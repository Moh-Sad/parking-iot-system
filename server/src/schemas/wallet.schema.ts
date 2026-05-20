import { z } from 'zod';

export const topUpBody = z.object({
  amountCents: z.number().int().positive().max(1_000_000),
  paymentMethodId: z.string().min(1),
});

export const updateWalletBody = z.object({
  autoRefillEnabled: z.boolean().optional(),
  autoRefillThresholdCents: z.number().int().min(0).max(1_000_000).optional(),
  autoRefillAmountCents: z.number().int().min(0).max(1_000_000).optional(),
});

export const payInvoiceBody = z.object({
  paymentMethodId: z.string().optional(),
  useWalletBalance: z.boolean().optional(),
});

export type TopUpBody = z.infer<typeof topUpBody>;
export type UpdateWalletBody = z.infer<typeof updateWalletBody>;
export type PayInvoiceBody = z.infer<typeof payInvoiceBody>;
