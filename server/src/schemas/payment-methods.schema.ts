import { z } from 'zod';
import { CardBrand } from '@prisma/client';

export const createPaymentMethodBody = z.object({
  brand: z.nativeEnum(CardBrand),
  last4: z.string().regex(/^\d{4}$/, 'last4 must be 4 digits'),
  expiryMonth: z.coerce.number().int().min(1).max(12),
  expiryYear: z.coerce.number().int().min(new Date().getFullYear()).max(2100),
  holderName: z.string().min(1).max(120).optional(),
  isDefault: z.boolean().optional(),
});

export const updatePaymentMethodBody = z.object({
  isDefault: z.boolean().optional(),
  holderName: z.string().min(1).max(120).optional(),
  expiryMonth: z.coerce.number().int().min(1).max(12).optional(),
  expiryYear: z.coerce.number().int().min(2000).max(2100).optional(),
});

export type CreatePaymentMethodBody = z.infer<typeof createPaymentMethodBody>;
export type UpdatePaymentMethodBody = z.infer<typeof updatePaymentMethodBody>;
