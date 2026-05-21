# IoT Integration — Server Implementation Brief

Hand this whole file to a fresh Claude session (or do it yourself). It's self-contained: any context you need is below.

---

## Repo & stack

- **You are working in:** `c:\Users\yoga\code\Intigrate-Proj\parking-iot-system\server`
- **Stack:** Node 20+, TypeScript (ESM, `.js` import suffixes), Express 5, Prisma 5 → Postgres, Zod, Pino, JWT auth, `bcrypt`. Package manager: **pnpm**.
- **Routes mount under** `/api/v1` (see [src/routes/index.ts](src/routes/index.ts) and [src/config/constants.ts](src/config/constants.ts)).
- **Style conventions** (match existing code):
  - Route file → Zod schema → service function → Prisma. See [src/routes/auth.routes.ts](src/routes/auth.routes.ts) + [src/services/auth.service.ts](src/services/auth.service.ts) for the canonical pattern.
  - Errors via `ApiError` helpers (`ApiError.notFound('...')`, `.badRequest('...')`, `.conflict('...')`), wrapped in `asyncHandler`.
  - Money in cents (Int). For ETB we'll use **cents = 1/100 ETB** consistently.
  - No throwaway comments. Only comment when WHY is non-obvious.
  - Don't add fallbacks/validation for impossible scenarios. Trust internal callers.

---

## What we're building

A bridge between our REST server and an Arduino-based parking-gate simulator that sits behind a small Node relay (`IETP-BACKEND`). The relay calls **into us** for every IoT event (entry tap, mode selection, exit tap, charging unplugged). We call **back into the relay** to physically stop charging mid-session and to open the exit gate after payment. Payment is processed by **Chapa** (Ethiopian payment gateway, hosted checkout).

### End-to-end flow

1. User registers via the web frontend → row in `users`, vehicle in `vehicles`, card auto-issued (`vehicles.cardNumber`, 4-digit numeric, unique).
2. User drives up to entry gate → Arduino prompts to type card → relay POSTs to us → we validate (user/vehicle exists, no open assignment for this vehicle) → return ok/reject.
3. User presses "Park-only" or "Park+Charge" → Arduino picks a slot (1–4 = EV, 5–10 = parking) → relay POSTs to us → we create an ACTIVE `SlotAssignment`. If CHARGING, we arm a charging timer.
4. **Charging timer (in-process):** 8 min = 100% for demo. SSE notifications fire at 25% (2 min), 50% (4 min), 75% (6 min). At t=7:50 we POST to the relay to physically stop the relay; on ack we emit the 100% SSE event.
5. If the user unplugs early, relay POSTs `charging/unplugged` → we cancel the rest of the timers, compute % from elapsed, emit SSE at that %, and lock the charging cost.
6. User taps card at exit → relay POSTs `exit/tap` → we compute total cost, init a Chapa checkout, return the `checkoutUrl` to the relay.
7. Chapa webhook arrives → verify signature → mark assignment paid+COMPLETED → POST to relay `/exit/open` to lift the gate.

### Pricing (server-side constants)

```
PARKING_RATE_ETB_PER_MIN = 5     // ceil(minutes) * 5
CHARGING_RATE_ETB_PER_KWH = 8
BATTERY_KWH = 60
CHARGING_FULL_MINUTES = 8        // demo: 8 min = 100%
NOTIFY_AT_PCT = [25, 50, 75, 100]
NOTIFY_AT_MS  = [2*60_000, 4*60_000, 6*60_000, 7*50_000]  // last triggers stop-then-100
AUTO_STOP_BEFORE_FULL_MS = 10_000  // call relay 10s before 100% to ensure relay drops
```

Charging cost formula:
```
chargePct  = min(elapsedMinutes / CHARGING_FULL_MINUTES, 1.0)
kWhDelivered = BATTERY_KWH * chargePct
chargeCostEtb = kWhDelivered * CHARGING_RATE_ETB_PER_KWH
```
No tax. All amounts in **ETB cents (Int)**.

---

## Step 1 — Prisma schema change

Edit [prisma/schema.prisma](prisma/schema.prisma):

```prisma
model Vehicle {
  // ... existing fields ...
  cardNumber String? @unique  // 4-digit numeric. Nullable for legacy/seeded rows.
  // ... rest ...
  @@index([cardNumber])
}
```

Run:
```bash
pnpm prisma migrate dev --name add_vehicle_card_number
pnpm prisma generate
```

---

## Step 2 — Card number generator

Add to [src/lib/uid.ts](src/lib/uid.ts):

```ts
export function generateCardNumber4(): string {
  return Math.floor(Math.random() * 10_000).toString().padStart(4, '0');
}
```

(Uniqueness is enforced by the DB; the caller retries on `P2002`.)

Create a small helper service `src/services/cards.service.ts`:

```ts
import { prisma } from '../lib/prisma.js';
import { generateCardNumber4 } from '../lib/uid.js';

export async function issueCardForVehicle(vehicleId: string): Promise<string> {
  for (let i = 0; i < 50; i++) {
    const candidate = generateCardNumber4();
    try {
      await prisma.vehicle.update({
        where: { id: vehicleId },
        data: { cardNumber: candidate },
      });
      return candidate;
    } catch (e: any) {
      if (e?.code === 'P2002') continue; // collision, retry
      throw e;
    }
  }
  throw new Error('Could not allocate a unique card number after 50 attempts');
}
```

Wire `issueCardForVehicle` into [src/services/auth.service.ts](src/services/auth.service.ts) `register()` — after the existing `tx.vehicle.create({...})` block, call it. Do it OUTSIDE the transaction (it's a separate write that can retry). If the user has no plate at registration, no card is issued — that's fine.

Also add a vehicles endpoint or service helper for "add another vehicle to my account" that issues a fresh card per new vehicle. Check [src/routes/vehicles.routes.ts](src/routes/vehicles.routes.ts) — if there's already a create-vehicle endpoint, just hook `issueCardForVehicle` into its service. If not, add one (POST `/api/v1/vehicles` for the authenticated user).

---

## Step 3 — Seed: one IoT station with 10 slots

Edit [prisma/seed.ts](prisma/seed.ts) — add at the end (or in the appropriate section):

```ts
// IoT simulation station with 10 slots: 1–4 EV (CHARGE_AND_PARK), 5–10 parking
const iotStation = await prisma.station.upsert({
  where: { code: 'IOT-SIM-01' },
  update: {},
  create: {
    code: 'IOT-SIM-01',
    name: 'IoT Simulation Lot',
    region: 'Addis Ababa',
    address: 'Proteus Bench',
  },
});

for (let n = 1; n <= 10; n++) {
  await prisma.slot.upsert({
    where: { stationId_slotNumber: { stationId: iotStation.id, slotNumber: n } },
    update: {},
    create: {
      stationId: iotStation.id,
      slotNumber: n,
      displayId: `IOT-${n.toString().padStart(2, '0')}`,
      kind: n <= 4 ? 'CHARGE_AND_PARK' : 'PARKING_ONLY',
      isActive: true,
    },
  });
}
```

Export a constant for the IoT station code so the IoT service can look it up:

```ts
// src/config/constants.ts
export const IOT_STATION_CODE = 'IOT-SIM-01';
```

---

## Step 4 — Env vars

Add to [.env.example](.env.example) (and the user will mirror to `.env`):

```env
# Chapa (Ethiopian payment gateway — hosted checkout)
CHAPA_BASE_URL=https://api.chapa.co/v1
CHAPA_SECRET_KEY=
CHAPA_WEBHOOK_SECRET=
CHAPA_CALLBACK_URL=http://localhost:4000/api/v1/iot/payments/chapa/webhook
CHAPA_RETURN_URL=http://localhost:3000/payment/return

# IETP-BACKEND relay (we call into it to stop charging and open exit gate)
IOT_RELAY_BASE_URL=http://localhost:3001
```

Update [src/config/env.ts](src/config/env.ts) Zod schema to include all the above as strings. `CHAPA_SECRET_KEY` and `CHAPA_WEBHOOK_SECRET` should be `.optional().default('')` so the server still boots without keys in dev (Chapa init will fail loudly when actually called).

---

## Step 5 — Chapa client

Create `src/lib/chapa.ts`:

```ts
import crypto from 'node:crypto';
import { env } from '../config/env.js';

interface InitInput {
  amountEtb: number;            // not cents — Chapa wants whole units (string in JSON)
  txRef: string;                // your unique reference
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
  const json = await res.json() as { status: string; data?: { status: string; amount: string } };
  return { status: json.data?.status ?? 'unknown', amount: json.data?.amount ?? '0' };
}

export function verifyChapaSignature(rawBody: string, signatureHeader: string | undefined): boolean {
  if (!signatureHeader || !env.CHAPA_WEBHOOK_SECRET) return false;
  const computed = crypto
    .createHmac('sha256', env.CHAPA_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  // Constant-time compare
  const a = Buffer.from(computed, 'hex');
  const b = Buffer.from(signatureHeader, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
```

Note: the Chapa webhook signature comes in the `chapa-signature` header (some docs also mention `x-chapa-signature`). Read both and try whichever exists.

---

## Step 6 — IoT relay client

Create `src/lib/iotRelay.ts`:

```ts
import { env } from '../config/env.js';
import { logger } from './logger.js';

async function post(path: string, body: unknown): Promise<void> {
  try {
    const res = await fetch(`${env.IOT_RELAY_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) logger.warn({ path, status: res.status }, 'iot relay non-2xx');
  } catch (err) {
    logger.error({ err, path }, 'iot relay unreachable');
  }
}

export function relayStopCharging(cardNumber: string, slotNumber: number): Promise<void> {
  return post('/charging/stop', { cardNumber, slotNumber });
}

export function relayOpenExit(cardNumber: string, slotNumber: number): Promise<void> {
  return post('/exit/open', { cardNumber, slotNumber });
}
```

---

## Step 7 — SSE infrastructure

Create `src/lib/sse.ts`:

```ts
import type { Response } from 'express';

type Sub = { res: Response; assignmentId: string };
const subs = new Map<string, Set<Sub>>(); // key = assignmentId

export function addSseClient(assignmentId: string, res: Response): void {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sub: Sub = { res, assignmentId };
  if (!subs.has(assignmentId)) subs.set(assignmentId, new Set());
  subs.get(assignmentId)!.add(sub);

  // Heartbeat every 25s so proxies don't kill the connection
  const heartbeat = setInterval(() => res.write(': hb\n\n'), 25_000);
  res.on('close', () => {
    clearInterval(heartbeat);
    subs.get(assignmentId)?.delete(sub);
  });
}

export function emitSse(assignmentId: string, event: string, data: unknown): void {
  const set = subs.get(assignmentId);
  if (!set) return;
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const s of set) {
    try { s.res.write(payload); } catch { /* dead socket; cleanup on close */ }
  }
}
```

---

## Step 8 — Charging timer manager

Create `src/services/chargingTimers.service.ts`:

```ts
import { emitSse } from '../lib/sse.js';
import { relayStopCharging } from '../lib/iotRelay.js';
import { logger } from '../lib/logger.js';

interface Active {
  assignmentId: string;
  cardNumber: string;
  slotNumber: number;
  startedAt: number;
  timers: NodeJS.Timeout[];
  stopped: boolean;
}

const active = new Map<string, Active>(); // key = assignmentId

const NOTIFY_SCHEDULE: Array<{ ms: number; pct: number }> = [
  { ms: 2 * 60_000, pct: 25 },
  { ms: 4 * 60_000, pct: 50 },
  { ms: 6 * 60_000, pct: 75 },
];
const STOP_AT_MS = 7 * 60_000 + 50_000; // 7:50 — call relay; emit 100 on ack

export function startChargingTimers(args: {
  assignmentId: string;
  cardNumber: string;
  slotNumber: number;
}): void {
  if (active.has(args.assignmentId)) return;
  const entry: Active = { ...args, startedAt: Date.now(), timers: [], stopped: false };

  for (const step of NOTIFY_SCHEDULE) {
    entry.timers.push(
      setTimeout(() => emitSse(args.assignmentId, 'charge.progress', { pct: step.pct }), step.ms),
    );
  }
  entry.timers.push(
    setTimeout(async () => {
      try {
        await relayStopCharging(args.cardNumber, args.slotNumber);
      } catch (err) {
        logger.error({ err }, 'failed to stop charging on relay');
      }
      emitSse(args.assignmentId, 'charge.progress', { pct: 100 });
      entry.stopped = true;
    }, STOP_AT_MS),
  );

  active.set(args.assignmentId, entry);
}

// Called when relay says "user unplugged early"
export function unplugCharging(assignmentId: string): { pct: number } | null {
  const entry = active.get(assignmentId);
  if (!entry) return null;
  for (const t of entry.timers) clearTimeout(t);
  const elapsedMin = (Date.now() - entry.startedAt) / 60_000;
  const pct = Math.min(100, Math.round((elapsedMin / 8) * 100));
  emitSse(assignmentId, 'charge.progress', { pct, reason: 'unplugged' });
  entry.stopped = true;
  return { pct };
}

export function getChargedPct(assignmentId: string): number {
  const entry = active.get(assignmentId);
  if (!entry) return 0;
  const elapsedMin = (Date.now() - entry.startedAt) / 60_000;
  return Math.min(100, (elapsedMin / 8) * 100);
}

export function clearChargingTimers(assignmentId: string): void {
  const entry = active.get(assignmentId);
  if (!entry) return;
  for (const t of entry.timers) clearTimeout(t);
  active.delete(assignmentId);
}
```

(In-process timers are fine for demo. Note in the file: they don't survive a restart.)

---

## Step 9 — Pricing helpers

Create `src/lib/pricing.ts`:

```ts
export const PARKING_RATE_ETB_PER_MIN = 5;
export const CHARGING_RATE_ETB_PER_KWH = 8;
export const BATTERY_KWH = 60;
export const CHARGING_FULL_MINUTES = 8;

export function parkingCostCents(arrival: Date, departure: Date): number {
  const minutes = Math.ceil((departure.getTime() - arrival.getTime()) / 60_000);
  return Math.max(0, minutes) * PARKING_RATE_ETB_PER_MIN * 100;
}

export function chargingCostCentsFromPct(chargePct: number): {
  kWh: number;
  cents: number;
} {
  const pct = Math.max(0, Math.min(100, chargePct)) / 100;
  const kWh = BATTERY_KWH * pct;
  const cents = Math.round(kWh * CHARGING_RATE_ETB_PER_KWH * 100);
  return { kWh, cents };
}
```

---

## Step 10 — IoT routes & service

Create `src/schemas/iot.schema.ts`:

```ts
import { z } from 'zod';

const cardId = z.string().regex(/^\d{4}$/, '4-digit card number');

export const entryTapBody  = z.object({ cardNumber: cardId });
export const entryConfirmBody = z.object({
  cardNumber: cardId,
  mode: z.enum(['PARKING', 'CHARGING']),
  slotNumber: z.number().int().min(1).max(10),
  freeSlotsRemaining: z.number().int().min(0).optional(),
});
export const chargingUnpluggedBody = z.object({ cardNumber: cardId });
export const exitTapBody = z.object({ cardNumber: cardId });
```

Create `src/services/iot.service.ts`:

```ts
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
import {
  parkingCostCents,
  chargingCostCentsFromPct,
} from '../lib/pricing.js';
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

// --- entry/tap ----------------------------------------------------------
export async function entryTap(cardNumber: string) {
  const v = await vehicleByCard(cardNumber);
  const open = await activeAssignmentForVehicle(v.id);
  if (open) return { ok: false, reason: 'Vehicle already inside' };
  return {
    ok: true,
    userName: [v.owner!.firstName, v.owner!.lastName].filter(Boolean).join(' ') || v.owner!.email,
  };
}

// --- entry/confirm ------------------------------------------------------
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
      unitCostPerKWhCents: input.mode === 'CHARGING' ? 8 * 100 : null,
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

// --- charging/unplugged -------------------------------------------------
export async function chargingUnplugged(cardNumber: string) {
  const v = await vehicleByCard(cardNumber);
  const a = await activeAssignmentForVehicle(v.id);
  if (!a) throw ApiError.notFound('No active session');

  const result = unplugCharging(a.id);
  if (!result) return { pct: 100 };  // timers already cleared (auto-stop fired)

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

// --- exit/tap -----------------------------------------------------------
export async function exitTap(cardNumber: string) {
  const v = await vehicleByCard(cardNumber);
  const a = await activeAssignmentForVehicle(v.id);
  if (!a) throw ApiError.notFound('No active session for this card');

  // Lock charging cost if not already locked
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

  // Stash txRef on the assignment so the webhook can find it
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

// --- payments/chapa/webhook --------------------------------------------
export async function handleChapaSuccess(txRef: string) {
  const tx = await prisma.transaction.findUnique({
    where: { code: txRef },
    include: { assignment: { include: { vehicle: true, slot: true } } },
  });
  if (!tx || !tx.assignment) return;
  if (tx.status === 'COMPLETED') return; // idempotent

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
```

Create `src/routes/iot.routes.ts`:

```ts
import { Router, json } from 'express';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/http.js';
import {
  entryTapBody,
  entryConfirmBody,
  chargingUnpluggedBody,
  exitTapBody,
} from '../schemas/iot.schema.js';
import * as iot from '../services/iot.service.js';
import { verifyChapaSignature } from '../lib/chapa.js';
import { addSseClient } from '../lib/sse.js';
import { authenticate } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../utils/ApiError.js';

const router = Router();

router.post('/entry/tap', validate(entryTapBody), asyncHandler(async (req, res) => {
  return ok(res, await iot.entryTap(req.body.cardNumber));
}));

router.post('/entry/confirm', validate(entryConfirmBody), asyncHandler(async (req, res) => {
  return ok(res, await iot.entryConfirm(req.body));
}));

router.post('/charging/unplugged', validate(chargingUnpluggedBody), asyncHandler(async (req, res) => {
  return ok(res, await iot.chargingUnplugged(req.body.cardNumber));
}));

router.post('/exit/tap', validate(exitTapBody), asyncHandler(async (req, res) => {
  return ok(res, await iot.exitTap(req.body.cardNumber));
}));

// Chapa webhook — needs raw body for signature verification.
// Mount with express.raw on this route ONLY.
router.post(
  '/payments/chapa/webhook',
  json({ verify: (req: any, _res, buf) => { req.rawBody = buf.toString('utf8'); } }),
  asyncHandler(async (req: any, res) => {
    const sig = (req.header('chapa-signature') ?? req.header('x-chapa-signature')) as string | undefined;
    if (!verifyChapaSignature(req.rawBody, sig)) throw ApiError.unauthorized('Bad signature');
    const body = req.body as { status?: string; tx_ref?: string };
    if (body.status === 'success' && body.tx_ref) await iot.handleChapaSuccess(body.tx_ref);
    return ok(res, { received: true });
  }),
);

// SSE for charging progress — auth'd, scoped to the assignment owner
router.get('/sessions/:id/stream', authenticate, asyncHandler(async (req: any, res) => {
  const userId = req.user!.id as string;
  const assignment = await prisma.slotAssignment.findUnique({
    where: { id: req.params.id },
    include: { vehicle: true },
  });
  if (!assignment || assignment.vehicle.ownerId !== userId) {
    throw ApiError.notFound('Session not found');
  }
  addSseClient(assignment.id, res);
}));

export default router;
```

Mount in [src/routes/index.ts](src/routes/index.ts):

```ts
import iotRoutes from './iot.routes.js';
// ...
apiRouter.use('/iot', iotRoutes);
```

---

## Step 11 — Verify it works

1. `pnpm prisma:migrate` — applies the new card_number column.
2. `pnpm prisma:seed` — creates IOT-SIM-01 station + 10 slots.
3. Register a user with a plate via `POST /api/v1/auth/register` — confirm the user's vehicle row has a non-null `cardNumber` (check via Prisma Studio).
4. Manually exercise the flow with curl:

```bash
# Entry tap
curl -X POST http://localhost:4000/api/v1/iot/entry/tap \
  -H 'Content-Type: application/json' -d '{"cardNumber":"1234"}'

# Confirm
curl -X POST http://localhost:4000/api/v1/iot/entry/confirm \
  -H 'Content-Type: application/json' \
  -d '{"cardNumber":"1234","mode":"CHARGING","slotNumber":1}'

# Tail SSE (use the assignmentId returned above + a JWT)
curl -N -H 'Authorization: Bearer $JWT' \
  http://localhost:4000/api/v1/iot/sessions/$ASSIGN_ID/stream

# Unplug after a few minutes
curl -X POST http://localhost:4000/api/v1/iot/charging/unplugged \
  -H 'Content-Type: application/json' -d '{"cardNumber":"1234"}'

# Exit
curl -X POST http://localhost:4000/api/v1/iot/exit/tap \
  -H 'Content-Type: application/json' -d '{"cardNumber":"1234"}'
```

The exit response should include a `checkoutUrl` (real if Chapa keys are set, will error otherwise — that's expected for now).

---

## What to NOT do

- Don't add machine-to-machine auth on `/iot/*` yet (the user is deferring this).
- Don't add a tax line (user said no tax).
- Don't touch the IETP-BACKEND repo or the Arduino sketch — those are handled separately.
- Don't add EV/non-EV vehicle validation on `entry/confirm` — assume user picked correctly.
- Don't refactor unrelated code; keep diffs scoped to the additions above.

---

## Open items the user still needs to confirm

- Real `CHAPA_SECRET_KEY` and `CHAPA_WEBHOOK_SECRET` from the Chapa dashboard. Until provided, exit tap will throw at the Chapa init call (handle gracefully if you want, or leave it — fine for demo without keys).
- For local Chapa webhook testing, need `ngrok http 4000` and set `CHAPA_CALLBACK_URL` to the ngrok URL in `.env`.
