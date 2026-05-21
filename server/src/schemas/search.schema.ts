import { z } from 'zod';

export const searchQuery = z.object({
  q: z.string().min(1).max(200),
  types: z
    .string()
    .transform((v) => v.split(',').map((s) => s.trim()).filter(Boolean))
    .optional(),
  limit: z.coerce.number().int().positive().max(20).optional(),
});

export type SearchQuery = z.infer<typeof searchQuery>;
