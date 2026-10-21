import { describe, expect, it, jest } from '@jest/globals';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  SESSION_ONLY_COOKIE,
  secondsUntilExpiry,
  setAuthCookies,
} from './auth-cookies';

function jwtWithExp(exp: number) {
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'HS256' })}.${encode({ sub: 'u1', exp })}.sig`;
}

function cookieStore() {
  return { set: jest.fn(), delete: jest.fn() };
}

describe('secondsUntilExpiry', () => {
  const now = Date.UTC(2026, 0, 1);

  it('derives the lifetime from the exp claim', () => {
    expect(secondsUntilExpiry(jwtWithExp(now / 1000 + 900), 1, now)).toBe(900);
  });

  it('never returns a negative lifetime', () => {
    expect(secondsUntilExpiry(jwtWithExp(now / 1000 - 60), 1, now)).toBe(0);
  });

  it.each(['not-a-jwt', 'a.%%%.c', jwtWithExp(Number.NaN)])(
    'falls back for unreadable token %s',
    (token) => {
      expect(secondsUntilExpiry(token, 42, now)).toBe(42);
    },
  );
});

describe('setAuthCookies', () => {
  const tokens = {
    accessToken: jwtWithExp(Date.now() / 1000 + 900),
    refreshToken: jwtWithExp(Date.now() / 1000 + 7 * 86400),
  };

  it('sets HttpOnly cookies with lifetimes matching the tokens', () => {
    const store = cookieStore();
    setAuthCookies(store, tokens);

    expect(store.set).toHaveBeenCalledWith(
      ACCESS_TOKEN_COOKIE,
      tokens.accessToken,
      expect.objectContaining({ httpOnly: true, sameSite: 'lax' }),
    );
    const refreshOptions = store.set.mock.calls.find(
      ([name]) => name === REFRESH_TOKEN_COOKIE,
    )?.[2] as { httpOnly: boolean; sameSite: string; maxAge?: number };
    expect(refreshOptions).toMatchObject({
      httpOnly: true,
      sameSite: 'strict',
    });
    expect(refreshOptions.maxAge).toBeGreaterThan(6 * 86400);
    expect(store.delete).toHaveBeenCalledWith(SESSION_ONLY_COOKIE);
  });

  it('makes the refresh cookie session-only when not persistent', () => {
    const store = cookieStore();
    setAuthCookies(store, tokens, { persistent: false });

    const refreshOptions = store.set.mock.calls.find(
      ([name]) => name === REFRESH_TOKEN_COOKIE,
    )?.[2] as { maxAge?: number };
    expect(refreshOptions.maxAge).toBeUndefined();
    expect(store.set).toHaveBeenCalledWith(
      SESSION_ONLY_COOKIE,
      '1',
      expect.objectContaining({ httpOnly: true }),
    );
  });
});
