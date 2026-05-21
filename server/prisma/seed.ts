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
  WalletTxKind,
  CardBrand,
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
  await prisma.walletTransaction.deleteMany({});
  await prisma.wallet.deleteMany({});
  await prisma.userPaymentMethod.deleteMany({});
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

  // --- End customer (USER role) ---
  const customer = await prisma.user.create({
    data: {
      email: 'liam@parking-iot.local',
      passwordHash: await bcrypt.hash('User123!', 12),
      firstName: 'Liam',
      lastName: 'Vance',
      role: Role.USER,
      roleLevel: 1,
      status: UserStatus.ACTIVE,
      region: 'North America',
      uid: 'USR-LV-401',
      mustCompleteProfile: false,
      lastLoginAt: new Date(),
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
  const customerVehicle = await prisma.vehicle.create({
    data: {
      plateNumber: 'LV-PLAID-8921',
      driverName: 'Liam Vance',
      carType: CarType.EV,
      model: 'Model S Plaid',
      ownerId: customer.id,
    },
  });
  const vehicles = await Promise.all([
    prisma.vehicle.create({ data: { plateNumber: 'EV-001-AB', driverName: 'Mara Klein', carType: CarType.EV, model: 'BYD Seal' } }),
    prisma.vehicle.create({ data: { plateNumber: 'NY-998-ZX', driverName: 'Aaron Park', carType: CarType.SEDAN, model: 'Tesla Model 3' } }),
    prisma.vehicle.create({ data: { plateNumber: 'TK-CHARGE-1', driverName: 'Hiro Tanaka', carType: CarType.EV, model: 'Nissan Leaf' } }),
    prisma.vehicle.create({ data: { plateNumber: 'EU-FLEET-7', driverName: 'Sofia Garcia', carType: CarType.VAN } }),
    prisma.vehicle.create({ data: { plateNumber: 'US-PICKUP-3', driverName: 'Jamie Lee', carType: CarType.PICKUP } }),
  ]);

  // --- Customer wallet + payment method ---
  const customerWallet = await prisma.wallet.create({
    data: {
      userId: customer.id,
      balanceCents: 45280, // $452.80
      currency: 'ETB',
      autoRefillEnabled: true,
      autoRefillThresholdCents: 5000,
      autoRefillAmountCents: 10000,
    },
  });

  const customerCard = await prisma.userPaymentMethod.create({
    data: {
      userId: customer.id,
      brand: CardBrand.VISA,
      last4: '4429',
      expiryMonth: 12,
      expiryYear: 2028,
      holderName: 'Liam Vance',
      isDefault: true,
    },
  });

  // Top-up history
  await prisma.walletTransaction.create({
    data: {
      walletId: customerWallet.id,
      kind: WalletTxKind.TOPUP,
      amountCents: 10000,
      balanceAfterCents: 45280,
      description: 'Auto top-up · VISA •••• 4429',
      paymentMethodId: customerCard.id,
      createdAt: new Date(Date.now() - 4 * 86_400_000),
    },
  });

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

  // --- Customer's ACTIVE charging session (slot 3 of station 0) ---
  const customerActiveSlot = await prisma.slot.findFirst({
    where: { stationId: stations[2]!.id, slotNumber: 3 },
  });
  if (customerActiveSlot) {
    await prisma.slotAssignment.create({
      data: {
        slotId: customerActiveSlot.id,
        vehicleId: customerVehicle.id,
        status: AssignmentStatus.ACTIVE,
        battery: 75,
        currentSocPct: 75,
        currentPowerKW: 120,
        peakPowerKW: 250,
        estimatedRemainingMin: 12,
        connectorType: 'CCS Combo 2',
        energyDeliveredKWh: 38.4,
        unitCostPerKWhCents: 42,
        energyCostCents: 1422,
        totalCostCents: 1422,
        arrivalTime: new Date(Date.now() - 42 * 60_000 - 15_000),
        notes: "Customer's active session",
      },
    });
  }

  // --- Customer's completed sessions (history) ---
  const historySessions = [
    { stationIdx: 2, displayId: 'A-05', kwh: 64.2, durationMin: 76, costCents: 3630, daysAgo: 6, model: 'Model S Plaid', plateLast4: '8921' },
    { stationIdx: 2, displayId: 'A-07', kwh: 42.5, durationMin: 34, costCents: 1840, daysAgo: 9, model: 'Model S Plaid', plateLast4: '8921' },
    { stationIdx: 0, displayId: 'A-09', kwh: 28.1, durationMin: 28, costCents: 1240, daysAgo: 14, model: 'Model S Plaid', plateLast4: '8921' },
    { stationIdx: 2, displayId: 'A-03', kwh: 51.0, durationMin: 58, costCents: 2945, daysAgo: 20, model: 'Model S Plaid', plateLast4: '8921' },
  ];
  for (const hs of historySessions) {
    const station = stations[hs.stationIdx]!;
    const slot = await prisma.slot.findFirst({ where: { stationId: station.id, displayId: hs.displayId } });
    if (!slot) continue;
    const arrived = new Date(Date.now() - hs.daysAgo * 86_400_000);
    const departed = new Date(arrived.getTime() + hs.durationMin * 60_000);
    const energyCents = Math.round(hs.kwh * 42);
    const facilityCents = 250;
    const idleCents = 0;
    const subtotal = energyCents + facilityCents + idleCents;
    const taxCents = Math.round(subtotal * 0.085);

    await prisma.slotAssignment.create({
      data: {
        slotId: slot.id,
        vehicleId: customerVehicle.id,
        status: AssignmentStatus.COMPLETED,
        battery: 100,
        currentSocPct: 100,
        arrivalTime: arrived,
        departureTime: departed,
        durationSeconds: hs.durationMin * 60,
        connectorType: 'CCS Combo 2',
        peakPowerKW: 250,
        energyDeliveredKWh: hs.kwh,
        unitCostPerKWhCents: 42,
        energyCostCents: energyCents,
        facilityFeeCents: facilityCents,
        idleMinutes: 0,
        idleFeeCents: idleCents,
        taxCents,
        totalCostCents: subtotal + taxCents,
        carbonOffsetGramsCO2e: Math.round(hs.kwh * 400),
        paidAt: departed,
        paymentMethodId: customerCard.id,
      },
    });

    // Wallet debit for each completed session
    await prisma.walletTransaction.create({
      data: {
        walletId: customerWallet.id,
        kind: WalletTxKind.CHARGE,
        amountCents: -(subtotal + taxCents),
        balanceAfterCents: 45280, // not historically accurate; OK for seed
        description: `Charging session · ${station.code} ${hs.displayId}`,
        createdAt: departed,
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
        currency: 'ETB',
        lineItems: { create: lineItems.map((li, idx) => ({ ...li, sortOrder: idx })) },
      },
    });
  }

  // --- Customer-owned invoices (consolidated monthly statements) ---
  const customerInvoices = [
    { status: InvoiceStatus.PAID, daysAgo: 5, totalCents: 12_450_00 },
    { status: InvoiceStatus.PROCESSING, daysAgo: 8, totalCents: 8_210_00 },
    { status: InvoiceStatus.OVERDUE, daysAgo: 23, totalCents: 21_800_00 },
    { status: InvoiceStatus.PAID, daysAgo: 35, totalCents: 5_530_00 },
  ];
  for (let i = 0; i < customerInvoices.length; i++) {
    const ci = customerInvoices[i]!;
    const station = stations[i % stations.length]!;
    const itemEnergy = Math.round(ci.totalCents * 0.78);
    const itemPremium = Math.round(ci.totalCents * 0.15);
    const itemMaint = ci.totalCents - itemEnergy - itemPremium;
    const subtotal = ci.totalCents;
    await prisma.invoice.create({
      data: {
        code: code('INV', 6),
        clientName: 'Liam Vance',
        stationId: station.id,
        ownerId: customer.id,
        issueDate: new Date(Date.now() - ci.daysAgo * 86_400_000),
        dueDate: new Date(Date.now() + (30 - ci.daysAgo) * 86_400_000),
        status: ci.status,
        paidAt: ci.status === InvoiceStatus.PAID ? new Date(Date.now() - (ci.daysAgo - 1) * 86_400_000) : null,
        billTo: { name: 'Liam Vance', address: ['702 Tech Plaza, Ste 400', 'San Francisco, CA 94105'] },
        subtotalCents: subtotal,
        taxCents: 0,
        grandTotalCents: subtotal,
        currency: 'ETB',
        lineItems: {
          create: [
            { label: 'kWh Consumption', description: `Node: ${station.code}`, totalCents: itemEnergy, sortOrder: 0 },
            { label: 'Peak Load Premium', description: 'Network Overload Surcharge', totalCents: itemPremium, sortOrder: 1 },
            { label: 'Maintenance Fee', description: 'Periodic Sensor Calibration', totalCents: itemMaint, sortOrder: 2 },
          ],
        },
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
      localization: { currency: 'ETB', timezone: 'UTC', measurement: 'METRIC' },
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

  // --- IoT simulation station with 10 slots: 1–4 EV (CHARGE_AND_PARK), 5–10 parking ---
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
        kind: n <= 4 ? SlotKind.CHARGE_AND_PARK : SlotKind.PARKING_ONLY,
        isActive: true,
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
  Invited supervisor: ${supInvited.email} (no password yet)
  Customer (USER): ${customer.email} / User123!`);
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
