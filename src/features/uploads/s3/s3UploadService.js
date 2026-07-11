import { Upload } from '@aws-sdk/lib-storage';
import s3 from '../../../config/s3.js';


const BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const PART_SIZE   = 5 * 1024 * 1024;
const QUEUE_SIZE  = 4; 


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