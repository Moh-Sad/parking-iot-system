"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowUpRight,
  ChevronRight,
  Loader2,
  MapPin,
  RefreshCw,
  StopCircle,
} from "lucide-react";
import { api, ApiCallError } from "@/lib/api";
import type {
  ActiveSessionDto,
  ChargingHistoryItem,
  Paginated,
  WalletDto,
} from "@/lib/api-types";
import { formatMoney } from "@/lib/format";
import { TopUpDialog } from "@/components/TopUpDialog";

function ChargeRing({ percent }: { percent: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const safePercent = Math.max(0, Math.min(100, percent));
  const filled = (safePercent / 100) * circ;
  return (
    <svg viewBox="0 0 128 128" className="w-full h-full" aria-hidden>
      <circle cx="64" cy="64" r={r} fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="10" className="text-foreground" />
      <circle
        cx="64" cy="64" r={r} fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round"
        strokeDasharray={`${filled} ${circ - filled}`} strokeDashoffset={circ * 0.25} className="text-foreground"
      />
      <text x="64" y="60" textAnchor="middle" dominantBaseline="middle" fontSize="22" fontWeight="700" fill="currentColor" className="text-foreground">
        {safePercent}%
      </text>
      <text x="64" y="78" textAnchor="middle" dominantBaseline="middle" fontSize="8" fontWeight="600" fill="currentColor" fillOpacity="0.45" letterSpacing="1" className="text-foreground">
        SOC
      </text>
    </svg>
  );
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}hr ${m}m`;
  return `${m}m`;
}

export default function UserDashboardPage() {
  const [wallet, setWallet] = useState<WalletDto | null>(null);
  const [session, setSession] = useState<ActiveSessionDto | null>(null);
  const [history, setHistory] = useState<ChargingHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (showSpinner: boolean) => {
    if (showSpinner) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);
    try {
      const [w, s, h] = await Promise.all([
        api.get<WalletDto>("/me/wallet"),
        api.get<ActiveSessionDto | null>("/me/sessions/active"),
        api.get<Paginated<ChargingHistoryItem>>("/me/sessions/history?limit=5", { unwrap: false }),
      ]);
      setWallet(w);
      setSession(s);
      setHistory(h.data);
    } catch (err) {
      if (err instanceof ApiCallError) setError(err.message || "Failed to load dashboard");
      else setError("Network error. Is the API server running?");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load(true);
  }, [load]);

  // Live ticker for elapsed time when a session is active
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!session) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [session]);

  const elapsedSeconds = session
    ? Math.max(0, Math.floor((now - new Date(session.startTime).getTime()) / 1000))
    : 0;

  const stopSession = async () => {
    if (!session || !confirm("End this charging session?")) return;
    setStopping(true);
    try {
      await api.post("/me/sessions/active/stop");
      await load(false);
    } catch (err) {
      if (err instanceof ApiCallError) setError(err.message);
    } finally {
      setStopping(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-96 items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-6 sm:mt-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Driver Portal</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {session ? "Charging session in progress" : "Ready to charge"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load(false)}
          disabled={isRefreshing}
          aria-label="Refresh"
          className="rounded-md border border-border p-2 text-muted-foreground transition hover:bg-muted/40 hover:text-foreground disabled:opacity-50"
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 flex flex-col gap-6">
          {session ? (
            <>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground tracking-[0.18em] uppercase mb-1">
                    Active Session
                  </p>
                  <h2 className="text-2xl font-bold text-foreground">{session.stationCode}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
                    <MapPin size={12} className="shrink-0" />
                    {session.locationLabel}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-muted-foreground tracking-[0.18em] uppercase mb-1">
                    Current Cost
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {formatMoney(session.currentCostCents, session.currency)}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-8">
                <div className="w-32 h-32 shrink-0">
                  <ChargeRing percent={session.stateOfChargePct ?? 0} />
                </div>

                <div className="grid grid-cols-2 gap-x-10 gap-y-4 w-full">
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground tracking-[0.15em] uppercase mb-1">
                      Time Elapsed
                    </p>
                    <p className="text-lg font-bold text-foreground tabular-nums">{formatElapsed(elapsedSeconds)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground tracking-[0.15em] uppercase mb-1">
                      Power Delivery
                    </p>
                    <p className="text-lg font-bold text-foreground">
                      {session.powerDeliveryKW ? `${session.powerDeliveryKW} kW` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground tracking-[0.15em] uppercase mb-1">
                      Remaining
                    </p>
                    <p className="text-lg font-bold text-foreground">
                      {session.estimatedRemainingMinutes ? `≈ ${session.estimatedRemainingMinutes} mins` : "—"}
                    </p>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => void stopSession()}
                      disabled={stopping}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors disabled:opacity-60"
                    >
                      {stopping ? <Loader2 size={13} className="animate-spin" /> : <StopCircle size={13} />}
                      {stopping ? "Ending…" : "Stop Session"}
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-muted/30">
                <MapPin className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold">No active session</p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Drive up to any station to start a session. Live charging stats will appear here.
              </p>
            </div>
          )}
        </div>

        {/* Wallet */}
        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-5">
          {wallet && (
            <>
              <div>
                <p className="text-xs font-semibold text-muted-foreground tracking-[0.18em] uppercase mb-1">
                  Wallet Balance
                </p>
                <p className="text-4xl font-bold text-foreground">
                  {formatMoney(wallet.balanceCents, wallet.currency)}
                </p>
                <p className="text-xs text-muted-foreground mt-1.5">
                  {wallet.autoRefillEnabled
                    ? `Auto-refill enabled at ${formatMoney(wallet.autoRefillThresholdCents, wallet.currency)}`
                    : "Auto-refill disabled"}
                </p>
              </div>

              <div className="flex-1 border-t border-border/50 pt-4 flex flex-col gap-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last top up</span>
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    {wallet.lastTopUp
                      ? `${new Date(wallet.lastTopUp.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })} · +${formatMoney(wallet.lastTopUp.amountCents, wallet.currency)}`
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Monthly Spend</span>
                  <span className="font-semibold text-foreground">
                    {formatMoney(wallet.monthlySpendCents, wallet.currency)}
                  </span>
                </div>
              </div>

              <TopUpDialog
                trigger={
                  <button
                    type="button"
                    className="mt-auto flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-muted/30 transition-colors"
                  >
                    <RefreshCw size={13} />
                    Top Up Wallet
                  </button>
                }
                onSuccess={() => load(false)}
              />
            </>
          )}
        </div>
      </div>

      {/* Charging History */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-bold text-foreground">Recent Charging History</h2>
          <Link
            href="/user/finances"
            className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            View All
            <ChevronRight size={13} />
          </Link>
        </div>

        {history.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No charging history yet.
          </p>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap min-w-140">
              <thead>
                <tr className="border-b border-border/50 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                  <th className="pb-3 font-bold">Location</th>
                  <th className="pb-3 font-bold">Date</th>
                  <th className="pb-3 font-bold">Energy</th>
                  <th className="pb-3 font-bold">Duration</th>
                  <th className="pb-3 text-right font-bold">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {history.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => (window.location.href = `/user/finances/${row.id}`)}
                    className="group cursor-pointer hover:bg-muted/10 transition-colors"
                  >
                    <td className="py-4">
                      <p className="font-semibold text-foreground flex items-center gap-1.5">
                        <MapPin size={12} className="text-muted-foreground shrink-0" />
                        {row.stationCode}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 pl-5">
                        {row.stationName}
                      </p>
                    </td>
                    <td className="py-4 text-muted-foreground">
                      {new Date(row.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="py-4 text-foreground font-medium">
                      {row.energyKWh ? `${row.energyKWh} kWh` : "—"}
                    </td>
                    <td className="py-4 text-muted-foreground">{formatDuration(row.durationSeconds)}</td>
                    <td className="py-4 text-right font-bold text-foreground">
                      {row.totalCostCents != null ? formatMoney(row.totalCostCents, row.currency) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* News + Map decorative cards — kept as-is */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl overflow-hidden group">
          <div className="relative h-40 bg-muted/40 overflow-hidden flex items-end">
            <div className="absolute inset-0 bg-linear-to-t from-card/90 via-card/30 to-transparent z-10" />
            <div className="absolute top-3 left-3 z-20 bg-foreground/10 backdrop-blur-sm border border-border/40 rounded-md px-2 py-0.5">
              <span className="text-[10px] font-bold text-foreground tracking-widest uppercase">News</span>
            </div>
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
            <div className="relative z-10 p-4">
              <h3 className="text-base font-bold text-foreground leading-snug">Expansion: Munich Node</h3>
            </div>
          </div>
          <div className="p-4 pt-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Six new 350kW liquid-cooled stalls now online at Munich Central Hub. Optimized for next-gen 800V architectures.
            </p>
            <button className="mt-3 text-xs font-semibold text-foreground flex items-center gap-1 hover:opacity-70 transition-opacity">
              Read more <ArrowUpRight size={12} />
            </button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden relative">
          <div className="h-full min-h-55 relative bg-muted/20 flex items-center justify-center">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
            <div className="absolute top-[35%] left-[40%] w-2.5 h-2.5 rounded-full bg-foreground/60 ring-4 ring-foreground/10" />
            <div className="absolute top-[50%] left-[60%] w-2 h-2 rounded-full bg-foreground/30" />
            <div className="absolute top-[60%] left-[30%] w-2 h-2 rounded-full bg-foreground/30" />
            <div className="absolute top-[25%] left-[65%] w-2 h-2 rounded-full bg-foreground/30" />
            <div className="relative flex flex-col items-center gap-2 z-10">
              <MapPin size={28} className="text-foreground opacity-40" />
              <div className="text-center">
                <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">Network Coverage Map</p>
                <p className="text-xs font-semibold text-foreground mt-0.5">
                  {session?.stationName ?? "Coverage area"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
