"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { api, ApiCallError } from "@/lib/api";
import type {
  DailyVolumePoint,
  FinanceKpis,
  Paginated,
  RevenuePoint,
  TransactionRow,
} from "@/lib/api-types";
import { formatMoney } from "@/lib/format";

type Granularity = "day" | "week" | "month";
const RANGE_PRESET: { label: string; granularity: Granularity; daysBack: number }[] = [
  { label: "5D", granularity: "day", daysBack: 5 },
  { label: "30D", granularity: "day", daysBack: 30 },
  { label: "1Y", granularity: "month", daysBack: 365 },
];

const PAYMENT_LABEL: Record<string, string> = {
  CORPORATE_FLEET_CARD: "Corporate Fleet Card",
  DIRECT_PAY: "Direct Pay",
  MOBILE_APP_WALLET: "Mobile App Wallet",
  RFID_PASS: "RFID Pass",
  APPLE_PAY: "Apple Pay",
};

function StatusBadge({ status }: { status: TransactionRow["status"] }) {
  const map = {
    COMPLETED: { dot: "bg-foreground", text: "text-foreground", label: "Completed" },
    PENDING: { dot: "bg-muted-foreground", text: "text-muted-foreground", label: "Pending" },
    FAILED: { dot: "bg-destructive", text: "text-destructive", label: "Failed" },
  };
  const t = map[status];
  return (
    <div className="flex items-center gap-2">
      <div className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />
      <span className={`${t.text} font-medium`}>{t.label}</span>
    </div>
  );
}

function RevenueChart({ points }: { points: RevenuePoint[] }) {
  if (points.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">No revenue in selected range.</p>;
  }
  const maxY = Math.max(...points.map((p) => p.revenueCents), 1);
  const stepX = points.length > 1 ? 480 / (points.length - 1) : 0;
  const pts = points.map((p, i) => ({ x: i * stepX, y: 90 - (p.revenueCents / maxY) * 80 }));

  const smoothD = pts.reduce((d, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = pts[i - 1]!;
    const cpX = (prev.x + p.x) / 2;
    return `${d} C ${cpX} ${prev.y} ${cpX} ${p.y} ${p.x} ${p.y}`;
  }, "");
  const fillD = `${smoothD} L ${pts[pts.length - 1]!.x} 100 L 0 100 Z`;

  return (
    <svg viewBox="0 0 480 110" className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="rev-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.20" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[20, 40, 60, 80].map((y) => (
        <line key={y} x1="0" y1={y} x2="480" y2={y} stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />
      ))}
      <path d={fillD} fill="url(#rev-fill)" className="text-foreground" />
      <path d={smoothD} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-foreground" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="currentColor" className="text-foreground" />
      ))}
    </svg>
  );
}

function VolumetricChart({ points }: { points: DailyVolumePoint[] }) {
  const maxH = Math.max(...points.map((p) => p.count), 1);
  return (
    <svg viewBox="0 0 220 90" className="w-full" preserveAspectRatio="xMidYMax meet">
      {points.map((p, i) => {
        const barH = (p.count / maxH) * 72;
        const x = i * 32 + 4;
        const isMax = p.count === maxH && p.count > 0;
        return (
          <g key={p.day}>
            <rect
              x={x} y={78 - barH} width="20" height={barH} rx="4"
              fill="currentColor" fillOpacity={isMax ? "1" : "0.25"} className="text-foreground"
            />
            <text x={x + 10} y="88" textAnchor="middle" fontSize="6" fill="currentColor" fillOpacity="0.4" fontWeight="600" letterSpacing="0.5">
              {p.day}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function DeltaLabel({ deltaPct, suffix }: { deltaPct: number; suffix: string }) {
  const positive = deltaPct >= 0;
  return (
    <p className="text-sm text-muted-foreground mt-2 font-medium flex items-center gap-1">
      {positive ? <TrendingUp size={13} className="text-foreground" /> : <TrendingDown size={13} className="text-muted-foreground" />}
      {positive ? "+" : ""}{deltaPct.toFixed(1)}% {suffix}
    </p>
  );
}

export default function AdminFinancesPage() {
  const [kpis, setKpis] = useState<FinanceKpis | null>(null);
  const [revenue, setRevenue] = useState<RevenuePoint[]>([]);
  const [volume, setVolume] = useState<DailyVolumePoint[]>([]);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [meta, setMeta] = useState<{ page: number; total: number; limit: number } | null>(null);
  const [page, setPage] = useState(1);
  const [rangeIdx, setRangeIdx] = useState(1); // 30D default
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (showSpinner: boolean) => {
      if (showSpinner) setIsLoading(true);
      else setIsRefreshing(true);
      setError(null);
      const range = RANGE_PRESET[rangeIdx]!;
      const to = new Date();
      const from = new Date(to.getTime() - range.daysBack * 86_400_000);
      try {
        const [k, r, v, tx] = await Promise.all([
          api.get<FinanceKpis>("/finances/kpis"),
          api.get<RevenuePoint[]>(
            `/finances/revenue-timeseries?granularity=${range.granularity}&from=${from.toISOString()}&to=${to.toISOString()}`,
          ),
          api.get<DailyVolumePoint[]>("/finances/daily-volume"),
          api.get<Paginated<TransactionRow>>(`/transactions?page=${page}&limit=7`, { unwrap: false }),
        ]);
        setKpis(k);
        setRevenue(r);
        setVolume(v);
        setTransactions(tx.data);
        setMeta({ page: tx.meta.page, total: tx.meta.total, limit: tx.meta.limit });
      } catch (err) {
        if (err instanceof ApiCallError) setError(err.message || "Failed to load finances");
        else setError("Network error. Is the API server running?");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [rangeIdx, page],
  );

  useEffect(() => {
    void load(true);
  }, [load]);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await api.raw("/invoices/export.csv");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "finances.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-96 items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1;

  return (
    <div className="mt-2 flex flex-col gap-6 sm:mt-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Finances</h1>
          <p className="text-sm text-muted-foreground">Network-wide revenue and transaction activity.</p>
        </div>
        <button
          type="button"
          onClick={() => void load(false)}
          disabled={isRefreshing}
          className="rounded-md border border-border p-2 text-muted-foreground transition hover:bg-muted/40 hover:text-foreground disabled:opacity-50"
          aria-label="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-card border border-border rounded-xl relative overflow-hidden group">
          <div className="absolute right-0 -bottom-4 opacity-[0.03] text-foreground group-hover:scale-110 transition-transform">
            <DollarSign size={100} />
          </div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-muted-foreground tracking-[0.15em] uppercase">Total Revenue</h2>
            <ArrowUpRight size={14} className="text-muted-foreground" />
          </div>
          <div className="text-3xl font-bold text-foreground">
            {kpis ? formatMoney(kpis.totalRevenueCents, kpis.currency) : "—"}
          </div>
          {kpis && <DeltaLabel deltaPct={kpis.totalRevenueDeltaPct} suffix="vs last month" />}
        </div>

        <div className="p-6 bg-card border border-border rounded-xl relative overflow-hidden group">
          <div className="absolute right-0 -bottom-4 opacity-[0.03] text-foreground group-hover:scale-110 transition-transform">
            <CreditCard size={100} />
          </div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-muted-foreground tracking-[0.15em] uppercase">Avg Transaction</h2>
            <ArrowUpRight size={14} className="text-muted-foreground" />
          </div>
          <div className="text-3xl font-bold text-foreground">
            {kpis ? formatMoney(kpis.avgTransactionCents, kpis.currency) : "—"}
          </div>
          {kpis && <DeltaLabel deltaPct={kpis.avgTransactionDeltaPct} suffix="vs last month" />}
        </div>

        <div className="p-6 bg-card border border-border rounded-xl relative overflow-hidden group">
          <div className="absolute right-0 -bottom-4 opacity-[0.03] text-foreground group-hover:scale-110 transition-transform">
            <Clock size={100} />
          </div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-muted-foreground tracking-[0.15em] uppercase">Pending Payouts</h2>
            <div className="text-xs font-semibold text-muted-foreground border border-border rounded-full px-2 py-0.5">
              Processing
            </div>
          </div>
          <div className="text-3xl font-bold text-foreground">
            {kpis ? formatMoney(kpis.pendingPayoutsCents, kpis.currency) : "—"}
          </div>
          {kpis && <DeltaLabel deltaPct={kpis.pendingPayoutsDeltaPct} suffix="vs last month" />}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">Revenue Performance</h2>
              <p className="text-sm text-muted-foreground">Tracking transaction flow across the network.</p>
            </div>
            <div className="flex gap-1 shrink-0">
              {RANGE_PRESET.map((r, i) => (
                <button
                  key={r.label}
                  onClick={() => setRangeIdx(i)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg border transition-colors ${
                    i === rangeIdx
                      ? "bg-foreground text-background border-foreground"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div className="w-full h-32">
            <RevenueChart points={revenue} />
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">Volumetric Data</h2>
              <p className="text-sm text-muted-foreground">Daily transaction counts (last 7 days).</p>
            </div>
            <button className="text-muted-foreground hover:text-foreground" aria-label="More">
              <MoreHorizontal size={20} />
            </button>
          </div>
          <div className="mt-4">
            <VolumetricChart points={volume} />
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">Recent Transactions</h2>
            <p className="text-sm text-muted-foreground">Real-time ledger of network activity.</p>
          </div>
          <button
            type="button"
            onClick={() => void exportCsv()}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-secondary text-foreground transition-colors shrink-0 disabled:opacity-60"
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Export CSV
          </button>
        </div>

        <div className="w-full overflow-x-auto rounded-lg">
          <table className="w-full text-left text-sm whitespace-nowrap min-w-[600px]">
            <thead>
              <tr className="border-b border-border/50 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                <th className="pb-4 font-bold">Transaction ID</th>
                <th className="pb-4 font-bold">Station Location</th>
                <th className="pb-4 font-bold">Status</th>
                <th className="pb-4 font-bold">Method</th>
                <th className="pb-4 text-right font-bold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="group hover:bg-muted/10 transition-colors">
                    <td className="py-4 font-medium text-muted-foreground">{t.code}</td>
                    <td className="py-4 text-foreground">{t.station}</td>
                    <td className="py-4">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="py-4 text-muted-foreground">{PAYMENT_LABEL[t.method] ?? t.method}</td>
                    <td className="py-4 text-right font-bold text-foreground">
                      {formatMoney(t.amount, t.currency)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground font-medium">
          <span>{meta ? `Showing ${transactions.length} of ${meta.total.toLocaleString()} items` : "—"}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border border-border rounded-lg hover:bg-secondary hover:text-foreground transition-colors disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 border border-border rounded-lg hover:bg-secondary hover:text-foreground transition-colors disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
