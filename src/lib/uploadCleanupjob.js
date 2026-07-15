import prisma from '../config/prisma.js';
import { deleteS3Object } from '../features/uploads/s3/s3UploadService.js';
import { AbortMultipartUploadCommand, ListMultipartUploadsCommand } from '@aws-sdk/client-s3';
import s3 from '../config/s3.js';


const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

const STUCK_UPLOAD_TIMEOUT_MINUTES = 30;

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



export const runUploadCleanupJob = async () => {
  console.log('[CleanupJob] Starting upload cleanup job...');

  try {
    await cleanupExpiredPendingSessions();
    await cleanupStuckUploadingSessions();
  } catch (err) {
    console.error('[CleanupJob] Unexpected error during cleanup:', err.message);
  }

  console.log('[CleanupJob] Upload cleanup job complete.');
};