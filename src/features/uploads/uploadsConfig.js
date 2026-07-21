
export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

//export const STORAGE_QUOTA_BYTES = 5 * 1024 * 1024 * 1024; // 5GB per user 

export const STORAGE_QUOTA_BYTES =  5 * 1024 * 1024 * 1024;

export const ALLOWED_MIME_TYPES = new Set([
  
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/tiff',


  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',

  'text/plain',
  'text/csv',

  'application/zip',
  'application/x-7z-compressed',
  'application/x-rar-compressed',

  'audio/mpeg',
  'audio/wav',
  'audio/ogg',


  'video/mp4',
  'video/quicktime',
  'video/webm',
]);