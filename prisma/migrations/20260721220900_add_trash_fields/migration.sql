-- AlterTable
ALTER TABLE "File" ADD COLUMN     "trashedIndependently" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Folder" ADD COLUMN     "trashedIndependently" BOOLEAN NOT NULL DEFAULT false;
