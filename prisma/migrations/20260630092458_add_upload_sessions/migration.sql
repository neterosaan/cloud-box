/*
  Warnings:

  - A unique constraint covering the columns `[uploadSessionId]` on the table `File` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('PENDING', 'UPLOADING', 'COMPLETED', 'FAILED', 'ABORTED');

-- AlterTable
ALTER TABLE "File" ADD COLUMN     "uploadSessionId" TEXT;

-- CreateTable
CREATE TABLE "UploadSession" (
    "id" TEXT NOT NULL,
    "status" "UploadStatus" NOT NULL DEFAULT 'PENDING',
    "fileName" TEXT NOT NULL,
    "declaredSize" INTEGER,
    "mimeType" TEXT,
    "folderId" TEXT,
    "userId" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "s3UploadId" TEXT,
    "actualSize" INTEGER,
    "actualMimeType" TEXT,
    "errorMessage" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UploadSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UploadSession_userId_status_idx" ON "UploadSession"("userId", "status");

-- CreateIndex
CREATE INDEX "UploadSession_expiresAt_idx" ON "UploadSession"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "File_uploadSessionId_key" ON "File"("uploadSessionId");

-- AddForeignKey
ALTER TABLE "UploadSession" ADD CONSTRAINT "UploadSession_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadSession" ADD CONSTRAINT "UploadSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_uploadSessionId_fkey" FOREIGN KEY ("uploadSessionId") REFERENCES "UploadSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
