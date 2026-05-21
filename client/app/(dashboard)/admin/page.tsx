"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  Banknote,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  RotateCw,
  ShieldAlert,
  UserPlus,
  Zap,
} from "lucide-react";
import { api, ApiCallError } from "@/lib/api";
import type {
  AlertRow,
  DashboardStats,
  TransactionRow,
} from "@/lib/api-types";
import { formatMoney, formatRelative } from "@/lib/format";

interface HealthData {
  healthScore: number;
  latencyMs: number;
  uptimePct: number;
  status: string;
}

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

const STATUS_TONE: Record<TransactionRow["status"], { dot: string; text: string }> = {
  COMPLETED: { dot: "bg-foreground", text: "text-foreground" },
  PENDING: { dot: "bg-muted-foreground", text: "text-muted-foreground" },
  FAILED: { dot: "bg-destructive", text: "text-destructive" },
};

function abbreviateMoney(cents: number, currency: string): string {
  const value = cents / 100;
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return formatMoney(Math.round(value / 1000) * 100_000, currency).replace(/[\d.,]+/, (m) => `${(Number(m.replace(/,/g, "")) / 1000).toFixed(1)}k`);
  if (abs >= 1_000) {
    const k = (value / 1000).toFixed(1).replace(/\.0$/, "");
    return `${currency === "ETB" ? "ETB" : `${currency} `}${k}k`;
  }
  return formatMoney(cents, currency);
}

function abbreviateCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return n.toString();
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (showSpinner: boolean) => {
    if (showSpinner) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);
    try {
      const [s, t, h, a] = await Promise.all([
        api.get<DashboardStats>("/dashboard/stats"),
        api.get<TransactionRow[]>("/dashboard/transactions?limit=10"),
        api.get<HealthData>("/dashboard/health"),
        api.get<AlertRow[]>("/dashboard/alerts?limit=5"),
      ]);
      setStats(s);
      setTransactions(t);
      setHealth(h);
      setAlerts(a);
    } catch (err) {
      if (err instanceof ApiCallError) setError(err.message || "Failed to load dashboard");
      else setError("Network error. Is the API server running?");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-96 items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-6 sm:mt-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Real-time view of the parking network.</p>
        </div>
        <button
          type="button"
          onClick={() => void load(false)}
          disabled={isRefreshing}
          aria-label="Refresh dashboard"
          className="rounded-md border border-border/60 bg-background p-2 text-muted-foreground transition hover:bg-muted/40 hover:text-foreground disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          icon={<Activity size={100} />}
          label="Total Stations"
          value={stats ? stats.totalStations.toString() : "—"}
          hint="Network-wide"
        />
        <StatCard
          icon={<Zap size={100} />}
          label="Active Sessions"
          value={stats ? stats.activeSessions.toString() : "—"}
          hint={stats && stats.activeSessions > 0 ? "Live now" : "No active sessions"}
        />
        <StatCard
          icon={<Banknote size={100} />}
          label="Revenue"
          value={
            stats
              ? abbreviateMoney(stats.revenue.totalCents, stats.revenue.currency)
              : "—"
          }
          hint={
            stats
              ? `Daily AVG ${abbreviateMoney(stats.revenue.dailyAvgCents, stats.revenue.currency)}`
              : ""
          }
        />
        <StatCard
          icon={<UserPlus size={100} />}
          label="Active Users"
          value={stats ? abbreviateCount(stats.activeUsers) : "—"}
          hint="Logged in last 30 days"
        />
      </div>

      {/* Main Split Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transactions table */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl flex flex-col p-6 min-w-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">Recent Transactions</h2>
              <p className="text-sm text-muted-foreground">Real-time ledger of network activity.</p>
            </div>
          </div>

          <div className="w-full overflow-x-auto rounded-lg">
            <table className="w-full text-left text-sm whitespace-nowrap min-w-175">
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
                      No recent transactions.
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => {
                    const tone = STATUS_TONE[t.status];
                    return (
                      <tr key={t.id} className="group hover:bg-muted/10 transition-colors">
                        <td className="py-4 font-medium text-muted-foreground">{t.code}</td>
                        <td className="py-4 text-foreground">{t.station}</td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${tone.dot}`}></div>
                            <span className={`${tone.text} font-medium`}>{STATUS_LABEL[t.status]}</span>
                          </div>
                        </td>
                        <td className="py-4 text-muted-foreground">
                          {PAYMENT_LABEL[t.method] ?? t.method}
                        </td>
                        <td className="py-4 text-right font-bold text-foreground">
                          {formatMoney(t.amount, t.currency)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-6">
          <SystemHealthCard health={health} />
          <CriticalAlertsCard alerts={alerts} />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="p-6 bg-card border border-border rounded-xl relative overflow-hidden group">
      <div className="absolute right-0 -bottom-4 opacity-[0.03] text-foreground group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h2 className="text-xs font-semibold text-muted-foreground tracking-[0.15em] mb-4 uppercase">
        {label}
      </h2>
      <div className="text-3xl font-bold text-foreground">{value}</div>
      {hint && <p className="text-sm text-muted-foreground mt-2 font-medium">{hint}</p>}
    </div>
  );
}

function SystemHealthCard({ health }: { health: HealthData | null }) {
  const score = health?.healthScore ?? 0;
  const label = score >= 95 ? "Optimal" : score >= 85 ? "Stable" : score >= 70 ? "Degraded" : "Critical";

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold tracking-widest text-muted-foreground uppercase">System Health</h3>
        <button className="text-muted-foreground hover:text-foreground" aria-label="More">
          <MoreHorizontal size={20} />
        </button>
      </div>

      <div className="relative flex justify-center py-6">
        <div className="relative w-48 h-48">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {[...Array(8)].map((_, i) => (
              <circle
                key={i}
                cx="50"
                cy="50"
                r="42"
                fill="none"
                className={i % 2 === 0 ? "stroke-primary" : "stroke-muted-foreground/50"}
                strokeWidth="8"
                strokeDasharray="28 235.89"
                transform={`rotate(${i * 45} 50 50)`}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center mt-1">
            <div className="text-4xl font-black text-foreground tracking-tighter">{score.toFixed(1)}%</div>
            <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mt-1">
              {label}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-2 text-left">
        <div className="border border-border/50 rounded-xl p-4 bg-muted/10">
          <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-1">Latency</div>
          <div className="text-2xl font-bold text-foreground">{health ? `${health.latencyMs}ms` : "—"}</div>
        </div>
        <div className="border border-border/50 rounded-xl p-4 bg-muted/10">
          <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-1">Uptime</div>
          <div className="text-2xl font-bold text-foreground">
            {health ? `${health.uptimePct.toFixed(2)}%` : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

function CriticalAlertsCard({ alerts }: { alerts: AlertRow[] }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 flex flex-col min-h-87.5">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold tracking-widest text-muted-foreground uppercase">Critical Alerts</h3>
        <button className="text-muted-foreground hover:text-foreground" aria-label="View all">
          <ShieldAlert size={16} />
        </button>
      </div>

      {alerts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No critical alerts.</p>
      ) : (
        <div className="space-y-4 flex-1">
          {alerts.map((a) => {
            const icon = alertIcon(a.component);
            return (
              <div key={a.id} className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-foreground text-background flex items-center justify-center shrink-0">
                  {icon}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{a.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {a.component} · {formatRelative(a.timestamp)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function alertIcon(component: string): React.ReactNode {
  switch (component) {
    case "Auth":
      return <AlertCircle size={20} />;
    case "Slots":
      return <Zap size={20} />;
    case "Settings":
      return <RotateCw size={20} />;
    default:
      return <ShieldAlert size={20} />;
  }
}
