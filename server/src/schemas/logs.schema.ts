import { z } from 'zod';
import { LogStatus } from '@prisma/client';

export const listLogsQuery = z.object({
  component: z.string().optional(),
  status: z.nativeEnum(LogStatus).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const logsMetricsQuery = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
