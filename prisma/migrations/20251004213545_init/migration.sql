/*
  Warnings:

  - You are about to drop the column `parentChapterId` on the `chapters` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."chapters" DROP CONSTRAINT "chapters_novelId_fkey";

-- DropForeignKey
ALTER TABLE "public"."chapters" DROP CONSTRAINT "chapters_parentChapterId_fkey";

-- DropForeignKey
ALTER TABLE "public"."choices" DROP CONSTRAINT "choices_chapterId_fkey";

-- AlterTable
ALTER TABLE "chapters" DROP COLUMN "parentChapterId",
ADD COLUMN     "positionX" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "positionY" DOUBLE PRECISION DEFAULT 0;

-- AddForeignKey
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "novels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "choices" ADD CONSTRAINT "choices_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
