import prisma from '../../config/prisma.js';
import { normalizeError } from '../../lib/normalizeError.js';


export const createTag = async(userId,name)=>{

    try{

        const tag = await prisma.tag.create({
            data: {
                name,
                userId
            },
        });

        return tag;
    } catch(err) {
      throw normalizeError(err);
    }
};

export const getTags = async(userId)=>{

    const tags = await prisma.tag.findMany({
        where: { userId },
        orderBy: { name : 'asc'},
        include: {
            _count:{
                select: { files:true },
            },
        },
    });

    return tags.map(tag=> ({
        id : tag.id,
        name : tag.name,
        fileCount: tag._count.files
    }));
};



export const deleteTag = async (userId, tagId) => {
  const tag = await prisma.tag.findUnique({
    where: { id: tagId },
  });

  if (!tag || tag.userId !== userId) {
    const err = new Error('Tag not found or unauthorized.');
    err.status = 404;
    throw err;
  }

  await prisma.tag.delete({
    where: { id: tagId },
  });

  return { message: 'Tag deleted successfully.' };
};



export const attachTag = async (userId, fileId, tagId) => {


    const file = await prisma.file.findUnique({
    where: { id: fileId },
  });

  if (!file || file.userId !== userId) {
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
    },
  });

  if (alreadyAttached) {
    const err = new Error('Tag is already attached to this file.');
    err.status = 409;
    throw err;
  }

  const updatedFile = await prisma.file.updat({
    where: { id: fileId },
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

  // Verify file ownership
  const file = await prisma.file.findUnique({
    where: { id: fileId },
    include: {
      tags: { where: { id: tagId } },
    },
  });

  if (!file || file.userId !== userId) {
    const err = new Error('File not found or unauthorized.');
    err.status = 404;
    throw err;
  }

  // Verify the tag is actually attached to this file
  if (file.tags.length === 0) {
    const err = new Error('Tag is not attached to this file.');
    err.status = 404;
    throw err;
  }

  const updatedFile = await prisma.file.update({
    where: { id: fileId },
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