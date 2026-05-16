import { prisma } from '../lib/prisma.js';
import type { Actor } from '../types/domain.js';

export type SearchType = 'users' | 'stations' | 'invoices' | 'transactions';

export async function search(actor: Actor, q: string, types: SearchType[], limit: number) {
  const regionFilter = actor.role === 'SUPERVISOR' && actor.region ? { region: actor.region } : {};
  const stationRegionFilter =
    actor.role === 'SUPERVISOR' && actor.region ? { station: { region: actor.region } } : {};

  const wantedTypes = types.length ? new Set(types) : new Set<SearchType>(['users', 'stations', 'invoices', 'transactions']);

  const [users, stations, invoices, transactions] = await Promise.all([
    wantedTypes.has('users') && actor.role === 'ADMIN'
      ? prisma.user.findMany({
          where: {
            ...regionFilter,
            OR: [
              { email: { contains: q, mode: 'insensitive' } },
              { firstName: { contains: q, mode: 'insensitive' } },
              { lastName: { contains: q, mode: 'insensitive' } },
              { uid: { contains: q, mode: 'insensitive' } },
            ],
          },
          take: limit,
          select: { id: true, email: true, uid: true, firstName: true, lastName: true },
        })
      : Promise.resolve([]),
    wantedTypes.has('stations')
      ? prisma.station.findMany({
          where: {
            ...regionFilter,
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { code: { contains: q, mode: 'insensitive' } },
              { address: { contains: q, mode: 'insensitive' } },
            ],
          },
          take: limit,
          select: { id: true, name: true, code: true, region: true },
        })
      : Promise.resolve([]),
    wantedTypes.has('invoices')
      ? prisma.invoice.findMany({
          where: {
            ...stationRegionFilter,
            OR: [
              { code: { contains: q, mode: 'insensitive' } },
              { clientName: { contains: q, mode: 'insensitive' } },
            ],
          },
          take: limit,
          select: { id: true, code: true, clientName: true, grandTotalCents: true, status: true },
        })
      : Promise.resolve([]),
    wantedTypes.has('transactions')
      ? prisma.transaction.findMany({
          where: {
            ...stationRegionFilter,
            code: { contains: q, mode: 'insensitive' },
          },
          take: limit,
          select: { id: true, code: true, status: true, amountCents: true },
        })
      : Promise.resolve([]),
  ]);

  return { users, stations, invoices, transactions };
}
