-- AlterTable
ALTER TABLE "File" ADD COLUMN     "originalParentId" TEXT;

-- AlterTable
ALTER TABLE "Folder" ADD COLUMN     "originalParentId" TEXT;
