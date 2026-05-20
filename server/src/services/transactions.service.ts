import { prisma } from '../lib/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { Prisma, type PaymentMethod, type TransactionStatus } from '@prisma/client';
import type { Actor } from '../types/domain.js';
import { parsePage, buildMeta } from '../lib/pagination.js';

function scope(actor: Actor): Prisma.TransactionWhereInput {
  if (actor.role === 'SUPERVISOR' && actor.region) return { station: { region: actor.region } };
  return {};
}

export async function listTransactions(actor: Actor, query: {
  status?: TransactionStatus;
  method?: PaymentMethod;
  stationId?: string;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
}) {
  const { page, limit, skip } = parsePage(query);
  const where: Prisma.TransactionWhereInput = {
    ...scope(actor),
    ...(query.status ? { status: query.status } : {}),
    ...(query.method ? { method: query.method } : {}),
    ...(query.stationId ? { stationId: query.stationId } : {}),
    ...(query.from || query.to
      ? { processedAt: { ...(query.from ? { gte: query.from } : {}), ...(query.to ? { lte: query.to } : {}) } }
      : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      orderBy: { processedAt: 'desc' },
      skip,
      take: limit,
      include: { station: true },
    }),
  ]);
  return {
    rows: rows.map((t) => ({
      id: t.id,
      code: t.code,
      station: t.station.name,
      status: t.status,
      method: t.method,
      amount: t.amountCents,
      currency: t.currency,
      processedAt: t.processedAt,
    })),
    meta: buildMeta(page, limit, total),
  };
}

export async function getTransaction(actor: Actor, id: string) {
  const t = await prisma.transaction.findUnique({ where: { id }, include: { station: true, assignment: true } });
  if (!t) throw ApiError.notFound('Transaction not found');
  if (actor.role === 'SUPERVISOR' && actor.region && t.station.region !== actor.region) {
    throw ApiError.forbidden();
  }
  return t;
}
