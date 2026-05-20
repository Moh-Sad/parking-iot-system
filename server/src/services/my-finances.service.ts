import { prisma } from '../lib/prisma.js';
import { InvoiceStatus, WalletTxKind } from '@prisma/client';
import { parsePage, buildMeta, type PageMeta } from '../lib/pagination.js';
import { ApiError } from '../utils/ApiError.js';

interface SummaryDto {
  totalSpentYearToDateCents: number;
  pendingBalanceCents: number;
  unpaidInvoiceCount: number;
  availableCreditsCents: number;
  currency: string;
}

export async function getSummary(userId: string): Promise<SummaryDto> {
  const yearStart = new Date();
  yearStart.setUTCMonth(0, 1);
  yearStart.setUTCHours(0, 0, 0, 0);

  const [paid, pending, wallet] = await Promise.all([
    prisma.invoice.aggregate({
      where: { ownerId: userId, status: InvoiceStatus.PAID, paidAt: { gte: yearStart } },
      _sum: { grandTotalCents: true },
    }),
    prisma.invoice.findMany({
      where: { ownerId: userId, status: { in: [InvoiceStatus.PROCESSING, InvoiceStatus.OVERDUE] } },
      select: { grandTotalCents: true },
    }),
    prisma.wallet.findUnique({ where: { userId } }),
  ]);

  const pendingTotal = pending.reduce((a, p) => a + p.grandTotalCents, 0);

  return {
    totalSpentYearToDateCents: paid._sum.grandTotalCents ?? 0,
    pendingBalanceCents: pendingTotal,
    unpaidInvoiceCount: pending.length,
    availableCreditsCents: wallet?.balanceCents ?? 0,
    currency: 'USD',
  };
}

interface MyInvoiceRow {
  id: string;
  code: string;
  client: string;
  node: string;
  date: Date;
  amount: number;
  currency: string;
  status: InvoiceStatus;
}

export async function listMyInvoices(
  userId: string,
  query: { status?: string; page?: number; limit?: number },
): Promise<{ rows: MyInvoiceRow[]; meta: PageMeta }> {
  const { page, limit, skip } = parsePage({ page: query.page, limit: query.limit });

  const where: { ownerId: string; status?: { in: InvoiceStatus[] } | InvoiceStatus } = { ownerId: userId };
  if (query.status === 'PENDING') {
    where.status = { in: [InvoiceStatus.PROCESSING, InvoiceStatus.OVERDUE] };
  } else if (query.status && query.status !== 'ALL') {
    where.status = query.status as InvoiceStatus;
  }

  const [total, rows] = await Promise.all([
    prisma.invoice.count({ where }),
    prisma.invoice.findMany({
      where,
      orderBy: { issueDate: 'desc' },
      skip,
      take: limit,
      include: { station: { select: { name: true, code: true } } },
    }),
  ]);

  return {
    rows: rows.map((r) => ({
      id: r.id,
      code: r.code,
      client: r.clientName,
      node: r.station.name,
      date: r.issueDate,
      amount: r.grandTotalCents,
      currency: r.currency,
      status: r.status,
    })),
    meta: buildMeta(page, limit, total),
  };
}

export async function getMyInvoice(userId: string, invoiceId: string): Promise<unknown> {
  const inv = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      station: { select: { id: true, name: true, code: true, region: true } },
      lineItems: { orderBy: { sortOrder: 'asc' } },
    },
  });
  if (!inv) throw ApiError.notFound('Invoice not found');
  if (inv.ownerId !== userId) throw ApiError.forbidden();
  return {
    id: inv.id,
    code: inv.code,
    clientName: inv.clientName,
    station: inv.station,
    issueDate: inv.issueDate,
    dueDate: inv.dueDate,
    status: inv.status,
    billTo: inv.billTo,
    lineItems: inv.lineItems.map((li) => ({
      id: li.id,
      label: li.label,
      description: li.description,
      totalCents: li.totalCents,
    })),
    subtotalCents: inv.subtotalCents,
    taxCents: inv.taxCents,
    grandTotalCents: inv.grandTotalCents,
    currency: inv.currency,
    paidAt: inv.paidAt,
  };
}

export async function payInvoice(
  userId: string,
  invoiceId: string,
  opts: { paymentMethodId?: string; useWalletBalance?: boolean },
): Promise<unknown> {
  const inv = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!inv) throw ApiError.notFound('Invoice not found');
  if (inv.ownerId !== userId) throw ApiError.forbidden();
  if (inv.status === InvoiceStatus.PAID) throw ApiError.conflict('Invoice already paid');

  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) throw ApiError.badRequest('No wallet on file');

  const useWallet = opts.useWalletBalance ?? true;
  let chargedFromWallet = 0;
  let chargedToCard = 0;
  const paymentMethodId = opts.paymentMethodId;

  if (useWallet && wallet.balanceCents >= inv.grandTotalCents) {
    chargedFromWallet = inv.grandTotalCents;
  } else if (useWallet && wallet.balanceCents > 0) {
    chargedFromWallet = wallet.balanceCents;
    chargedToCard = inv.grandTotalCents - chargedFromWallet;
  } else {
    chargedToCard = inv.grandTotalCents;
  }

  if (chargedToCard > 0) {
    if (!paymentMethodId) throw ApiError.badRequest('Payment method required to cover the remainder');
    const card = await prisma.userPaymentMethod.findUnique({ where: { id: paymentMethodId } });
    if (!card || card.userId !== userId) throw ApiError.notFound('Payment method not found');
  }

  const newBalance = wallet.balanceCents - chargedFromWallet;
  const now = new Date();
  await prisma.$transaction([
    prisma.invoice.update({
      where: { id: inv.id },
      data: { status: InvoiceStatus.PAID, paidAt: now },
    }),
    ...(chargedFromWallet > 0
      ? [
          prisma.wallet.update({ where: { id: wallet.id }, data: { balanceCents: newBalance } }),
          prisma.walletTransaction.create({
            data: {
              walletId: wallet.id,
              kind: WalletTxKind.INVOICE_PAY,
              amountCents: -chargedFromWallet,
              balanceAfterCents: newBalance,
              description: `Invoice ${inv.code} (wallet)`,
              relatedInvoiceId: inv.id,
            },
          }),
        ]
      : []),
  ]);

  return {
    invoiceId: inv.id,
    status: 'PAID',
    paidAt: now,
    chargedFromWalletCents: chargedFromWallet,
    chargedToCardCents: chargedToCard,
  };
}
