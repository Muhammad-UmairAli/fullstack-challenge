import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { api } from './lib/api';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  SESSION_ONLY_COOKIE,
  clearAuthCookies,
  setAuthCookies,
  type AuthTokens,
} from './lib/auth-cookies';

/**
 * PROXY (formerly middleware): Route Protection & Transparent Refresh
 * Runs on the Node.js runtime before routes render. It is an optimistic check only:
 * it looks at cookie presence, while the API verifies tokens on every call.
 * Pages and Server Actions must still enforce auth themselves; signed-in users are
 * redirected away from auth pages by `app/(auth)/layout.tsx`, which verifies the session.
 */

const AUTH_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];
const PUBLIC_ROUTES: string[] = []; // Add strictly public routes here (e.g. '/about')

const REFRESH_TIMEOUT_MS = 5_000;

type RefreshResult =
  | { status: 'ok'; tokens: AuthTokens }
  // The API rejected the token: the session is over.
  | { status: 'rejected' }
  // Network error, timeout, 429 or 5xx: the session may still be valid.
  | { status: 'unavailable' };

async function refreshSession(
  request: NextRequest,
  refreshToken: string,
): Promise<RefreshResult> {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const result = await api.auth.refresh(refreshToken, {
    headers: forwardedFor ? { 'X-Forwarded-For': forwardedFor } : {},
    signal: AbortSignal.timeout(REFRESH_TIMEOUT_MS),
  });

  if (result.success && result.data?.accessToken) {
    return { status: 'ok', tokens: result.data };
  }
  return result.status === 400 || result.status === 401
    ? { status: 'rejected' }
    : { status: 'unavailable' };
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  const isProtectedRoute =
    !AUTH_ROUTES.includes(pathname) && !PUBLIC_ROUTES.includes(pathname);

  if (!isProtectedRoute || accessToken) {
    return NextResponse.next();
  }

  // TRANSPARENT REFRESH: access token expired but a refresh token exists.
  const refresh = refreshToken
    ? await refreshSession(request, refreshToken)
    : ({ status: 'rejected' } as const);

  if (refresh.status === 'ok') {
    const { tokens } = refresh;
    const persistent = !request.cookies.has(SESSION_ONLY_COOKIE);

    // Update the incoming request so Server Components rendering this same
    // request see the new tokens, then forward its rewritten cookie header.
    request.cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken);
    if (tokens.refreshToken) {
      request.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken);
    }
    const response = NextResponse.next({
      request: { headers: request.headers },
    });
    // ...and set them on the response so the browser stores them.
    setAuthCookies(response.cookies, tokens, { persistent });
    return response;
  }

  // Denied: no usable session right now
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect', pathname);

  const response = NextResponse.redirect(loginUrl);
  // Keep cookies on transient failures so the session resumes once the API is back.
  if (refresh.status === 'rejected') {
    clearAuthCookies(response.cookies);
  }
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/ (Next.js internals: static files, image optimization, HMR)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - static asset files by extension (routes containing dots still match)
     */
    '/((?!api|_next/|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpe?g|gif|webp|avif|ico|txt|xml|webmanifest|js|css|map|woff2?)$).*)',
  ],
};
