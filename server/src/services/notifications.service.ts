import { prisma } from '../lib/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import type { NotificationKind } from '@prisma/client';
import { parsePage, buildMeta } from '../lib/pagination.js';
import type { Actor } from '../types/domain.js';

export async function listForUser(actor: Actor, query: { unreadOnly?: boolean; page?: number; limit?: number }) {
  const { page, limit, skip } = parsePage(query);
  const where = {
    OR: [{ userId: actor.id }, { userId: null }],
    ...(query.unreadOnly ? { readAt: null } : {}),
  };
  const [total, rows, unreadCount] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    prisma.notification.count({
      where: { OR: [{ userId: actor.id }, { userId: null }], readAt: null },
    }),
  ]);
  return { rows, meta: { ...buildMeta(page, limit, total), unreadCount } };
}

export async function markRead(actor: Actor, id: string): Promise<void> {
  const n = await prisma.notification.findUnique({ where: { id } });
  if (!n) throw ApiError.notFound();
  if (n.userId && n.userId !== actor.id) throw ApiError.forbidden();
  if (!n.readAt) {
    await prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  }
}

export async function markAllRead(actor: Actor): Promise<void> {
  await prisma.notification.updateMany({
    where: { OR: [{ userId: actor.id }, { userId: null }], readAt: null },
    data: { readAt: new Date() },
  });
}

export async function create(input: { userId?: string; kind: NotificationKind; title: string; body: string; link?: string }) {
  return prisma.notification.create({
    data: {
      userId: input.userId ?? null,
      kind: input.kind,
      title: input.title,
      body: input.body,
      link: input.link,
    },
  });
}
