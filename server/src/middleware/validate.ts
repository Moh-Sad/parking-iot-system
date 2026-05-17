import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodError, type ZodTypeAny } from 'zod';
import { ApiError } from '../utils/ApiError.js';

type Source = 'body' | 'query' | 'params';

export function validate(schema: ZodTypeAny, source: Source = 'body'): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[source]);

      // Stash on a dedicated bag — Express 5's req.query is a getter and can't
      // be reassigned, and mutating its values in place doesn't persist either.
      const bag = (req as Request & { validated?: Record<Source, unknown> }).validated ?? {} as Record<Source, unknown>;
      bag[source] = parsed;
      (req as Request & { validated?: Record<Source, unknown> }).validated = bag;

      if (source !== 'query') {
        // For body / params (regular properties), still keep them in sync so
        // route handlers that read req.body directly see the parsed value.
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

export function validated<T>(req: Request, source: Source): T {
  const bag = (req as Request & { validated?: Record<Source, unknown> }).validated;
  return (bag?.[source] ?? req[source]) as T;
}
