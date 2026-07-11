import { pipeline } from 'stream/promises';
import { PassThrough } from 'stream';
import { extractFilePart } from './extractFilePart.js';
import { SizeGuardTransform } from '../streams/sizeGuardTransform.js';
import { MimeTypeSnifferTransform } from '../streams/mimeTypeSnifferTransform.js';
import { MimeTypeValidatorTransform } from '../streams/mimeTypeValidatorTransform.js';
import { createS3Upload } from '../s3/s3UploadService.js';
import { MAX_FILE_SIZE, ALLOWED_MIME_TYPES } from '../uploadsConfig.js';

export const runUploadPipeline = async (session, req) => {

  const { fileStream } = await extractFilePart(req);

  const sizeGuard     = new SizeGuardTransform({ maxBytes: MAX_FILE_SIZE });
  const mimeSniffer   = new MimeTypeSnifferTransform();

  const mimeValidator = new MimeTypeValidatorTransform({
    mimeSniffer,
    allowedTypes: ALLOWED_MIME_TYPES,
  });

  const s3PassThrough = new PassThrough();
  const s3Upload      = createS3Upload(session.s3Key, s3PassThrough);

  try {
    await Promise.all([
      pipeline(fileStream, sizeGuard, mimeSniffer, mimeValidator, s3PassThrough),
      s3Upload.done(),
    ]);
  } catch (err) {
    await s3Upload.abort().catch(() => {});
    if (!err.status) err.status = 500;
    throw err;
  }

  return {
    actualSize:     sizeGuard.bytesReceived,
    actualMimeType: mimeSniffer.detectedMimeType,
  };
};