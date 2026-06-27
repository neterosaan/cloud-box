import prisma from "../../config/prisma.js";

export const createFolder = async(userId,name,parentId=null)=>{
    console.log(userId)
    if(parentId){

        const parentFolder= await prisma.folder.findUnique({
            where: {id : parentId}
        })

        if(!parentFolder || parentFolder.userId !== userId){
            throw new Error("parent folder not founr or unauthorized.")
        }
    }

        const existingFolder = await prisma.folder.findFirst({
            where: {
                name,
                parentId,
                userId,
            },
    });

    if(existingFolder){
        throw new Error("A folder with this name already exists in this location.")
    }

    const newFolder = await prisma.folder.create({
        data: {
            name,
            parentId,
            userId
        }
    });

    return  newFolder
};

export const getRootFolders = async(userId)=>{

    const folders = await  prisma.folder.findMany({
        where:{ userId:userId, parentId:null},
        orderBy: {createdAt: 'desc'}
    });

    const files = await prisma.file.findMany({
        where:{ userId:userId, folderId:null},
        orderBy: {createdAt: 'desc'}
    });
    
    return {
        name: "Root",
        folders,
        files
    }
}

export const getFolderById = async(userId,folderId)=>{
     const folder = await prisma.folder.findUnique({
        where: {id : folderId},
        include:{
            subFolders: { orderBy: { createdAt: 'desc' } },
            files: { orderBy: { createdAt: 'desc' } } 
        }
     })

     if (!folder || folder.userId !== userId){

        throw new Error("Folder not found or unauthorized.");
     }

         return {
        id: folder.id,
        name: folder.name,
        parentId: folder.parentId,
        folders: folder.subFolders,
        files: folder.files
    };
}


export const updateFolder = async(userId,folderId,updateData)=>{

    const folder = await prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder || folder.userId !== userId) {
        throw new Error("Folder not found or unauthorized.");
    }

    if (updateData.parentId === folderId) {
        throw new Error("A folder cannot be its own parent.");
    }

    if (updateData.parentId) {
    const newParent = await prisma.folder.findUnique({ where: { id: updateData.parentId } });
    if (!newParent || newParent.userId !== userId) {
        throw new Error("Target parent folder not found or unauthorized.");
    }
    }

    const updatedFolder = await prisma.folder.update({
        where : {id: folderId},
        data: updateData
    })

    return updatedFolder

};



export const deleteFolder = async (userId, folderId) => {

    const folder = await prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder || folder.userId !== userId) {
        throw new Error("Folder not found or unauthorized.");
    }

    await prisma.folder.delete({
        where: { id: folderId }
    });

    return { message: "Folder and all its contents deleted successfully." };
};
