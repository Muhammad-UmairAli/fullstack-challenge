import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import * as argon2 from 'argon2';
import { randomBytes, randomUUID } from 'node:crypto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { isUniqueConstraintError } from '@repo/database';
import type {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from '@repo/validators';
import type { Env } from '../../common/configs/env.validation.js';
import { hashToken } from '../../common/utils/token-hash.js';

type JwtPayload = {
  sub: string;
  email: string;
};
type DurationUnit = 's' | 'm' | 'h' | 'd';
type DurationString = `${number}${DurationUnit}`;

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const GENERIC_RESET_MESSAGE =
  'If an account exists, a reset link has been sent.';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  /**
   * Hash verified against when the email is unknown, so failed logins take the
   * same time whether or not the account exists (prevents user enumeration).
   */
  private dummyHash?: Promise<string>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<Env, true>,
  ) {}

  /**
   * REGISTER: Create a new user
   */
  async register(data: RegisterInput) {
    const hashedPassword = await argon2.hash(data.password);

    try {
      return await this.prisma.user.create({
        data: {
          email: data.email.toLowerCase(),
          password: hashedPassword,
          name: data.name,
        },
        select: { id: true, email: true, name: true, createdAt: true },
      });
    } catch (error) {
      // Relies on the unique index instead of check-then-insert, which races.
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('User with this email already exists');
      }
      throw error;
    }
  }

  /**
   * LOGIN: Authenticate user and issue tokens
   */
  async login(data: LoginInput): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
      // The client omits password by default; opt in only where it is compared.
      select: { id: true, email: true, password: true, isActive: true },
    });

    const isValidPassword = await argon2
      .verify(user?.password ?? (await this.getDummyHash()), data.password)
      .catch(() => false);

    if (!user || !isValidPassword || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user.id, user.email);
  }

  /**
   * FORGOT PASSWORD: Create a reset token
   */
  async forgotPassword(data: ForgotPasswordInput) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
      select: { id: true, isActive: true },
    });

    // SECURITY: Always return the same response to prevent email enumeration.
    if (!user || !user.isActive) {
      return { message: GENERIC_RESET_MESSAGE };
    }

    const token = randomBytes(32).toString('hex');

    // Only the hash is stored, so a database leak does not expose usable reset links.
    await this.prisma.$transaction([
      this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
      this.prisma.passwordResetToken.create({
        data: {
          token: hashToken(token),
          userId: user.id,
          expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        },
      }),
    ]);

    // TODO: Send the reset link by email. Until a mail provider is wired up, the link
    // is logged in development only; reset tokens must never reach production logs.
    if (this.configService.get('NODE_ENV', { infer: true }) !== 'production') {
      const resetUrl = new URL(
        '/reset-password',
        this.configService.get('FRONTEND_URL', { infer: true }),
      );
      resetUrl.searchParams.set('token', token);
      this.logger.log(`[DEV ONLY] Password reset link: ${resetUrl.toString()}`);
    }

    return { message: GENERIC_RESET_MESSAGE };
  }

  /**
   * RESET PASSWORD: Use token to update password
   */
  async resetPassword(data: ResetPasswordInput) {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token: hashToken(data.token) },
    });

    if (!resetToken || resetToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const hashedPassword = await argon2.hash(data.password);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      this.prisma.passwordResetToken.deleteMany({
        where: { userId: resetToken.userId },
      }),
      // A password reset signs the user out everywhere.
      this.prisma.refreshToken.updateMany({
        where: { userId: resetToken.userId, isRevoked: false },
        data: { isRevoked: true },
      }),
    ]);

    return { message: 'Password reset successfully' };
  }

  /**
   * REFRESH: Rotate refresh tokens with reuse detection.
   */
  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const payload = await this.verifyRefreshToken(refreshToken);

    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: hashToken(refreshToken) },
    });

    if (!stored || stored.userId !== payload.sub) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (stored.isRevoked) {
      // SECURITY: A validly signed but already-rotated token is being replayed,
      // which suggests it was stolen. Revoke every session for this user.
      await this.revokeAllSessions(stored.userId);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (stored.expiresAt <= new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Conditional update makes rotation atomic: of two concurrent requests with the
    // same token, only one can flip isRevoked, the other is treated as reuse.
    const { count } = await this.prisma.refreshToken.updateMany({
      where: { id: stored.id, isRevoked: false },
      data: { isRevoked: true },
    });

    if (count === 0) {
      await this.revokeAllSessions(stored.userId);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: stored.userId },
      select: { id: true, email: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Access Denied');
    }

    return this.generateTokens(user.id, user.email);
  }

  async logout(refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: { token: hashToken(refreshToken), isRevoked: false },
        data: { isRevoked: true },
      });
    }

    return { message: 'Logged out successfully' };
  }

  private async verifyRefreshToken(refreshToken: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET', { infer: true }),
        algorithms: ['HS256'],
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async revokeAllSessions(userId: string) {
    this.logger.warn(
      `Refresh token reuse detected; revoking all sessions for user ${userId}`,
    );
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  /**
   * Helper: Token Generation & Persistence
   */
  private async generateTokens(
    userId: string,
    email: string,
  ): Promise<AuthTokens> {
    const accessTokenExpiresIn = this.configService.get(
      'JWT_ACCESS_EXPIRATION',
      { infer: true },
    ) as DurationString;
    const refreshTokenExpiresIn = this.configService.get(
      'JWT_REFRESH_EXPIRATION',
      { infer: true },
    ) as DurationString;

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email },
        {
          secret: this.configService.get('JWT_ACCESS_SECRET', { infer: true }),
          expiresIn: accessTokenExpiresIn,
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, email },
        {
          secret: this.configService.get('JWT_REFRESH_SECRET', {
            infer: true,
          }),
          expiresIn: refreshTokenExpiresIn,
          // Unique ID so two tokens issued in the same second never collide.
          jwtid: randomUUID(),
        },
      ),
    ]);

    await this.prisma.refreshToken.create({
      data: {
        token: hashToken(refreshToken),
        userId,
        expiresAt: new Date(
          Date.now() + parseDurationToMs(refreshTokenExpiresIn),
        ),
      },
    });

    return { accessToken, refreshToken };
  }

  private getDummyHash(): Promise<string> {
    this.dummyHash ??= argon2.hash(randomBytes(16).toString('hex'));
    return this.dummyHash;
  }
}

/**
 * Converts a duration such as "15m" or "7d" to milliseconds.
 * The format is guaranteed by env validation.
 */
export function parseDurationToMs(duration: DurationString): number {
  const match = /^(\d+)([smhd])$/.exec(duration.trim());
  if (!match) {
    throw new Error(`Invalid duration format: ${duration}`);
  }

  const value = Number(match[1]);
  const unit = match[2] as DurationUnit;
  const unitToMs = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  } as const;

  return value * unitToMs[unit];
}
