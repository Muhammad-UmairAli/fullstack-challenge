import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { RegisterInput, LoginInput } from '@repo/validators';

type JwtPayload = {
  sub: string;
  email: string;
};
type DurationUnit = 's' | 'm' | 'h' | 'd';
type DurationString = `${number}${DurationUnit}`;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 📝 REGISTER: Create a new user
   */
  async register(data: RegisterInput) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await argon2.hash(data.password);

    return this.prisma.client.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
      },
    });
  }

  /**
   * 🔑 LOGIN: Authenticate user and issue tokens
   */
  async login(data: LoginInput) {
    // Note: We use the base prisma client here because we NEED the password for comparison
    // The security extension would return 'undefined' for the password field
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValidPassword = await argon2
      .verify(user.password, data.password)
      .catch(() => false);

    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user.id, user.email);
  }

  async verifyRefreshToken(refreshToken: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * 🔄 REFRESH: Rotate Refresh Tokens
   */
  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { refreshTokens: true },
    });

    if (!user) throw new UnauthorizedException('Access Denied');

    const tokenExists = user.refreshTokens.find(
      (t) =>
        t.token === refreshToken && !t.isRevoked && t.expiresAt > new Date(),
    );

    if (!tokenExists) {
      // 🛡️ SECURITY: Token Reuse Detection
      // If a refresh token is used but not found/revoked, it might be a breach
      // We should revoke ALL tokens for this user as a precaution
      await this.prisma.refreshToken.updateMany({
        where: { userId },
        data: { isRevoked: true },
      });
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Revoke the old token
    await this.prisma.refreshToken.update({
      where: { id: tokenExists.id },
      data: { isRevoked: true },
    });

    // Issue new tokens
    return this.generateTokens(user.id, user.email);
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) {
      return { message: 'Logged out successfully' };
    }

    await this.prisma.refreshToken.updateMany({
      where: { token: refreshToken, isRevoked: false },
      data: { isRevoked: true },
    });

    return { message: 'Logged out successfully' };
  }

  /**
   * 🛠️ Helper: Token Generation & Persistence
   */
  private async generateTokens(userId: string, email: string) {
    const accessTokenExpiresIn = this.configService.getOrThrow<DurationString>(
      'JWT_ACCESS_EXPIRATION',
    );
    const refreshTokenExpiresIn = this.configService.getOrThrow<DurationString>(
      'JWT_REFRESH_EXPIRATION',
    );

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email },
        {
          secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
          expiresIn: accessTokenExpiresIn,
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, email },
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
          expiresIn: refreshTokenExpiresIn,
        },
      ),
    ]);

    const expiresAt = this.getRefreshTokenExpiresAt(refreshTokenExpiresIn);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private getRefreshTokenExpiresAt(refreshExpiration: DurationString) {
    const now = new Date();
    const durationInMs = this.parseDurationToMs(refreshExpiration);
    return new Date(now.getTime() + durationInMs);
  }

  private parseDurationToMs(duration: DurationString) {
    const match = /^(\d+)([smhd])$/.exec(duration.trim());
    if (!match) {
      throw new UnauthorizedException('Invalid refresh expiration format');
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
}
