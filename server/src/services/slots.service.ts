import { prisma } from '../lib/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { Prisma, type SlotKind } from '@prisma/client';
import type { Actor } from '../types/domain.js';

export interface SlotView {
  id: string;
  slotNumber: number;
  displayId: string;
  kind: SlotKind;
  occupied: boolean;
  vehicle?: string;
  duration?: string;
  battery?: number;
}

export interface SlotStats {
  totalSlots: number;
  usedSlots: number;
  availableSlots: number;
  chargingSlots: number;
  parkingOnlySlots: number;
}

function durationLabel(arrival: Date, end: Date): string {
  const seconds = Math.max(0, Math.floor((end.getTime() - arrival.getTime()) / 1000));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function scope(actor: Actor): Prisma.SlotWhereInput {
  if (actor.role === 'ADMIN') return {};
  if (actor.region) return { station: { region: actor.region } };
  return {};
}

export async function listSlots(actor: Actor, query: { stationId?: string; kind?: SlotKind; occupied?: boolean }) {
  const baseScope = scope(actor);
  const where: Prisma.SlotWhereInput = {
    ...baseScope,
    ...(query.stationId ? { stationId: query.stationId } : {}),
    ...(query.kind ? { kind: query.kind } : {}),
  };

  const slots = await prisma.slot.findMany({
    where,
    orderBy: [{ stationId: 'asc' }, { slotNumber: 'asc' }],
    include: {
      assignments: {
        where: { status: 'ACTIVE' },
        take: 1,
        include: { vehicle: true },
      },
    },
  });

  const now = new Date();
  const allViews: SlotView[] = slots.map((s) => {
    const active = s.assignments[0];
    const view: SlotView = {
      id: s.id,
      slotNumber: s.slotNumber,
      displayId: s.displayId,
      kind: s.kind,
      occupied: !!active,
    };
    if (active) {
      view.vehicle = `${active.vehicle.driverName} (${active.vehicle.plateNumber})`;
      view.duration = durationLabel(active.arrivalTime, now);
      if (typeof active.battery === 'number') view.battery = active.battery;
    }
    return view;
  });

  const filtered =
    query.occupied === undefined ? allViews : allViews.filter((v) => v.occupied === query.occupied);

  const stats: SlotStats = {
    totalSlots: allViews.length,
    usedSlots: allViews.filter((v) => v.occupied).length,
    availableSlots: allViews.filter((v) => !v.occupied).length,
    chargingSlots: allViews.filter((v) => v.kind === 'CHARGE_AND_PARK').length,
    parkingOnlySlots: allViews.filter((v) => v.kind === 'PARKING_ONLY').length,
  };

  return { slots: filtered, stats };
}

export async function getSlot(actor: Actor, id: string) {
  const slot = await prisma.slot.findUnique({
    where: { id },
    include: {
      station: true,
      assignments: {
        where: { status: 'ACTIVE' },
        take: 1,
        include: { vehicle: true },
      },
    },
  });
  if (!slot) throw ApiError.notFound('Slot not found');
  if (actor.role === 'SUPERVISOR' && actor.region && slot.station.region !== actor.region) {
    throw ApiError.forbidden();
  }
  return {
    slot,
    activeAssignment: slot.assignments[0] ?? null,
  };
}

export async function patchSlot(id: string, input: { kind?: SlotKind; isActive?: boolean }) {
  return prisma.slot.update({ where: { id }, data: input });
}
