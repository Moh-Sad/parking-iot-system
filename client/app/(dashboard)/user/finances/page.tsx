"use client";

import { useState } from "react";
import { X, SlidersHorizontal, Zap, TrendingUp, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

/* ------------------------------------------------------------------ */
/*  Types & mock data                                                  */
/* ------------------------------------------------------------------ */

interface Invoice {
  id: string;
  client: string;
  node: string;
  date: string;
  amount: number;
  status: "PAID" | "PROCESSING" | "OVERDUE";
  billTo: {
    name: string;
    address: string[];
  };
  lineItems: { label: string; description: string; total: number }[];
  subtotal: number;
  tax: number;
  grandTotal: number;
}

const INVOICES: Invoice[] = [
  {
    id: "INV-2024-001",
    client: "Aether Fleet Solutions",
    node: "SECTOR 7-G HUB",
    date: "Oct 12, 2024",
    amount: 12450.0,
    status: "PAID",
    billTo: {
      name: "Aether Fleet Solutions",
      address: ["702 Tech Plaza, Ste 400", "San Francisco, CA 94105"],
    },
    lineItems: [
      { label: "KW/h Consumption", description: "Node: HUB-7G (48,200 units)", total: 9640.0 },
      { label: "Peak Load Premium", description: "Network Overload Surcharge", total: 1810.0 },
      { label: "Maintenance Fee", description: "Periodic Sensor Calibration", total: 1000.0 },
    ],
    subtotal: 12450.0,
    tax: 0,
    grandTotal: 12450.0,
  },
  {
    id: "INV-2024-002",
    client: "Nordic Logistics",
    node: "OSLO TERMINUS B",
    date: "Oct 14, 2024",
    amount: 8210.0,
    status: "PROCESSING",
    billTo: {
      name: "Nordic Logistics",
      address: ["15 Harbour Rd", "Oslo, Norway 0150"],
    },
    lineItems: [
      { label: "KW/h Consumption", description: "Node: OSLO-TB (32,100 units)", total: 6410.0 },
      { label: "Peak Load Premium", description: "Network Overload Surcharge", total: 1000.0 },
      { label: "Maintenance Fee", description: "Periodic Sensor Calibration", total: 800.0 },
    ],
    subtotal: 8210.0,
    tax: 0,
    grandTotal: 8210.0,
  },
  {
    id: "INV-2024-003",
    client: "Hyperion Dynamics",
    node: "LAX CENTRAL PORT",
    date: "Oct 08, 2024",
    amount: 21800.0,
    status: "OVERDUE",
    billTo: {
      name: "Hyperion Dynamics",
      address: ["9000 Sunset Blvd", "Los Angeles, CA 90069"],
    },
    lineItems: [
      { label: "KW/h Consumption", description: "Node: LAX-CP (91,200 units)", total: 18200.0 },
      { label: "Peak Load Premium", description: "Network Overload Surcharge", total: 2600.0 },
      { label: "Maintenance Fee", description: "Periodic Sensor Calibration", total: 1000.0 },
    ],
    subtotal: 21800.0,
    tax: 0,
    grandTotal: 21800.0,
  },
  {
    id: "INV-2024-004",
    client: "Vertex Grid Co.",
    node: "NEO-TOKYO SUBSTATION",
    date: "Oct 15, 2024",
    amount: 4120.5,
    status: "PAID",
    billTo: {
      name: "Vertex Grid Co.",
      address: ["1-2-3 Shibuya", "Tokyo, Japan 150-0002"],
    },
    lineItems: [
      { label: "KW/h Consumption", description: "Node: NTK-SS (16,400 units)", total: 3280.0 },
      { label: "Peak Load Premium", description: "Network Overload Surcharge", total: 440.5 },
      { label: "Maintenance Fee", description: "Periodic Sensor Calibration", total: 400.0 },
    ],
    subtotal: 4120.5,
    tax: 0,
    grandTotal: 4120.5,
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function StatusBadge({ status }: { status: Invoice["status"] }) {
  if (status === "PAID")
    return (
      <span className="inline-flex items-center rounded-full bg-foreground px-3 py-0.5 text-xs font-semibold tracking-wider text-background">
        PAID
      </span>
    );
  if (status === "PROCESSING")
    return (
      <span className="inline-flex items-center rounded-full border border-foreground/40 px-3 py-0.5 text-xs font-semibold tracking-wider text-foreground">
        PROCESSING
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground">
      <span className="h-2 w-2 rounded-full bg-muted-foreground" />
      OVERDUE
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function UserFinancePage() {
  const router = useRouter();
  const [filter, setFilter] = useState<"ALL" | "PENDING">("ALL");
  const [selected, setSelected] = useState<Invoice | null>(null);

  const filtered =
    filter === "ALL"
      ? INVOICES
      : INVOICES.filter((i) => i.status !== "PAID");

  const handlePay = () => {
    if (selected) {
      router.push(`/user/finances/${selected.id}`);
    }
  };

  return (
    <div className="bg-background text-foreground">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="mb-1 text-2xl font-semibold sm:text-3xl">
          My Finances
        </h1>
        <p className="text-sm text-muted-foreground">
          View your transaction history and manage upcoming payments.
        </p>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-6">
        {/* -------- LEFT COLUMN -------- */}
        <div className={`min-w-0 ${selected ? "flex-1" : "w-full"}`}>
          {/* Stat cards */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {/* Total Spent */}
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Total Spent
              </p>
              <p className="text-2xl font-bold leading-tight sm:text-3xl">
                $16,570.50
              </p>
              <div className="mt-4 flex items-center gap-2">
                <div className="h-1 w-10 rounded-full bg-foreground" />
                <span className="text-xs text-muted-foreground">This Year</span>
              </div>
            </div>

            {/* Pending Balance */}
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Pending Balance
              </p>
              <p className="text-2xl font-bold leading-tight sm:text-3xl text-red-500">
                $30,010.00
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5" />
                2 Invoices Unpaid
              </div>
            </div>

            {/* Rewards / Credits */}
            <div className="rounded-xl border border-foreground/40 bg-card p-4">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Available Credits
              </p>
              <p className="text-2xl font-bold leading-tight sm:text-3xl">
                $150.00
              </p>
              <p className="mt-4 text-xs text-muted-foreground">
                To use on next billing
              </p>
            </div>
          </div>

          {/* Recent Invoices */}
          <div className="rounded-xl border border-border bg-card">
            {/* Toolbar */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-bold uppercase tracking-wider">
                  Recent Invoices
                </h2>
                <div className="flex overflow-hidden rounded-md border border-border">
                  <button
                    type="button"
                    onClick={() => setFilter("ALL")}
                    className={`px-3 py-1 text-xs font-semibold transition-colors ${
                      filter === "ALL"
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    ALL
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter("PENDING")}
                    className={`px-3 py-1 text-xs font-semibold transition-colors ${
                      filter === "PENDING"
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    PENDING
                  </button>
                </div>
              </div>
              <button type="button" className="text-muted-foreground hover:text-foreground">
                <SlidersHorizontal className="h-4 w-4" />
              </button>
            </div>

            {/* Table header */}
            <div className="grid grid-cols-[100px_1fr_90px_120px_110px] gap-2 border-b border-border px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground sm:px-6">
              <span>Invoice ID</span>
              <span>Client / Node</span>
              <span>Date</span>
              <span>Amount</span>
              <span>Status</span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-border">
              {filtered.map((inv) => (
                <button
                  key={inv.id}
                  type="button"
                  onClick={() => setSelected(inv)}
                  className={`grid w-full grid-cols-[100px_1fr_90px_120px_110px] gap-2 px-4 py-4 text-left text-sm transition-colors hover:bg-accent/50 sm:px-6 ${
                    selected?.id === inv.id ? "bg-accent/60" : ""
                  }`}
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    {inv.id}
                  </span>
                  <div>
                    <p className="font-medium leading-tight">{inv.client}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {inv.node}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {inv.date}
                  </span>
                  <span className="font-semibold">{fmt(inv.amount)}</span>
                  <span className="flex items-center">
                    <StatusBadge status={inv.status} />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* -------- RIGHT COLUMN – Invoice Preview -------- */}
        {selected && (
          <div className="hidden w-[380px] shrink-0 lg:block">
            <div className="sticky top-6 rounded-xl border border-border bg-card">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h2 className="text-xs font-bold uppercase tracking-widest">
                  Invoice Preview
                </h2>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5">
                {/* Brand + badge */}
                <div className="mb-6 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-foreground text-background">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div className="text-right">
                    <StatusBadge status={selected.status} />
                    <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                      {selected.id}
                    </p>
                  </div>
                </div>

                <h3 className="mb-5 text-lg font-bold tracking-wide">
                  VOLTCORE
                </h3>

                {/* Bill To */}
                <div className="mb-6">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Bill To
                  </p>
                  <p className="font-medium">{selected.billTo.name}</p>
                  {selected.billTo.address.map((line) => (
                    <p key={line} className="text-sm text-muted-foreground">
                      {line}
                    </p>
                  ))}
                </div>

                {/* Line items */}
                <div className="mb-4 border-t border-border pt-4">
                  <div className="mb-2 flex justify-between text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    <span>Line Item</span>
                    <span>Total</span>
                  </div>
                  <div className="space-y-3">
                    {selected.lineItems.map((li) => (
                      <div key={li.label} className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium">{li.label}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {li.description}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-semibold">
                          {fmt(li.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="border-t border-border pt-4">
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{fmt(selected.subtotal)}</span>
                  </div>
                  <div className="mb-3 flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax (0%)</span>
                    <span>{fmt(selected.tax)}</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Grand Total
                    </span>
                    <span className="text-2xl font-bold">{fmt(selected.grandTotal)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 space-y-3">
                  {selected.status !== "PAID" ? (
                    <Button
                      type="button"
                      onClick={handlePay}
                      className="h-auto w-full gap-2 bg-foreground py-3 text-xs font-bold uppercase tracking-widest text-background hover:bg-foreground/90"
                    >
                      <CreditCard className="h-4 w-4" /> Pay Now
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => router.push(`/user/finances/${selected.id}`)}
                      className="h-auto w-full gap-2 bg-foreground py-3 text-xs font-bold uppercase tracking-widest text-background hover:bg-foreground/90"
                    >
                      <Zap className="h-4 w-4" /> View Receipt
                    </Button>
                  )}
                </div>

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
