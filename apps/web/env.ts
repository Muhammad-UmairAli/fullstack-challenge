import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

/**
 * 🔒 STRICT ENVIRONMENT VALIDATION
 * This ensures the application fails-fast if critical environment variables are missing.
 * No more runtime undefined errors.
 */
export const env = createEnv({
  server: {
    // API_URL is used by Server Components for SSR/BFF calls
    API_URL: z.string().url(),
  },
  client: {
    // NEXT_PUBLIC_API_URL is exposed to the browser
    NEXT_PUBLIC_API_URL: z.string().url(),
  },
  // We need to destructure process.env for Next.js to properly inline them
  runtimeEnv: {
    API_URL: process.env.API_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
});
