-- CreateTable
CREATE TABLE "ClientProject" (
    "id" TEXT NOT NULL,
    "accessCode" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "estimatedEnd" TIMESTAMP(3) NOT NULL,
    "modules" JSONB NOT NULL DEFAULT '[]',
    "updates" JSONB NOT NULL DEFAULT '[]',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientProject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientProject_accessCode_key" ON "ClientProject"("accessCode");

-- CreateIndex
CREATE INDEX "ClientProject_accessCode_idx" ON "ClientProject"("accessCode");
