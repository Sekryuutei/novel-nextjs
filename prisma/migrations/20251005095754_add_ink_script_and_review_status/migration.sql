-- AlterEnum
ALTER TYPE "NovelStatus" ADD VALUE 'IN_REVIEW';

-- AlterTable
ALTER TABLE "novels" ADD COLUMN     "inkScript" TEXT;
