import { z } from 'zod';

const cardId = z.string().regex(/^\d{4}$/, '4-digit card number');

export const entryTapBody = z.object({ cardNumber: cardId });

export const entryConfirmBody = z.object({
  cardNumber: cardId,
  mode: z.enum(['PARKING', 'CHARGING']),
  slotNumber: z.number().int().min(1).max(10),
  freeSlotsRemaining: z.number().int().min(0).optional(),
});

export const chargingUnpluggedBody = z.object({ cardNumber: cardId });

export const exitTapBody = z.object({ cardNumber: cardId });
