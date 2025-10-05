/*
  Warnings:

  - You are about to drop the column `chapterId` on the `purchases` table. All the data in the column will be lost.
  - You are about to drop the `chapters` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `choices` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `reading_histories` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."chapters" DROP CONSTRAINT "chapters_authorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."chapters" DROP CONSTRAINT "chapters_novelId_fkey";

-- DropForeignKey
ALTER TABLE "public"."choices" DROP CONSTRAINT "choices_chapterId_fkey";

-- DropForeignKey
ALTER TABLE "public"."choices" DROP CONSTRAINT "choices_nextChapterId_fkey";

-- DropForeignKey
ALTER TABLE "public"."purchases" DROP CONSTRAINT "purchases_chapterId_fkey";

-- DropForeignKey
ALTER TABLE "public"."reading_histories" DROP CONSTRAINT "reading_histories_chapterId_fkey";

-- DropForeignKey
ALTER TABLE "public"."reading_histories" DROP CONSTRAINT "reading_histories_novelId_fkey";

-- DropForeignKey
ALTER TABLE "public"."reading_histories" DROP CONSTRAINT "reading_histories_userId_fkey";

-- AlterTable
ALTER TABLE "purchases" DROP COLUMN "chapterId";

-- DropTable
DROP TABLE "public"."chapters";

-- DropTable
DROP TABLE "public"."choices";

-- DropTable
DROP TABLE "public"."reading_histories";
