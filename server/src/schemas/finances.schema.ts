import { z } from 'zod';

export const kpisQuery = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const timeseriesQuery = z.object({
  granularity: z.enum(['day', 'week', 'month']).default('month'),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const dailyVolumeQuery = z.object({
  weekStarting: z.coerce.date().optional(),
});

export const myInvoicesQuery = z.object({
  status: z.enum(['PAID', 'PROCESSING', 'OVERDUE', 'ALL', 'PENDING']).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const chargingHistoryQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export type KpisQuery = z.infer<typeof kpisQuery>;
export type TimeseriesQuery = z.infer<typeof timeseriesQuery>;
export type DailyVolumeQuery = z.infer<typeof dailyVolumeQuery>;
export type MyInvoicesQuery = z.infer<typeof myInvoicesQuery>;
export type ChargingHistoryQuery = z.infer<typeof chargingHistoryQuery>;
