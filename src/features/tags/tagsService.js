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



