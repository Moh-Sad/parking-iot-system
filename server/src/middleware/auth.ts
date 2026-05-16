import type { Request, Response, NextFunction } from 'express';
import { verifyAccess } from '../lib/jwt.js';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../utils/ApiError.js';

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.header('authorization') ?? '';
    if (!header.startsWith('Bearer ')) throw ApiError.unauthorized('Missing Bearer token');
    const token = header.slice('Bearer '.length).trim();
    if (!token) throw ApiError.unauthorized('Missing token');

    let payload;
    try {
      payload = verifyAccess(token);
    } catch {
      throw ApiError.unauthorized('Invalid or expired token');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, roleLevel: true, status: true, region: true },
    });
    if (!user) throw ApiError.unauthorized('User no longer exists');
    if (user.status === 'SUSPENDED') throw ApiError.forbidden('Account suspended');

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      roleLevel: user.roleLevel,
      region: user.region,
    };
    next();
  } catch (err) {
    next(err);
  }
}
