import type { Response } from 'express';

interface Sub { res: Response; assignmentId: string }
const subs = new Map<string, Set<Sub>>();

export function addSseClient(assignmentId: string, res: Response): void {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sub: Sub = { res, assignmentId };
  if (!subs.has(assignmentId)) subs.set(assignmentId, new Set());
  subs.get(assignmentId)!.add(sub);

  const heartbeat = setInterval(() => res.write(': hb\n\n'), 25_000);
  res.on('close', () => {
    clearInterval(heartbeat);
    subs.get(assignmentId)?.delete(sub);
  });
}

export function emitSse(assignmentId: string, event: string, data: unknown): void {
  const set = subs.get(assignmentId);
  if (!set) return;
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const s of set) {
    try { s.res.write(payload); } catch { /* dead socket; cleanup on close */ }
  }
}
