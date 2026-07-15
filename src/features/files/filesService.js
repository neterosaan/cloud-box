import prisma from '../../config/prisma.js';
import { generatePresignedDownloadUrl, deleteS3Object } from '../uploads/s3/s3UploadService.js';
import { normalizeError } from '../../lib/normalizeError.js';

export const  downloadFile = async(userId,fileId)=>{
    const file = await prisma.file.findUnique({
        where : { id : fileId },
    });

    if (!file || file.userId !== userId) {
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

  if (!file || file.userId !== userId) {
    const err = new Error('File not found or unauthorized.');
    err.status = 404;
    throw err;
  }

  if(updateData.folderId !== undefined && updateData.folderId !== null){
    const targetFolder = await prisma.folder.findUnique({
        where : { id: updateData.folderId },
    })
    if (!targetFolder || targetFolder.userId !== userId) {
      const err = new Error('Target folder not found or unauthorized.');
      err.status = 404;
      throw err;
    }
  }


  try {
    const updatedFile = await prisma.file.update({
      where: { id: fileId },
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

  if (!file || file.userId !== userId) {
    const err = new Error('File not found or unauthorized.');
    err.status = 404;
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

    return { message: 'File deleted successfully.' };
};