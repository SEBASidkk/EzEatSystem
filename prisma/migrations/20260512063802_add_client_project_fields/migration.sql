-- AlterTable
ALTER TABLE "ClientProject" ADD COLUMN     "approvals" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "comments" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "communications" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "contacts" JSONB NOT NULL DEFAULT '[]';
