import { prisma } from '../lib/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { WalletTxKind, type Wallet } from '@prisma/client';

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
    wallet = await prisma.wallet.create({ data: { userId, balanceCents: 0, currency: 'USD' } });
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
