import { prisma } from '../lib/prisma.js';
import type { Actor } from '../types/domain.js';

function regionFilter(actor: Actor): { stationRegion?: string } {
  if (actor.role === 'SUPERVISOR' && actor.region) return { stationRegion: actor.region };
  return {};
}

export async function stats(actor: Actor) {
  const rf = regionFilter(actor);
  const stationWhere = rf.stationRegion ? { region: rf.stationRegion } : {};
  const txWhere = rf.stationRegion ? { station: { region: rf.stationRegion } } : {};
  const slotsWhere = rf.stationRegion ? { station: { region: rf.stationRegion } } : {};

  const [totalStations, activeSessions, revenue, activeUsers] = await Promise.all([
    prisma.station.count({ where: stationWhere }),
    prisma.slotAssignment.count({ where: { status: 'ACTIVE', slot: slotsWhere } }),
    prisma.transaction.aggregate({
      _sum: { amountCents: true },
      where: { ...txWhere, status: 'COMPLETED' },
    }),
    prisma.user.count({
      where: {
        status: 'ACTIVE',
        lastLoginAt: { gte: new Date(Date.now() - 30 * 86_400_000) },
        ...(rf.stationRegion ? { region: rf.stationRegion } : {}),
      },
    }),
  ]);

  const totalCents = revenue._sum.amountCents ?? 0;
  return {
    totalStations,
    activeSessions,
    revenue: { totalCents, currency: 'USD', dailyAvgCents: Math.round(totalCents / 30), deltaPct: 0 },
    activeUsers,
    deltas: { stationsPct: 0, sessionsPct: 0, revenuePct: 0, usersPct: 0 },
  };
}

export async function recentTransactions(actor: Actor, limit: number) {
  const where = actor.role === 'SUPERVISOR' && actor.region ? { station: { region: actor.region } } : {};
  const rows = await prisma.transaction.findMany({
    where,
    orderBy: { processedAt: 'desc' },
    take: limit,
    include: { station: true },
  });
  return rows.map((t) => ({
    id: t.id,
    code: t.code,
    station: t.station.name,
    status: t.status,
    method: t.method,
    amount: t.amountCents,
    currency: t.currency,
    processedAt: t.processedAt,
  }));
}

export async function health() {
  const snapshot = await prisma.systemMetricsSnapshot.findFirst({ orderBy: { capturedAt: 'desc' } });
  if (snapshot) {
    return {
      healthScore: Number(snapshot.healthScore),
      latencyMs: snapshot.latencyMs,
      uptimePct: Number(snapshot.uptimePct),
      status: snapshot.criticalErrors > 0 ? 'degraded' : 'healthy',
    };
  }
  return { healthScore: 99.4, latencyMs: 42, uptimePct: 99.97, status: 'healthy' };
}

export async function alerts(actor: Actor, limit: number) {
  const where = actor.role === 'SUPERVISOR' && actor.region ? { user: { region: actor.region } } : {};
  const rows = await prisma.auditLog.findMany({
    where: { ...where, status: 'FLAGGED' },
    orderBy: { timestamp: 'desc' },
    take: limit,
  });
  return rows.map((l) => ({
    id: l.id,
    title: l.action,
    component: l.component,
    timestamp: l.timestamp,
    details: l.details,
  }));
}
