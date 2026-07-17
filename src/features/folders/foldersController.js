import { createFolderSchema  , getFolderParamsSchema,updateFolderSchema} from "./foldersValidation.js";
import * as foldersService from './foldersService.js';

export const createFolder = async (req,res)=>{
    const  validationResult = createFolderSchema.safeParse(req.body);
     if (!validationResult.success) {
        return res.status(400).json({
            success: false,
            errors: validationResult.error.format()
        });
        }
    try{

        const { name , parentId}= validationResult.data;

        const userId = req.user.id

        const newFolder = await foldersService.createFolder(userId,name,parentId)

         return res.status(201).json({
            success: true,
            data: newFolder
        });

    }catch (error) {
        return res.status(error.status || 500).json({
            success: false,
            message: error.message
        });
    }
}

export const getFolder = async(req,res)=>{
    try{

        const userId = req.user.id
        const folderId = req.params.id

        let folderData;


        if(!folderId){

            folderData = await foldersService.getRootFolders(userId, req.query)
        }else{

        const validationResult=getFolderParamsSchema.safeParse(req.params);
        if(!validationResult.success){
                return res.status(400).json({
                success: false,
                errors: validationResult.error.format()
            });
        }

           folderData = await foldersService.getFolderById(userId, folderId,  req.query);
        } 
        
        
         return res.status(200).json({
            success: true,
            data: folderData
        });

    }catch (error) {
        return res.status(error.status || 500).json({
            success: false,
            message: error.message
        });
    }
}


export const updateFolder = async (req, res) => {
    try {
        const userId = req.user.id;
        const folderId = req.params.id;

        const paramValidation = getFolderParamsSchema.safeParse(req.params);
        const bodyValidation = updateFolderSchema.safeParse(req.body);

        if (!paramValidation.success || !bodyValidation.success) {
            return res.status(400).json({
                success: false,
                errors: {
                    params: paramValidation.error?.format(),
                    body: bodyValidation.error?.format()
                }
            });
        }
        const updatedFolder = await foldersService.updateFolder(userId, folderId, bodyValidation.data);

        return res.status(200).json({
            success: true,
            data: updatedFolder
        });

    } catch (error) {
        return res.status(error.status || 500).json({
            success: false,
            message: error.message
        });
    }
};


export const deleteFolder = async (req, res) => {
    try {
        const userId = req.user.id;


        const folderId = req.params.id;

        const paramValidation = getFolderParamsSchema.safeParse(req.params);
        if (!paramValidation.success) {
            return res.status(400).json({
                success: false,
                errors: paramValidation.error.format()
            });
        }

        const result = await foldersService.deleteFolder(userId, folderId);

        return res.status(200).json({
            success: true,
            message: result.message
        });

    } catch (error) {
        return res.status(error.status || 500).json({
            success: false,
            message: error.message
        });
    }
};

export const getFolderBreadcrumbs = async (req, res) => {
    
    try{
        const userId = req.user.id
        const folderId = req.params.id
        const validationResult=getFolderParamsSchema.safeParse(req.params);
        if(!validationResult.success){
                return res.status(400).json({
                success: false,
                errors: validationResult.error.format()
            });
        }

        const breadcrumbs = await foldersService.getFolderBreadcrumbs(userId,folderId)
            return res.status(200).json({
            success: true,
            data: breadcrumbs
        });

    }catch (error) {
        return res.status(error.status || 500).json({
            success: false,
            message: error.message
        });
    }
}
