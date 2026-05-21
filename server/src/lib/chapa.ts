import crypto from 'node:crypto';
import { env } from '../config/env.js';

interface InitInput {
  amountEtb: number;
  txRef: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  description?: string;
}

interface ChapaInitResponse {
  status: 'success' | 'failed';
  message: string;
  data?: { checkout_url: string };
}

export async function initChapaCheckout(input: InitInput): Promise<{ checkoutUrl: string }> {
  if (!env.CHAPA_SECRET_KEY) throw new Error('CHAPA_SECRET_KEY not configured');

  const res = await fetch(`${env.CHAPA_BASE_URL}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.CHAPA_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: input.amountEtb.toFixed(2),
      currency: 'ETB',
      email: input.email,
      first_name: input.firstName,
      last_name: input.lastName,
      phone_number: input.phone,
      tx_ref: input.txRef,
      callback_url: env.CHAPA_CALLBACK_URL,
      return_url: env.CHAPA_RETURN_URL,
      customization: { title: 'Parking Payment', description: input.description },
    }),
  });

  const json = (await res.json()) as ChapaInitResponse;
  if (json.status !== 'success' || !json.data?.checkout_url) {
    throw new Error(`Chapa init failed: ${json.message}`);
  }
  return { checkoutUrl: json.data.checkout_url };
}

export async function verifyChapa(txRef: string): Promise<{ status: string; amount: string }> {
  const res = await fetch(`${env.CHAPA_BASE_URL}/transaction/verify/${encodeURIComponent(txRef)}`, {
    headers: { Authorization: `Bearer ${env.CHAPA_SECRET_KEY}` },
  });
  const json = (await res.json()) as { status: string; data?: { status: string; amount: string } };
  return { status: json.data?.status ?? 'unknown', amount: json.data?.amount ?? '0' };
}

export function verifyChapaSignature(rawBody: string, signatureHeader: string | undefined): boolean {
  if (!signatureHeader || !env.CHAPA_WEBHOOK_SECRET) return false;
  const computed = crypto
    .createHmac('sha256', env.CHAPA_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  const a = Buffer.from(computed, 'hex');
  const b = Buffer.from(signatureHeader, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
