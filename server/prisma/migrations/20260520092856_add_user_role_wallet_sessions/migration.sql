-- CreateEnum
CREATE TYPE "WalletTxKind" AS ENUM ('TOPUP', 'CHARGE', 'INVOICE_PAY', 'REFUND', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "CardBrand" AS ENUM ('VISA', 'MASTERCARD', 'AMEX', 'DISCOVER', 'OTHER');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'USER';

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "paidAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "slot_assignments" ADD COLUMN     "carbonOffsetGramsCO2e" INTEGER,
ADD COLUMN     "connectorType" TEXT,
ADD COLUMN     "currentPowerKW" DECIMAL(7,2),
ADD COLUMN     "currentSocPct" INTEGER,
ADD COLUMN     "energyCostCents" INTEGER,
ADD COLUMN     "energyDeliveredKWh" DECIMAL(10,3),
ADD COLUMN     "estimatedRemainingMin" INTEGER,
ADD COLUMN     "facilityFeeCents" INTEGER,
ADD COLUMN     "idleFeeCents" INTEGER,
ADD COLUMN     "idleMinutes" INTEGER,
ADD COLUMN     "invoiceId" TEXT,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentMethodId" TEXT,
ADD COLUMN     "peakPowerKW" DECIMAL(7,2),
ADD COLUMN     "taxCents" INTEGER,
ADD COLUMN     "totalCostCents" INTEGER,
ADD COLUMN     "unitCostPerKWhCents" INTEGER;

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "model" TEXT,
ADD COLUMN     "ownerId" TEXT;

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balanceCents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "autoRefillEnabled" BOOLEAN NOT NULL DEFAULT false,
    "autoRefillThresholdCents" INTEGER NOT NULL DEFAULT 5000,
    "autoRefillAmountCents" INTEGER NOT NULL DEFAULT 10000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "kind" "WalletTxKind" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "balanceAfterCents" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "paymentMethodId" TEXT,
    "relatedInvoiceId" TEXT,
    "relatedAssignmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_payment_methods" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "brand" "CardBrand" NOT NULL DEFAULT 'OTHER',
    "last4" TEXT NOT NULL,
    "expiryMonth" INTEGER NOT NULL,
    "expiryYear" INTEGER NOT NULL,
    "holderName" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wallets_userId_key" ON "wallets"("userId");

-- CreateIndex
CREATE INDEX "wallet_transactions_walletId_createdAt_idx" ON "wallet_transactions"("walletId", "createdAt");

-- CreateIndex
CREATE INDEX "user_payment_methods_userId_idx" ON "user_payment_methods"("userId");

-- CreateIndex
CREATE INDEX "invoices_ownerId_idx" ON "invoices"("ownerId");

-- CreateIndex
CREATE INDEX "vehicles_ownerId_idx" ON "vehicles"("ownerId");

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slot_assignments" ADD CONSTRAINT "slot_assignments_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "user_payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slot_assignments" ADD CONSTRAINT "slot_assignments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "user_payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_payment_methods" ADD CONSTRAINT "user_payment_methods_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
