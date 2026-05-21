import { prisma } from '../lib/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { CarType } from '@prisma/client';
import { issueCardForVehicle } from './cards.service.js';

interface CreateInput {
  plateNumber: string;
  carType?: CarType;
  model?: string;
  notes?: string;
}

interface UpdateInput {
  carType?: CarType;
  model?: string;
  notes?: string | null;
}

export async function listMyVehicles(userId: string) {
  return prisma.vehicle.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      plateNumber: true,
      driverName: true,
      carType: true,
      model: true,
      notes: true,
      cardNumber: true,
      createdAt: true,
    },
  });
}

export async function createMyVehicle(userId: string, input: CreateInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.unauthorized();

  const plate = input.plateNumber.trim().toUpperCase();
  const existing = await prisma.vehicle.findUnique({ where: { plateNumber: plate } });
  if (existing) throw ApiError.conflict('That plate number is already registered');

  const vehicle = await prisma.vehicle.create({
    data: {
      plateNumber: plate,
      driverName: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
      carType: input.carType ?? CarType.EV,
      model: input.model,
      notes: input.notes,
      ownerId: userId,
    },
  });

  await issueCardForVehicle(vehicle.id).catch(() => undefined);

  return prisma.vehicle.findUniqueOrThrow({
    where: { id: vehicle.id },
    select: {
      id: true,
      plateNumber: true,
      driverName: true,
      carType: true,
      model: true,
      notes: true,
      cardNumber: true,
      createdAt: true,
    },
  });
}

export async function updateMyVehicle(userId: string, id: string, patch: UpdateInput) {
  const existing = await prisma.vehicle.findUnique({ where: { id } });
  if (!existing || existing.ownerId !== userId) throw ApiError.notFound('Vehicle not found');

  return prisma.vehicle.update({
    where: { id },
    data: {
      ...(patch.carType !== undefined ? { carType: patch.carType } : {}),
      ...(patch.model !== undefined ? { model: patch.model } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
    },
    select: {
      id: true,
      plateNumber: true,
      driverName: true,
      carType: true,
      model: true,
      notes: true,
      cardNumber: true,
      createdAt: true,
    },
  });
}

export async function deleteMyVehicle(userId: string, id: string) {
  const existing = await prisma.vehicle.findUnique({ where: { id } });
  if (!existing || existing.ownerId !== userId) throw ApiError.notFound('Vehicle not found');
  await prisma.vehicle.delete({ where: { id } });
}
