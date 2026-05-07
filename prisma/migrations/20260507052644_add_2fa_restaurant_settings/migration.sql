-- AlterTable
ALTER TABLE "Credential" ADD COLUMN     "restaurantId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorSecret" TEXT;

-- CreateTable
CREATE TABLE "SystemSettings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "Credential_restaurantId_idx" ON "Credential"("restaurantId");

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
