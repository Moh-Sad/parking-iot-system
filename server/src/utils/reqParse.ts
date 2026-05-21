import type { Request } from 'express';

export const paramId = (req: Request): string => String((req.params as Record<string, string>).id);
export const param = (req: Request, key: string): string => String((req.params as Record<string, string>)[key]);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const queryObj = <T = any>(req: Request): T => req.query as unknown as T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const bodyObj = <T = any>(req: Request): T => req.body as T;
