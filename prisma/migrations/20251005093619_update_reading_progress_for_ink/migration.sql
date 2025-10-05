/*
  Warnings:

  - You are about to drop the column `currentChapterId` on the `ReadingProgress` table. All the data in the column will be lost.
  - You are about to drop the column `path` on the `ReadingProgress` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ReadingProgress" DROP COLUMN "currentChapterId",
DROP COLUMN "path",
ADD COLUMN     "inkState" TEXT;
