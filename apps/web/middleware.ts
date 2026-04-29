import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * 🛡️ EDGE MIDDLEWARE: Route Protection & Transparent Refresh
 * This runs at the edge before any page renders. It enforces security policies
 * and handles the silent token refresh flow (BFF Pattern).
 */

const AUTH_ROUTES = ['/login', '/register'];
const PUBLIC_ROUTES = ['/about', '/pricing']; // Add strictly public routes here

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Bypass logic for static assets and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  const isAuthRoute = AUTH_ROUTES.includes(pathname);
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const isProtectedRoute = !isAuthRoute && !isPublicRoute;

  // 2. Already logged in but trying to access login/register
  if (accessToken && isAuthRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 3. Trying to access a protected route
  if (isProtectedRoute) {
    if (accessToken) {
      // Fast path: User has a valid access token
      return NextResponse.next();
    }

    if (!accessToken && refreshToken) {
      // 🔄 TRANSPARENT REFRESH FLOW
      // The access token expired, but we have a refresh token.
      // We will ask the NestJS backend for a new pair right here at the Edge.
      try {
        const apiUrl =
          process.env.API_URL ??
          process.env.NEXT_PUBLIC_API_URL ??
          'http://localhost:3001/api/v1';
        const refreshResponse = await fetch(`${apiUrl}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        const result = await refreshResponse.json();

        if (refreshResponse.ok && result.data?.accessToken) {
          // Success! We got a new token pair.
          // Create the response object so we can append the new cookies to it.
          const response = NextResponse.next();

          // Set new Access Token
          response.cookies.set('access_token', result.data.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60, // 15 mins
            path: '/',
          });

          // Set new Refresh Token if backend rolled it
          if (result.data.refreshToken) {
            response.cookies.set('refresh_token', result.data.refreshToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'strict',
              maxAge: 7 * 24 * 60 * 60, // 7 days
              path: '/',
            });
          }

          return response;
        }
      } catch {
        // If the refresh network request fails, we fall through to the login redirect
      }
    }

    // 🛑 Denied: No valid session
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);

    // Clear dead cookies just in case
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('access_token');
    response.cookies.delete('refresh_token');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
