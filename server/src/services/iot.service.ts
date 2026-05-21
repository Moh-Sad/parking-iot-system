import { prisma } from '../lib/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { AssignmentStatus } from '@prisma/client';
import { IOT_STATION_CODE } from '../config/constants.js';
import {
  startChargingTimers,
  unplugCharging,
  getChargedPct,
  clearChargingTimers,
} from './chargingTimers.service.js';
import { parkingCostCents, chargingCostCentsFromPct, CHARGING_RATE_ETB_PER_KWH } from '../lib/pricing.js';
import { initChapaCheckout } from '../lib/chapa.js';
import { transactionCode } from '../lib/uid.js';
import { relayOpenExit } from '../lib/iotRelay.js';

async function vehicleByCard(cardNumber: string) {
  const v = await prisma.vehicle.findUnique({
    where: { cardNumber },
    include: { owner: true },
  });
  if (!v) throw ApiError.notFound('Card not registered');
  if (!v.owner) throw ApiError.badRequest('Vehicle has no owner');
  return v;
}

async function iotStation() {
  const s = await prisma.station.findUnique({ where: { code: IOT_STATION_CODE } });
  if (!s) throw new Error('IoT station not seeded');
  return s;
}

async function activeAssignmentForVehicle(vehicleId: string) {
  return prisma.slotAssignment.findFirst({
    where: { vehicleId, status: AssignmentStatus.ACTIVE },
    include: { slot: true },
  });
}

export async function entryTap(cardNumber: string) {
  const v = await vehicleByCard(cardNumber);
  const open = await activeAssignmentForVehicle(v.id);
  if (open) return { ok: false, reason: 'Vehicle already inside' };
  return {
    ok: true,
    userName: [v.owner!.firstName, v.owner!.lastName].filter(Boolean).join(' ') || v.owner!.email,
  };
}

export async function entryConfirm(input: {
  cardNumber: string;
  mode: 'PARKING' | 'CHARGING';
  slotNumber: number;
}) {
  const v = await vehicleByCard(input.cardNumber);
  const station = await iotStation();
  const slot = await prisma.slot.findUnique({
    where: { stationId_slotNumber: { stationId: station.id, slotNumber: input.slotNumber } },
  });
  if (!slot) throw ApiError.notFound('Slot not found');

  const existing = await activeAssignmentForVehicle(v.id);
  if (existing) throw ApiError.conflict('Already inside');

  const assignment = await prisma.slotAssignment.create({
    data: {
      slotId: slot.id,
      vehicleId: v.id,
      createdById: v.ownerId,
      status: AssignmentStatus.ACTIVE,
      arrivalTime: new Date(),
      connectorType: input.mode === 'CHARGING' ? 'CCS Combo 2' : null,
      unitCostPerKWhCents: input.mode === 'CHARGING' ? CHARGING_RATE_ETB_PER_KWH * 100 : null,
    },
  });

  if (input.mode === 'CHARGING') {
    startChargingTimers({
      assignmentId: assignment.id,
      cardNumber: input.cardNumber,
      slotNumber: input.slotNumber,
    });
  }

  return { assignmentId: assignment.id };
}

export async function chargingUnplugged(cardNumber: string) {
  const v = await vehicleByCard(cardNumber);
  const a = await activeAssignmentForVehicle(v.id);
  if (!a) throw ApiError.notFound('No active session');

  const result = unplugCharging(a.id);
  if (!result) return { pct: 100 };

  const { kWh, cents } = chargingCostCentsFromPct(result.pct);
  await prisma.slotAssignment.update({
    where: { id: a.id },
    data: {
      energyDeliveredKWh: kWh,
      currentSocPct: result.pct,
      energyCostCents: cents,
    },
  });
  return { pct: result.pct, kWh, costCents: cents };
}

export async function exitTap(cardNumber: string) {
  const v = await vehicleByCard(cardNumber);
  const a = await activeAssignmentForVehicle(v.id);
  if (!a) throw ApiError.notFound('No active session for this card');

  let chargeCents = a.energyCostCents ?? 0;
  let kWh = a.energyDeliveredKWh ? Number(a.energyDeliveredKWh) : 0;
  if (a.connectorType) {
    const pct = a.currentSocPct ?? getChargedPct(a.id);
    const locked = chargingCostCentsFromPct(pct);
    chargeCents = locked.cents;
    kWh = locked.kWh;
  }

  const now = new Date();
  const parkCents = parkingCostCents(a.arrivalTime, now);
  const total = parkCents + chargeCents;

  await prisma.slotAssignment.update({
    where: { id: a.id },
    data: {
      energyCostCents: chargeCents,
      energyDeliveredKWh: kWh,
      facilityFeeCents: parkCents,
      totalCostCents: total,
    },
  });
  clearChargingTimers(a.id);

  const txRef = transactionCode();
  const { checkoutUrl } = await initChapaCheckout({
    amountEtb: total / 100,
    txRef,
    email: v.owner!.email,
    firstName: v.owner!.firstName ?? 'Customer',
    lastName: v.owner!.lastName ?? '',
    phone: v.owner!.phone ?? undefined,
    description: `Parking session at ${IOT_STATION_CODE}`,
  });

  await prisma.transaction.create({
    data: {
      code: txRef,
      stationId: a.slot.stationId,
      assignmentId: a.id,
      amountCents: total,
      currency: 'ETB',
      method: 'DIRECT_PAY',
      status: 'PENDING',
    },
  });

  return {
    checkoutUrl,
    txRef,
    totalCents: total,
    breakdown: { parkingCents: parkCents, chargingCents: chargeCents, kWh },
  };
}

export async function handleChapaSuccess(txRef: string) {
  const tx = await prisma.transaction.findUnique({
    where: { code: txRef },
    include: { assignment: { include: { vehicle: true, slot: true } } },
  });
  if (!tx || !tx.assignment) return;
  if (tx.status === 'COMPLETED') return;

  const a = tx.assignment;
  const now = new Date();
  await prisma.$transaction([
    prisma.transaction.update({
      where: { id: tx.id },
      data: { status: 'COMPLETED', processedAt: now },
    }),
    prisma.slotAssignment.update({
      where: { id: a.id },
      data: {
        status: AssignmentStatus.COMPLETED,
        departureTime: now,
        durationSeconds: Math.floor((now.getTime() - a.arrivalTime.getTime()) / 1000),
        paidAt: now,
      },
    }),
  ]);

  if (a.vehicle.cardNumber) {
    await relayOpenExit(a.vehicle.cardNumber, a.slot.slotNumber);
  }
}
