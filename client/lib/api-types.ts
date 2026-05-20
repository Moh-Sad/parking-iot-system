import type { Role, StoredUser } from "./auth-storage";

export interface ApiEnvelope<T> {
  data: T;
}

export interface ApiError {
  error: { code: string; message: string; details?: unknown };
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  unreadCount?: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

// --- Auth ---
export interface LoginResponse {
  token: string;
  refreshToken: string;
  role: Role;
  mustCompleteProfile: boolean;
  user: StoredUser;
}

export interface RefreshResponse {
  token: string;
  refreshToken: string;
}

// --- Domain ---
export interface SlotView {
  id: string;
  slotNumber: number;
  displayId: string;
  kind: "CHARGE_AND_PARK" | "PARKING_ONLY";
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

export interface SlotsListResponse {
  data: SlotView[];
  stats: SlotStats;
}

export interface InvoiceSummary {
  id: string;
  code: string;
  client: string;
  node: string;
  date: string;
  amount: number;
  currency: string;
  status: "PAID" | "PROCESSING" | "OVERDUE";
}

export interface InvoiceLineItem {
  id: string;
  label: string;
  description: string;
  totalCents: number;
}

export interface InvoiceDetail {
  id: string;
  code: string;
  clientName: string;
  station: { id: string; name: string; code: string; region: string };
  issueDate: string;
  dueDate: string;
  status: InvoiceSummary["status"];
  billTo: { name: string; address: string[] };
  lineItems: InvoiceLineItem[];
  subtotalCents: number;
  taxCents: number;
  grandTotalCents: number;
  currency: string;
}

export interface UserRow {
  id: string;
  name: string;
  uid: string;
  role: Role;
  status: "ACTIVE" | "SUSPENDED" | "INVITED";
  region: string | null;
  lastLogin: string | null;
  initials: string;
  email: string;
}

// --- USER role: wallet, sessions, finances ---
export interface WalletDto {
  id: string;
  balanceCents: number;
  currency: string;
  autoRefillEnabled: boolean;
  autoRefillThresholdCents: number;
  autoRefillAmountCents: number;
  monthlySpendCents: number;
  lastTopUp: { amountCents: number; createdAt: string } | null;
}

export interface UserPaymentMethodDto {
  id: string;
  brand: "VISA" | "MASTERCARD" | "AMEX" | "DISCOVER" | "OTHER";
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  holderName: string | null;
  isDefault: boolean;
}

export interface ActiveSessionDto {
  id: string;
  stationCode: string;
  stationName: string;
  locationLabel: string;
  startTime: string;
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

export interface ChargingHistoryItem {
  id: string;
  stationCode: string;
  stationName: string;
  locationLabel: string;
  date: string;
  energyKWh: number | null;
  durationSeconds: number | null;
  totalCostCents: number | null;
  currency: string;
}

export interface UserFinancesSummary {
  totalSpentYearToDateCents: number;
  pendingBalanceCents: number;
  unpaidInvoiceCount: number;
  availableCreditsCents: number;
  currency: string;
}

export interface UserInvoiceRow {
  id: string;
  code: string;
  client: string;
  node: string;
  date: string;
  amount: number;
  currency: string;
  status: InvoiceSummary["status"];
}

export interface ReceiptDto {
  sessionId: string;
  receiptCode: string;
  date: string;
  endTime: string | null;
  vehicleModel: string;
  vehiclePlateLast4: string;
  station: { id: string; code: string; name: string; address: string | null; region: string };
  connectorType: string;
  peakPowerKW: number | null;
  energyDeliveredKWh: number | null;
  durationMinutes: number | null;
  unitCostPerKWhCents: number | null;
  energyCostCents: number;
  facilityFeeCents: number;
  idleMinutes: number;
  idleFeeCents: number;
  taxCents: number;
  totalCostCents: number;
  currency: string;
  paymentMethod: { brand: string; last4: string } | null;
  carbonOffsetGramsCO2e: number | null;
}

// --- Admin finances aggregations ---
export interface FinanceKpis {
  totalRevenueCents: number;
  totalRevenueDeltaPct: number;
  avgTransactionCents: number;
  avgTransactionDeltaPct: number;
  pendingPayoutsCents: number;
  pendingPayoutsDeltaPct: number;
  currency: string;
}

export interface RevenuePoint {
  date: string;
  revenueCents: number;
}

export interface DailyVolumePoint {
  day: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
  count: number;
}

export interface AuditLogRow {
  id: string;
  timestamp: string;
  component: string;
  user: { id: string; name: string } | null;
  action: string;
  details: unknown;
  status: "SUCCESS" | "IN_PROGRESS" | "FLAGGED";
}

export interface LogsMetrics {
  criticalErrors: number;
  dailyActions: number;
  networkUptime: number;
  activeNodes: number;
}

export interface DashboardStats {
  totalStations: number;
  activeSessions: number;
  revenue: { totalCents: number; currency: string; dailyAvgCents: number; deltaPct: number };
  activeUsers: number;
  deltas: { stationsPct: number; sessionsPct: number; revenuePct: number; usersPct: number };
}

export interface TransactionRow {
  id: string;
  code: string;
  station: string;
  status: "COMPLETED" | "PENDING" | "FAILED";
  method: string;
  amount: number;
  currency: string;
  processedAt: string;
}

export interface AlertRow {
  id: string;
  title: string;
  component: string;
  timestamp: string;
  details: unknown;
}

export interface NotificationItem {
  id: string;
  userId: string | null;
  kind: "INFO" | "WARNING" | "CRITICAL";
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}
