import prisma from '../../config/prisma.js';
import { generatePresignedDownloadUrl } from '../uploads/s3/s3UploadService.js';
import { normalizeError } from '../../lib/normalizeError.js';
import { parsePagination, buildPaginationMeta } from '../../lib/pagination.js';

export const  downloadFile = async(userId,fileId)=>{
    const file = await prisma.file.findUnique({
        where : { id : fileId },
    });

    if (!file || file.userId !== userId || file.deletedAt !== null) {
    const err = new Error('File not found or unauthorized.');
    err.status = 404;
    throw err;
  }
  const url = await generatePresignedDownloadUrl(file.key, file.mimeType).catch(()=>{
    const err = new Error('Failed to generate download URL. Please try again.');
    err.status = 500;
    throw err;
  });
  
  return { url, expiresIn:3600 };
}



export const updateFile = async (userId, fileId, updateData) => {
  const file = await prisma.file.findUnique({
    where: { id: fileId },
  });

  if (!file || file.userId !== userId || file.deletedAt !== null) {
    const err = new Error('File not found or unauthorized.');
    err.status = 404;
    throw err;
  }

  if(updateData.folderId !== undefined && updateData.folderId !== null){
    const targetFolder = await prisma.folder.findUnique({
        where : { id: updateData.folderId },
    })
    if (!targetFolder || targetFolder.userId !== userId  || targetFolder.deletedAt !== null) {
      const err = new Error('Target folder not found or unauthorized.');
      err.status = 404;
      throw err;
    }
  }


  try {
    const updatedFile = await prisma.file.update({
      where: { id: fileId  , deletedAt : null},
      data: updateData,
    });

    return updatedFile;
  } catch (err) {
    throw normalizeError(err);
  }

}



export const deleteFile = async (userId, fileId) => {
  const file = await prisma.file.findUnique({
    where: { id: fileId },
  });

  if (!file || file.userId !== userId || file.deletedAt !== null) {
    const err = new Error('File not found or unauthorized.');
    err.status = 404;
    throw err;
  }

  await prisma.file.update({
    where: { id: fileId },
    data: { deletedAt: new Date() , trashedIndependently: true},
  });

  return { message: 'File moved to trash.' };
};



export const attachTag = async (userId, fileId, tagId) => {


    const file = await prisma.file.findUnique({
    where: { id: fileId },
  });

  if (!file || file.userId !== userId || file.deletedAt !== null) {
    const err = new Error('File not found or unauthorized.');
    err.status = 404;
    throw err;
  }


  const tag = await prisma.tag.findUnique({
    where: { id: tagId },
  });

  if (!tag || tag.userId !== userId) {
    const err = new Error('Tag not found or unauthorized.');
    err.status = 404;
    throw err;
  }
  const alreadyAttached = await prisma.file.findFirst({
    where:{
        id: fileId,
        tags: { some : { id: tagId } },
        deletedAt : null
    },
  });

  if (alreadyAttached) {
    const err = new Error('Tag is already attached to this file.');
    err.status = 409;
    throw err;
  }

  const updatedFile = await prisma.file.update({
    where: { id: fileId , deletedAt : null },
    data:{
        tags:{
            connect: { id:tagId },
        },
    },
    include: {
        tags:true,
    },
  });
  
  return updatedFile
};

export const detachTag = async (userId, fileId, tagId) => {

  const file = await prisma.file.findUnique({
    where: { id: fileId },
    include: {
      tags: { where: { id: tagId } },
    },
  });

  if (!file || file.userId !== userId || file.deletedAt !== null ) {
    const err = new Error('File not found or unauthorized.');
    err.status = 404;
    throw err;
  }

  if (file.tags.length === 0) {
    const err = new Error('Tag is not attached to this file.');
    err.status = 404;
    throw err;
  }

  const updatedFile = await prisma.file.update({
    where: { id: fileId , deletedAt : null },
    data: {
      tags: {
        disconnect: { id: tagId },
      },
    },
    include: {
      tags: true,
    },
  });

  return updatedFile;
};





export const searchFiles = async (userId, filters) => {
  const { page, limit, skip } = parsePagination(filters);
  const where = {
    userId,
    deletedAt : null,
    ...(filters.name && {
      name: {
        contains: filters.name,
        mode: 'insensitive',
      },
    }),
    ...(filters.mimeType && {
      mimeType: {
        contains: filters.mimeType,
        mode: 'insensitive',
      },
    }),
    ...(filters.tagId && {
      tags: {
        some: { id: filters.tagId },
      },
    }),
  };

  const [files, total] = await Promise.all([
    prisma.file.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { tags: true },
      take: limit,
      skip,
    }),
    prisma.file.count({ where }),
  ]);

  return {
    data: files,
    meta: buildPaginationMeta(total, page, limit),
  };
};