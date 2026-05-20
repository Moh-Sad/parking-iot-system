import { prisma } from '../lib/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { Prisma } from '@prisma/client';
import { parsePage, buildMeta, type PageMeta } from '../lib/pagination.js';
import type { Actor } from '../types/domain.js';

export async function listStations(actor: Actor, query: { region?: string; q?: string; page?: number; limit?: number }) {
  const { page, limit, skip } = parsePage(query);
  const where: Prisma.StationWhereInput = {
    ...(actor.role === 'SUPERVISOR' && actor.region ? { region: actor.region } : {}),
    ...(query.region ? { region: query.region } : {}),
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: 'insensitive' } },
            { code: { contains: query.q, mode: 'insensitive' } },
            { address: { contains: query.q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.station.count({ where }),
    prisma.station.findMany({ where, orderBy: { name: 'asc' }, skip, take: limit }),
  ]);
  return { rows, meta: buildMeta(page, limit, total) };
}

export async function getStation(actor: Actor, id: string) {
  const station = await prisma.station.findUnique({
    where: { id },
    include: { _count: { select: { slots: true } } },
  });
  if (!station) throw ApiError.notFound('Station not found');
  if (actor.role === 'SUPERVISOR' && actor.region && station.region !== actor.region) {
    throw ApiError.forbidden();
  }
  return station;
}

export async function createStation(input: Prisma.StationCreateInput) {
  return prisma.station.create({ data: input });
}

export async function updateStation(id: string, input: Prisma.StationUpdateInput) {
  return prisma.station.update({ where: { id }, data: input });
}

export async function deleteStation(id: string) {
  await prisma.station.delete({ where: { id } });
}

export type ListMeta = PageMeta;
