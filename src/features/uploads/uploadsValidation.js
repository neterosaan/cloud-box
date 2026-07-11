// src/features/uploads/uploadsValidation.js
import { z } from 'zod';

export const initUploadSchema = z.object({
  fileName: z.string()
    .min(1, "File name cannot be empty")
    .max(255, "File name is too long")
    .regex(/^[^<>:"/\\|?*]+$/, "File name contains invalid characters"),
  folderId: z.string()
    .uuid("Invalid folder ID")
    .optional()
    .nullable(),
});

export const uploadIdParamsSchema = z.object({
  uploadId: z.string().uuid("Invalid upload ID format"),
});