import { z } from 'zod';
import { NotificationKind } from '@prisma/client';

export const listNotificationsQuery = z.object({
  unreadOnly: z
    .union([z.literal('true'), z.literal('false')])
    .transform((v) => v === 'true')
    .optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const createNotificationBody = z.object({
  userId: z.string().optional(),
  kind: z.nativeEnum(NotificationKind).default(NotificationKind.INFO),
  title: z.string().min(1).max(160),
  body: z.string().min(1).max(1000),
  link: z.string().url().optional(),
});
