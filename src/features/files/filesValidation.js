import { z } from 'zod';


export const uploadFile = z.object({

    folderId: z.string().uuid("Invalid folder ID").optional.nullable()

})

export const fileParamsSchema= z.object({
    id: z.string().uuid("Invalid file ID format"),
})

export const updateFileSchema = z.object({
    
    name : z.string()
        .min(1,"File name cannot be empty")
        .max(255, "File name is too long")
        .regex(/^[^<>:"/\\|?*]+$/, "File name contains invalid characters")
        .optional(),
    parentId : z.string()
            .uuid("Invalid parent ID")
            .optional()
            .nullable(),
    }).refine(data => data.name !== undefined || data.parentId !== undefined, {
    message: "You must provide either a new name or a new parentId to update."
})