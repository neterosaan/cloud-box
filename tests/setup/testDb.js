import { PrismaClient } from '@prisma/client';

export const testPrisma = new PrismaClient();


export const resetDb = async () => {
  await testPrisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "_FileTags",
      "File",
      "UploadSession",
      "Folder",
      "Tag",
      "User"
    CASCADE
  `);
};

export const disconnectTestDb = async () => {
  await testPrisma.$disconnect();
};
