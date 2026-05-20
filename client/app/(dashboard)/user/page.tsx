"use client";

import {
  MapPin,
  ArrowUpRight,
  RefreshCw,
  ChevronRight,
} from "lucide-react";

function ChargeRing({ percent }: { percent: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const filled = (percent / 100) * circ;

  return (
    <svg viewBox="0 0 128 128" className="w-full h-full" aria-hidden>
      {/* Track */}
      <circle
        cx="64"
        cy="64"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.1"
        strokeWidth="10"
        className="text-foreground"
      />
      {/* Fill */}
      <circle
        cx="64"
        cy="64"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeDashoffset={circ * 0.25}
        className="text-foreground"
      />
      {/* Label */}
      <text
        x="64"
        y="60"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="22"
        fontWeight="700"
        fill="currentColor"
        className="text-foreground"
      >
        {percent}%
      </text>
      <text
        x="64"
        y="78"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="8"
        fontWeight="600"
        fill="currentColor"
        fillOpacity="0.45"
        letterSpacing="1"
        className="text-foreground"
      >
        SOC
      </text>
    </svg>
  );
}

// ── Data ────────────────────────────────────────────────────────────────────
const chargingHistory = [
  {
    location: "V-102 London East",
    sublocation: "Supercharger, UK",
    date: "Oct 28, 2023",
    energy: "42.5 kWh",
    duration: "34m 12s",
    cost: "$18.40",
  },
  {
    location: "V-089 Paris Nord",
    sublocation: "Fast Stations, FR",
    date: "Oct 25, 2023",
    energy: "28.1 kWh",
    duration: "22m 05s",
    cost: "$12.10",
  },
  {
    location: "V-402 Berlin Central",
    sublocation: "Supercharger, DE",
    date: "Oct 22, 2023",
    energy: "55.0 kWh",
    duration: "48m 40s",
    cost: "$24.30",
  },
];

export default function UserDashboardPage() {
  return (
    <div className="mt-2 flex flex-col gap-6 sm:mt-4">
      {/* ── Header Row ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Driver Portal</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            System operational · 4 nodes active
          </p>
        </div>
      </div>

      {/* ── Main Grid: Session + Wallet ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Session Card (2/3) */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 flex flex-col gap-6">
          {/* Session header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground tracking-[0.18em] uppercase mb-1">
                Active Session
              </p>
              <h2 className="text-2xl font-bold text-foreground">
                Station V-402
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
                <MapPin size={12} className="shrink-0" />
                Supercharger · Berlin Central
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-muted-foreground tracking-[0.18em] uppercase mb-1">
                Current Cost
              </p>
              <p className="text-3xl font-bold text-foreground">$14.22</p>
            </div>
          </div>

          {/* Ring + Stats */}
          <div className="flex flex-col sm:flex-row items-center gap-8">
            {/* Ring */}
            <div className="w-32 h-32 shrink-0">
              <ChargeRing percent={75} />
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-x-10 gap-y-4 w-full">
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground tracking-[0.15em] uppercase mb-1">
                  Time Elapsed
                </p>
                <p className="text-lg font-bold text-foreground tabular-nums">
                  00:42:15
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground tracking-[0.15em] uppercase mb-1">
                  Power Delivery
                </p>
                <p className="text-lg font-bold text-foreground">120 kW</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground tracking-[0.15em] uppercase mb-1">
                  Remaining
                </p>
                <p className="text-lg font-bold text-foreground">≈ 12 mins</p>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Balance Card (1/3) */}
        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-5">
          <div>
            <p className="text-xs font-semibold text-muted-foreground tracking-[0.18em] uppercase mb-1">
              Wallet Spent
            </p>
            <p className="text-4xl font-bold text-foreground">$452.80</p>
            <p className="text-xs text-muted-foreground mt-1.5">
              Auto-refill enabled at $50.00
            </p>
          </div>

          <div className="flex-1 border-t border-border/50 pt-4 flex flex-col gap-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Last Spend</span>
              <span className="font-semibold text-foreground flex items-center gap-1">
                Oct 24 · +$100.00
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Monthly Spend</span>
              <span className="font-semibold text-foreground">$214.50</span>
            </div>
          </div>

          <button className="mt-auto flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-muted/30 transition-colors">
            <RefreshCw size={13} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Charging History ── */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-bold text-foreground">
            Recent Charging History
          </h2>
          <button className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
            View All Logs
            <ChevronRight size={13} />
          </button>
        </div>

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
              {chargingHistory.map((row) => (
                <tr
                  key={row.location}
                  className="group hover:bg-muted/10 transition-colors"
                >
                  <td className="py-4">
                    <p className="font-semibold text-foreground flex items-center gap-1.5">
                      <MapPin
                        size={12}
                        className="text-muted-foreground shrink-0"
                      />
                      {row.location}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 pl-5">
                      {row.sublocation}
                    </p>
                  </td>
                  <td className="py-4 text-muted-foreground">{row.date}</td>
                  <td className="py-4 text-foreground font-medium">
                    {row.energy}
                  </td>
                  <td className="py-4 text-muted-foreground">{row.duration}</td>
                  <td className="py-4 text-right font-bold text-foreground">
                    {row.cost}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Bottom Row: News + Map ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* News Card */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden group">
          {/* Image placeholder with gradient overlay */}
          <div className="relative h-40 bg-muted/40 overflow-hidden flex items-end">
            <div className="absolute inset-0 bg-linear-to-t from-card/90 via-card/30 to-transparent z-10" />
            <div className="absolute top-3 left-3 z-20 bg-foreground/10 backdrop-blur-sm border border-border/40 rounded-md px-2 py-0.5">
              <span className="text-[10px] font-bold text-foreground tracking-widest uppercase">
                News
              </span>
            </div>
            {/* Decorative grid pattern */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />
            <div className="relative z-10 p-4">
              <h3 className="text-base font-bold text-foreground leading-snug">
                Expansion: Munich Node
              </h3>
            </div>
          </div>
          <div className="p-4 pt-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Six new 350kW liquid-cooled stalls now online at Munich Central
              Hub. Optimized for next-gen 800V architectures.
            </p>
            <button className="mt-3 text-xs font-semibold text-foreground flex items-center gap-1 hover:opacity-70 transition-opacity">
              Read more <ArrowUpRight size={12} />
            </button>
          </div>
        </div>

        {/* Network Coverage Map Card */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden relative">
          {/* Map placeholder */}
          <div className="h-full min-h-55 relative bg-muted/20 flex items-center justify-center">
            {/* Grid lines mimicking map */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />
            {/* Dot nodes */}
            <div className="absolute top-[35%] left-[40%] w-2.5 h-2.5 rounded-full bg-foreground/60 ring-4 ring-foreground/10" />
            <div className="absolute top-[50%] left-[60%] w-2 h-2 rounded-full bg-foreground/30" />
            <div className="absolute top-[60%] left-[30%] w-2 h-2 rounded-full bg-foreground/30" />
            <div className="absolute top-[25%] left-[65%] w-2 h-2 rounded-full bg-foreground/30" />

            {/* Label */}
            <div className="relative flex flex-col items-center gap-2 z-10">
              <MapPin size={28} className="text-foreground opacity-40" />
              <div className="text-center">
                <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                  Network Coverage Map
                </p>
                <p className="text-xs font-semibold text-foreground mt-0.5">
                  Berlin Gateway
                </p>
              </div>
            </div>

            {/* Compass */}
            <button className="absolute bottom-3 right-3 w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <svg
                viewBox="0 0 16 16"
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M8 2v12M2 8h12" />
                <circle cx="8" cy="8" r="6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
