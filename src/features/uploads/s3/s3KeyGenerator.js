export const generateS3Key = (userId, uploadSessionId, fileName) => {
  const sanitized = fileName
    .replace(/[^\w.\-]/g, '_')  
    .replace(/_{2,}/g, '_')    
    .toLowerCase();

  return `users/${userId}/${uploadSessionId}/${sanitized}`;
};