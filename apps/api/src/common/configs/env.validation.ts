import { Logger } from '@nestjs/common';
import { z } from 'zod';

const logger = new Logger('EnvConfig');

/**
 * 💡 Environment Validation Schema
 * We use Zod to validate all incoming environment variables at startup.
 */
export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z
    .string()
    .default('3001')
    .transform((val) => parseInt(val, 10)),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
});

export type Env = z.infer<typeof envSchema>;

/**
 * 💡 FAIL-FAST: Validation Function
 */
export function validate(config: Record<string, unknown>) {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    logger.error('❌ Invalid environment variables detected:');
    logger.error(JSON.stringify(result.error.format(), null, 2));
    throw new Error('Invalid environment variables');
  }

  return result.data;
}
