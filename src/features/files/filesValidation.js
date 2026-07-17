import { z } from 'zod';


export const fileParamsSchema = z.object({
    id: z.string().uuid('Invalid file IDformat'),
})

export const updateFileSchema = z.object({
    name : z.string()
    .min(1, 'File name cannot be empty')
    .max(255, 'File name is too long')
    .regex(/^[^<>:"/\\|?*]+$/, 'File name contains invalid characters')
    .optional(),
  folderId: z.string()
    .uuid('Invalid folder ID')
    .optional()
    .nullable(),
}).refine(
    data => data.name !== undefined || data.folderId !== undefined,
    { message: 'You must provide either a new name or a new folderId to update.'}
)

export const searchFilesSchema = z.object({
  name:     z.string().min(1).max(255).optional(),
  mimeType: z.string().min(1).max(100).optional(),
  tagId:    z.string().uuid('Invalid tag ID format').optional(),
  page:     z.string().optional(),
  limit:    z.string().optional(),
}).refine(
  data => data.name !== undefined || data.mimeType !== undefined || data.tagId !== undefined,
  { message: 'You must provide at least one search filter: name, mimeType, or tagId.' }
);