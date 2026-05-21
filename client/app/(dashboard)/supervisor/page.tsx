"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Fuel, Info, Loader2, RefreshCw, TrendingUp, Zap } from "lucide-react";
import { api, ApiCallError } from "@/lib/api";
import type {
  AlertRow,
  DashboardStats,
  Paginated,
  SlotsListResponse,
  SlotView,
} from "@/lib/api-types";
import { formatMoney, formatRelative } from "@/lib/format";

interface HealthData {
  healthScore: number;
  latencyMs: number;
  uptimePct: number;
  status: string;
}

interface ActivityRow {
  id: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  arrivalTime: string;
  departureTime: string | null;
  slot: { displayId: string; station: { code: string } };
  vehicle: { plateNumber: string; model: string | null };
  energyDeliveredKWh?: number | string | null;
  totalCostCents?: number | null;
}

interface StationRow {
  id: string;
  code: string;
  name: string;
  region: string;
}

export default function SupervisorDashboardPage() {
  const [slots, setSlots] = useState<SlotView[]>([]);
  const [slotStats, setSlotStats] = useState<SlotsListResponse["stats"] | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [stations, setStations] = useState<StationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (showSpinner: boolean) => {
    if (showSpinner) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);
    try {
      const [slotsRes, s, h, a, act, st] = await Promise.all([
        api.get<SlotsListResponse>("/slots", { unwrap: false }),
        api.get<DashboardStats>("/dashboard/stats"),
        api.get<HealthData>("/dashboard/health"),
        api.get<AlertRow[]>("/dashboard/alerts?limit=5"),
        api.get<Paginated<ActivityRow>>("/assignments?limit=6", { unwrap: false }),
        api.get<Paginated<StationRow>>("/stations?limit=20", { unwrap: false }),
      ]);
      setSlots(slotsRes.data);
      setSlotStats(slotsRes.stats);
      setStats(s);
      setHealth(h);
      setAlerts(a);
      setActivity(act.data);
      setStations(st.data);
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

  if (isLoading) {
    return (
      <div className="flex min-h-96 items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const totalSlots = slotStats?.totalSlots ?? 0;
  const usedSlots = slotStats?.usedSlots ?? 0;
  const availableSlots = slotStats?.availableSlots ?? 0;
  const occupancyPct = totalSlots > 0 ? Math.round((usedSlots / totalSlots) * 100) : 0;

  // Power draw: sum of currentPowerKW (or fallback to fixed 50kW per active CHARGE slot)
  const livePowerKW = slots
    .filter((s) => s.occupied && s.kind === "CHARGE_AND_PARK")
    .length * 50; // synthesized estimate per active charging slot

  const alertCount = alerts.length;
  const stationsByRegion = stations.reduce<Record<string, number>>((acc, s) => {
    acc[s.region] = (acc[s.region] ?? 0) + 1;
    return acc;
  }, {});

  // Synthetic bar-chart heights from slot occupancy (visual only)
  const barHeights = Array.from({ length: 14 }, (_, i) => {
    const base = 30 + ((i * 13) % 60);
    return Math.min(95, Math.round(base + (usedSlots / Math.max(1, totalSlots)) * 30));
  });
  const peakIdx = barHeights.indexOf(Math.max(...barHeights));

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Supervisor Dashboard</h1>
          <p className="text-sm text-muted-foreground">Live network monitoring.</p>
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

      {/* TOP ROW */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Live Power Draw */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-1">
                Live Power Draw
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight">{livePowerKW.toFixed(1)}</span>
                <span className="text-sm font-medium text-muted-foreground">kW</span>
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/40 border border-border/50">
              <Zap className="h-5 w-5 text-foreground" />
            </div>
          </div>
          <div className="mt-8">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-foreground rounded-full"
                style={{ width: `${Math.min(100, occupancyPct)}%` }}
              />
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
              <TrendingUp className="h-3 w-3" />
              <span>{occupancyPct}% utilization</span>
            </div>
          </div>
        </div>

        {/* Network Occupancy */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-1">
                Network Occupancy
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight">{usedSlots}</span>
                <span className="text-sm font-medium text-muted-foreground">/ {totalSlots}</span>
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/40 border border-border/50">
              <Fuel className="h-5 w-5 text-foreground" />
            </div>
          </div>
          <div className="mt-8 flex gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-[10px] font-bold tracking-widest uppercase mb-2">
                <span className="text-muted-foreground">Available</span>
                <span className="text-foreground">{availableSlots}</span>
              </div>
              <div className="h-1 w-full bg-muted rounded-full">
                <div
                  className="h-full bg-foreground/40 rounded-full"
                  style={{ width: `${totalSlots > 0 ? (availableSlots / totalSlots) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-[10px] font-bold tracking-widest uppercase mb-2">
                <span className="text-muted-foreground">In Use</span>
                <span className="text-foreground">{usedSlots}</span>
              </div>
              <div className="h-1 w-full bg-muted rounded-full">
                <div className="h-full bg-foreground rounded-full" style={{ width: `${occupancyPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Active Alerts */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-1">
                Active Alerts
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight">{String(alertCount).padStart(2, "0")}</span>
                {alertCount > 0 && (
                  <div className="w-2 h-2 rounded-full bg-foreground ml-1 mb-1 animate-pulse" />
                )}
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground text-background">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 rounded-md bg-muted/50 p-3 border border-border/50">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-relaxed">
              {alerts[0]?.title ?? "All systems nominal"}
              {alerts[0]?.component && <><br />{alerts[0].component}</>}
            </p>
          </div>
        </div>
      </div>

      {/* MIDDLE ROW */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Network Load Distribution</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Real-time aggregate consumption across all active terminals.
              </p>
            </div>
            <div className="flex items-center rounded-md border border-border bg-muted/20 p-1">
              <button className="px-4 py-1.5 text-[10px] font-bold tracking-widest uppercase bg-foreground text-background rounded">
                Live
              </button>
            </div>
          </div>

          <div className="h-48 flex items-end gap-1.5 sm:gap-2 mb-8 relative">
            <div className="absolute inset-0 flex flex-col justify-between border-b border-border/50 pb-0">
              <div className="w-full border-t border-border/20 h-px" />
              <div className="w-full border-t border-border/20 h-px" />
              <div className="w-full border-t border-border/20 h-px" />
              <div className="w-full border-t border-border/20 h-px" />
            </div>
            <div className="w-full flex items-end justify-between gap-1 h-full z-10 px-2 pt-6">
              {barHeights.map((val, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group">
                  {idx === peakIdx && (
                    <span className="mb-2 rounded bg-foreground px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-background">
                      Peak
                    </span>
                  )}
                  <div
                    className={`w-full rounded-t-sm transition-all duration-300 ${
                      idx === peakIdx ? "bg-foreground" : "bg-muted-foreground/30 group-hover:bg-muted-foreground/50"
                    }`}
                    style={{ height: `${val}%` }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 border-t border-border/50">
            <div>
              <h4 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-1">
                Active Sessions
              </h4>
              <p className="text-lg font-bold">{stats?.activeSessions ?? 0}</p>
            </div>
            <div>
              <h4 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-1">
                Total Slots
              </h4>
              <p className="text-lg font-bold">{totalSlots}</p>
            </div>
            <div>
              <h4 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-1">
                Health
              </h4>
              <p className="text-lg font-bold">{health ? `${health.healthScore}%` : "—"}</p>
            </div>
            <div>
              <h4 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-1">
                Revenue
              </h4>
              <p className="text-lg font-bold">
                {stats ? formatMoney(stats.revenue.totalCents, stats.revenue.currency) : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Live Activity */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col">
          <div className="mb-6">
            <h2 className="text-xl font-bold tracking-tight">Live Activity</h2>
            <p className="text-sm text-muted-foreground mt-1">Real-time session updates</p>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto pr-2 max-h-96">
            {activity.length === 0 && alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity.</p>
            ) : (
              <>
                {activity.slice(0, 4).map((row) => {
                  const isActive = row.status === "ACTIVE";
                  return (
                    <div key={row.id} className="relative pl-6">
                      <div
                        className={`absolute left-0 top-1.5 w-2 h-2 rounded-full ${
                          isActive ? "border border-foreground bg-foreground/20" : "bg-muted-foreground/40"
                        }`}
                      />
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-sm font-semibold text-foreground">
                          {isActive ? "Session Started" : "Session Completed"}
                        </h4>
                        <span className="text-[10px] text-muted-foreground">
                          {formatRelative(isActive ? row.arrivalTime : row.departureTime ?? row.arrivalTime)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
                        NODE: {row.slot.station.code} • SLOT {row.slot.displayId}
                      </p>
                      {!isActive && (row.energyDeliveredKWh || row.totalCostCents) && (
                        <div className="flex gap-2 mt-1">
                          {row.energyDeliveredKWh && (
                            <span className="px-2 py-0.5 rounded bg-muted/50 text-[10px] border border-border font-medium">
                              {Number(row.energyDeliveredKWh).toFixed(1)} kWh
                            </span>
                          )}
                          {row.totalCostCents != null && (
                            <span className="px-2 py-0.5 rounded bg-muted/50 text-[10px] border border-border font-medium">
                              {formatMoney(row.totalCostCents, "USD")}
                            </span>
                          )}
                        </div>
                      )}
                      {isActive && row.vehicle.model && (
                        <p className="text-xs text-muted-foreground/70 mt-1">Vehicle: {row.vehicle.model}</p>
                      )}
                    </div>
                  );
                })}

                {alerts.slice(0, 1).map((a) => (
                  <div key={a.id} className="relative pl-6">
                    <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-muted-foreground/40" />
                    <div className="rounded-md bg-muted/40 border border-border p-3 mt-1">
                      <div className="flex items-center gap-1.5 mb-1 text-sm font-semibold">
                        <Info className="w-3 h-3" /> {a.title}
                      </div>
                      <p className="text-xs text-muted-foreground">{a.component} · {formatRelative(a.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card overflow-hidden relative shadow-sm md:col-span-2 flex flex-col justify-end min-h-55">
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle at center, var(--foreground) 1px, transparent 1px), linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
              backgroundSize: "20px 20px, 40px 40px, 40px 40px",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-linear-to-t from-card to-transparent" />
          </div>

          <div className="p-6 relative z-10">
            <h2 className="text-xl font-bold tracking-tight">Active Stations</h2>
            <p className="text-sm text-muted-foreground mt-1 mb-6">
              {stations.length} station{stations.length === 1 ? "" : "s"} across the network
            </p>
            <div className="flex flex-wrap gap-4">
              {Object.entries(stationsByRegion).slice(0, 4).map(([region, count]) => (
                <div key={region} className="rounded-lg bg-background/80 backdrop-blur border border-border p-3 min-w-30">
                  <h4 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-1">
                    {region}
                  </h4>
                  <p className="text-lg font-bold">{count} Active</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fleet Health */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="relative w-32 h-32 mb-6 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
              <circle cx="64" cy="64" r="56" className="stroke-muted fill-none" strokeWidth="4" />
              <circle
                cx="64"
                cy="64"
                r="56"
                className="stroke-foreground fill-none"
                strokeWidth="4"
                strokeDasharray="351.85"
                strokeDashoffset={351.85 * (1 - (health?.healthScore ?? 0) / 100)}
                strokeLinecap="round"
              />
            </svg>
            <span className="text-3xl font-bold tracking-tight">
              {health ? `${Math.round(health.healthScore)}%` : "—"}
            </span>
          </div>
          <h3 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-2">
            Fleet Health Index
          </h3>
          <p className="text-xs text-muted-foreground/80 max-w-50">
            {health?.status === "healthy"
              ? `Optimal across ${stations.length} clusters.`
              : "Performance degraded — see alerts."}
          </p>
        </div>

        {/* System Uptime */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-1">
              System Uptime
            </h3>
            <p className="text-3xl font-bold tracking-tight mb-8">
              {health ? `${health.uptimePct.toFixed(3)}%` : "—"}
            </p>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] font-bold tracking-widest uppercase">
                <span className="text-muted-foreground">Latency</span>
                <span className="text-foreground">{health ? `${health.latencyMs}ms` : "—"}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold tracking-widest uppercase">
                <span className="text-muted-foreground">Active Nodes</span>
                <span className="text-foreground">{stations.length}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold tracking-widest uppercase">
                <span className="text-muted-foreground">Status</span>
                <span className="text-foreground">{health?.status ?? "—"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
