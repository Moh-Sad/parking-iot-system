import {
  ArrowUpRight,
  BadgeDollarSign,
  Clock3,
  Download,
  Hourglass,
  ReceiptText,
  TrendingUp,
} from "lucide-react";

const metricCards = [
  {
    label: "Total revenue",
    value: "$2,842,910.00",
    delta: "+12.4%",
    note: "vs last month",
    icon: TrendingUp,
  },
  {
    label: "Avg transaction value",
    value: "$42.85",
    delta: "+2.1%",
    note: "vs last month",
    icon: ReceiptText,
  },
  {
    label: "Pending payouts",
    value: "$128,402.15",
    delta: "Processing",
    note: "4 batches queued",
    icon: Hourglass,
  },
];

const transactions = [
  {
    id: "TXN-94021-884",
    location: "Berlin North Cluster B4",
    status: "Completed",
    method: "Corporate Fleet Card",
    amount: "$142.50",
  },
  {
    id: "TXN-94022-102",
    location: "Munich Tech Hub S1",
    status: "Pending",
    method: "Direct Pay",
    amount: "$88.20",
  },
  {
    id: "TXN-94023-559",
    location: "Hamburg Port Terminal",
    status: "Completed",
    method: "Mobile App Wallet",
    amount: "$31.00",
  },
  {
    id: "TXN-94024-912",
    location: "Paris Center High-Volt",
    status: "Completed",
    method: "RFID Pass",
    amount: "$215.75",
  },
  {
    id: "TXN-94025-442",
    location: "London East EV Station",
    status: "Failed",
    method: "Apple Pay",
    amount: "$15.00",
  },
];

const volumeBars = [
  { day: "Mon", value: 42 },
  { day: "Tue", value: 66 },
  { day: "Wed", value: 58 },
  { day: "Thu", value: 92 },
  { day: "Fri", value: 55 },
  { day: "Sat", value: 82 },
  { day: "Sun", value: 92 },
];

function StatusDot({ status }: { status: string }) {
  const color =
    status === "Completed"
      ? "bg-emerald-500 dark:bg-primary"
      : status === "Failed"
        ? "bg-destructive"
        : "bg-amber-500";

  return (
    <span className="flex items-center gap-2">
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} aria-hidden />
      <span
        className={
          status === "Pending"
            ? "font-medium text-muted-foreground"
            : "font-medium text-foreground"
        }
      >
        {status}
      </span>
    </span>
  );
}

export default function AdminFinancesPage() {
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
        <button
          type="button"
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-foreground transition-colors hover:bg-muted/30"
        >
          <Download className="h-4 w-4" strokeWidth={2} aria-hidden />
          Export CSV
        </button>
      </header>

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
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Revenue Performance
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Visualizing global transaction flow across the network.
              </p>
            </div>
            <div className="inline-flex w-fit rounded-lg border border-border bg-background p-1">
              {["7D", "30D", "1Y"].map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`rounded-md px-3 py-1.5 text-[10px] font-bold transition-colors ${
                    item === "30D"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 h-[260px] rounded-lg bg-muted/10 p-3">
            <svg
              className="h-full w-full overflow-visible"
              viewBox="0 0 720 250"
              role="img"
              aria-label="Revenue line chart from October 1 to October 28"
            >
              <defs>
                <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.16" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[50, 100, 150, 200].map((y) => (
                <line
                  key={y}
                  x1="0"
                  x2="720"
                  y1={y}
                  y2={y}
                  className="stroke-border/70"
                  strokeDasharray="4 10"
                />
              ))}
              <path
                d="M0 168 C70 145 110 166 150 164 C210 160 220 188 285 170 C360 149 390 83 455 88 C520 94 530 198 590 192 C654 185 685 143 720 83"
                fill="none"
                className="stroke-foreground"
                strokeLinecap="round"
                strokeWidth="3"
              />
              <path
                d="M0 168 C70 145 110 166 150 164 C210 160 220 188 285 170 C360 149 390 83 455 88 C520 94 530 198 590 192 C654 185 685 143 720 83 L720 250 L0 250 Z"
                className="fill-foreground"
                opacity="0.06"
              />
              <circle cx="180" cy="166" r="4" className="fill-foreground" />
              {[
                ["01 OCT", 0],
                ["07 OCT", 180],
                ["14 OCT", 360],
                ["21 OCT", 540],
                ["28 OCT", 700],
              ].map(([label, x]) => (
                <text
                  key={label}
                  x={x}
                  y="238"
                  className="fill-muted-foreground text-[11px] font-bold"
                >
                  {label}
                </text>
              ))}
            </svg>
          </div>
        </article>

        <article className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Volumetric Data
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Daily transaction counts.
              </p>
            </div>
            <BadgeDollarSign className="h-5 w-5 text-muted-foreground" aria-hidden />
          </div>

          <div className="mt-8 flex h-[260px] items-end gap-3 rounded-lg bg-muted/10 px-3 pb-4 pt-5">
            {volumeBars.map((bar) => (
              <div key={bar.day} className="flex min-w-0 flex-1 flex-col items-center gap-3">
                <div className="flex h-44 w-full items-end">
                  <div
                    className="w-full rounded-t-sm bg-foreground/15 transition-colors first:bg-foreground/20 dark:bg-primary/20"
                    style={{ height: `${bar.value}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold uppercase text-muted-foreground">
                  {bar.day}
                </span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border/80 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Recent Transactions
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Real-time ledger of network activity.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-foreground transition-colors hover:bg-muted/30"
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
              {transactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="transition-colors hover:bg-muted/10"
                >
                  <td className="px-6 py-5 font-mono text-xs font-medium text-muted-foreground">
                    {transaction.id}
                  </td>
                  <td className="px-4 py-5 font-medium text-foreground">
                    {transaction.location}
                  </td>
                  <td className="px-4 py-5 text-xs">
                    <StatusDot status={transaction.status} />
                  </td>
                  <td className="px-4 py-5 text-muted-foreground">
                    {transaction.method}
                  </td>
                  <td className="px-6 py-5 text-right font-bold text-foreground">
                    {transaction.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="flex flex-col gap-3 border-t border-border/80 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            <Clock3 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Showing 5 of 24,010 items
          </p>
          <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground">
            <button type="button" className="transition-colors hover:text-foreground">
              Previous
            </button>
            <button type="button" className="transition-colors hover:text-foreground">
              Next
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
