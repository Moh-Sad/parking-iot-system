import { z } from 'zod';
import { Role, UserStatus } from '@prisma/client';

export const listUsersQuery = z.object({
  role: z.nativeEnum(Role).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  region: z.string().optional(),
  lastActivity: z.enum(['24h', '7d', '30d']).optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const createUserBody = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().min(1).max(80).optional(),
  role: z.nativeEnum(Role).default(Role.SUPERVISOR),
  region: z.string().min(1).max(80).optional(),
});

export const updateUserBody = z.object({
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().min(1).max(80).optional(),
  role: z.nativeEnum(Role).optional(),
  region: z.string().min(1).max(80).optional(),
  status: z.nativeEnum(UserStatus).optional(),
});

const preferencesSchema = z
  .object({
    currency: z.enum(['ETB', 'EUR', 'GBP']).optional(),
    timezone: z.string().min(1).max(40).optional(),
    measurement: z.enum(['METRIC', 'IMPERIAL']).optional(),
    notifications: z
      .object({
        chargeAlerts: z.boolean().optional(),
        balanceWarnings: z.boolean().optional(),
        receiptEmails: z.boolean().optional(),
      })
      .partial()
      .optional(),
  })
  .partial();

export const updateMeBody = z.object({
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().min(1).max(80).optional(),
  avatarUrl: z.string().url().optional(),
  phone: z.string().min(3).max(40).optional().nullable(),
  preferences: preferencesSchema.optional(),
});

export const changePasswordBody = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export type ListUsersQuery = z.infer<typeof listUsersQuery>;
