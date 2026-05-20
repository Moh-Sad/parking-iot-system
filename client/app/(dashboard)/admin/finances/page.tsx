"use client";

import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Clock,
  Download,
  MoreHorizontal,
  ArrowUpRight,
} from "lucide-react";

// ── Inline SVG Revenue Chart (pure CSS-variable aware) ──────────────────────
function RevenueChart() {
  const points = [
    { x: 0, y: 65 },
    { x: 60, y: 50 },
    { x: 120, y: 70 },
    { x: 180, y: 30 },
    { x: 240, y: 55 },
    { x: 300, y: 20 },
    { x: 360, y: 45 },
    { x: 420, y: 10 },
    { x: 480, y: 35 },
  ];

  const lineD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  // Smooth bezier curve path
  const smoothD = points.reduce((d, p, i, arr) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = arr[i - 1];
    const cpX = (prev.x + p.x) / 2;
    return `${d} C ${cpX} ${prev.y} ${cpX} ${p.y} ${p.x} ${p.y}`;
  }, "");

  const fillD = `${smoothD} L ${points[points.length - 1].x} 100 L 0 100 Z`;

  const labels = ["JAN21", "JAN22", "JAN23", "JAN24", "JAN25"];

  return (
    <svg viewBox="0 0 480 110" className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="rev-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.20" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[20, 40, 60, 80].map((y) => (
        <line
          key={y}
          x1="0"
          y1={y}
          x2="480"
          y2={y}
          stroke="currentColor"
          strokeOpacity="0.08"
          strokeWidth="1"
        />
      ))}
      {/* Fill */}
      <path d={fillD} fill="url(#rev-fill)" className="text-foreground" />
      {/* Line */}
      <path
        d={smoothD}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="text-foreground"
      />
      {/* Dots */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="3"
          fill="currentColor"
          className="text-foreground"
        />
      ))}
      {/* X labels */}
      {labels.map((label, i) => (
        <text
          key={label}
          x={i * 120}
          y="108"
          textAnchor="middle"
          fontSize="7"
          fill="currentColor"
          fillOpacity="0.4"
          fontWeight="600"
          letterSpacing="1"
        >
          {label}
        </text>
      ))}
    </svg>
  );
}

// ── Inline SVG Bar Chart (Volumetric) ───────────────────────────────────────
function VolumetricChart() {
  const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const heights = [55, 72, 45, 88, 60, 95, 38];

  return (
    <svg viewBox="0 0 220 90" className="w-full" preserveAspectRatio="xMidYMax meet">
      {days.map((day, i) => {
        const barH = (heights[i] / 100) * 72;
        const x = i * 32 + 4;
        const isMax = heights[i] === Math.max(...heights);
        return (
          <g key={day}>
            <rect
              x={x}
              y={78 - barH}
              width="20"
              height={barH}
              rx="4"
              fill="currentColor"
              fillOpacity={isMax ? "1" : "0.25"}
              className="text-foreground"
            />
            <text
              x={x + 10}
              y="88"
              textAnchor="middle"
              fontSize="6"
              fill="currentColor"
              fillOpacity="0.4"
              fontWeight="600"
              letterSpacing="0.5"
            >
              {day}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Data ────────────────────────────────────────────────────────────────────
const transactions = [
  {
    id: "TXN-94021-884",
    station: "Berlin North Cluster B4",
    status: "Completed",
    method: "Corporate Fleet Card",
    amount: "$142.50",
  },
  {
    id: "TXN-94022-102",
    station: "Munich Tech Hub S1",
    status: "Pending",
    method: "Direct Pay",
    amount: "$88.20",
  },
  {
    id: "TXN-94023-559",
    station: "Hamburg Port Terminal",
    status: "Completed",
    method: "Mobile App Wallet",
    amount: "$31.00",
  },
  {
    id: "TXN-94024-912",
    station: "Paris Center High-Volt",
    status: "Completed",
    method: "RFID Pass",
    amount: "$215.75",
  },
  {
    id: "TXN-94025-442",
    station: "London East EV Station",
    status: "Failed",
    method: "Apple Pay",
    amount: "$15.00",
  },
  {
    id: "TXN-94026-118",
    station: "Tokyo Central Hub 7",
    status: "Completed",
    method: "Corporate Fleet Card",
    amount: "$64.20",
  },
  {
    id: "TXN-94027-303",
    station: "Amsterdam West G1",
    status: "Pending",
    method: "Direct Pay",
    amount: "$112.50",
  },
];

function StatusBadge({ status }: { status: string }) {
  if (status === "Completed") {
    return (
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
        <span className="text-foreground font-medium">{status}</span>
      </div>
    );
  }
  if (status === "Pending") {
    return (
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
        <span className="text-muted-foreground font-medium">{status}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
      <span className="text-destructive font-medium">{status}</span>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function FinancePage() {
  return (
    <div className="mt-2 flex flex-col gap-6 sm:mt-4">

      {/* ── Top Stat Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Total Revenue */}
        <div className="p-6 bg-card border border-border rounded-xl relative overflow-hidden group">
          <div className="absolute right-0 -bottom-4 opacity-[0.03] text-foreground group-hover:scale-110 transition-transform">
            <DollarSign size={100} />
          </div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-muted-foreground tracking-[0.15em] uppercase">
              Total Revenue
            </h2>
            <ArrowUpRight size={14} className="text-muted-foreground" />
          </div>
          <div className="text-3xl font-bold text-foreground">$2,842,910</div>
          <p className="text-sm text-muted-foreground mt-2 font-medium flex items-center gap-1">
            <TrendingUp size={13} className="text-foreground" />
            +12.4% vs last month
          </p>
        </div>

        {/* Avg Transaction Value */}
        <div className="p-6 bg-card border border-border rounded-xl relative overflow-hidden group">
          <div className="absolute right-0 -bottom-4 opacity-[0.03] text-foreground group-hover:scale-110 transition-transform">
            <CreditCard size={100} />
          </div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-muted-foreground tracking-[0.15em] uppercase">
              Avg Transaction Value
            </h2>
            <ArrowUpRight size={14} className="text-muted-foreground" />
          </div>
          <div className="text-3xl font-bold text-foreground">$42.85</div>
          <p className="text-sm text-muted-foreground mt-2 font-medium flex items-center gap-1">
            <TrendingUp size={13} className="text-foreground" />
            +2% vs last week
          </p>
        </div>

        {/* Pending Payouts */}
        <div className="p-6 bg-card border border-border rounded-xl relative overflow-hidden group">
          <div className="absolute right-0 -bottom-4 opacity-[0.03] text-foreground group-hover:scale-110 transition-transform">
            <Clock size={100} />
          </div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-muted-foreground tracking-[0.15em] uppercase">
              Pending Payouts
            </h2>
            <div className="text-xs font-semibold text-muted-foreground border border-border rounded-full px-2 py-0.5">
              Processing
            </div>
          </div>
          <div className="text-3xl font-bold text-foreground">$128,402</div>
          <p className="text-sm text-muted-foreground mt-2 font-medium flex items-center gap-1">
            <TrendingDown size={13} className="text-muted-foreground" />
            -3.1% vs last month
          </p>
        </div>
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Revenue Performance Chart (2/3) */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">Revenue Performance</h2>
              <p className="text-sm text-muted-foreground">
                Tracking global transaction flow across the network.
              </p>
            </div>
            <div className="flex gap-1 shrink-0">
              {["5D", "30D", "1Y"].map((label) => (
                <button
                  key={label}
                  className={`px-3 py-1 text-xs font-bold rounded-lg border transition-colors ${
                    label === "30D"
                      ? "bg-foreground text-background border-foreground"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="w-full h-32">
            <RevenueChart />
          </div>
        </div>

        {/* Volumetric Data Chart (1/3) */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">Volumetric Data</h2>
              <p className="text-sm text-muted-foreground">Daily transaction counts.</p>
            </div>
            <button className="text-muted-foreground hover:text-foreground">
              <MoreHorizontal size={20} />
            </button>
          </div>
          <div className="mt-4">
            <VolumetricChart />
          </div>
        </div>
      </div>

      {/* ── Recent Transactions Table ── */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">Recent Transactions</h2>
            <p className="text-sm text-muted-foreground">Real-time ledger of network activity.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-secondary text-foreground transition-colors shrink-0">
            <Download size={14} />
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
              {transactions.map((txn) => (
                <tr key={txn.id} className="group hover:bg-muted/10 transition-colors">
                  <td className="py-4 font-medium text-muted-foreground">{txn.id}</td>
                  <td className="py-4 text-foreground">{txn.station}</td>
                  <td className="py-4">
                    <StatusBadge status={txn.status} />
                  </td>
                  <td className="py-4 text-muted-foreground">{txn.method}</td>
                  <td className="py-4 text-right font-bold text-foreground">{txn.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination row */}
        <div className="mt-6 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground font-medium">
          <span>Showing 7 of 38,120 items</span>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 border border-border rounded-lg hover:bg-secondary hover:text-foreground transition-colors">
              Previous
            </button>
            <button className="px-3 py-1.5 border border-border rounded-lg hover:bg-secondary hover:text-foreground transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
