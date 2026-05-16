import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodError, type ZodTypeAny } from 'zod';
import { ApiError } from '../utils/ApiError.js';

type Source = 'body' | 'query' | 'params';

export function validate(schema: ZodTypeAny, source: Source = 'body'): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[source]);

      if (source === 'query') {
        // Express 5: req.query is a getter, cannot reassign. Mutate in place instead.
        const target = req.query as Record<string, unknown>;
        for (const key of Object.keys(target)) delete target[key];
        Object.assign(target, parsed as Record<string, unknown>);
      } else {
        (req as unknown as Record<Source, unknown>)[source] = parsed;
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return next(ApiError.badRequest('Validation failed', err.flatten()));
      }
      next(err);
    }
  };
}
