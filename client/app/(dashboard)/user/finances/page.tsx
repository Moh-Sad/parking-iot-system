"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CreditCard, Loader2, SlidersHorizontal, TrendingUp, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, ApiCallError } from "@/lib/api";
import type {
  InvoiceDetail,
  Paginated,
  UserFinancesSummary,
  UserInvoiceRow,
} from "@/lib/api-types";
import { formatMoney } from "@/lib/format";
import { TopUpDialog } from "@/components/TopUpDialog";

function StatusBadge({ status }: { status: UserInvoiceRow["status"] }) {
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
      <span className="h-2 w-2 rounded-full bg-destructive" />
      OVERDUE
    </span>
  );
}

export default function UserFinancePage() {
  const router = useRouter();
  const [filter, setFilter] = useState<"ALL" | "PENDING">("ALL");
  const [rows, setRows] = useState<UserInvoiceRow[]>([]);
  const [summary, setSummary] = useState<UserFinancesSummary | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<InvoiceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [s, list] = await Promise.all([
        api.get<UserFinancesSummary>("/me/finances/summary"),
        api.get<Paginated<UserInvoiceRow>>(`/me/finances/invoices?status=${filter}&limit=50`, { unwrap: false }),
      ]);
      setSummary(s);
      setRows(list.data);
    } catch (err) {
      if (err instanceof ApiCallError) setError(err.message || "Failed to load finances");
      else setError("Network error. Is the API server running?");
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!selectedId) {
      setSelected(null);
      return;
    }
    let cancelled = false;
    setIsDetailLoading(true);
    (async () => {
      try {
        const det = await api.get<InvoiceDetail>(`/me/finances/invoices/${selectedId}`);
        if (!cancelled) setSelected(det);
      } catch {
        if (!cancelled) setSelected(null);
      } finally {
        if (!cancelled) setIsDetailLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const payNow = async () => {
    if (!selected) return;
    setPaying(true);
    try {
      await api.post(`/me/finances/invoices/${selected.id}/pay`, { useWalletBalance: true });
      await load();
      const refreshed = await api.get<InvoiceDetail>(`/me/finances/invoices/${selected.id}`);
      setSelected(refreshed);
    } catch (err) {
      if (err instanceof ApiCallError) setError(err.message || "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="bg-background text-foreground">
      <div className="mb-6 md:mb-8">
        <h1 className="mb-1 text-2xl font-semibold sm:text-3xl">My Finances</h1>
        <p className="text-sm text-muted-foreground">
          View your transaction history and manage upcoming payments.
        </p>
      </div>

      {error && (
        <div role="alert" className="mb-4 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex gap-6">
        <div className={`min-w-0 ${selectedId ? "flex-1" : "w-full"}`}>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Total Spent
              </p>
              <p className="text-2xl font-bold leading-tight sm:text-3xl">
                {summary ? formatMoney(summary.totalSpentYearToDateCents, summary.currency) : "—"}
              </p>
              <div className="mt-4 flex items-center gap-2">
                <div className="h-1 w-10 rounded-full bg-foreground" />
                <span className="text-xs text-muted-foreground">This Year</span>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Pending Balance
              </p>
              <p className={`text-2xl font-bold leading-tight sm:text-3xl ${summary && summary.pendingBalanceCents > 0 ? "text-destructive" : ""}`}>
                {summary ? formatMoney(summary.pendingBalanceCents, summary.currency) : "—"}
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5" />
                {summary
                  ? `${summary.unpaidInvoiceCount} Invoice${summary.unpaidInvoiceCount === 1 ? "" : "s"} Unpaid`
                  : "—"}
              </div>
            </div>

            <div className="rounded-xl border border-foreground/40 bg-card p-4">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Wallet Balance
              </p>
              <p className="text-2xl font-bold leading-tight sm:text-3xl">
                {summary ? formatMoney(summary.availableCreditsCents, summary.currency) : "—"}
              </p>
              <TopUpDialog
                trigger={
                  <button
                    type="button"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    Top up →
                  </button>
                }
                onSuccess={() => load()}
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-bold uppercase tracking-wider">Recent Invoices</h2>
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
              <button type="button" className="text-muted-foreground hover:text-foreground" aria-label="Filters">
                <SlidersHorizontal className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-[100px_1fr_90px_120px_110px] gap-2 border-b border-border px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground sm:px-6">
              <span>Invoice ID</span>
              <span>Client / Node</span>
              <span>Date</span>
              <span>Amount</span>
              <span>Status</span>
            </div>

            <div className="divide-y divide-border">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : rows.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  No invoices found.
                </p>
              ) : (
                rows.map((inv) => (
                  <button
                    key={inv.id}
                    type="button"
                    onClick={() => setSelectedId(inv.id)}
                    className={`grid w-full grid-cols-[100px_1fr_90px_120px_110px] gap-2 px-4 py-4 text-left text-sm transition-colors hover:bg-accent/50 sm:px-6 ${
                      selectedId === inv.id ? "bg-accent/60" : ""
                    }`}
                  >
                    <span className="font-mono text-xs text-muted-foreground">{inv.code}</span>
                    <div>
                      <p className="font-medium leading-tight">{inv.client}</p>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {inv.node}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(inv.date).toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" })}
                    </span>
                    <span className="font-semibold">{formatMoney(inv.amount, inv.currency)}</span>
                    <span className="flex items-center">
                      <StatusBadge status={inv.status} />
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Invoice preview */}
        {selectedId && (
          <div className="hidden w-[380px] shrink-0 lg:block">
            <div className="sticky top-6 rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h2 className="text-xs font-bold uppercase tracking-widest">Invoice Preview</h2>
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Close preview"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {isDetailLoading || !selected ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="p-5">
                  <div className="mb-6 flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-foreground text-background">
                      <Zap className="h-5 w-5" />
                    </div>
                    <div className="text-right">
                      <StatusBadge status={selected.status} />
                      <p className="mt-1 font-mono text-[10px] text-muted-foreground">{selected.code}</p>
                    </div>
                  </div>

                  <h3 className="mb-5 text-lg font-bold tracking-wide">VOLTCORE</h3>

                  <div className="mb-6">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Bill To
                    </p>
                    <p className="font-medium">
                      {(selected.billTo as { name: string }).name}
                    </p>
                    {((selected.billTo as { address: string[] }).address ?? []).map((line) => (
                      <p key={line} className="text-sm text-muted-foreground">
                        {line}
                      </p>
                    ))}
                  </div>

                  <div className="mb-4 border-t border-border pt-4">
                    <div className="mb-2 flex justify-between text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      <span>Line Item</span>
                      <span>Total</span>
                    </div>
                    <div className="space-y-3">
                      {selected.lineItems.map((li) => (
                        <div key={li.id} className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium">{li.label}</p>
                            <p className="text-[10px] text-muted-foreground">{li.description}</p>
                          </div>
                          <span className="shrink-0 text-sm font-semibold">
                            {formatMoney(li.totalCents, selected.currency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatMoney(selected.subtotalCents, selected.currency)}</span>
                    </div>
                    <div className="mb-3 flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax</span>
                      <span>{formatMoney(selected.taxCents, selected.currency)}</span>
                    </div>
                    <div className="flex items-end justify-between">
                      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Grand Total
                      </span>
                      <span className="text-2xl font-bold">
                        {formatMoney(selected.grandTotalCents, selected.currency)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    {selected.status !== "PAID" ? (
                      <Button
                        type="button"
                        onClick={() => void payNow()}
                        disabled={paying}
                        className="h-auto w-full gap-2 bg-foreground py-3 text-xs font-bold uppercase tracking-widest text-background hover:bg-foreground/90 disabled:opacity-60"
                      >
                        {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                        {paying ? "Processing…" : "Pay Now"}
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
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
