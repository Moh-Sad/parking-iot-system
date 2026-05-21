import { emitSse } from '../lib/sse.js';
import { relayStopCharging } from '../lib/iotRelay.js';
import { logger } from '../lib/logger.js';

// In-process timers — they do not survive a server restart. Acceptable for demo.
interface Active {
  assignmentId: string;
  cardNumber: string;
  slotNumber: number;
  startedAt: number;
  timers: NodeJS.Timeout[];
  stopped: boolean;
}

const active = new Map<string, Active>();

const NOTIFY_SCHEDULE: Array<{ ms: number; pct: number }> = [
  { ms: 2 * 60_000, pct: 25 },
  { ms: 4 * 60_000, pct: 50 },
  { ms: 6 * 60_000, pct: 75 },
];
const STOP_AT_MS = 7 * 60_000 + 50_000;

export function startChargingTimers(args: {
  assignmentId: string;
  cardNumber: string;
  slotNumber: number;
}): void {
  if (active.has(args.assignmentId)) return;
  const entry: Active = { ...args, startedAt: Date.now(), timers: [], stopped: false };

  for (const step of NOTIFY_SCHEDULE) {
    entry.timers.push(
      setTimeout(() => emitSse(args.assignmentId, 'charge.progress', { pct: step.pct }), step.ms),
    );
  }
  entry.timers.push(
    setTimeout(async () => {
      try {
        await relayStopCharging(args.cardNumber, args.slotNumber);
      } catch (err) {
        logger.error({ err }, 'failed to stop charging on relay');
      }
      emitSse(args.assignmentId, 'charge.progress', { pct: 100 });
      entry.stopped = true;
    }, STOP_AT_MS),
  );

  active.set(args.assignmentId, entry);
}

export function unplugCharging(assignmentId: string): { pct: number } | null {
  const entry = active.get(assignmentId);
  if (!entry) return null;
  for (const t of entry.timers) clearTimeout(t);
  const elapsedMin = (Date.now() - entry.startedAt) / 60_000;
  const pct = Math.min(100, Math.round((elapsedMin / 8) * 100));
  emitSse(assignmentId, 'charge.progress', { pct, reason: 'unplugged' });
  entry.stopped = true;
  return { pct };
}

export function getChargedPct(assignmentId: string): number {
  const entry = active.get(assignmentId);
  if (!entry) return 0;
  const elapsedMin = (Date.now() - entry.startedAt) / 60_000;
  return Math.min(100, (elapsedMin / 8) * 100);
}

export function clearChargingTimers(assignmentId: string): void {
  const entry = active.get(assignmentId);
  if (!entry) return;
  for (const t of entry.timers) clearTimeout(t);
  active.delete(assignmentId);
}
