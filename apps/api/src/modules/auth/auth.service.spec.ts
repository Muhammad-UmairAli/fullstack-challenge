import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { Prisma } from '@repo/database';
import { PrismaService } from '../../database/prisma.service.js';
import { hashToken } from '../../common/utils/token-hash.js';
import { AuthService, parseDurationToMs } from './auth.service.js';

const config = {
  NODE_ENV: 'test',
  FRONTEND_URL: 'http://localhost:3000',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'r'.repeat(32),
  JWT_ACCESS_EXPIRATION: '15m',
  JWT_REFRESH_EXPIRATION: '7d',
} as const;

type AnyFn = (...args: any[]) => any;

// Only the Prisma calls AuthService makes; each test configures return values.
function createPrismaMock() {
  return {
    user: {
      create: jest.fn<AnyFn>(),
      findUnique: jest.fn<AnyFn>(),
      update: jest.fn<AnyFn>(),
    },
    refreshToken: {
      create: jest.fn<AnyFn>().mockResolvedValue({}),
      findUnique: jest.fn<AnyFn>(),
      updateMany: jest.fn<AnyFn>().mockResolvedValue({ count: 1 }),
    },
    passwordResetToken: {
      create: jest.fn<AnyFn>(),
      deleteMany: jest.fn<AnyFn>(),
      findUnique: jest.fn<AnyFn>(),
    },
    $transaction: jest.fn<AnyFn>().mockResolvedValue([]),
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let jwt: JwtService;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: ConfigService,
          useValue: { get: (key: keyof typeof config) => config[key] },
        },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
    jwt = moduleRef.get(JwtService);
  });

  async function issueRefreshToken(userId = 'user-1') {
    return jwt.signAsync(
      { sub: userId, email: 'user@example.com' },
      { secret: config.JWT_REFRESH_SECRET, expiresIn: '7d' },
    );
  }

  describe('register', () => {
    it('hashes the password and lowercases the email', async () => {
      prisma.user.create.mockResolvedValue({ id: 'user-1' });

      await service.register({
        email: 'User@Example.com',
        password: 'Password1',
      });

      const { data } = prisma.user.create.mock.calls[0]![0] as {
        data: { email: string; password: string };
      };
      expect(data.email).toBe('user@example.com');
      expect(data.password).not.toBe('Password1');
      await expect(argon2.verify(data.password, 'Password1')).resolves.toBe(
        true,
      );
    });

    it('maps a unique constraint violation to 409 Conflict', async () => {
      prisma.user.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      await expect(
        service.register({ email: 'a@example.com', password: 'Password1' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('login', () => {
    it('issues tokens and stores only the refresh token hash', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        password: await argon2.hash('Password1'),
        isActive: true,
      });

      const tokens = await service.login({
        email: 'user@example.com',
        password: 'Password1',
      });

      expect(tokens.accessToken).toEqual(expect.any(String));
      const { data } = prisma.refreshToken.create.mock.calls[0]![0] as {
        data: { token: string };
      };
      expect(data.token).toBe(hashToken(tokens.refreshToken));
      expect(data.token).not.toBe(tokens.refreshToken);
    });

    it('issues distinct refresh tokens for logins in the same second', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        password: await argon2.hash('Password1'),
        isActive: true,
      });
      const credentials = { email: 'user@example.com', password: 'Password1' };

      const [first, second] = await Promise.all([
        service.login(credentials),
        service.login(credentials),
      ]);

      expect(first.refreshToken).not.toBe(second.refreshToken);
    });

    it.each([
      ['unknown email', null],
      [
        'inactive user',
        { id: 'u', email: 'e', password: 'x', isActive: false },
      ],
    ])('rejects %s with a generic error', async (_case, user) => {
      prisma.user.findUnique.mockResolvedValue(user);

      await expect(
        service.login({ email: 'user@example.com', password: 'Password1' }),
      ).rejects.toThrow(new UnauthorizedException('Invalid credentials'));
    });
  });

  describe('refreshTokens', () => {
    it('revokes the presented token and issues a new pair', async () => {
      const refreshToken = await issueRefreshToken();
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        userId: 'user-1',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 60_000),
      });
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        isActive: true,
      });

      const tokens = await service.refreshTokens(refreshToken);

      expect(prisma.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { token: hashToken(refreshToken) },
      });
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { id: 'rt-1', isRevoked: false },
        data: { isRevoked: true },
      });
      expect(tokens.refreshToken).not.toBe(refreshToken);
    });

    it('revokes every session when a rotated token is replayed', async () => {
      const refreshToken = await issueRefreshToken();
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        userId: 'user-1',
        isRevoked: true,
        expiresAt: new Date(Date.now() + 60_000),
      });

      await expect(service.refreshTokens(refreshToken)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isRevoked: false },
        data: { isRevoked: true },
      });
      expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    });

    it('treats a lost rotation race as reuse', async () => {
      const refreshToken = await issueRefreshToken();
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        userId: 'user-1',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 60_000),
      });
      prisma.refreshToken.updateMany.mockResolvedValueOnce({ count: 0 });

      await expect(service.refreshTokens(refreshToken)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(prisma.refreshToken.updateMany).toHaveBeenLastCalledWith({
        where: { userId: 'user-1', isRevoked: false },
        data: { isRevoked: true },
      });
    });

    it('rejects tokens signed with the wrong secret', async () => {
      const forged = await jwt.signAsync(
        { sub: 'user-1', email: 'user@example.com' },
        { secret: config.JWT_ACCESS_SECRET },
      );

      await expect(service.refreshTokens(forged)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(prisma.refreshToken.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('forgotPassword', () => {
    it('returns the same message for unknown emails without creating a token', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.forgotPassword({
        email: 'nobody@example.com',
      });

      expect(result.message).toMatch(/If an account exists/);
      expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
    });

    it('stores a hashed reset token', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        isActive: true,
      });

      await service.forgotPassword({ email: 'user@example.com' });

      const { data } = prisma.passwordResetToken.create.mock.calls[0]![0] as {
        data: { token: string };
      };
      expect(data.token).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('resetPassword', () => {
    it('rejects expired tokens', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'prt-1',
        userId: 'user-1',
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(
        service.resetPassword({ token: 'abc', password: 'Password1' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('updates the password and revokes all sessions', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'prt-1',
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 60_000),
      });

      await service.resetPassword({ token: 'abc', password: 'Password1' });

      expect(prisma.passwordResetToken.findUnique).toHaveBeenCalledWith({
        where: { token: hashToken('abc') },
      });
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isRevoked: false },
        data: { isRevoked: true },
      });
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });
  });
});

describe('parseDurationToMs', () => {
  it.each([
    ['30s', 30_000],
    ['15m', 900_000],
    ['2h', 7_200_000],
    ['7d', 604_800_000],
  ] as const)('parses %s', (input, expected) => {
    expect(parseDurationToMs(input)).toBe(expected);
  });

  it('rejects malformed durations', () => {
    expect(() => parseDurationToMs('7 days' as `${number}d`)).toThrow();
  });
});
