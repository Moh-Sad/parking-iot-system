import { z } from 'zod';

export const listVehiclesQuery = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const plateParam = z.object({
  plateNumber: z.string().min(1).max(20),
});
