import { z } from 'zod';
import { SlotKind } from '@prisma/client';

export const listSlotsQuery = z.object({
  stationId: z.string().optional(),
  kind: z.nativeEnum(SlotKind).optional(),
  occupied: z
    .union([z.literal('true'), z.literal('false')])
    .transform((v) => v === 'true')
    .optional(),
});

export const patchSlotBody = z.object({
  kind: z.nativeEnum(SlotKind).optional(),
  isActive: z.boolean().optional(),
});
