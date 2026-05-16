import { createId } from '@paralleldrive/cuid2';

export const newId = createId;

const ALPHANUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
function randomCode(len: number): string {
  let out = '';
  for (let i = 0; i < len; i++) out += ALPHANUM[Math.floor(Math.random() * ALPHANUM.length)];
  return out;
}

export function supervisorUid(): string {
  return `SUP-${randomCode(6)}`;
}

export function adminUid(): string {
  return `ADM-${randomCode(6)}`;
}

export function transactionCode(): string {
  return `TXN-${randomCode(5)}-${randomCode(3)}`;
}

export function invoiceCode(year = new Date().getFullYear()): string {
  return `INV-${year}-${randomCode(4)}`;
}

export function initialsOf(firstName?: string | null, lastName?: string | null, fallback?: string): string {
  const a = (firstName ?? '').trim();
  const b = (lastName ?? '').trim();
  if (a && b) return `${a[0]}${b[0]}`.toUpperCase();
  if (a) return a.slice(0, 2).toUpperCase();
  if (b) return b.slice(0, 2).toUpperCase();
  return (fallback ?? '??').slice(0, 2).toUpperCase();
}
