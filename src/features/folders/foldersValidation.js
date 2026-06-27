import { z } from 'zod';


export const createFolderSchema = z.object({
    name: z.string()
        .min(1, "Folder name cannot be empty")
        .max(255, "Folder name is too long")
        .regex(/^[^<>:"/\\|?*]+$/, "Folder name contains invalid characters"), // Prevents bad characters
    
    parentId: z.string().uuid("Invalid parent ID").optional().nullable(),
});

export const updateFolderSchema = z.object({
    
    name : z.string()
        .min(1,"folder name cannot be empty")
        .max(255, "folder name is too long")
        .regex(/^[^<>:"/\\|?*]+$/, "Folder name contains invalid characters")
        .optional(),
    parentId : z.string()
            .uuid("Invalid parent ID")
            .optional()
            .nullable(),
    }).refine(data => data.name !== undefined || data.parentId !== undefined, {
    message: "You must provide either a new name or a new parentId to update."
})

export const renameFolderSchema= z.object({
    
    name : z.string()
        .min(1,"folder name cannot be empty")
        .max(255, "folder name is too long")
        .regex(/^[^<>:"/\\|?*]+$/, "Folder name contains invalid characters"),
    })


export const getFolderParamsSchema = z.object({
    id: z.string().uuid("Invalid folder ID format"),
})