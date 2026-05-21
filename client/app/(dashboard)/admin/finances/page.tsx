"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  BadgeDollarSign,
  Clock3,
  Download,
  Hourglass,
  Loader2,
  ReceiptText,
  RefreshCw,
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

type RangeKey = "7D" | "30D" | "1Y";
const RANGES: { key: RangeKey; granularity: "day" | "week" | "month"; daysBack: number }[] = [
  { key: "7D", granularity: "day", daysBack: 7 },
  { key: "30D", granularity: "day", daysBack: 30 },
  { key: "1Y", granularity: "month", daysBack: 365 },
];

const PAYMENT_LABEL: Record<string, string> = {
  CORPORATE_FLEET_CARD: "Corporate Fleet Card",
  DIRECT_PAY: "Direct Pay",
  MOBILE_APP_WALLET: "Mobile App Wallet",
  RFID_PASS: "RFID Pass",
  APPLE_PAY: "Apple Pay",
};

const STATUS_LABEL: Record<TransactionRow["status"], string> = {
  COMPLETED: "Completed",
  PENDING: "Pending",
  FAILED: "Failed",
};

function StatusDot({ status }: { status: TransactionRow["status"] }) {
  const label = STATUS_LABEL[status];
  const color =
    status === "COMPLETED"
      ? "bg-emerald-500 dark:bg-primary"
      : status === "FAILED"
        ? "bg-destructive"
        : "bg-amber-500";

  return (
    <span className="flex items-center gap-2">
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} aria-hidden />
      <span
        className={
          status === "PENDING"
            ? "font-medium text-muted-foreground"
            : "font-medium text-foreground"
        }
      >
        {label}
      </span>
    </span>
  );
}

function buildRevenuePath(points: RevenuePoint[]): { line: string; fill: string; circles: { x: number; y: number }[] } {
  if (points.length === 0) return { line: "", fill: "", circles: [] };
  const width = 720;
  const height = 220;
  const max = Math.max(...points.map((p) => p.revenueCents), 1);
  const stepX = points.length > 1 ? width / (points.length - 1) : 0;
  const coords = points.map((p, i) => ({
    x: i * stepX,
    y: 20 + (1 - p.revenueCents / max) * (height - 40),
  }));

  let line = `M ${coords[0]!.x} ${coords[0]!.y}`;
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1]!;
    const curr = coords[i]!;
    const cpX = (prev.x + curr.x) / 2;
    line += ` C ${cpX} ${prev.y} ${cpX} ${curr.y} ${curr.x} ${curr.y}`;
  }
  const fill = `${line} L ${coords[coords.length - 1]!.x} 250 L 0 250 Z`;

  return { line, fill, circles: coords };
}

function formatTickLabel(iso: string, granularity: "day" | "week" | "month"): string {
  const d = new Date(iso);
  if (granularity === "month") {
    return d.toLocaleDateString(undefined, { month: "short", year: "2-digit" }).toUpperCase();
  }
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short" }).toUpperCase();
}

export default function AdminFinancesPage() {
  const [kpis, setKpis] = useState<FinanceKpis | null>(null);
  const [revenue, setRevenue] = useState<RevenuePoint[]>([]);
  const [volume, setVolume] = useState<DailyVolumePoint[]>([]);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [meta, setMeta] = useState<{ total: number; limit: number; page: number } | null>(null);
  const [page, setPage] = useState(1);
  const [rangeKey, setRangeKey] = useState<RangeKey>("30D");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (showSpinner: boolean) => {
      if (showSpinner) setIsLoading(true);
      else setIsRefreshing(true);
      setError(null);
      const range = RANGES.find((r) => r.key === rangeKey)!;
      const to = new Date();
      const from = new Date(to.getTime() - range.daysBack * 86_400_000);
      try {
        const [k, r, v, tx] = await Promise.all([
          api.get<FinanceKpis>("/finances/kpis"),
          api.get<RevenuePoint[]>(
            `/finances/revenue-timeseries?granularity=${range.granularity}&from=${from.toISOString()}&to=${to.toISOString()}`,
          ),
          api.get<DailyVolumePoint[]>("/finances/daily-volume"),
          api.get<Paginated<TransactionRow>>(`/transactions?page=${page}&limit=5`, { unwrap: false }),
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
    [rangeKey, page],
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

  const range = RANGES.find((r) => r.key === rangeKey)!;
  const { line: revLine, fill: revFill, circles: revCircles } = buildRevenuePath(revenue);
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1;
  const maxVolume = Math.max(...volume.map((v) => v.count), 1);
  const xTicks = revenue.length > 0
    ? [0, Math.floor(revenue.length / 4), Math.floor(revenue.length / 2), Math.floor((revenue.length * 3) / 4), revenue.length - 1]
    : [];

  const metricCards = kpis
    ? [
        {
          label: "Total revenue",
          value: formatMoney(kpis.totalRevenueCents, kpis.currency),
          delta: `${kpis.totalRevenueDeltaPct >= 0 ? "+" : ""}${kpis.totalRevenueDeltaPct.toFixed(1)}%`,
          note: "vs last month",
          icon: TrendingUp,
        },
        {
          label: "Avg transaction value",
          value: formatMoney(kpis.avgTransactionCents, kpis.currency),
          delta: `${kpis.avgTransactionDeltaPct >= 0 ? "+" : ""}${kpis.avgTransactionDeltaPct.toFixed(1)}%`,
          note: "vs last month",
          icon: ReceiptText,
        },
        {
          label: "Pending payouts",
          value: formatMoney(kpis.pendingPayoutsCents, kpis.currency),
          delta: "Processing",
          note: `${transactions.filter((t) => t.status === "PENDING").length} on this page`,
          icon: Hourglass,
        },
      ]
    : [];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            VoltCore finance
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Revenue Operations
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void load(false)}
            disabled={isRefreshing}
            aria-label="Refresh"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => void exportCsv()}
            disabled={exporting}
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-foreground transition-colors hover:bg-muted/30 disabled:opacity-60"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" strokeWidth={2} />}
            Export CSV
          </button>
        </div>
      </header>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        {metricCards.map(({ label, value, delta, note, icon: Icon }) => (
          <article
            key={label}
            className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                {label}
              </p>
              <Icon
                className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
                strokeWidth={2}
                aria-hidden
              />
            </div>
            <p className="mt-5 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {value}
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-foreground" aria-hidden />
              {delta}
              <span className="font-medium text-muted-foreground">{note}</span>
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,0.95fr)]">
        <article className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">Revenue Performance</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Visualizing global transaction flow across the network.
              </p>
            </div>
            <div className="inline-flex w-fit rounded-lg border border-border bg-background p-1">
              {RANGES.map(({ key }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRangeKey(key)}
                  className={`rounded-md px-3 py-1.5 text-[10px] font-bold transition-colors ${
                    key === rangeKey
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 h-[260px] rounded-lg bg-muted/10 p-3">
            {revenue.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No revenue in selected range.
              </div>
            ) : (
              <svg
                className="h-full w-full overflow-visible"
                viewBox="0 0 720 250"
                role="img"
                aria-label="Revenue line chart"
              >
                <defs>
                  <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="currentColor" stopOpacity="0.16" />
                    <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[50, 100, 150, 200].map((y) => (
                  <line key={y} x1="0" x2="720" y1={y} y2={y} className="stroke-border/70" strokeDasharray="4 10" />
                ))}
                <path d={revLine} fill="none" className="stroke-foreground" strokeLinecap="round" strokeWidth="3" />
                <path d={revFill} className="fill-foreground" opacity="0.06" />
                {revCircles.length > 0 && (
                  <circle cx={revCircles[revCircles.length - 1]!.x} cy={revCircles[revCircles.length - 1]!.y} r="4" className="fill-foreground" />
                )}
                {xTicks.map((i) => {
                  const point = revenue[i];
                  if (!point) return null;
                  const x = revCircles[i]?.x ?? 0;
                  return (
                    <text key={i} x={x} y="238" textAnchor={i === 0 ? "start" : i === revenue.length - 1 ? "end" : "middle"} className="fill-muted-foreground text-[11px] font-bold">
                      {formatTickLabel(point.date, range.granularity)}
                    </text>
                  );
                })}
              </svg>
            )}
          </div>
        </article>

        <article className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">Volumetric Data</h2>
              <p className="mt-1 text-sm text-muted-foreground">Daily transaction counts.</p>
            </div>
            <BadgeDollarSign className="h-5 w-5 text-muted-foreground" aria-hidden />
          </div>

          <div className="mt-8 flex h-[260px] items-end gap-3 rounded-lg bg-muted/10 px-3 pb-4 pt-5">
            {volume.map((bar) => {
              const pct = (bar.count / maxVolume) * 100;
              return (
                <div key={bar.day} className="flex min-w-0 flex-1 flex-col items-center gap-3">
                  <div className="flex h-44 w-full items-end">
                    <div
                      className="w-full rounded-t-sm bg-foreground/15 transition-colors dark:bg-primary/20"
                      style={{ height: `${pct}%` }}
                      title={`${bar.count} transactions`}
                    />
                  </div>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">{bar.day}</span>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border/80 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">Recent Transactions</h2>
            <p className="mt-1 text-sm text-muted-foreground">Real-time ledger of network activity.</p>
          </div>
          <button
            type="button"
            onClick={() => void exportCsv()}
            disabled={exporting}
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-foreground transition-colors hover:bg-muted/30 disabled:opacity-60"
          >
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Export CSV
          </button>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-border/80 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                <th className="px-6 py-4 font-bold">Transaction ID</th>
                <th className="px-4 py-4 font-bold">Station Location</th>
                <th className="px-4 py-4 font-bold">Status</th>
                <th className="px-4 py-4 font-bold">Method</th>
                <th className="px-6 py-4 text-right font-bold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="transition-colors hover:bg-muted/10">
                    <td className="px-6 py-5 font-mono text-xs font-medium text-muted-foreground">{t.code}</td>
                    <td className="px-4 py-5 font-medium text-foreground">{t.station}</td>
                    <td className="px-4 py-5 text-xs">
                      <StatusDot status={t.status} />
                    </td>
                    <td className="px-4 py-5 text-muted-foreground">
                      {PAYMENT_LABEL[t.method] ?? t.method}
                    </td>
                    <td className="px-6 py-5 text-right font-bold text-foreground">
                      {formatMoney(t.amount, t.currency)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <footer className="flex flex-col gap-3 border-t border-border/80 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            <Clock3 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            {meta ? `Showing ${transactions.length} of ${meta.total.toLocaleString()} items` : "—"}
          </p>
          <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="transition-colors hover:text-foreground disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="transition-colors hover:text-foreground disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
