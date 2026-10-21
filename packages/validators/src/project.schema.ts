import { z } from 'zod';

/**
 * PROJECT SCHEMA
 * Contract for creating and updating portfolio projects.
 */

// Optional URL fields accept an empty string so cleared form inputs validate.
const optionalUrl = (message: string) =>
  z
    .url({ error: message, protocol: /^https?$/ })
    .max(2048, { error: 'URL is too long' })
    .optional()
    .or(z.literal(''));

export const ProjectSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, { error: 'Title must be at least 3 characters long' })
    .max(120, { error: 'Title must be at most 120 characters long' }),
  description: z
    .string()
    .trim()
    .min(10, { error: 'Description must be at least 10 characters long' })
    .max(5000, { error: 'Description must be at most 5000 characters long' }),
  imageUrl: optionalUrl('Invalid image URL'),
  techStack: z
    .array(z.string().trim().min(1).max(50))
    .min(1, { error: 'Tech stack must have at least one item' })
    .max(30, { error: 'Tech stack can have at most 30 items' }),
  liveUrl: optionalUrl('Invalid live URL'),
  githubUrl: optionalUrl('Invalid GitHub URL'),
});

export type ProjectInput = z.infer<typeof ProjectSchema>;
