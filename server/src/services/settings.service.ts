import { prisma } from '../lib/prisma.js';
import { Prisma } from '@prisma/client';
import { randomOpaque } from '../lib/jwt.js';
import { writeAudit } from './audit.service.js';
import { AUDIT_COMPONENTS } from '../config/constants.js';

const DEFAULT_SETTINGS = {
  features: { loadBalancing: true, telemetry: true, thermalMonitoring: true },
  localization: { currency: 'ETB', timezone: 'UTC', measurement: 'METRIC' },
  authentication: { apiGateway: true, networkSecret: randomOpaque(16) },
  hardware: { cpuLoadThreshold: 80, storage: 84 },
};

async function ensure(): Promise<void> {
  await prisma.systemSettings.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      features: DEFAULT_SETTINGS.features as Prisma.InputJsonValue,
      localization: DEFAULT_SETTINGS.localization as Prisma.InputJsonValue,
      authentication: DEFAULT_SETTINGS.authentication as Prisma.InputJsonValue,
      hardware: DEFAULT_SETTINGS.hardware as Prisma.InputJsonValue,
    },
    update: {},
  });
}

interface Settings {
  features: Record<string, unknown>;
  localization: Record<string, unknown>;
  authentication: { apiGateway: boolean; networkSecret: string };
  hardware: Record<string, unknown>;
  updatedAt: Date;
}

function mask(secret: string): string {
  if (!secret) return '';
  if (secret.length <= 4) return '****';
  return `${'*'.repeat(secret.length - 4)}${secret.slice(-4)}`;
}

export async function getSettings(reveal = false): Promise<Settings> {
  await ensure();
  const row = await prisma.systemSettings.findUnique({ where: { id: 1 } });
  const auth = (row?.authentication ?? {}) as { apiGateway: boolean; networkSecret: string };
  return {
    features: (row?.features ?? {}) as Record<string, unknown>,
    localization: (row?.localization ?? {}) as Record<string, unknown>,
    authentication: { apiGateway: auth.apiGateway, networkSecret: reveal ? auth.networkSecret : mask(auth.networkSecret) },
    hardware: (row?.hardware ?? {}) as Record<string, unknown>,
    updatedAt: row?.updatedAt ?? new Date(),
  };
}

export async function patchSettings(actorId: string, input: {
  features?: Record<string, unknown>;
  localization?: Record<string, unknown>;
  authentication?: Record<string, unknown>;
  hardware?: Record<string, unknown>;
}): Promise<Settings> {
  await ensure();
  const existing = await prisma.systemSettings.findUnique({ where: { id: 1 } });
  const merged = {
    features: { ...((existing?.features as object) ?? {}), ...(input.features ?? {}) } as object,
    localization: { ...((existing?.localization as object) ?? {}), ...(input.localization ?? {}) } as object,
    authentication: { ...((existing?.authentication as object) ?? {}), ...(input.authentication ?? {}) } as object,
    hardware: { ...((existing?.hardware as object) ?? {}), ...(input.hardware ?? {}) } as object,
  };
  await prisma.systemSettings.update({
    where: { id: 1 },
    data: {
      features: merged.features as Prisma.InputJsonValue,
      localization: merged.localization as Prisma.InputJsonValue,
      authentication: merged.authentication as Prisma.InputJsonValue,
      hardware: merged.hardware as Prisma.InputJsonValue,
      updatedById: actorId,
    },
  });
  await writeAudit({
    component: AUDIT_COMPONENTS.SETTINGS,
    action: 'settings.updated',
    userId: actorId,
    details: { sections: Object.keys(input) },
  });
  return getSettings(false);
}

export async function rotateNetworkSecret(actorId: string): Promise<{ networkSecret: string }> {
  await ensure();
  const existing = await prisma.systemSettings.findUnique({ where: { id: 1 } });
  const secret = randomOpaque(16);
  const merged = { ...((existing?.authentication as object) ?? {}), networkSecret: secret };
  await prisma.systemSettings.update({
    where: { id: 1 },
    data: {
      authentication: merged as Prisma.InputJsonValue,
      updatedById: actorId,
    },
  });
  await writeAudit({
    component: AUDIT_COMPONENTS.SETTINGS,
    action: 'settings.networkSecret.rotated',
    userId: actorId,
  });
  return { networkSecret: secret };
}
