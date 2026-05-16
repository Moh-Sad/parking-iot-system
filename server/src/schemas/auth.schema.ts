import { z } from 'zod';

export const loginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const completeAccessBody = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  password: z.string().min(8).max(128),
});

export const refreshBody = z.object({
  refreshToken: z.string().min(1),
});

export const logoutBody = z.object({
  refreshToken: z.string().min(1).optional(),
});

export const recoveryBody = z.object({
  email: z.string().email(),
});

export const resetBody = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});
