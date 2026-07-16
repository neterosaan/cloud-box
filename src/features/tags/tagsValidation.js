
import { z } from 'zod';

export const createTagSchema = z.object({
  name: z.string()
    .min(1, 'Tag name cannot be empty')
    .max(50, 'Tag name is too long')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Tag name can only contain letters, numbers, spaces, hyphens and underscores')
    .transform(val => val.trim().toLowerCase()), 
});

export const tagParamsSchema = z.object({
  id: z.string().uuid('Invalid tag ID format'),
});

export const fileTagSchema = z.object({
  tagId: z.string().uuid('Invalid tag ID format'),
});

export const fileTagParamsSchema = z.object({
  id: z.string().uuid('Invalid file ID format'),
  tagId: z.string().uuid('Invalid tag ID format'),
});




