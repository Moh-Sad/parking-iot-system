"use client";

import { Zap, Fuel, AlertTriangle, TrendingUp, Info } from "lucide-react";

export default function SupervisorDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* TOP ROW */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Card 1: Live Power Draw */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-1">
                Live Power Draw
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight">842.4</span>
                <span className="text-sm font-medium text-muted-foreground">
                  kW
                </span>
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/40 border border-border/50">
              <Zap className="h-5 w-5 text-foreground" />
            </div>
          </div>
          <div className="mt-8">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-foreground rounded-full w-[65%]" />
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
              <TrendingUp className="h-3 w-3" />
              <span>12% VS LAST HOUR</span>
            </div>
          </div>
        </div>

        {/* Card 2: Network Occupancy */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-1">
                Network Occupancy
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight">128</span>
                <span className="text-sm font-medium text-muted-foreground">
                  / 150
                </span>
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
                <span className="text-foreground">22</span>
              </div>
              <div className="h-1 w-full bg-muted rounded-full">
                <div className="h-full bg-foreground/40 rounded-full w-[15%]" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-[10px] font-bold tracking-widest uppercase mb-2">
                <span className="text-muted-foreground">In Use</span>
                <span className="text-foreground">128</span>
              </div>
              <div className="h-1 w-full bg-muted rounded-full">
                <div className="h-full bg-foreground rounded-full w-[85%]" />
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Active Alerts */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-1">
                Active Alerts
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight">03</span>
                <div className="w-2 h-2 rounded-full bg-foreground ml-1 mb-1 animate-pulse" />
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground text-background">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 rounded-md bg-muted/50 p-3 border border-border/50">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-relaxed">
              Terminal 4B: Inverter Thermal
              <br />
              Threshold Warning
            </p>
          </div>
        </div>
      </div>

      {/* MIDDLE ROW */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Network Load Distribution (Span 2) */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                Network Load Distribution
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Real-time aggregate consumption across all active terminals.
              </p>
            </div>
            <div className="flex items-center rounded-md border border-border bg-muted/20 p-1">
              <button className="px-4 py-1.5 text-[10px] font-bold tracking-widest uppercase bg-foreground text-background rounded">
                Live
              </button>
              <button className="px-4 py-1.5 text-[10px] font-bold tracking-widest uppercase text-muted-foreground hover:text-foreground">
                24H
              </button>
            </div>
          </div>

          {/* Simulated Bar Chart */}
          <div className="h-48 flex items-end gap-1.5 sm:gap-2 mb-8 relative">
            {/* Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between border-b border-border/50 pb-0">
              <div className="w-full border-t border-border/20 h-px" />
              <div className="w-full border-t border-border/20 h-px" />
              <div className="w-full border-t border-border/20 h-px" />
              <div className="w-full border-t border-border/20 h-px" />
            </div>

            {/* Bars */}
            <div className="w-full flex items-end justify-between gap-1 h-full z-10 px-2 pt-6">
              {[40, 55, 30, 85, 60, 45, 75, 55, 40, 35, 50, 70, 95, 40].map(
                (val, idx) => (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center justify-end h-full group"
                  >
                    {idx === 3 && (
                      <span className="mb-2 rounded bg-foreground px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-background">
                        Peak
                      </span>
                    )}
                    <div
                      className={`w-full rounded-t-sm transition-all duration-300 ${idx === 12 ? "bg-foreground" : "bg-muted-foreground/30 group-hover:bg-muted-foreground/50"}`}
                      style={{ height: `${val}%` }}
                    />
                  </div>
                ),
              )}
            </div>
          </div>

          {/* Bottom Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 border-t border-border/50">
            <div>
              <h4 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-1">
                Peak Load
              </h4>
              <p className="text-lg font-bold">1.2 MW</p>
            </div>
            <div>
              <h4 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-1">
                Avg Session
              </h4>
              <p className="text-lg font-bold">42 Min</p>
            </div>
            <div>
              <h4 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-1">
                Efficiency
              </h4>
              <p className="text-lg font-bold">98.4%</p>
            </div>
            <div>
              <h4 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-1">
                Revenue/Hr
              </h4>
              <p className="text-lg font-bold">$4,280</p>
            </div>
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col">
          <div className="mb-6">
            <h2 className="text-xl font-bold tracking-tight">Live Activity</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time session updates
            </p>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto pr-2">
            <div className="relative pl-6">
              <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full border border-foreground bg-foreground/20" />
              <div className="flex justify-between items-start mb-1">
                <h4 className="text-sm font-semibold text-foreground">
                  Session Started
                </h4>
                <span className="text-[10px] text-muted-foreground">
                  Just now
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
                NODE: NYC-HUB-042 • PORT 3
              </p>
              <p className="text-xs text-muted-foreground/70">
                Vehicle: Tesla Model 3 (800V)
              </p>
            </div>

            <div className="relative pl-6">
              <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-muted-foreground/40" />
              <div className="flex justify-between items-start mb-1">
                <h4 className="text-sm font-semibold text-foreground">
                  Session Completed
                </h4>
                <span className="text-[10px] text-muted-foreground">
                  4m ago
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
                NODE: NYC-HUB-011 • PORT 1
              </p>
              <div className="flex gap-2">
                <span className="px-2 py-0.5 rounded bg-muted/50 text-[10px] border border-border font-medium">
                  64.2 kWh
                </span>
                <span className="px-2 py-0.5 rounded bg-muted/50 text-[10px] border border-border font-medium">
                  $28.44
                </span>
              </div>
            </div>

            <div className="relative pl-6">
              <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-muted-foreground/40" />
              <div className="flex justify-between items-start mb-1">
                <h4 className="text-sm font-semibold text-foreground">
                  Session Started
                </h4>
                <span className="text-[10px] text-muted-foreground">
                  12m ago
                </span>
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                NODE: NYC-HUB-098 • PORT 6
              </p>
            </div>

            <div className="relative pl-6">
              <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-muted-foreground/40" />
              <div className="rounded-md bg-muted/40 border border-border p-3 mt-1">
                <div className="flex items-center gap-1.5 mb-1 text-sm font-semibold">
                  <Info className="w-3 h-3" /> Diagnostic Event
                </div>
                <p className="text-xs text-muted-foreground">
                  High latency detected on Node SF-120. Automatic rerouting
                  engaged.
                </p>
              </div>
            </div>

            <div className="relative pl-6 pb-2">
              <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-muted-foreground/40" />
              <div className="flex justify-between items-start mb-1">
                <h4 className="text-sm font-semibold text-foreground">
                  Session Completed
                </h4>
                <span className="text-[10px] text-muted-foreground">
                  22m ago
                </span>
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                NODE: BOS-CTR-002 • PORT 2
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-border mt-2">
            <button className="w-full text-[10px] font-bold tracking-widest text-muted-foreground hover:text-foreground uppercase py-2 transition-colors">
              View All Activities
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4">
        {/* Active Nodes Map (Span 2) */}
        <div className="rounded-xl border border-border bg-card overflow-hidden relative shadow-sm md:col-span-2 flex flex-col justify-end min-h-55">
          {/* Abstract Network/Map Background using CSS patterns */}
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
            <h2 className="text-xl font-bold tracking-tight">Active Nodes</h2>
            <p className="text-sm text-muted-foreground mt-1 mb-6">
              Regional Cluster: Northeast Corridor
            </p>

            <div className="flex flex-wrap gap-4">
              <div className="rounded-lg bg-background/80 backdrop-blur border border-border p-3 min-w-30">
                <h4 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-1">
                  SF Bay Area
                </h4>
                <p className="text-lg font-bold">42 Active</p>
              </div>
              <div className="rounded-lg bg-background/80 backdrop-blur border border-border p-3 min-w-30">
                <h4 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-1">
                  NYC Metro
                </h4>
                <p className="text-lg font-bold">108 Active</p>
              </div>
            </div>
          </div>
        </div>

        {/* Fleet Health Index */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="relative w-32 h-32 mb-6 flex items-center justify-center">
            {/* SVG Circular Progress */}
            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                className="stroke-muted fill-none"
                strokeWidth="4"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                className="stroke-foreground fill-none"
                strokeWidth="4"
                strokeDasharray="351.85"
                strokeDashoffset="87.96"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-3xl font-bold tracking-tight">75%</span>
          </div>
          <h3 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-2">
            Fleet Health Index
          </h3>
          <p className="text-xs text-muted-foreground/80 max-w-50">
            Optimal operating conditions across 12 clusters.
          </p>
        </div>

        {/* System Uptime */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-1">
              System Uptime
            </h3>
            <p className="text-3xl font-bold tracking-tight mb-8">99.998%</p>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] font-bold tracking-widest uppercase">
                <span className="text-muted-foreground">Database</span>
                <span className="text-foreground">Active</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold tracking-widest uppercase">
                <span className="text-muted-foreground">Inverters</span>
                <span className="text-foreground">94/96</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold tracking-widest uppercase">
                <span className="text-muted-foreground">Grid Sync</span>
                <span className="text-foreground">Stable</span>
              </div>
            </div>
          </div>

          <button className="w-full mt-8 rounded border border-border/50 bg-muted/20 py-2.5 text-[10px] font-bold tracking-widest text-foreground uppercase hover:bg-muted/40 transition-colors">
            Details
          </button>
        </div>
      </div>
    </div>
  );
}
