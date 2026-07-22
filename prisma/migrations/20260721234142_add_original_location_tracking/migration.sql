/*
  Warnings:

  - You are about to drop the column `originalParentId` on the `File` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "File" DROP COLUMN "originalParentId",
ADD COLUMN     "originalFolderId" TEXT;
