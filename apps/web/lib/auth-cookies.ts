/**
 * AUTH COOKIE POLICY
 * Single definition of the session cookies, shared by Server Actions and the proxy
 * so names, flags and lifetimes cannot drift apart.
 */

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';
// Present (as a browser-session cookie) when the user did not tick "keep me signed in",
// so token rotation in the proxy keeps the session non-persistent.
export const SESSION_ONLY_COOKIE = 'session_only';

// Fallbacks if a token's `exp` claim cannot be read. Match the API defaults.
const DEFAULT_ACCESS_MAX_AGE_S = 15 * 60;
const DEFAULT_REFRESH_MAX_AGE_S = 7 * 24 * 60 * 60;

export type AuthTokens = { accessToken: string; refreshToken?: string };

type CookieOptions = {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'strict';
  path: string;
  maxAge?: number;
};

/** Minimal surface shared by `cookies()` and `NextResponse#cookies`. */
type CookieWriter = {
  set(name: string, value: string, options: CookieOptions): unknown;
  delete(name: string): unknown;
};

/**
 * Seconds until a JWT's `exp` claim, so cookies expire with the token they hold.
 * The token is NOT verified here; the API verifies it on every request.
 */
export function secondsUntilExpiry(
  token: string,
  fallback: number,
  now: number = Date.now(),
): number {
  try {
    const [, payload] = token.split('.');
    if (!payload) return fallback;
    // atob works in both the Node.js and Edge runtimes; JWTs use base64url.
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(base64)) as { exp?: unknown };
    if (typeof exp !== 'number') return fallback;
    return Math.max(0, Math.floor(exp - now / 1000));
  } catch {
    return fallback;
  }
}

function baseOptions(sameSite: CookieOptions['sameSite']): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite,
    path: '/',
  };
}

/**
 * Writes the session cookies.
 * @param persistent When false ("keep me signed in" unchecked) the refresh cookie is a
 *   browser-session cookie and is dropped when the browser closes.
 */
export function setAuthCookies(
  store: CookieWriter,
  tokens: AuthTokens,
  { persistent = true }: { persistent?: boolean } = {},
) {
  store.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...baseOptions('lax'),
    maxAge: secondsUntilExpiry(tokens.accessToken, DEFAULT_ACCESS_MAX_AGE_S),
  });

  if (tokens.refreshToken) {
    store.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
      // Strict: the refresh token is only ever read server-side on same-site requests.
      ...baseOptions('strict'),
      ...(persistent && {
        maxAge: secondsUntilExpiry(
          tokens.refreshToken,
          DEFAULT_REFRESH_MAX_AGE_S,
        ),
      }),
    });
  }

  if (persistent) {
    store.delete(SESSION_ONLY_COOKIE);
  } else {
    store.set(SESSION_ONLY_COOKIE, '1', baseOptions('strict'));
  }
}

export function clearAuthCookies(store: CookieWriter) {
  store.delete(ACCESS_TOKEN_COOKIE);
  store.delete(REFRESH_TOKEN_COOKIE);
  store.delete(SESSION_ONLY_COOKIE);
}
