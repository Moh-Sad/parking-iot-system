import { env } from '../config/env.js';
import { logger } from './logger.js';

async function post(path: string, body: unknown): Promise<void> {
  try {
    const res = await fetch(`${env.IOT_RELAY_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) logger.warn({ path, status: res.status }, 'iot relay non-2xx');
  } catch (err) {
    logger.error({ err, path }, 'iot relay unreachable');
  }
}

export function relayStopCharging(cardNumber: string, slotNumber: number): Promise<void> {
  return post('/charging/stop', { cardNumber, slotNumber });
}

export function relayOpenExit(cardNumber: string, slotNumber: number): Promise<void> {
  return post('/exit/open', { cardNumber, slotNumber });
}
