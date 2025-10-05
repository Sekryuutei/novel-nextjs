/*
  Warnings:

  - You are about to drop the column `customBackground` on the `novels` table. All the data in the column will be lost.
  - You are about to drop the column `customFont` on the `novels` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "novels" DROP COLUMN "customBackground",
DROP COLUMN "customFont",
ADD COLUMN     "backgroundColor" TEXT DEFAULT '#FFFFFF',
ADD COLUMN     "fontColor" TEXT DEFAULT '#000000',
ADD COLUMN     "fontFamily" TEXT DEFAULT 'Inter';
