import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  APP_URL: z.string().url().default('http://localhost:4000'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  DATABASE_URL: z.string().min(1),

  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),

  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  SMTP_FROM: z.string().default('Parking IoT <no-reply@parking-iot.local>'),

  SEED_ADMIN_EMAIL: z.string().email().default('admin@parking-iot.local'),
  SEED_ADMIN_PASSWORD: z.string().min(8).default('Admin123!'),

  CHAPA_BASE_URL: z.string().default('https://api.chapa.co/v1'),
  CHAPA_SECRET_KEY: z.string().optional().default(''),
  CHAPA_WEBHOOK_SECRET: z.string().optional().default(''),
  CHAPA_CALLBACK_URL: z.string().default('http://localhost:4000/api/v1/iot/payments/chapa/webhook'),
  CHAPA_RETURN_URL: z.string().default('http://localhost:3000/payment/return'),

  IOT_RELAY_BASE_URL: z.string().default('http://localhost:3001'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
