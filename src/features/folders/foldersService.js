import prisma from "../../config/prisma.js";

export const createFolder = async(userId,name,parentId=null)=>{
    if(parentId){

        const parentFolder= await prisma.folder.findUnique({
            where: {id : parentId}
        })
        if (!parentFolder || parentFolder.userId !== userId) {
        const err = new Error("Parent folder not found or unauthorized.");
        err.status = 404;
        throw err;
        }
    }

        const existingFolder = await prisma.folder.findFirst({
            where: {
                name,
                parentId,
                userId,
            },
    });

        if (existingFolder) {
        const err = new Error("A folder with this name already exists in this location.");
        err.status = 409; 
        throw err
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

        if (!folder || folder.userId !== userId) {
            const err = new Error("Folder not found or unauthorized.");
            err.status = 404;
            throw err;
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
        const err = new Error("Folder not found or unauthorized.");
        err.status = 404;
        throw err; 
       }

    if (updateData.parentId === folderId) {
        const err = new Error("A folder cannot be its own parent.");
        err.status = 400;
        throw err;  
     }

    if (updateData.parentId) {
        const newParent = await prisma.folder.findUnique({ where: { id: updateData.parentId } });
        if (!newParent || newParent.userId !== userId) {
        const err = new Error("Target parent folder not found or unauthorized.");
        err.status = 404;
        throw err;  
        }
        const descendants = await prisma.$queryRaw`
        WITH RECURSIVE descendants AS (
            SELECT id FROM "Folder"
            where id=${folderId}
            UNION ALL
            SELECT f.id FROM "Folder" f
            INNER JOIN descendants d ON f."parentId" =d.id
        )
            SELECT id FROM descendants
        `;

          const descendantIds = descendants.map(d => d.id);

        if (descendantIds.includes(updateData.parentId)) {
            const err = new Error("Cannot move a folder into its own descendant.");
            err.status = 400;
            throw err;
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
    const err = new Error("Folder not found or unauthorized.");
    err.status = 404;
    throw err;  
    }

    await prisma.folder.delete({
        where: { id: folderId }
    });

    return { message: "Folder and all its contents deleted successfully." };
};


export const getFolderBreadcrumbs = async (userId, folderId) => {
  // use prisma.$queryRaw with the recursive CTE above
  const breadcrumbs = await prisma.$queryRaw`
    WITH RECURSIVE breadcrumbs AS(
     SELECT id,name,"parentId",1 AS depth
     from "Folder"
     where "userId" =${userId} AND id=${folderId}

     UNION ALL

     SELECT f.id,f.name,f."parentId",b.depth + 1
     from "Folder" f
     INNER JOIN breadcrumbs b ON f.id=b."parentId" AND f."userId" = ${userId}
    )
     SELECT id,name,"parentId"
     from breadcrumbs
     ORDER BY depth DESC
  `;
  if(breadcrumbs.length === 0){
    const err = new Error("Folder not found or unauthorized.");
    err.status = 404;
    throw err;
  }

  return breadcrumbs
}