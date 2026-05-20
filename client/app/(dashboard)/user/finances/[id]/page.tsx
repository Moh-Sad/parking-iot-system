"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, Loader2, Printer, QrCode } from "lucide-react";
import { api, ApiCallError } from "@/lib/api";
import type { ReceiptDto } from "@/lib/api-types";
import { formatMoney } from "@/lib/format";

function formatTimeRange(start: string, end: string | null): string {
  const startDate = new Date(start);
  if (Number.isNaN(startDate.getTime())) return "—";
  const dateStr = startDate.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const startTime = startDate.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
  if (end) {
    const endDate = new Date(end);
    const endTime = endDate.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
    return `${dateStr} · ${startTime} — ${endTime}`;
  }
  return `${dateStr} · ${startTime}`;
}

export default function ReceiptPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [receipt, setReceipt] = useState<ReceiptDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const r = await api.get<ReceiptDto>(`/me/sessions/${id}/receipt`);
      setReceipt(r);
    } catch (err) {
      if (err instanceof ApiCallError) {
        if (err.status === 404) setError("Receipt not found. The link may have expired or this is an invoice (not a session receipt).");
        else if (err.status === 403) setError("You don't have access to this receipt.");
        else setError(err.message || "Could not load receipt");
      } else {
        setError("Network error.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    void load();
  }, [id, load]);

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-6">
          <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error ?? "Receipt not found."}</span>
          </div>
          <button
            type="button"
            onClick={() => router.push("/user/finances")}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold transition hover:bg-muted/30"
          >
            <ArrowLeft className="h-4 w-4" /> Back to finances
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background p-4 text-foreground font-sans">
      <div className="w-full max-w-xl">
        <div className="rounded-xl border border-border bg-card p-8 shadow-2xl sm:p-10 print:border-0 print:shadow-none">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <h1 className="text-2xl font-bold tracking-widest text-foreground">VOLTCORE</h1>
              <p className="mt-1 text-sm text-muted-foreground">Transaction Receipt</p>
              <p className="text-sm text-muted-foreground">VAT ID: VC-98821-002</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Session ID</p>
              <p className="font-mono text-sm tracking-wider text-foreground">#{receipt.receiptCode}</p>
            </div>
          </div>

          <hr className="mb-8 border-border" />

          <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                Date &amp; Time
              </p>
              <p className="text-sm text-foreground">{formatTimeRange(receipt.date, receipt.endTime)}</p>
            </div>
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                Vehicle Identity
              </p>
              <p className="text-sm text-foreground">{receipt.vehicleModel} · *{receipt.vehiclePlateLast4}</p>
            </div>
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                Location
              </p>
              <p className="text-sm text-foreground">{receipt.station.name} · {receipt.station.code}</p>
              {receipt.station.address && (
                <p className="text-sm text-muted-foreground mt-0.5">{receipt.station.address}</p>
              )}
            </div>
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                Connector Type
              </p>
              <p className="text-sm text-foreground">
                {receipt.connectorType}{receipt.peakPowerKW ? ` · ${receipt.peakPowerKW}kW Peak` : ""}
              </p>
            </div>
          </div>

          <div className="mb-8 grid grid-cols-2 rounded-xl border border-border bg-accent/50 py-6">
            <div className="flex flex-col items-center justify-center border-r border-border px-4 text-center">
              <p className="text-3xl font-bold text-foreground">
                {receipt.energyDeliveredKWh ?? "—"}
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                kWh Delivered
              </p>
            </div>
            <div className="flex flex-col items-center justify-center px-4 text-center">
              <p className="text-3xl font-bold text-foreground">{receipt.durationMinutes ?? "—"}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                Minutes Charged
              </p>
            </div>
          </div>

          <div className="mb-8 space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Breakdown</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Energy Consumption ({receipt.energyDeliveredKWh ?? "—"} kWh
                {receipt.unitCostPerKWhCents != null ? ` @ ${formatMoney(receipt.unitCostPerKWhCents, receipt.currency)}/kWh` : ""})
              </span>
              <span className="font-semibold text-foreground">
                {formatMoney(receipt.energyCostCents, receipt.currency)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Facility Service Fee</span>
              <span className="font-semibold text-foreground">{formatMoney(receipt.facilityFeeCents, receipt.currency)}</span>
            </div>
            {receipt.idleFeeCents > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Idle Fee {receipt.idleMinutes > 0 ? `(Overstay ${receipt.idleMinutes} min)` : ""}
                </span>
                <span className="font-semibold text-foreground">{formatMoney(receipt.idleFeeCents, receipt.currency)}</span>
              </div>
            )}
            {receipt.taxCents > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Applicable Tax</span>
                <span className="font-semibold text-foreground">{formatMoney(receipt.taxCents, receipt.currency)}</span>
              </div>
            )}
          </div>

          <hr className="mb-6 border-border" />

          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-1">
                Total Charged
              </p>
              {receipt.paymentMethod && (
                <p className="text-sm text-muted-foreground">
                  Billed to {receipt.paymentMethod.brand} ···· {receipt.paymentMethod.last4}
                </p>
              )}
            </div>
            <p className="text-4xl font-bold tracking-tight text-foreground">
              {formatMoney(receipt.totalCostCents, receipt.currency)}
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Thank you for powering with VoltCore.</p>
              {receipt.carbonOffsetGramsCO2e != null && (
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Carbon Offset for this session: {(receipt.carbonOffsetGramsCO2e / 1000).toFixed(1)}kg CO2e
                </p>
              )}
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-foreground p-2">
              <QrCode className="h-full w-full text-background" />
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-3 print:hidden">
          <button
            type="button"
            onClick={() => router.push("/user/finances")}
            className="flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold transition hover:bg-muted/30"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-bold tracking-wide text-background transition-transform hover:scale-105 active:scale-95"
          >
            <Printer className="h-4 w-4" />
            Print Document
          </button>
        </div>
      </div>
    </div>
  );
}
