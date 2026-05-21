import { z } from 'zod';
import { AssignmentStatus, CarType, SlotKind } from '@prisma/client';

export const createAssignmentBody = z.object({
  slotId: z.string().min(1),
  plateNumber: z.string().min(1).max(20),
  driverName: z.string().min(1).max(120),
  carType: z.nativeEnum(CarType),
  slotType: z.nativeEnum(SlotKind).optional(),
  battery: z.number().int().min(0).max(100).optional(),
  arrivalTime: z.coerce.date().optional(),
  notes: z.string().max(500).optional(),
});

export const listAssignmentsQuery = z.object({
  status: z.nativeEnum(AssignmentStatus).optional(),
  slotId: z.string().optional(),
  stationId: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const patchAssignmentBody = z.object({
  battery: z.number().int().min(0).max(100).optional(),
  notes: z.string().max(500).optional(),
});

export const closeAssignmentBody = z.object({
  departureTime: z.coerce.date().optional(),
});
