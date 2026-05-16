import type { Role } from '@prisma/client';

export interface Actor {
  id: string;
  role: Role;
  roleLevel: number;
  region: string | null;
}
