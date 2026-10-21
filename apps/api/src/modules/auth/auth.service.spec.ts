import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { Prisma } from '@repo/database';
import { PrismaService } from '../../database/prisma.service.js';
import { hashToken } from '../../common/utils/token-hash.js';
import {
  AuthService,
  ROTATION_GRACE_MS,
  parseDurationToMs,
} from './auth.service.js';

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
  const mock = {
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
      deleteMany: jest.fn<AnyFn>().mockResolvedValue({ count: 1 }),
      findUnique: jest.fn<AnyFn>(),
    },
    $transaction: jest.fn<AnyFn>(),
  };
  // Array form resolves; interactive form runs the callback against the same mock.
  mock.$transaction.mockImplementation(async (arg: unknown) =>
    typeof arg === 'function' ? (arg as AnyFn)(mock) : [],
  );
  return mock;
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

    it('stores a blank optional name as null', async () => {
      prisma.user.create.mockResolvedValue({ id: 'user-1' });

      await service.register({
        email: 'user@example.com',
        password: 'Password1',
        name: '',
      });

      const { data } = prisma.user.create.mock.calls[0]![0] as {
        data: { name: string | null };
      };
      expect(data.name).toBeNull();
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
    const activeUser = {
      id: 'user-1',
      email: 'user@example.com',
      isActive: true,
    };
    const storedToken = (overrides: Record<string, unknown> = {}) => ({
      id: 'rt-1',
      userId: 'user-1',
      isRevoked: false,
      rotatedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user: activeUser,
      ...overrides,
    });
    const revokeAll = {
      where: { userId: 'user-1', isRevoked: false },
      data: { isRevoked: true },
    };

    it('marks the presented token rotated and issues a new pair', async () => {
      const refreshToken = await issueRefreshToken();
      prisma.refreshToken.findUnique.mockResolvedValue(storedToken());

      const tokens = await service.refreshTokens(refreshToken);

      expect(prisma.refreshToken.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { token: hashToken(refreshToken) } }),
      );
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { id: 'rt-1', isRevoked: false },
        data: { isRevoked: true, rotatedAt: expect.any(Date) },
      });
      expect(tokens.refreshToken).not.toBe(refreshToken);
    });

    it('serves a concurrent request that lost the rotation race', async () => {
      const refreshToken = await issueRefreshToken();
      prisma.refreshToken.findUnique
        .mockResolvedValueOnce(storedToken())
        .mockResolvedValueOnce(
          storedToken({ isRevoked: true, rotatedAt: new Date() }),
        );
      prisma.refreshToken.updateMany.mockResolvedValueOnce({ count: 0 });

      const tokens = await service.refreshTokens(refreshToken);

      expect(tokens.accessToken).toEqual(expect.any(String));
      expect(prisma.refreshToken.updateMany).not.toHaveBeenCalledWith(
        revokeAll,
      );
    });

    it('accepts a token rotated within the grace window', async () => {
      const refreshToken = await issueRefreshToken();
      prisma.refreshToken.findUnique.mockResolvedValue(
        storedToken({
          isRevoked: true,
          rotatedAt: new Date(Date.now() - ROTATION_GRACE_MS / 2),
        }),
      );

      await expect(service.refreshTokens(refreshToken)).resolves.toEqual(
        expect.objectContaining({ refreshToken: expect.any(String) }),
      );
      expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
    });

    it('revokes every session when a rotated token is replayed later', async () => {
      const refreshToken = await issueRefreshToken();
      prisma.refreshToken.findUnique.mockResolvedValue(
        storedToken({
          isRevoked: true,
          rotatedAt: new Date(Date.now() - ROTATION_GRACE_MS - 1000),
        }),
      );

      await expect(service.refreshTokens(refreshToken)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(revokeAll);
      expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    });

    it('rejects a token revoked by logout without touching other sessions', async () => {
      const refreshToken = await issueRefreshToken();
      prisma.refreshToken.findUnique.mockResolvedValue(
        storedToken({ isRevoked: true, rotatedAt: null }),
      );

      await expect(service.refreshTokens(refreshToken)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
    });

    it('rejects deactivated users', async () => {
      const refreshToken = await issueRefreshToken();
      prisma.refreshToken.findUnique.mockResolvedValue(
        storedToken({ user: { ...activeUser, isActive: false } }),
      );

      await expect(service.refreshTokens(refreshToken)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(prisma.refreshToken.create).not.toHaveBeenCalled();
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
    const validToken = {
      id: 'prt-1',
      userId: 'user-1',
      expiresAt: new Date(Date.now() + 60_000),
    };

    it('rejects expired tokens', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue({
        ...validToken,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(
        service.resetPassword({ token: 'abc', password: 'Password1' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('consumes the token, updates the password and revokes all sessions', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue(validToken);

      await service.resetPassword({ token: 'abc', password: 'Password1' });

      expect(prisma.passwordResetToken.findUnique).toHaveBeenCalledWith({
        where: { token: hashToken('abc') },
      });
      expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
        where: { id: 'prt-1', expiresAt: { gt: expect.any(Date) } },
      });
      expect(prisma.user.update).toHaveBeenCalled();
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isRevoked: false },
        data: { isRevoked: true },
      });
    });

    it('rejects a token already consumed by a concurrent request', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue(validToken);
      prisma.passwordResetToken.deleteMany.mockResolvedValueOnce({ count: 0 });

      await expect(
        service.resetPassword({ token: 'abc', password: 'Password1' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(prisma.user.update).not.toHaveBeenCalled();
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
