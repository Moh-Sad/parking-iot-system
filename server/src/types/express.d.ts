import type { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface UserContext {
      id: string;
      email: string;
      role: Role;
      roleLevel: number;
      region: string | null;
    }
    interface Request {
      user?: UserContext;
      validated?: {
        body?: unknown;
        query?: unknown;
        params?: unknown;
      };
    }
  }
}

export {};
