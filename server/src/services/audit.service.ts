import { prisma } from '../lib/prisma.js';
import type { LogStatus } from '@prisma/client';
import { logger } from '../lib/logger.js';

export interface WriteAuditInput {
  component: string;
  action: string;
  userId?: string | null;
  details?: Record<string, unknown>;
  status?: LogStatus;
}

export async function writeAudit(input: WriteAuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        component: input.component,
        action: input.action,
        userId: input.userId ?? null,
        details: (input.details ?? {}) as object,
        status: input.status ?? 'SUCCESS',
      },
    });
  } catch (err) {
    logger.warn({ err, input }, 'failed to write audit log');
  }
}
