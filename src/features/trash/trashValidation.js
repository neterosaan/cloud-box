import { z } from 'zod';

export const trashItemParamsSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

export const trashItemTypeSchema = z.object({
  type: z.enum(['file', 'folder'], {
    errorMap: () => ({ message: 'Type must be either "file" or "folder"' }),
  }),
});