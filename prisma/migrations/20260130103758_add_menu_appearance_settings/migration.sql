-- AlterTable
ALTER TABLE "MenuSettings" ADD COLUMN     "colorPrimary" TEXT NOT NULL DEFAULT '#000000',
ADD COLUMN     "colorSecondary" TEXT NOT NULL DEFAULT '#ffffff',
ADD COLUMN     "colorTertiary" TEXT NOT NULL DEFAULT '#f4f6f8',
ADD COLUMN     "deleteSvg" TEXT,
ADD COLUMN     "fontPrimary" TEXT,
ADD COLUMN     "fontSecondary" TEXT,
ADD COLUMN     "fontTertiary" TEXT,
ADD COLUMN     "logoutSvg" TEXT;
