import { prisma } from '../lib/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { WalletTxKind, type Wallet, type CardBrand } from '@prisma/client';

interface WalletDto {
  id: string;
  balanceCents: number;
  currency: string;
  autoRefillEnabled: boolean;
  autoRefillThresholdCents: number;
  autoRefillAmountCents: number;
  monthlySpendCents: number;
  lastTopUp: { amountCents: number; createdAt: Date } | null;
}

async function ensureWallet(userId: string): Promise<Wallet> {
  let wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) {
    wallet = await prisma.wallet.create({ data: { userId, balanceCents: 0, currency: 'ETB' } });
  }
  return wallet;
}

export async function getWallet(userId: string): Promise<WalletDto> {
  const wallet = await ensureWallet(userId);

  // Monthly spend = sum of negative transactions (charges/pays) for this month
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const spent = await prisma.walletTransaction.aggregate({
    where: {
      walletId: wallet.id,
      createdAt: { gte: monthStart },
      amountCents: { lt: 0 },
    },
    _sum: { amountCents: true },
  });

  const lastTopUp = await prisma.walletTransaction.findFirst({
    where: { walletId: wallet.id, kind: WalletTxKind.TOPUP },
    orderBy: { createdAt: 'desc' },
    select: { amountCents: true, createdAt: true },
  });

  return {
    id: wallet.id,
    balanceCents: wallet.balanceCents,
    currency: wallet.currency,
    autoRefillEnabled: wallet.autoRefillEnabled,
    autoRefillThresholdCents: wallet.autoRefillThresholdCents,
    autoRefillAmountCents: wallet.autoRefillAmountCents,
    monthlySpendCents: Math.abs(spent._sum.amountCents ?? 0),
    lastTopUp,
  };
}

export async function updateWallet(
  userId: string,
  patch: {
    autoRefillEnabled?: boolean;
    autoRefillThresholdCents?: number;
    autoRefillAmountCents?: number;
  },
): Promise<WalletDto> {
  await ensureWallet(userId);
  await prisma.wallet.update({ where: { userId }, data: patch });
  return getWallet(userId);
}

export async function topUp(
  userId: string,
  amountCents: number,
  paymentMethodId: string,
): Promise<WalletDto> {
  if (amountCents <= 0) throw ApiError.badRequest('Amount must be positive');

  const wallet = await ensureWallet(userId);
  const card = await prisma.userPaymentMethod.findUnique({ where: { id: paymentMethodId } });
  if (!card || card.userId !== userId) throw ApiError.notFound('Payment method not found');

  const newBalance = wallet.balanceCents + amountCents;
  await prisma.$transaction([
    prisma.wallet.update({ where: { id: wallet.id }, data: { balanceCents: newBalance } }),
    prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        kind: WalletTxKind.TOPUP,
        amountCents,
        balanceAfterCents: newBalance,
        description: `Top-up · ${card.brand} •••• ${card.last4}`,
        paymentMethodId: card.id,
      },
    }),
  ]);

  return getWallet(userId);
}

export async function listPaymentMethods(userId: string): Promise<unknown[]> {
  return prisma.userPaymentMethod.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    select: { id: true, brand: true, last4: true, expiryMonth: true, expiryYear: true, holderName: true, isDefault: true },
  });
}

export async function listWalletTransactions(
  userId: string,
  limit: number,
): Promise<unknown[]> {
  const wallet = await ensureWallet(userId);
  return prisma.walletTransaction.findMany({
    where: { walletId: wallet.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

interface CreatePaymentMethodInput {
  brand: CardBrand;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  holderName?: string;
  isDefault?: boolean;
}

export async function createPaymentMethod(userId: string, input: CreatePaymentMethodInput) {
  // If marking this as default, clear other defaults first
  if (input.isDefault) {
    await prisma.userPaymentMethod.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  } else {
    // If no methods on file, this becomes default automatically
    const count = await prisma.userPaymentMethod.count({ where: { userId } });
    if (count === 0) input.isDefault = true;
  }

  const created = await prisma.userPaymentMethod.create({
    data: {
      userId,
      brand: input.brand,
      last4: input.last4,
      expiryMonth: input.expiryMonth,
      expiryYear: input.expiryYear,
      holderName: input.holderName,
      isDefault: input.isDefault ?? false,
    },
    select: { id: true, brand: true, last4: true, expiryMonth: true, expiryYear: true, holderName: true, isDefault: true },
  });
  return created;
}

export async function updatePaymentMethod(
  userId: string,
  id: string,
  patch: { isDefault?: boolean; holderName?: string; expiryMonth?: number; expiryYear?: number },
) {
  const existing = await prisma.userPaymentMethod.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) throw ApiError.notFound('Payment method not found');

  if (patch.isDefault === true) {
    // Clear other defaults
    await prisma.userPaymentMethod.updateMany({
      where: { userId, isDefault: true, id: { not: id } },
      data: { isDefault: false },
    });
  }

  return prisma.userPaymentMethod.update({
    where: { id },
    data: patch,
    select: { id: true, brand: true, last4: true, expiryMonth: true, expiryYear: true, holderName: true, isDefault: true },
  });
}

export async function deletePaymentMethod(userId: string, id: string) {
  const existing = await prisma.userPaymentMethod.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) throw ApiError.notFound('Payment method not found');

  const wasDefault = existing.isDefault;
  await prisma.userPaymentMethod.delete({ where: { id } });

  // If we deleted the default, promote the next most-recent one
  if (wasDefault) {
    const next = await prisma.userPaymentMethod.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    if (next) {
      await prisma.userPaymentMethod.update({
        where: { id: next.id },
        data: { isDefault: true },
      });
    }
  }
}
