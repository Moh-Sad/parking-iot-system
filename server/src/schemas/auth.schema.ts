import { z } from 'zod';

export const loginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const completeAccessBody = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  // Optional: only required if the user is completing profile without going through /auth/reset first.
  password: z.string().min(8).max(128).optional(),
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

export const registerBody = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().min(1).max(80).optional(),
  phone: z.string().min(3).max(40).optional(),
  plateNumber: z.string().min(1).max(20).optional(),
});
