"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  AlertCircle,
  Download,
  Loader2,
  RefreshCw,
  Share2,
  SlidersHorizontal,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, ApiCallError } from "@/lib/api";
import type {
  InvoiceDetail,
  InvoiceSummary,
  Paginated,
} from "@/lib/api-types";
import { formatMoney } from "@/lib/format";

type Filter = "ALL" | "PENDING";

function StatusBadge({ status }: { status: InvoiceSummary["status"] }) {
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

function formatShortDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" });
}

export default function FinancesPage() {
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<InvoiceDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const loadList = useCallback(async (showSpinner: boolean) => {
    if (showSpinner) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);
    try {
      const res = await api.get<Paginated<InvoiceSummary>>(
        "/invoices?limit=100",
        { unwrap: false },
      );
      setInvoices(res.data);
    } catch (err) {
      if (err instanceof ApiCallError) setError(err.message || "Failed to load invoices");
      else setError("Network error. Is the API server running?");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadList(true);
  }, [loadList]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setIsLoadingDetail(true);
    (async () => {
      try {
        const d = await api.get<InvoiceDetail>(`/invoices/${selectedId}`);
        if (!cancelled) setDetail(d);
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiCallError) setError(err.message);
          else setError("Failed to load invoice detail");
        }
      } finally {
        if (!cancelled) setIsLoadingDetail(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const filtered = filter === "ALL" ? invoices : invoices.filter((i) => i.status !== "PAID");

  // Stats derived from the loaded list.
  const totalOutstandingCents = invoices
    .filter((i) => i.status === "OVERDUE" || i.status === "PROCESSING")
    .reduce((acc, i) => acc + i.amount, 0);
  const last24hCents = invoices
    .filter((i) => i.status === "PAID" && Date.now() - new Date(i.date).getTime() < 86_400_000)
    .reduce((acc, i) => acc + i.amount, 0);
  const activeAccounts = new Set(invoices.map((i) => i.client)).size;
  const currency = invoices[0]?.currency ?? "ETB";

  const downloadPdf = async () => {
    if (!detail) return;
    setDownloading(true);
    try {
      const res = await api.raw(`/invoices/${detail.id}/pdf`);
      if (!res.ok) throw new Error("Failed to download PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${detail.code}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  };

  const submitShare = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!detail) return;
    const form = new FormData(e.currentTarget);
    const recipients = (form.get("recipients") as string | null)?.trim() ?? "";
    const message = (form.get("message") as string | null)?.trim() ?? "";
    const list = recipients
      .split(/[,;\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (list.length === 0) {
      setError("Enter at least one recipient email.");
      return;
    }
    setSharing(true);
    setError(null);
    try {
      await api.post(`/invoices/${detail.id}/share`, {
        to: list,
        ...(message ? { message } : {}),
      });
      setShareOpen(false);
    } catch (err) {
      if (err instanceof ApiCallError) setError(err.message || "Failed to share invoice");
      else setError("Network error");
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="bg-background text-foreground">
      <div className="mb-6 md:mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl font-semibold sm:text-3xl">Billing &amp; Invoices</h1>
          <p className="text-sm text-muted-foreground">
            Manage enterprise-level billing cycles and network transaction logs.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadList(false)}
          disabled={isLoading || isRefreshing}
          aria-label="Refresh invoices"
          className="rounded-md border border-border/60 bg-background p-2 text-muted-foreground transition hover:bg-muted/40 hover:text-foreground disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex gap-6">
        <div className={`min-w-0 ${detail ? "flex-1" : "w-full"}`}>
          {/* Stat cards */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Total Outstanding
              </p>
              <p className="text-2xl font-bold leading-tight sm:text-3xl">
                {formatMoney(totalOutstandingCents, currency)}
              </p>
              <p className="mt-4 text-xs text-muted-foreground">
                {invoices.filter((i) => i.status !== "PAID").length} pending invoice
                {invoices.filter((i) => i.status !== "PAID").length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Processed (24H)
              </p>
              <p className="text-2xl font-bold leading-tight sm:text-3xl">
                {formatMoney(last24hCents, currency)}
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5" />
                Paid in last 24h
              </div>
            </div>

            <div className="rounded-xl border border-foreground/40 bg-card p-4">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Active Accounts
              </p>
              <p className="text-2xl font-bold leading-tight sm:text-3xl">{activeAccounts}</p>
              <p className="mt-4 text-xs text-muted-foreground">Distinct clients billed</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Total Invoices
              </p>
              <p className="text-2xl font-bold leading-tight sm:text-3xl">{invoices.length}</p>
              <p className="mt-4 text-xs text-muted-foreground">In current view</p>
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

            <div className="grid grid-cols-[120px_1fr_90px_120px_110px] gap-2 border-b border-border px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground sm:px-6">
              <span>Invoice ID</span>
              <span>Client / Node</span>
              <span>Date</span>
              <span>Amount</span>
              <span>Status</span>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="px-6 py-12 text-center text-sm text-muted-foreground">
                No invoices matching this filter.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map((inv) => (
                  <button
                    key={inv.id}
                    type="button"
                    onClick={() => setSelectedId(inv.id)}
                    className={`grid w-full grid-cols-[120px_1fr_90px_120px_110px] gap-2 px-4 py-4 text-left text-sm transition-colors hover:bg-accent/50 sm:px-6 ${
                      selectedId === inv.id ? "bg-accent/60" : ""
                    }`}
                  >
                    <span className="font-mono text-xs text-muted-foreground truncate">{inv.code}</span>
                    <div className="min-w-0">
                      <p className="font-medium leading-tight truncate">{inv.client}</p>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">
                        {inv.node}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatShortDate(inv.date)}</span>
                    <span className="font-semibold">{formatMoney(inv.amount, inv.currency)}</span>
                    <span className="flex items-center">
                      <StatusBadge status={inv.status} />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detail panel */}
        {selectedId && (
          <div className="hidden w-[380px] shrink-0 lg:block">
            <div className="sticky top-6 rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h2 className="text-xs font-bold uppercase tracking-widest">Invoice Preview</h2>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(null);
                    setShareOpen(false);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Close preview"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {isLoadingDetail || !detail ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="p-5">
                  <div className="mb-6 flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-foreground text-background">
                      <Zap className="h-5 w-5" />
                    </div>
                    <div className="text-right">
                      <StatusBadge status={detail.status} />
                      <p className="mt-1 font-mono text-[10px] text-muted-foreground">{detail.code}</p>
                    </div>
                  </div>

                  <h3 className="mb-5 text-lg font-bold tracking-wide">PARKING IOT</h3>

                  <div className="mb-6">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Bill To
                    </p>
                    <p className="font-medium">{detail.billTo.name}</p>
                    {detail.billTo.address.map((line, idx) => (
                      <p key={`${line}-${idx}`} className="text-sm text-muted-foreground">
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
                      {detail.lineItems.map((li) => (
                        <div key={li.id} className="flex items-start justify-between">
                          <div className="min-w-0 pr-3">
                            <p className="text-sm font-medium">{li.label}</p>
                            <p className="text-[10px] text-muted-foreground">{li.description}</p>
                          </div>
                          <span className="shrink-0 text-sm font-semibold">
                            {formatMoney(li.totalCents, detail.currency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatMoney(detail.subtotalCents, detail.currency)}</span>
                    </div>
                    <div className="mb-3 flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax</span>
                      <span>{formatMoney(detail.taxCents, detail.currency)}</span>
                    </div>
                    <div className="flex items-end justify-between">
                      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Grand Total
                      </span>
                      <span className="text-2xl font-bold">
                        {formatMoney(detail.grandTotalCents, detail.currency)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <Button
                      type="button"
                      onClick={() => void downloadPdf()}
                      disabled={downloading}
                      className="h-auto w-full gap-2 bg-foreground py-3 text-xs font-bold uppercase tracking-widest text-background hover:bg-foreground/90 disabled:opacity-60"
                    >
                      {downloading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      {downloading ? "Downloading…" : "Export PDF"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShareOpen((v) => !v)}
                      className="h-auto w-full gap-2 border-foreground/20 py-3 text-xs font-bold uppercase tracking-widest hover:bg-accent"
                    >
                      <Share2 className="h-4 w-4" /> {shareOpen ? "Close" : "Share invoice"}
                    </Button>

                    {shareOpen && (
                      <form onSubmit={submitShare} className="space-y-2 rounded-lg border border-border bg-background p-3">
                        <label className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                          Recipients (comma-separated emails)
                        </label>
                        <input
                          name="recipients"
                          type="text"
                          required
                          placeholder="ops@client.com, finance@client.com"
                          className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
                          disabled={sharing}
                        />
                        <label className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                          Message (optional)
                        </label>
                        <textarea
                          name="message"
                          rows={2}
                          placeholder="Please find attached…"
                          className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
                          disabled={sharing}
                        />
                        <Button
                          type="submit"
                          disabled={sharing}
                          className="h-auto w-full gap-2 bg-foreground py-2.5 text-xs font-bold uppercase tracking-widest text-background hover:bg-foreground/90 disabled:opacity-60"
                        >
                          {sharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                          {sharing ? "Sending…" : "Send"}
                        </Button>
                      </form>
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
