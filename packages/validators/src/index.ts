import { z } from 'zod';

/**
 * 💡 MARKET STANDARD: Shared API Contracts
 * By defining our schemas here in a shared package, we ensure that
 * both the Backend (NestJS) and Frontend (Next.js) use the exact
 * same validation rules. This is the single source of truth.
 */

export const CreateExampleSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long'),
  email: z.string().email('Invalid email format'),
  age: z.number().int().min(18, 'Must be at least 18 years old').optional(),
});

// We can also export the TypeScript type inferred from the schema
export type CreateExampleInput = z.infer<typeof CreateExampleSchema>;
export * from './auth.schema.js';
