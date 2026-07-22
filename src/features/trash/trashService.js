import prisma from '../../config/prisma.js';
import { deleteS3Object } from '../uploads/s3/s3UploadService.js';
import { parsePagination, buildPaginationMeta } from '../../lib/pagination.js';


export const listTrash = async (userId,query)=>{
    const {page, limit , skip} = parsePagination(query);
    const type = query.type

    const includeFiles = !type || type === 'file';
    const includeFolders = !type || type === 'folder';

    const [
        files,
        folders,
        totalFiles,
        totalFolders,
    ] = await Promise.all([
        includeFiles
         ? prisma.file.findMany({
            where : {userId , deletedAt : { not : null},   trashedIndependently: true,  },
            orderBy: { deletedAt: 'desc' }, 
            include: { tags: true },
            take: limit,
            skip,         
         })
         :[],
        includeFolders
         ? prisma.folder.findMany({
            where : {userId , deletedAt : { not : null},   trashedIndependently: true,  },
            orderBy: { deletedAt: 'desc' }, 
            take: limit,
            skip,         
         })
         :[],
        includeFiles
        ? prisma.file.count({
            where: { userId, deletedAt: { not: null },   trashedIndependently: true, },
            })
        : 0,
        includeFolders
        ? prisma.folder.count({
            where: { userId, deletedAt: { not: null },   trashedIndependently: true, },
            })
        : 0,
    ])

  return {
    files: {
      data: files,
      meta: buildPaginationMeta(totalFiles, page, limit),
    },
    folders: {
      data: folders,
      meta: buildPaginationMeta(totalFolders, page, limit),
    },
  };
}




export const restoreFile = async (userId, fileId) => {
  const file = await prisma.file.findUnique({
    where: { id: fileId },
  });

  if (!file || file.userId !== userId) {
    const err = new Error('File not found or unauthorized.');
    err.status = 404;
    throw err;
  }

  if (file.deletedAt === null) {
    const err = new Error('File is not in trash.');
    err.status = 409;
    throw err;
  }

  let targetFolderId = file.originalFolderId;

  if (targetFolderId) {
    const parentFolder = await prisma.folder.findUnique({
      where: { id: targetFolderId },
    });

    if (!parentFolder || parentFolder.deletedAt !== null) {
      targetFolderId = null;
    }
  }

  const restoredFile = await prisma.file.update({
    where: { id: fileId },
    data: {
      deletedAt: null,
      folderId: targetFolderId,
      trashedIndependently: false,
      originalFolderId: null, 
    },
  });

  return restoredFile;
};


export const restoreFolder = async (userId, folderId) => {
  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
  });

  if (!folder || folder.userId !== userId) {
    const err = new Error('Folder not found or unauthorized.');
    err.status = 404;
    throw err;
  }

  if (folder.deletedAt === null) {
    const err = new Error('Folder is not in trash.');
    err.status = 409;
    throw err;
  }

  let targetParentId = folder.originalParentId;

  if (targetParentId) {
    const parentFolder = await prisma.folder.findUnique({
      where: { id: targetParentId },
    });

    if (!parentFolder || parentFolder.deletedAt !== null) {
      targetParentId = null;
    }
  }

  const descendants = await prisma.$queryRaw`
    WITH RECURSIVE descendants AS (
      SELECT id
      FROM "Folder"
      WHERE id = ${folderId}

      UNION ALL

      SELECT f.id
      FROM "Folder" f
      INNER JOIN descendants d
        ON f."parentId" = d.id
      WHERE
        f."deletedAt" IS NOT NULL
        AND f."trashedIndependently" = false
    )
    SELECT id
    FROM descendants
  `;

  const allFolderIds = descendants.map((d) => d.id);

  const descendantFolderIds = allFolderIds.filter((id) => id !== folderId);

  await prisma.$transaction([
    prisma.folder.updateMany({
      where: {
        id: { in: descendantFolderIds },
        deletedAt: { not: null },
        trashedIndependently: false,
      },
      data: {
        deletedAt: null,
        trashedIndependently: false,
      },
    }),

    prisma.folder.update({
      where: { id: folderId },
      data: {
        deletedAt: null,
        parentId: targetParentId,
        trashedIndependently: false,
        originalParentId: null, 
      },
    }),

    prisma.file.updateMany({
      where: {
        folderId: { in: allFolderIds },
        deletedAt: { not: null },
        trashedIndependently: false,
      },
      data: {
        deletedAt: null,
        trashedIndependently: false,
      },
    }),
  ]);

  return {
    message: 'Folder and its contents restored successfully.',
  };
};




export const permanentDeleteFile = async (userId, fileId) => {
  const file = await prisma.file.findUnique({
    where: { id: fileId },
  });

  if (!file || file.userId !== userId) {
    const err = new Error('File not found or unauthorized.');
    err.status = 404;
    throw err;
  }

  if (file.deletedAt === null) {
    const err = new Error('File must be in trash before it can be permanently deleted.');
    err.status = 409;
    throw err;
  }

  await deleteS3Object(file.key).catch(() => {
    const err = new Error('Failed to delete file from storage. Please try again.');
    err.status = 500;
    throw err;
  });

  await prisma.file.delete({
    where: { id: fileId },
  });

  return { message: 'File permanently deleted.' };
};



export const permanentDeleteFolder = async (userId, folderId) => {
  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
  });

  if (!folder || folder.userId !== userId) {
    const err = new Error('Folder not found or unauthorized.');
    err.status = 404;
    throw err;
  }

  if (folder.deletedAt === null) {
    const err = new Error('Folder must be in trash before it can be permanently deleted.');
    err.status = 409;
    throw err;
  }

  const descendants = await prisma.$queryRaw`
    WITH RECURSIVE descendants AS (
      SELECT id FROM "Folder" WHERE id = ${folderId}
      UNION ALL
      SELECT f.id FROM "Folder" f
      INNER JOIN descendants d ON f."parentId" = d.id
          WHERE
      f."trashedIndependently" = false
    )
    SELECT id FROM descendants
  `;

  const allFolderIds = descendants.map(d => d.id);

  const filesToDelete = await prisma.file.findMany({
    where: { folderId: { in: allFolderIds },   deletedAt: { not: null },trashedIndependently: false, },
    select: { id: true, key: true },
  });

  await Promise.allSettled(
    filesToDelete.map(file =>
      deleteS3Object(file.key).catch(err =>
        console.error(`[PermanentDelete] Failed to delete S3 object ${file.key}:`, err.message)
      )
    )
  );

  await prisma.folder.delete({
    where: { id: folderId },
  });

  return { message: 'Folder and its contents permanently deleted.' };
};