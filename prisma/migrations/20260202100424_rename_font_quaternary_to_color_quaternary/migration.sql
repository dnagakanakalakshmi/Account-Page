/*
  Warnings:

  - You are about to drop the column `fontQuaternary` on the `MenuSettings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "MenuSettings" DROP COLUMN "fontQuaternary",
ADD COLUMN     "colorQuaternary" TEXT NOT NULL DEFAULT '#7983e61a';
