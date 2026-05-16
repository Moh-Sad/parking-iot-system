import { prisma } from '../lib/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { Prisma } from '@prisma/client';
import { parsePage, buildMeta } from '../lib/pagination.js';

export async function listVehicles(query: { q?: string; page?: number; limit?: number }) {
  const { page, limit, skip } = parsePage(query);
  const where: Prisma.VehicleWhereInput = query.q
    ? {
        OR: [
          { plateNumber: { contains: query.q, mode: 'insensitive' } },
          { driverName: { contains: query.q, mode: 'insensitive' } },
        ],
      }
    : {};
  const [total, rows] = await Promise.all([
    prisma.vehicle.count({ where }),
    prisma.vehicle.findMany({ where, skip, take: limit, orderBy: { updatedAt: 'desc' } }),
  ]);
  return { rows, meta: buildMeta(page, limit, total) };
}

export async function getVehicleByPlate(plateNumber: string) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { plateNumber },
    include: {
      assignments: {
        orderBy: { arrivalTime: 'desc' },
        take: 1,
        include: { slot: { include: { station: true } } },
      },
    },
  });
  if (!vehicle) throw ApiError.notFound('Vehicle not found');
  return { vehicle, lastAssignment: vehicle.assignments[0] ?? null };
}
