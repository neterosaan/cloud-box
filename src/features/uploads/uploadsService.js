import { randomUUID } from 'crypto';
import prisma from '../../config/prisma.js';
import { generateS3Key } from './s3/s3KeyGenerator.js';
import { runUploadPipeline } from './pipeline/runUploadPipeline.js';
import { normalizeError } from '../../lib/normalizeError.js';


const UPLOAD_SESSION_TTL_MINUTES = 15;


export const initUploadSession = async (userId, fileName, folderId = null) => {

  // 1. If a folderId was provided, verify ownership before creating anything
  if (folderId) {
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder || folder.userId !== userId) {
      const err = new Error('Folder not found or unauthorized.');
      err.status = 404;
      throw err;
    }
  }

  // 2. Pre-generate the session ID ourselves so we can build the S3 key
  //    in the same create() call — no two-step write needed
  const uploadSessionId = randomUUID();
  const s3Key = generateS3Key(userId, uploadSessionId, fileName);

  const expiresAt = new Date(
    Date.now() + UPLOAD_SESSION_TTL_MINUTES * 60 * 1000
  );

  // 3. Create the session row
  try{

      const session = await prisma.uploadSession.create({
    data: {
      id: uploadSessionId,
      fileName,
      folderId,
      userId,
      s3Key,
      expiresAt,
      // status defaults to PENDING via schema
    },
  });

  return session;

  }catch(err){
    throw normalizeError(err);
  }
};



export const handleUploadStream = async (userId, uploadId, req) => {


const { count } = await prisma.uploadSession.updateMany({
  where: {
    id: uploadId,
    userId: userId,      
    status: 'PENDING',
    expiresAt: { gt: new Date() }, 
  },
  data: {
    status: 'UPLOADING',
  },
});

if (count === 0) {
  const session = await prisma.uploadSession.findUnique({
    where: { id: uploadId },
  });

  if (!session || session.userId !== userId) {
    const err = new Error('Upload session not found or unauthorized.');
    err.status = 404;
    throw err;
  }

  if (new Date() > session.expiresAt) {
    const err = new Error('Upload session has expired. Please start a new upload.');
    err.status = 410;
    throw err;
  }

  const err = new Error('Upload session is no longer available.');
  err.status = 409;
  throw err;
}

    let pipelineResult;
  try {
    pipelineResult = await runUploadPipeline(session, req);
  } catch (pipelineError) {

   const normalized = normalizeError(pipelineError);

    await prisma.uploadSession.update({
      where: { id: uploadId },
      data: {
        status: 'FAILED',
        errorMessage: pipelineError.message,
      },
    });
    throw normalized; 
  }

  const { actualSize, actualMimeType } = pipelineResult;
  try{
  const file = await prisma.$transaction(async (tx) => {
    const newFile = await tx.file.create({
      data: {
        name: session.fileName,
        key: session.s3Key,
        size: actualSize,
        mimeType: actualMimeType,
        folderId: session.folderId,
        userId: userId,
        uploadSessionId: session.id,
      },
    });

    await tx.uploadSession.update({
      where: { id: uploadId },
      data: {
        status: 'COMPLETED',
        actualSize,
        actualMimeType,
      },
    });

    return newFile;
  });

  return file;
  }catch(txError){
    throw normalizeError(txError)
  }

};
 