import { z } from 'zod';

export const listStationsQuery = z.object({
  region: z.string().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const createStationBody = z.object({
  code: z.string().min(1).max(40),
  name: z.string().min(1).max(160),
  region: z.string().min(1).max(80),
  address: z.string().max(400).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const updateStationBody = createStationBody.partial();
