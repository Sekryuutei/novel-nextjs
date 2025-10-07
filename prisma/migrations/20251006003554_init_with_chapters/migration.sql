/*
  Warnings:

  - You are about to drop the column `inkState` on the `ReadingProgress` table. All the data in the column will be lost.
  - You are about to drop the column `backgroundColor` on the `novels` table. All the data in the column will be lost.
  - You are about to drop the column `fontColor` on the `novels` table. All the data in the column will be lost.
  - You are about to drop the column `fontFamily` on the `novels` table. All the data in the column will be lost.
  - You are about to drop the column `inkScript` on the `novels` table. All the data in the column will be lost.
  - Added the required column `chapterId` to the `ReadingProgress` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ReadingProgress" DROP COLUMN "inkState",
ADD COLUMN     "chapterId" TEXT NOT NULL,
ADD COLUMN     "history" JSONB,
ADD COLUMN     "progress" DOUBLE PRECISION DEFAULT 0;

-- AlterTable
ALTER TABLE "novels" DROP COLUMN "backgroundColor",
DROP COLUMN "fontColor",
DROP COLUMN "fontFamily",
DROP COLUMN "inkScript";

-- AlterTable
ALTER TABLE "purchases" ADD COLUMN     "chapterId" TEXT;

-- CreateTable
CREATE TABLE "chapters" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "chapterNumber" INTEGER NOT NULL,
    "isStart" BOOLEAN NOT NULL DEFAULT false,
    "isEnd" BOOLEAN NOT NULL DEFAULT false,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "price" DOUBLE PRECISION,
    "novelId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "backgroundMusic" TEXT,
    "customBackground" TEXT,
    "soundEffects" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "choices" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "nextChapterId" TEXT NOT NULL,

    CONSTRAINT "choices_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "novels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "choices" ADD CONSTRAINT "choices_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "choices" ADD CONSTRAINT "choices_nextChapterId_fkey" FOREIGN KEY ("nextChapterId") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingProgress" ADD CONSTRAINT "ReadingProgress_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
