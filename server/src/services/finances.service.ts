import { prisma } from '../lib/prisma.js';
import { InvoiceStatus, TransactionStatus, Prisma } from '@prisma/client';

interface KpisDto {
  totalRevenueCents: number;
  totalRevenueDeltaPct: number;
  avgTransactionCents: number;
  avgTransactionDeltaPct: number;
  pendingPayoutsCents: number;
  pendingPayoutsDeltaPct: number;
  currency: string;
}

interface RevenuePoint {
  date: string; // ISO date string for the bucket start
  revenueCents: number;
}

interface DailyVolumePoint {
  day: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
  count: number;
}

function startOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function addMonths(d: Date, n: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
}

export async function getKpis(): Promise<KpisDto> {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const prevMonthStart = addMonths(monthStart, -1);

  const [thisMonthTxs, prevMonthTxs, pendingAgg] = await Promise.all([
    prisma.transaction.aggregate({
      where: { status: TransactionStatus.COMPLETED, processedAt: { gte: monthStart } },
      _sum: { amountCents: true },
      _avg: { amountCents: true },
      _count: { _all: true },
    }),
    prisma.transaction.aggregate({
      where: {
        status: TransactionStatus.COMPLETED,
        processedAt: { gte: prevMonthStart, lt: monthStart },
      },
      _sum: { amountCents: true },
      _avg: { amountCents: true },
    }),
    prisma.invoice.aggregate({
      where: { status: { in: [InvoiceStatus.PROCESSING, InvoiceStatus.OVERDUE] } },
      _sum: { grandTotalCents: true },
    }),
  ]);

  const totalRevenueCents = thisMonthTxs._sum.amountCents ?? 0;
  const prevRevenueCents = prevMonthTxs._sum.amountCents ?? 0;
  const totalRevenueDeltaPct =
    prevRevenueCents > 0 ? ((totalRevenueCents - prevRevenueCents) / prevRevenueCents) * 100 : 0;

  const avgTransactionCents = Math.round(thisMonthTxs._avg.amountCents ?? 0);
  const prevAvg = Math.round(prevMonthTxs._avg.amountCents ?? 0);
  const avgTransactionDeltaPct = prevAvg > 0 ? ((avgTransactionCents - prevAvg) / prevAvg) * 100 : 0;

  const pendingPayoutsCents = pendingAgg._sum.grandTotalCents ?? 0;

  return {
    totalRevenueCents,
    totalRevenueDeltaPct: Math.round(totalRevenueDeltaPct * 10) / 10,
    avgTransactionCents,
    avgTransactionDeltaPct: Math.round(avgTransactionDeltaPct * 10) / 10,
    pendingPayoutsCents,
    pendingPayoutsDeltaPct: 0,
    currency: 'ETB',
  };
}

export async function revenueTimeseries(query: {
  granularity?: 'day' | 'week' | 'month';
  from?: Date;
  to?: Date;
}): Promise<RevenuePoint[]> {
  const granularity = query.granularity ?? 'month';
  const to = query.to ?? new Date();
  const from = query.from ?? new Date(to.getTime() - 365 * 86_400_000);

  // Raw SQL for portable date_trunc
  const bucket =
    granularity === 'day' ? 'day' : granularity === 'week' ? 'week' : 'month';

  const rows = await prisma.$queryRaw<Array<{ bucket: Date; revenue: bigint }>>(
    Prisma.sql`
      SELECT
        date_trunc(${bucket}, "processedAt") AS bucket,
        COALESCE(SUM("amountCents"), 0)::bigint AS revenue
      FROM transactions
      WHERE status = 'COMPLETED'
        AND "processedAt" >= ${from}
        AND "processedAt" <= ${to}
      GROUP BY bucket
      ORDER BY bucket ASC
    `,
  );

  return rows.map((r) => ({
    date: r.bucket.toISOString(),
    revenueCents: Number(r.revenue),
  }));
}

export async function dailyVolume(query: { weekStarting?: Date }): Promise<DailyVolumePoint[]> {
  // Default: last 7 days ending today
  const today = new Date();
  const start = query.weekStarting ?? new Date(today.getTime() - 6 * 86_400_000);
  const end = new Date(start.getTime() + 7 * 86_400_000);

  const rows = await prisma.$queryRaw<Array<{ dow: number; count: bigint }>>(
    Prisma.sql`
      SELECT
        EXTRACT(ISODOW FROM "processedAt")::int AS dow,
        COUNT(*)::bigint AS count
      FROM transactions
      WHERE "processedAt" >= ${start} AND "processedAt" < ${end}
      GROUP BY dow
      ORDER BY dow ASC
    `,
  );

  const byDow = new Map<number, number>();
  for (const r of rows) byDow.set(r.dow, Number(r.count));

  const labels: DailyVolumePoint['day'][] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  return labels.map((day, idx) => ({ day, count: byDow.get(idx + 1) ?? 0 }));
}

interface HourlyLoadPoint {
  hour: number; // 0-23
  sessions: number;
}

/**
 * Returns last 14 1-hour buckets of assignment-start counts.
 * Used by the supervisor dashboard's load distribution chart.
 */
export async function hourlyLoad(hours = 14): Promise<HourlyLoadPoint[]> {
  const end = new Date();
  const start = new Date(end.getTime() - hours * 60 * 60 * 1000);

  const rows = await prisma.$queryRaw<Array<{ bucket: Date; sessions: bigint }>>(
    Prisma.sql`
      SELECT
        date_trunc('hour', "arrivalTime") AS bucket,
        COUNT(*)::bigint AS sessions
      FROM slot_assignments
      WHERE "arrivalTime" >= ${start} AND "arrivalTime" <= ${end}
      GROUP BY bucket
      ORDER BY bucket ASC
    `,
  );

  // Build a complete window with zeros for buckets that have no data
  const byKey = new Map<string, number>();
  for (const r of rows) byKey.set(r.bucket.toISOString(), Number(r.sessions));

  const result: HourlyLoadPoint[] = [];
  for (let i = 0; i < hours; i++) {
    const slot = new Date(start.getTime() + i * 60 * 60 * 1000);
    slot.setMinutes(0, 0, 0);
    const key = slot.toISOString();
    result.push({ hour: slot.getUTCHours(), sessions: byKey.get(key) ?? 0 });
  }

  return result;
}
