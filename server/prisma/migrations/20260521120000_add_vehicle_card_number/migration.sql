-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN "cardNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_cardNumber_key" ON "vehicles"("cardNumber");

-- CreateIndex
CREATE INDEX "vehicles_cardNumber_idx" ON "vehicles"("cardNumber");
