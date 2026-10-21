import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

/**
 * STRICT ENVIRONMENT VALIDATION
 * This ensures the application fails-fast if critical environment variables are missing.
 *
 * The browser never talks to the API directly (BFF pattern), so the API URL is
 * server-only. Set SKIP_ENV_VALIDATION=1 for builds that run without runtime
 * secrets (e.g. Docker image builds); the server still validates at startup.
 */
export const env = createEnv({
  server: {
    // API_URL is used by Server Components, Server Actions and the proxy.
    API_URL: z.url(),
  },
  client: {},
  runtimeEnv: {
    API_URL: process.env.API_URL,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
