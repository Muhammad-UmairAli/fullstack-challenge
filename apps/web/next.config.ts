import type { NextConfig } from 'next';

/**
 * Baseline security headers for every route. A Content-Security-Policy is not set
 * here because Next.js inline scripts need a per-request nonce; see
 * https://nextjs.org/docs/app/guides/content-security-policy before adding one.
 */
const securityHeaders = [
  // Browsers only honour HSTS over HTTPS, so this is inert on http://localhost.
  { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
