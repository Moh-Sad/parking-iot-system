import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { Role } from '@prisma/client';
import { ApiError } from '../utils/ApiError.js';

export function requireRole(...roles: Role[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden('Insufficient role'));
    next();
  };
}
