import { z } from 'zod';

/**
 * 🛠️ PROJECT SCHEMA
 * Defines the contract for creating and updating portfolio projects.
 */
export const ProjectSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters long'),
  imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
  techStack: z
    .array(z.string())
    .min(1, 'Tech stack must have at least one item'),
  liveUrl: z.string().url('Invalid live URL').optional().or(z.literal('')),
  githubUrl: z.string().url('Invalid GitHub URL').optional().or(z.literal('')),
});

export type ProjectInput = z.infer<typeof ProjectSchema>;
