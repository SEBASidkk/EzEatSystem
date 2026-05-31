-- CreateTable
CREATE TABLE "Backend" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "port" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Backend_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Backend_restaurantId_key" ON "Backend"("restaurantId");

-- CreateIndex
CREATE INDEX "Backend_active_idx" ON "Backend"("active");

-- AddForeignKey
ALTER TABLE "Backend" ADD CONSTRAINT "Backend_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

