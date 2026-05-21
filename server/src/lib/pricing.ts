export const PARKING_RATE_ETB_PER_MIN = 5;
export const CHARGING_RATE_ETB_PER_KWH = 8;
export const BATTERY_KWH = 60;
export const CHARGING_FULL_MINUTES = 8;

export function parkingCostCents(arrival: Date, departure: Date): number {
  const minutes = Math.ceil((departure.getTime() - arrival.getTime()) / 60_000);
  return Math.max(0, minutes) * PARKING_RATE_ETB_PER_MIN * 100;
}

export function chargingCostCentsFromPct(chargePct: number): { kWh: number; cents: number } {
  const pct = Math.max(0, Math.min(100, chargePct)) / 100;
  const kWh = BATTERY_KWH * pct;
  const cents = Math.round(kWh * CHARGING_RATE_ETB_PER_KWH * 100);
  return { kWh, cents };
}
