import { prisma } from '../lib/prisma.js';
import { Prisma, type LogStatus } from '@prisma/client';
import type { Actor } from '../types/domain.js';
import { parsePage, buildMeta } from '../lib/pagination.js';

function scope(actor: Actor): Prisma.AuditLogWhereInput {
  if (actor.role === 'SUPERVISOR') return { userId: actor.id };
  return {};
}

export async function listLogs(actor: Actor, query: {
  component?: string;
  status?: LogStatus;
  from?: Date;
  to?: Date;
  q?: string;
  page?: number;
  limit?: number;
}) {
  const { page, limit, skip } = parsePage(query);
  const where: Prisma.AuditLogWhereInput = {
    ...scope(actor),
    ...(query.component ? { component: query.component } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.from || query.to
      ? { timestamp: { ...(query.from ? { gte: query.from } : {}), ...(query.to ? { lte: query.to } : {}) } }
      : {}),
    ...(query.q
      ? {
          OR: [
            { action: { contains: query.q, mode: 'insensitive' } },
            { component: { contains: query.q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      skip,
      take: limit,
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    }),
  ]);
  return {
    rows: rows.map((l) => ({
      id: l.id,
      timestamp: l.timestamp,
      component: l.component,
      user: l.user
        ? { id: l.user.id, name: [l.user.firstName, l.user.lastName].filter(Boolean).join(' ') || l.user.email }
        : null,
      action: l.action,
      details: l.details,
      status: l.status,
    })),
    meta: buildMeta(page, limit, total),
  };
}

export async function metrics(actor: Actor, query: { from?: Date; to?: Date }) {
  const where: Prisma.AuditLogWhereInput = {
    ...scope(actor),
    ...(query.from || query.to
      ? { timestamp: { ...(query.from ? { gte: query.from } : {}), ...(query.to ? { lte: query.to } : {}) } }
      : {}),
  };
  const last24h = new Date(Date.now() - 86_400_000);
  const [criticalErrors, dailyActions] = await Promise.all([
    prisma.auditLog.count({ where: { ...where, status: 'FLAGGED' } }),
    prisma.auditLog.count({ where: { ...where, timestamp: { gte: last24h } } }),
  ]);
  const activeNodes = await prisma.station.count();
  return {
    criticalErrors,
    dailyActions,
    networkUptime: 99.92,
    activeNodes,
  };
}
