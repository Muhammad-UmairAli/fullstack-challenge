import { Logger } from '@nestjs/common';
import { z } from 'zod';

const logger = new Logger('EnvConfig');

// "true"/"false" strings from .env files; z.coerce.boolean() would treat "false" as true.
const booleanString = z.enum(['true', 'false']).transform((v) => v === 'true');

/**
 * Environment Validation Schema
 * Every environment variable the API reads is declared and validated here at startup.
 */
export const envSchema = z
  .object({
    // Required, no default: dev-only behavior (Swagger, logged reset links) must
    // never switch on because a deployment forgot to set it.
    NODE_ENV: z.enum(['development', 'production', 'test']),
    PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    FRONTEND_URL: z.url().default('http://localhost:3000'),
    DATABASE_URL: z.url(),

    // Security: JWT config
    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    JWT_ACCESS_EXPIRATION: z
      .string()
      .regex(/^\d+[smhd]$/, 'Use a duration like 15m, 1h or 7d')
      .default('15m'),
    JWT_REFRESH_EXPIRATION: z
      .string()
      .regex(/^\d+[smhd]$/, 'Use a duration like 15m, 1h or 7d')
      .default('7d'),

    /**
     * Express "trust proxy" setting. Required for per-client rate limiting when the API
     * sits behind the Next.js BFF or a load balancer; otherwise every request appears to
     * come from the proxy's IP. Accepts "false", "true", a hop count, or a comma-separated
     * list of trusted addresses/subnets (e.g. "loopback" or "10.0.0.0/8").
     * See https://expressjs.com/en/guide/behind-proxies.html
     */
    TRUST_PROXY: z.string().default('false'),

    // Global rate limit (per client IP). Auth routes apply stricter limits on top.
    THROTTLE_TTL_MS: z.coerce.number().int().positive().default(60_000),
    THROTTLE_LIMIT: z.coerce.number().int().positive().default(100),

    // Swagger UI is useful locally but leaks the API surface in production.
    SWAGGER_ENABLED: booleanString.optional(),
  })
  // With a shared secret, a 7-day refresh token would also pass as an access token.
  .refine((env) => env.JWT_ACCESS_SECRET !== env.JWT_REFRESH_SECRET, {
    error: 'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different',
    path: ['JWT_REFRESH_SECRET'],
  });

export type Env = z.infer<typeof envSchema>;

/**
 * Converts the TRUST_PROXY string into the value Express expects.
 */
export function parseTrustProxy(value: string): boolean | number | string {
  if (value === 'true') return true;
  if (value === 'false' || value === '') return false;
  if (/^\d+$/.test(value)) return Number(value);
  return value;
}

/**
 * FAIL-FAST: Validation Function
 * Used by ConfigModule; the app refuses to boot with an invalid environment.
 */
export function validate(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    // prettifyError lists failing keys and reasons, never the submitted values.
    logger.error(
      `Invalid environment variables:\n${z.prettifyError(result.error)}`,
    );
    throw new Error('Invalid environment variables');
  }

  return result.data;
}
