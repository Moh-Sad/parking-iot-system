import type { Response } from 'express';
import type { PageMeta } from '../lib/pagination.js';

export const ok = <T>(res: Response, data: T): Response => res.status(200).json({ data });
export const created = <T>(res: Response, data: T): Response => res.status(201).json({ data });
export const noContent = (res: Response): Response => res.status(204).send();

export const paginated = <T>(res: Response, data: T[], meta: PageMeta): Response =>
  res.status(200).json({ data, meta });

export const okWith = <T extends object>(res: Response, payload: T): Response =>
  res.status(200).json({ data: payload });
