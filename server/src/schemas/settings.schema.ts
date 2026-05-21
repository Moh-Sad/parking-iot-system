import { z } from 'zod';

export const featuresSchema = z.object({
  loadBalancing: z.boolean(),
  telemetry: z.boolean(),
  thermalMonitoring: z.boolean(),
});

export const localizationSchema = z.object({
  currency: z.enum(['ETB', 'EUR', 'GBP']),
  timezone: z.enum(['UTC', 'EST', 'CET']),
  measurement: z.enum(['METRIC', 'IMPERIAL']),
});

export const authenticationSchema = z.object({
  apiGateway: z.boolean(),
  networkSecret: z.string().min(8),
});

export const hardwareSchema = z.object({
  cpuLoadThreshold: z.number().min(0).max(100),
  storage: z.number().min(0).max(100),
});

export const patchSettingsBody = z.object({
  features: featuresSchema.partial().optional(),
  localization: localizationSchema.partial().optional(),
  authentication: authenticationSchema.partial().optional(),
  hardware: hardwareSchema.partial().optional(),
});

export const getSettingsQuery = z.object({
  reveal: z
    .union([z.literal('true'), z.literal('false')])
    .transform((v) => v === 'true')
    .optional(),
});
