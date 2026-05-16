import 'dotenv/config';
import {
  PrismaClient,
  Role,
  UserStatus,
  SlotKind,
  CarType,
  AssignmentStatus,
  InvoiceStatus,
  TransactionStatus,
  PaymentMethod,
  LogStatus,
  NotificationKind,
} from '@prisma/client';
import bcrypt from 'bcrypt';
import { createId } from '@paralleldrive/cuid2';

const prisma = new PrismaClient();

function code(prefix: string, len = 5): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}-${s}`;
}

async function main() {
  // Clean (dev only)
  await prisma.notification.deleteMany({});
  await prisma.invoiceLineItem.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.slotAssignment.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.slot.deleteMany({});
  await prisma.station.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.passwordResetToken.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.systemSettings.deleteMany({});
  await prisma.systemMetricsSnapshot.deleteMany({});
  await prisma.user.deleteMany({});

  // --- Users ---
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@parking-iot.local';
  const adminPwd = process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!';

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPwd, 12),
      firstName: 'System',
      lastName: 'Admin',
      role: Role.ADMIN,
      roleLevel: 9,
      status: UserStatus.ACTIVE,
      region: 'Global Hub',
      uid: 'ADM-001',
      mustCompleteProfile: false,
      lastLoginAt: new Date(),
    },
  });

  const sup1 = await prisma.user.create({
    data: {
      email: 'elena@parking-iot.local',
      passwordHash: await bcrypt.hash('Super123!', 12),
      firstName: 'Elena',
      lastName: 'Rodriguez',
      role: Role.SUPERVISOR,
      roleLevel: 4,
      status: UserStatus.ACTIVE,
      region: 'EMEA Central',
      uid: 'SUP-092ER',
      mustCompleteProfile: false,
      lastLoginAt: new Date(Date.now() - 60_000),
    },
  });

  const sup2 = await prisma.user.create({
    data: {
      email: 'kenji@parking-iot.local',
      passwordHash: await bcrypt.hash('Super123!', 12),
      firstName: 'Kenji',
      lastName: 'Sato',
      role: Role.SUPERVISOR,
      roleLevel: 4,
      status: UserStatus.ACTIVE,
      region: 'APAC Hub',
      uid: 'SUP-211KS',
      mustCompleteProfile: false,
    },
  });

  // Invited supervisor (mustCompleteProfile)
  const supInvited = await prisma.user.create({
    data: {
      email: 'invited@parking-iot.local',
      role: Role.SUPERVISOR,
      roleLevel: 4,
      status: UserStatus.INVITED,
      region: 'North America',
      uid: 'SUP-INVITE',
      mustCompleteProfile: true,
    },
  });

  // --- Stations ---
  const stations = await Promise.all([
    prisma.station.create({
      data: { code: 'BER-N-B4', name: 'Berlin North Cluster B4', region: 'EMEA Central', address: 'Tiergartenstraße 1, Berlin' },
    }),
    prisma.station.create({
      data: { code: 'TKY-SHIB', name: 'Tokyo Shibuya Hub', region: 'APAC Hub', address: 'Shibuya 1-1, Tokyo' },
    }),
    prisma.station.create({
      data: { code: 'NYC-MID', name: 'NYC Midtown Tower', region: 'North America', address: '5th Ave, NY' },
    }),
    prisma.station.create({
      data: { code: 'GLO-001', name: 'Global Reference Node', region: 'Global Hub', address: '—' },
    }),
  ]);

  // --- Slots (10 per station, mix) ---
  for (const st of stations) {
    for (let i = 1; i <= 10; i++) {
      const kind: SlotKind = i % 2 === 0 ? SlotKind.PARKING_ONLY : SlotKind.CHARGE_AND_PARK;
      const prefix = kind === SlotKind.CHARGE_AND_PARK ? 'A' : 'P';
      await prisma.slot.create({
        data: {
          stationId: st.id,
          slotNumber: i,
          displayId: `${prefix}-${i.toString().padStart(2, '0')}`,
          kind,
        },
      });
    }
  }

  // --- Vehicles ---
  const vehicles = await Promise.all([
    prisma.vehicle.create({ data: { plateNumber: 'EV-001-AB', driverName: 'Mara Klein', carType: CarType.EV } }),
    prisma.vehicle.create({ data: { plateNumber: 'NY-998-ZX', driverName: 'Aaron Park', carType: CarType.SEDAN } }),
    prisma.vehicle.create({ data: { plateNumber: 'TK-CHARGE-1', driverName: 'Hiro Tanaka', carType: CarType.EV } }),
    prisma.vehicle.create({ data: { plateNumber: 'EU-FLEET-7', driverName: 'Sofia Garcia', carType: CarType.VAN } }),
    prisma.vehicle.create({ data: { plateNumber: 'US-PICKUP-3', driverName: 'Jamie Lee', carType: CarType.PICKUP } }),
  ]);

  // --- Active assignments (one per station, on slot 1 = CHARGE_AND_PARK) ---
  for (let s = 0; s < stations.length; s++) {
    const station = stations[s]!;
    const vehicle = vehicles[s % vehicles.length]!;
    const slot = await prisma.slot.findFirst({ where: { stationId: station.id, slotNumber: 1 } });
    if (!slot) continue;
    await prisma.slotAssignment.create({
      data: {
        slotId: slot.id,
        vehicleId: vehicle.id,
        createdById: sup1.id,
        status: AssignmentStatus.ACTIVE,
        battery: 30 + s * 15,
        arrivalTime: new Date(Date.now() - (s + 1) * 1_800_000),
        notes: 'Seeded active assignment',
      },
    });
  }

  // --- Transactions (10) ---
  const methods: PaymentMethod[] = [
    PaymentMethod.CORPORATE_FLEET_CARD,
    PaymentMethod.DIRECT_PAY,
    PaymentMethod.MOBILE_APP_WALLET,
    PaymentMethod.RFID_PASS,
    PaymentMethod.APPLE_PAY,
  ];
  const txStatus: TransactionStatus[] = [
    TransactionStatus.COMPLETED,
    TransactionStatus.COMPLETED,
    TransactionStatus.COMPLETED,
    TransactionStatus.PENDING,
    TransactionStatus.FAILED,
  ];
  for (let i = 0; i < 10; i++) {
    const station = stations[i % stations.length]!;
    await prisma.transaction.create({
      data: {
        code: code('TXN', 8),
        stationId: station.id,
        amountCents: 1500 + Math.floor(Math.random() * 9000),
        method: methods[i % methods.length]!,
        status: txStatus[i % txStatus.length]!,
        processedAt: new Date(Date.now() - i * 3_600_000),
      },
    });
  }

  // --- Invoices (5) ---
  const invSeed = [
    { client: 'Helios Fleet Co.', station: stations[0]!, status: InvoiceStatus.PAID },
    { client: 'Tokyo Mobility KK', station: stations[1]!, status: InvoiceStatus.PROCESSING },
    { client: 'NY Logistics LLC', station: stations[2]!, status: InvoiceStatus.OVERDUE },
    { client: 'Aurora Charge GmbH', station: stations[0]!, status: InvoiceStatus.PAID },
    { client: 'Pacific Vans Co.', station: stations[1]!, status: InvoiceStatus.PROCESSING },
  ];
  for (const seed of invSeed) {
    const lineItems = [
      { label: 'kWh Consumption', description: `Node: ${seed.station.code}`, totalCents: 18_200 },
      { label: 'Parking Hours', description: 'Standard rate', totalCents: 4_500 },
      { label: 'Network Fees', description: 'Platform usage', totalCents: 1_200 },
    ];
    const subtotal = lineItems.reduce((a, l) => a + l.totalCents, 0);
    const tax = Math.round(subtotal * 0.07);
    await prisma.invoice.create({
      data: {
        code: code('INV', 6),
        clientName: seed.client,
        stationId: seed.station.id,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 86_400_000),
        status: seed.status,
        billTo: { name: seed.client, address: ['Fleet Procurement', '123 Energy Way', 'Innovation District'] },
        subtotalCents: subtotal,
        taxCents: tax,
        grandTotalCents: subtotal + tax,
        currency: 'USD',
        lineItems: { create: lineItems.map((li, idx) => ({ ...li, sortOrder: idx })) },
      },
    });
  }

  // --- Audit logs (20) ---
  for (let i = 0; i < 20; i++) {
    await prisma.auditLog.create({
      data: {
        component: ['Auth', 'Slots', 'Invoices', 'Settings'][i % 4]!,
        userId: [admin.id, sup1.id, sup2.id, null][i % 4] ?? null,
        action: ['login.success', 'assignment.created', 'invoice.created', 'settings.updated'][i % 4]!,
        details: { seedIndex: i, traceId: createId() } as object,
        status: [LogStatus.SUCCESS, LogStatus.SUCCESS, LogStatus.SUCCESS, LogStatus.FLAGGED][i % 4]!,
        timestamp: new Date(Date.now() - i * 600_000),
      },
    });
  }

  // --- Settings ---
  await prisma.systemSettings.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      features: { loadBalancing: true, telemetry: true, thermalMonitoring: true },
      localization: { currency: 'USD', timezone: 'UTC', measurement: 'METRIC' },
      authentication: { apiGateway: true, networkSecret: 'INITIAL-SEED-SECRET-CHANGE-ME' },
      hardware: { cpuLoadThreshold: 80, storage: 84 },
      updatedById: admin.id,
    },
    update: {},
  });

  // --- Notifications ---
  for (let i = 0; i < 5; i++) {
    await prisma.notification.create({
      data: {
        userId: i % 2 === 0 ? null : sup1.id,
        kind: [NotificationKind.INFO, NotificationKind.WARNING, NotificationKind.CRITICAL][i % 3]!,
        title: ['System update available', 'Thermal anomaly', 'Critical alert', 'New supervisor invited', 'Routine maintenance'][i]!,
        body: 'Generated by seed.',
      },
    });
  }

  // --- Metrics snapshot ---
  await prisma.systemMetricsSnapshot.create({
    data: {
      healthScore: 99.4,
      latencyMs: 42,
      uptimePct: 99.97,
      activeNodes: stations.length,
      criticalErrors: 0,
      dailyActions: 200,
    },
  });

  // eslint-disable-next-line no-console
  console.log(`✅ Seed complete.
  Admin: ${adminEmail} / ${adminPwd}
  Supervisors: elena@parking-iot.local, kenji@parking-iot.local / Super123!
  Invited supervisor: ${supInvited.email} (no password yet)`);
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
