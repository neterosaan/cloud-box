import prisma from "../../config/prisma.js";
import { parsePagination, buildPaginationMeta } from '../../lib/pagination.js';


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
                deletedAt: null
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

export const getRootFolders = async(userId,query)=>{

    const {page,limit,skip}= parsePagination(query);

    const [
    folders,
    files,
    totalFolders,
    totalFiles,
    ] = await Promise.all([
    prisma.folder.findMany({
      where: { userId, parentId: null, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    }),
    prisma.file.findMany({
      where: { userId, folderId: null ,  deletedAt: null},
      orderBy: { createdAt: 'desc' },
      include: { tags: true },
      take: limit,
      skip,
    }),
    prisma.folder.count({
      where: { userId, parentId: null , deletedAt: null },
    }),
    prisma.file.count({
      where: { userId, folderId: null , deletedAt: null},
    }),
  ]);

  return {
    name: 'Root',
    folders: {
      data: folders,
      meta: buildPaginationMeta(totalFolders, page, limit),
    },
    files: {
      data: files,
      meta: buildPaginationMeta(totalFiles, page, limit),
    },
  };

}

export const getFolderById = async(userId,folderId, query)=>{
  const { page, limit, skip } = parsePagination(query);
  
  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
  });

  if (!folder || folder.userId !== userId || folder.deletedAt !== null) {
    const err = new Error('Folder not found or unauthorized.');
    err.status = 404;
    throw err;
  }

  const [
    subFolders,
    files,
    totalFolders,
    totalFiles,
  ] = await Promise.all([
    prisma.folder.findMany({
      where: { parentId: folderId , deletedAt: null},
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    }),
    prisma.file.findMany({
      where: { folderId , deletedAt: null},
      orderBy: { createdAt: 'desc' },
      include: { tags: true },
      take: limit,
      skip,
    }),
    prisma.folder.count({
      where: { parentId: folderId, deletedAt: null },
    }),
    prisma.file.count({
      where: { folderId, deletedAt: null },
    }),
  ]);

  return {
    id: folder.id,
    name: folder.name,
    parentId: folder.parentId,
    folders: {
      data: subFolders,
      meta: buildPaginationMeta(totalFolders, page, limit),
    },
    files: {
      data: files,
      meta: buildPaginationMeta(totalFiles, page, limit),
    },
  };
};



export const updateFolder = async(userId,folderId,updateData)=>{

    const folder = await prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder || folder.userId !== userId || folder.deletedAt !== null) {
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
        if (!newParent || newParent.userId !== userId || newParent.deletedAt !== null) {
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
    if (!folder || folder.userId !== userId || folder.deletedAt !== null) {
    const err = new Error("Folder not found or unauthorized.");
    err.status = 404;
    throw err;  
    }

  const now = new Date();

  const descendants = await prisma.$queryRaw`
    WITH RECURSIVE descendants AS (
      SELECT id FROM "Folder" WHERE id = ${folderId}
      UNION ALL
      SELECT f.id FROM "Folder" f
      INNER JOIN descendants d ON f."parentId" = d.id
    )
    SELECT id FROM descendants
  `;

  const allFolderIds = descendants.map(d => d.id);

  await prisma.$transaction([
    
    prisma.folder.update({
      where : {id : folderId},
      data : {
        deletedAt: now,
        trashedIndependently: true,
      },
    }),
  prisma.folder.updateMany({
    where: {
      id: { in: allFolderIds.filter(id => id !== folderId) },
      deletedAt: null,
    },
    data: { deletedAt: now },
  }),

  prisma.file.updateMany({
    where: { folderId: { in: allFolderIds }, deletedAt: null },
    data: { deletedAt: now },
  }),
  ]);

  return { message: 'Folder moved to trash.' };
};


export const getFolderBreadcrumbs = async (userId, folderId) => {
  const breadcrumbs = await prisma.$queryRaw`
    WITH RECURSIVE breadcrumbs AS(
     SELECT id,name,"parentId",1 AS depth
     from "Folder"
     where "userId" =${userId} AND id=${folderId} AND "deletedAt" IS NULL

     UNION ALL

     SELECT f.id,f.name,f."parentId",b.depth + 1
     from "Folder" f
     INNER JOIN breadcrumbs b ON f.id=b."parentId" AND f."userId" = ${userId}  AND f."deletedAt" IS NULL
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