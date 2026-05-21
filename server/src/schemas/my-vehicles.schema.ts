import { z } from 'zod';
import { CarType } from '@prisma/client';

export const createMyVehicleBody = z.object({
  plateNumber: z.string().min(1).max(20),
  carType: z.nativeEnum(CarType).optional(),
  model: z.string().min(1).max(80).optional(),
  notes: z.string().max(500).optional(),
});

export const updateMyVehicleBody = z.object({
  carType: z.nativeEnum(CarType).optional(),
  model: z.string().min(1).max(80).optional(),
  notes: z.string().max(500).optional().nullable(),
});

export type CreateMyVehicleBody = z.infer<typeof createMyVehicleBody>;
export type UpdateMyVehicleBody = z.infer<typeof updateMyVehicleBody>;
