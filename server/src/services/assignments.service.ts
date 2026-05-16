import { prisma } from '../lib/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { Prisma, type AssignmentStatus, type CarType, type SlotKind } from '@prisma/client';
import type { Actor } from '../types/domain.js';
import { parsePage, buildMeta } from '../lib/pagination.js';
import { writeAudit } from './audit.service.js';
import { AUDIT_COMPONENTS } from '../config/constants.js';

interface CreateAssignmentInput {
  slotId: string;
  plateNumber: string;
  driverName: string;
  carType: CarType;
  slotType?: SlotKind;
  battery?: number;
  arrivalTime?: Date;
  notes?: string;
}

export async function createAssignment(actor: Actor, input: CreateAssignmentInput) {
  const slot = await prisma.slot.findUnique({ where: { id: input.slotId }, include: { station: true } });
  if (!slot) throw ApiError.notFound('Slot not found');
  if (!slot.isActive) throw ApiError.badRequest('Slot is inactive');
  if (actor.role === 'SUPERVISOR' && actor.region && slot.station.region !== actor.region) {
    throw ApiError.forbidden();
  }

  const existingActive = await prisma.slotAssignment.findFirst({
    where: { slotId: slot.id, status: 'ACTIVE' },
  });
  if (existingActive) throw ApiError.conflict('Slot already has an active assignment');

  const vehicle = await prisma.vehicle.upsert({
    where: { plateNumber: input.plateNumber },
    create: { plateNumber: input.plateNumber, driverName: input.driverName, carType: input.carType },
    update: { driverName: input.driverName, carType: input.carType },
  });

  const assignment = await prisma.slotAssignment.create({
    data: {
      slotId: slot.id,
      vehicleId: vehicle.id,
      createdById: actor.id,
      battery: input.battery,
      arrivalTime: input.arrivalTime ?? new Date(),
      notes: input.notes,
      status: 'ACTIVE',
    },
    include: { vehicle: true, slot: true },
  });

  if (input.slotType && input.slotType !== slot.kind && actor.role === 'ADMIN') {
    await prisma.slot.update({ where: { id: slot.id }, data: { kind: input.slotType } });
  }

  await writeAudit({
    component: AUDIT_COMPONENTS.ASSIGNMENTS,
    action: 'assignment.created',
    userId: actor.id,
    details: { slotId: slot.id, assignmentId: assignment.id, plateNumber: vehicle.plateNumber },
  });

  return { assignment, slot };
}

export async function listAssignments(actor: Actor, query: {
  status?: AssignmentStatus;
  slotId?: string;
  stationId?: string;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
}) {
  const { page, limit, skip } = parsePage(query);
  const where: Prisma.SlotAssignmentWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.slotId ? { slotId: query.slotId } : {}),
    ...(query.stationId ? { slot: { stationId: query.stationId } } : {}),
    ...(query.from || query.to
      ? { arrivalTime: { ...(query.from ? { gte: query.from } : {}), ...(query.to ? { lte: query.to } : {}) } }
      : {}),
    ...(actor.role === 'SUPERVISOR' && actor.region ? { slot: { station: { region: actor.region } } } : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.slotAssignment.count({ where }),
    prisma.slotAssignment.findMany({
      where,
      orderBy: { arrivalTime: 'desc' },
      skip,
      take: limit,
      include: { vehicle: true, slot: { include: { station: true } } },
    }),
  ]);
  return { rows, meta: buildMeta(page, limit, total) };
}

export async function getAssignment(id: string) {
  const a = await prisma.slotAssignment.findUnique({
    where: { id },
    include: { vehicle: true, slot: { include: { station: true } } },
  });
  if (!a) throw ApiError.notFound('Assignment not found');
  return a;
}

export async function patchAssignment(id: string, input: { battery?: number; notes?: string }) {
  return prisma.slotAssignment.update({ where: { id }, data: input });
}

export async function closeAssignment(actor: Actor, id: string, departureTime?: Date) {
  const a = await prisma.slotAssignment.findUnique({ where: { id } });
  if (!a) throw ApiError.notFound('Assignment not found');
  if (a.status !== 'ACTIVE') throw ApiError.badRequest('Assignment is not active');
  const end = departureTime ?? new Date();
  const durationSeconds = Math.max(0, Math.floor((end.getTime() - a.arrivalTime.getTime()) / 1000));
  const closed = await prisma.slotAssignment.update({
    where: { id },
    data: { status: 'COMPLETED', departureTime: end, durationSeconds },
  });
  await writeAudit({
    component: AUDIT_COMPONENTS.ASSIGNMENTS,
    action: 'assignment.closed',
    userId: actor.id,
    details: { assignmentId: id, durationSeconds },
  });
  return closed;
}
