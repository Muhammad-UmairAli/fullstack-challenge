import { beforeAll, describe, expect, it } from '@jest/globals';
import { Logger } from '@nestjs/common';
import { parseTrustProxy, validate } from './env.validation.js';

const valid = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'r'.repeat(32),
};

describe('validate (env)', () => {
  // Failure cases log by design; keep test output readable.
  beforeAll(() => Logger.overrideLogger(false));

  it('applies defaults and coerces numbers', () => {
    const env = validate({ ...valid, PORT: '4000' });

    expect(env.PORT).toBe(4000);
    expect(env.NODE_ENV).toBe('development');
    expect(env.JWT_ACCESS_EXPIRATION).toBe('15m');
    expect(env.THROTTLE_LIMIT).toBe(100);
  });

  it('rejects short JWT secrets', () => {
    expect(() => validate({ ...valid, JWT_ACCESS_SECRET: 'short' })).toThrow(
      'Invalid environment variables',
    );
  });

  it('rejects identical access and refresh secrets', () => {
    expect(() =>
      validate({ ...valid, JWT_REFRESH_SECRET: valid.JWT_ACCESS_SECRET }),
    ).toThrow('Invalid environment variables');
  });

  it('rejects malformed expirations', () => {
    expect(() =>
      validate({ ...valid, JWT_REFRESH_EXPIRATION: '7 days' }),
    ).toThrow();
  });

  it('parses SWAGGER_ENABLED strictly', () => {
    expect(
      validate({ ...valid, SWAGGER_ENABLED: 'false' }).SWAGGER_ENABLED,
    ).toBe(false);
    expect(() => validate({ ...valid, SWAGGER_ENABLED: 'no' })).toThrow();
  });
});

describe('parseTrustProxy', () => {
  it.each([
    ['false', false],
    ['true', true],
    ['2', 2],
    ['loopback', 'loopback'],
    ['10.0.0.0/8, 127.0.0.1', '10.0.0.0/8, 127.0.0.1'],
  ] as const)('maps %s', (input, expected) => {
    expect(parseTrustProxy(input)).toBe(expected);
  });
});
