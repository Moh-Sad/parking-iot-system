import { prisma } from '../lib/prisma.js';
import { AssignmentStatus, WalletTxKind } from '@prisma/client';
import { ApiError } from '../utils/ApiError.js';
import { parsePage, buildMeta, type PageMeta } from '../lib/pagination.js';

interface ActiveSessionDto {
  id: string;
  stationCode: string;
  stationName: string;
  locationLabel: string;
  startTime: Date;
  timeElapsedSeconds: number;
  currentCostCents: number;
  currency: string;
  stateOfChargePct: number | null;
  powerDeliveryKW: number | null;
  estimatedRemainingMinutes: number | null;
  energyDeliveredKWh: number | null;
  unitCostPerKWhCents: number | null;
  connectorType: string | null;
}

export async function getActiveSession(userId: string): Promise<ActiveSessionDto | null> {
  // Customer's active session: most recent ACTIVE assignment for any vehicle they own.
  const session = await prisma.slotAssignment.findFirst({
    where: {
      status: AssignmentStatus.ACTIVE,
      vehicle: { ownerId: userId },
    },
    include: {
      slot: { include: { station: true } },
    },
    orderBy: { arrivalTime: 'desc' },
  });
  if (!session) return null;

  const elapsedSec = Math.max(0, Math.floor((Date.now() - session.arrivalTime.getTime()) / 1000));

  return {
    id: session.id,
    stationCode: session.slot.station.code,
    stationName: session.slot.station.name,
    locationLabel: `${session.slot.station.name} · ${session.slot.station.region}`,
    startTime: session.arrivalTime,
    timeElapsedSeconds: elapsedSec,
    currentCostCents: session.totalCostCents ?? session.energyCostCents ?? 0,
    currency: 'ETB',
    stateOfChargePct: session.currentSocPct ?? session.battery ?? null,
    powerDeliveryKW: session.currentPowerKW ? Number(session.currentPowerKW) : null,
    estimatedRemainingMinutes: session.estimatedRemainingMin ?? null,
    energyDeliveredKWh: session.energyDeliveredKWh ? Number(session.energyDeliveredKWh) : null,
    unitCostPerKWhCents: session.unitCostPerKWhCents ?? null,
    connectorType: session.connectorType ?? null,
  };
}

export async function stopActiveSession(userId: string): Promise<{ closed: boolean }> {
  const session = await prisma.slotAssignment.findFirst({
    where: { status: AssignmentStatus.ACTIVE, vehicle: { ownerId: userId } },
  });
  if (!session) throw ApiError.notFound('No active session');

  const departure = new Date();
  const durationSeconds = Math.floor((departure.getTime() - session.arrivalTime.getTime()) / 1000);
  const energyCostCents = session.energyCostCents ?? session.totalCostCents ?? 0;
  const facilityFeeCents = session.facilityFeeCents ?? 250;
  const subtotal = energyCostCents + facilityFeeCents;
  const taxCents = Math.round(subtotal * 0.085);
  const totalCostCents = subtotal + taxCents;

  // Debit wallet
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (wallet) {
    const newBalance = wallet.balanceCents - totalCostCents;
    await prisma.$transaction([
      prisma.slotAssignment.update({
        where: { id: session.id },
        data: {
          status: AssignmentStatus.COMPLETED,
          departureTime: departure,
          durationSeconds,
          facilityFeeCents,
          taxCents,
          totalCostCents,
          paidAt: departure,
        },
      }),
      prisma.wallet.update({ where: { id: wallet.id }, data: { balanceCents: newBalance } }),
      prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          kind: WalletTxKind.CHARGE,
          amountCents: -totalCostCents,
          balanceAfterCents: newBalance,
          description: 'Charging session',
          relatedAssignmentId: session.id,
        },
      }),
    ]);
  } else {
    await prisma.slotAssignment.update({
      where: { id: session.id },
      data: {
        status: AssignmentStatus.COMPLETED,
        departureTime: departure,
        durationSeconds,
      },
    });
  }

  return { closed: true };
}

interface ChargingHistoryRow {
  id: string;
  stationCode: string;
  stationName: string;
  locationLabel: string;
  date: Date;
  energyKWh: number | null;
  durationSeconds: number | null;
  totalCostCents: number | null;
  currency: string;
}

export async function chargingHistory(
  userId: string,
  query: { page?: number; limit?: number },
): Promise<{ rows: ChargingHistoryRow[]; meta: PageMeta }> {
  const { page, limit, skip } = parsePage({ page: query.page, limit: query.limit });

  const where = {
    status: AssignmentStatus.COMPLETED,
    vehicle: { ownerId: userId },
  } as const;

  const [total, rows] = await Promise.all([
    prisma.slotAssignment.count({ where }),
    prisma.slotAssignment.findMany({
      where,
      orderBy: { departureTime: 'desc' },
      skip,
      take: limit,
      include: { slot: { include: { station: true } } },
    }),
  ]);

  return {
    rows: rows.map((r) => ({
      id: r.id,
      stationCode: r.slot.station.code,
      stationName: r.slot.station.name,
      locationLabel: `${r.slot.station.name} · ${r.slot.station.region}`,
      date: r.departureTime ?? r.arrivalTime,
      energyKWh: r.energyDeliveredKWh ? Number(r.energyDeliveredKWh) : null,
      durationSeconds: r.durationSeconds,
      totalCostCents: r.totalCostCents,
      currency: 'ETB',
    })),
    meta: buildMeta(page, limit, total),
  };
}

export async function getReceipt(userId: string, sessionId: string): Promise<unknown> {
  const session = await prisma.slotAssignment.findUnique({
    where: { id: sessionId },
    include: {
      slot: { include: { station: true } },
      vehicle: true,
      paymentMethod: true,
    },
  });
  if (!session) throw ApiError.notFound('Session not found');
  if (session.vehicle.ownerId !== userId) throw ApiError.forbidden();

  const plateLast4 = session.vehicle.plateNumber.replace(/[^A-Za-z0-9]/g, '').slice(-4);
  const energyCents = session.energyCostCents ?? 0;
  const facilityCents = session.facilityFeeCents ?? 0;
  const idleCents = session.idleFeeCents ?? 0;
  const subtotal = energyCents + facilityCents + idleCents;
  const taxCents = session.taxCents ?? 0;
  const totalCents = session.totalCostCents ?? subtotal + taxCents;

  return {
    sessionId: session.id,
    receiptCode: `RCT-${session.id.slice(-8).toUpperCase()}`,
    date: session.arrivalTime,
    endTime: session.departureTime,
    vehicleModel: session.vehicle.model ?? session.vehicle.driverName,
    vehiclePlateLast4: plateLast4,
    station: {
      id: session.slot.station.id,
      code: session.slot.station.code,
      name: session.slot.station.name,
      address: session.slot.station.address,
      region: session.slot.station.region,
    },
    connectorType: session.connectorType ?? 'CCS Combo 2',
    peakPowerKW: session.peakPowerKW ? Number(session.peakPowerKW) : null,
    energyDeliveredKWh: session.energyDeliveredKWh ? Number(session.energyDeliveredKWh) : null,
    durationMinutes: session.durationSeconds ? Math.round(session.durationSeconds / 60) : null,
    unitCostPerKWhCents: session.unitCostPerKWhCents,
    energyCostCents: energyCents,
    facilityFeeCents: facilityCents,
    idleMinutes: session.idleMinutes ?? 0,
    idleFeeCents: idleCents,
    taxCents,
    totalCostCents: totalCents,
    currency: 'ETB',
    paymentMethod: session.paymentMethod
      ? { brand: session.paymentMethod.brand, last4: session.paymentMethod.last4 }
      : null,
    carbonOffsetGramsCO2e: session.carbonOffsetGramsCO2e,
  };
}
