import { Upload } from '@aws-sdk/lib-storage';
import { GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import s3 from '../../../config/s3.js';


const BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const PART_SIZE   = 5 * 1024 * 1024;
const QUEUE_SIZE  = 4; 
const PRESIGNED_URL_TTL = 60 * 60;


export const createS3Upload = (s3Key, bodyStream) => {
  return new Upload({
    client: s3,
    params: {
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: bodyStream,
    },
    partSize: PART_SIZE,
    queueSize: QUEUE_SIZE,
  });
};



export const generatePresignedDownloadUrl = async (s3Key) => {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
  });

  return await getSignedUrl(s3, command, { expiresIn: PRESIGNED_URL_TTL });
};


export const deleteS3Object = async (s3Key) => {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
  });

  await s3.send(command);
};