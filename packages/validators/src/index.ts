import { z } from 'zod';

/**
 * Shared API Validation Schemas
 * Single source of truth for backend and frontend validation.
 */

export const CreateExampleSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long'),
  email: z.string().email('Invalid email format'),
  age: z.number().int().min(18, 'Must be at least 18 years old').optional(),
});

// We can also export the TypeScript type inferred from the schema
export type CreateExampleInput = z.infer<typeof CreateExampleSchema>;
export * from './auth.schema.js';
export * from './project.schema.js';
