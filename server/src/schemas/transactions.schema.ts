import { z } from 'zod';
import { PaymentMethod, TransactionStatus } from '@prisma/client';

export const listTransactionsQuery = z.object({
  status: z.nativeEnum(TransactionStatus).optional(),
  method: z.nativeEnum(PaymentMethod).optional(),
  stationId: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});
