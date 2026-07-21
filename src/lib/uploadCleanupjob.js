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
        console.error(
          `[CleanupJob] Failed to abort multipart upload for key ${upload.Key}:`,
          err.message
        );
      });
    }
    }catch(err){
      console.error(
      `[CleanupJob] Failed to list multipart uploads for prefix ${s3KeyPrefix}:`,
      err.message
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
    console.log(`[CleanupJob] Marked ${count} expired PENDING session(s) as ABORTED.`);
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

  console.log(
    `[CleanupJob] Found ${stuckSessions.length} stuck UPLOADING session(s). Cleaning up...`
  );

  for (const session of stuckSessions){
    try{
        await abortOrphanedS3MultipartUploads(session.s3Key);

        await deleteS3Object(session.s3Key).catch((err) => {
        console.error(
          `[CleanupJob] Failed to delete S3 object for key ${session.s3Key}:`,
          err.message
        );
     })
        await prisma.uploadSession.update({
        where: { id: session.id },
        data: {
          status: 'FAILED',
          errorMessage: `Upload timed out after ${STUCK_UPLOAD_TIMEOUT_MINUTES} minutes. The upload process may have crashed.`,
        },
      });

      console.log(`[CleanupJob] Cleaned up stuck session: ${session.id}`);
    }catch(err){
    console.error(
        `[CleanupJob] Failed to clean up session ${session.id}:`,
        err.message
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

  console.log(
    `[CleanupJob] Found ${expiredFiles.length} expired trashed file(s). Purging...`
  );

  for (const file of expiredFiles) {
    try {
      // S3 first
      await deleteS3Object(file.key).catch((err) => {
        console.error(
          `[CleanupJob] Failed to delete S3 object ${file.key}:`,
          err.message
        );
      });

      // Then DB
      await prisma.file.delete({
        where: { id: file.id },
      });

      console.log(`[CleanupJob] Purged expired trashed file: ${file.id}`);
    } catch (err) {
      console.error(
        `[CleanupJob] Failed to purge file ${file.id}:`,
        err.message
      );
    }
  }
};



const purgeExpiredTrashedFolders = async () => {
  const cutoff = new Date(
    Date.now() - TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000
  );

  // Only purge top-level trashed folders (trashedIndependently: true)
  // whose deletedAt has passed the retention period.
  // Cascaded subfolders/files will be handled by DB cascade on folder delete.
  const expiredFolders = await prisma.folder.findMany({
    where: {
      deletedAt: { not: null, lt: cutoff },
      trashedIndependently: true,
    },
    select: { id: true },
  });

  if (expiredFolders.length === 0) return;

  console.log(
    `[CleanupJob] Found ${expiredFolders.length} expired trashed folder(s). Purging...`
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
            console.error(
              `[CleanupJob] Failed to delete S3 object ${file.key}:`,
              err.message
            )
          )
        )
      );

      // Delete root folder — DB cascade handles subfolders and files
      await prisma.folder.delete({
        where: { id: folder.id },
      });

      console.log(`[CleanupJob] Purged expired trashed folder: ${folder.id}`);
    } catch (err) {
      console.error(
        `[CleanupJob] Failed to purge folder ${folder.id}:`,
        err.message
      );
    }
  }
};




export const runUploadCleanupJob = async () => {
  console.log('[CleanupJob] Starting upload cleanup job...');

  try {
    await cleanupExpiredPendingSessions();
    await cleanupStuckUploadingSessions();
    await purgeExpiredTrashedFiles();      // ← new
    await purgeExpiredTrashedFolders();    // ← new
  } catch (err) {
    console.error('[CleanupJob] Unexpected error during cleanup:', err.message);
  }

  console.log('[CleanupJob] Upload cleanup job complete.');
};