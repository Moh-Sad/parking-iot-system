import { z } from 'zod';
import { InvoiceStatus } from '@prisma/client';

export const listInvoicesQuery = z.object({
  status: z.nativeEnum(InvoiceStatus).optional(),
  q: z.string().optional(),
  stationId: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

const lineItem = z.object({
  label: z.string().min(1).max(120),
  description: z.string().min(1).max(500),
  totalCents: z.number().int(),
});

export const createInvoiceBody = z.object({
  clientName: z.string().min(1).max(160),
  stationId: z.string().min(1),
  issueDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  status: z.nativeEnum(InvoiceStatus).default(InvoiceStatus.PROCESSING),
  billTo: z.object({ name: z.string().min(1), address: z.array(z.string()).max(8) }),
  lineItems: z.array(lineItem).min(1),
  taxCents: z.number().int().min(0).default(0),
  currency: z.string().length(3).default('ETB'),
  notes: z.string().max(500).optional(),
});

export const updateInvoiceBody = createInvoiceBody.partial();

export const shareInvoiceBody = z.object({
  to: z.array(z.string().email()).min(1).max(10),
  message: z.string().max(1000).optional(),
});
