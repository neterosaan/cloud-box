import prisma from '../config/prisma.js';
import { deleteS3Object } from '../features/uploads/s3/s3UploadService.js';
import { AbortMultipartUploadCommand, ListMultipartUploadsCommand } from '@aws-sdk/client-s3';
import s3 from '../config/s3.js';


const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

const STUCK_UPLOAD_TIMEOUT_MINUTES = 30;

const TRASH_RETENTION_DAYS = 30; 

const abortOrphanedS3MultipartUploads = async (s3KeyPrefix) => {

    try{
        const listCommand = new ListMultipartUploadsCommand({
            Bucket : BUCKET_NAME,
            Prefix : s3KeyPrefix,
        });

        const { Uploads = [] } = await s3.send(listCommand)

        for( const upload of Uploads){
            const abortCommand = new AbortMultipartUploadCommand({
                Bucket : BUCKET_NAME,
                Key : upload.Key,
                UploadId: upload.UploadId
            });
      await s3.send(abortCommand).catch((err) => {
        logger.error(
          {
            key: upload.Key,
            err,
          },
          '[CleanupJob] Failed to abort multipart upload'
        );
      });
    }
    }catch(err){
    logger.error(
      {
        prefix: s3KeyPrefix,
        err,
      },
      '[CleanupJob] Failed to list multipart uploads'
    );
    }
}


const cleanupExpiredPendingSessions = async () => {
    const now = new Date();

    const { count } = await prisma.uploadSession.updateMany({
        where :{
            status : 'PENDING',
            expiresAt: { lt: now},
        },
        data: {
            status: 'ABORTED',
            errorMessage: 'Session expired before upload was started.',
        },
    })
    
    if (count > 0) {
    logger.info(
      { count },
      '[CleanupJob] Marked expired PENDING sessions as ABORTED'
    );
  }
}


const cleanupStuckUploadingSessions = async () => {
  const cutoff = new Date(
    Date.now() - STUCK_UPLOAD_TIMEOUT_MINUTES * 60 * 1000
  );

  const stuckSessions = await prisma.uploadSession.findMany({
    where: {
      status: 'UPLOADING',
      updatedAt: { lt: cutoff },
    },
  });

  if (stuckSessions.length === 0) return;

  logger.info(
    { stuckSessionCount: stuckSessions.length },
    '[CleanupJob] Found stuck UPLOADING sessions. Cleaning up...'
  );

  for (const session of stuckSessions){
    try{
        await abortOrphanedS3MultipartUploads(session.s3Key);

        await deleteS3Object(session.s3Key).catch((err) => {
        logger.error(
          { key: session.s3Key, err },
          '[CleanupJob] Failed to delete S3 object'
        );
     })
        await prisma.uploadSession.update({
        where: { id: session.id },
        data: {
          status: 'FAILED',
          errorMessage: `Upload timed out after ${STUCK_UPLOAD_TIMEOUT_MINUTES} minutes. The upload process may have crashed.`,
        },
      });

    logger.info(
      { sessionId: session.id },
      '[CleanupJob] Cleaned up stuck session'
    );
    }catch(err){
    logger.error(
      { sessionId: session.id, err },
      '[CleanupJob] Failed to clean up session'
    );
    }
  }
}


const purgeExpiredTrashedFiles = async () => {
  const cutoff = new Date(
    Date.now() - TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000
  );

  // Find files that have been in trash longer than retention period
  const expiredFiles = await prisma.file.findMany({
    where: {
      deletedAt: { not: null, lt: cutoff },
    },
    select: { id: true, key: true },
  });

  if (expiredFiles.length === 0) return;

  logger.info(
    { expiredFileCount: expiredFiles.length },
    '[CleanupJob] Found expired trashed files. Purging...'
  );

  for (const file of expiredFiles) {
    try {
      // S3 first
      await deleteS3Object(file.key).catch((err) => {
      logger.error(
        {
          key: file.key,
          err,
        },
        '[CleanupJob] Failed to delete S3 object'
      );
      });

      // Then DB
      await prisma.file.delete({
        where: { id: file.id },
      });

    logger.info(
      {
        fileId: file.id,
      },
      '[CleanupJob] Purged expired trashed file'
    );
    } catch (err) {
      logger.error(
        {
          fileId: file.id,
          err,
        },
        '[CleanupJob] Failed to purge file'
      );
    }
  }
};



const purgeExpiredTrashedFolders = async () => {
  const cutoff = new Date(
    Date.now() - TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000
  );

  const expiredFolders = await prisma.folder.findMany({
    where: {
      deletedAt: { not: null, lt: cutoff },
      trashedIndependently: true,
    },
    select: { id: true },
  });

  if (expiredFolders.length === 0) return;

  logger.info(
    {
      expiredFolderCount: expiredFolders.length,
    },
    '[CleanupJob] Found expired trashed folders. Purging...'
  );

  for (const folder of expiredFolders) {
    try {
      // Find all files inside this folder tree for S3 cleanup
      const descendants = await prisma.$queryRaw`
        WITH RECURSIVE descendants AS (
          SELECT id FROM "Folder" WHERE id = ${folder.id}
          UNION ALL
          SELECT f.id FROM "Folder" f
          INNER JOIN descendants d ON f."parentId" = d.id
        )
        SELECT id FROM descendants
      `;

      const allFolderIds = descendants.map(d => d.id);

      const filesToDelete = await prisma.file.findMany({
        where: {
          folderId: { in: allFolderIds },
          deletedAt: { not: null },
        },
        select: { id: true, key: true },
      });

      // Delete all S3 objects — best effort
      await Promise.allSettled(
        filesToDelete.map(file =>
          deleteS3Object(file.key).catch(err =>
            logger.error(
              {
                key: file.key,
                err,
              },
              '[CleanupJob] Failed to delete S3 object'
            )
          )
        )
      );

      // Delete root folder — DB cascade handles subfolders and files
      await prisma.folder.delete({
        where: { id: folder.id },
      });

      logger.info(
        {
          folderId: folder.id,
        },
        '[CleanupJob] Purged expired trashed folder'
      );
    } catch (err) {
      logger.error(
        {
          folderId: folder.id,
          err,
        },
        '[CleanupJob] Failed to purge folder'
      );
    }
  }
};




export const runUploadCleanupJob = async () => {
  logger.info('[CleanupJob] Starting upload cleanup job...');

  try {
    await cleanupExpiredPendingSessions();
    await cleanupStuckUploadingSessions();
    await purgeExpiredTrashedFiles();     
    await purgeExpiredTrashedFolders();    
  } catch (err) {
  logger.error(
    { err },
    '[CleanupJob] Unexpected error during cleanup'
  );  
}

logger.info('[CleanupJob] Upload cleanup job complete.');

};