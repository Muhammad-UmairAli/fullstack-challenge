import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { env } from './env';
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
 * Pages and Server Actions must still enforce auth themselves.
 */

const AUTH_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];
const PUBLIC_ROUTES: string[] = []; // Add strictly public routes here (e.g. '/about')

const REFRESH_TIMEOUT_MS = 5_000;

async function refreshSession(
  request: NextRequest,
  refreshToken: string,
): Promise<AuthTokens | null> {
  try {
    const forwardedFor = request.headers.get('x-forwarded-for');
    const response = await fetch(`${env.API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(forwardedFor && { 'X-Forwarded-For': forwardedFor }),
      },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
      signal: AbortSignal.timeout(REFRESH_TIMEOUT_MS),
    });
    if (!response.ok) return null;

    const result = (await response.json()) as { data?: Partial<AuthTokens> };
    return result.data?.accessToken ? (result.data as AuthTokens) : null;
  } catch {
    // Network failure or timeout: fall through to the login redirect.
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  const isAuthRoute = AUTH_ROUTES.includes(pathname);
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const isProtectedRoute = !isAuthRoute && !isPublicRoute;

  // 1. Already logged in but trying to access login/register
  if (accessToken && isAuthRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (!isProtectedRoute || accessToken) {
    return NextResponse.next();
  }

  // 2. TRANSPARENT REFRESH: access token expired but a refresh token exists.
  if (refreshToken) {
    const tokens = await refreshSession(request, refreshToken);

    if (tokens) {
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
  }

  // 3. Denied: no valid session
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect', pathname);

  const response = NextResponse.redirect(loginUrl);
  clearAuthCookies(response.cookies);
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - any path with a file extension (public assets)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)',
  ],
};
