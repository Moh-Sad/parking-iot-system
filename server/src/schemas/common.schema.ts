import { z } from 'zod';

export const idParam = z.object({
  id: z.string().min(1),
});

export const paginationQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export type Pagination = z.infer<typeof paginationQuery>;
