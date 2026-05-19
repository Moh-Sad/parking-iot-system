"use client";

import { use } from "react";
import { Printer, QrCode } from "lucide-react";

export default function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background p-4 text-foreground font-sans">
      <div className="w-full max-w-xl">
        {/* Receipt Card */}
        <div className="rounded-xl border border-border bg-card p-8 shadow-2xl sm:p-10">
          
          {/* Header */}
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <h1 className="text-2xl font-bold tracking-widest text-foreground">
                VOLTCORE
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">Transaction Receipt</p>
              <p className="text-sm text-muted-foreground">VAT ID: VC-98821-002</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                Session ID
              </p>
              <p className="font-mono text-sm tracking-wider text-foreground">
                #{resolvedParams.id}
              </p>
            </div>
          </div>

          <hr className="mb-8 border-border" />

          {/* Details Grid */}
          <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                Date & Time
              </p>
              <p className="text-sm text-foreground">
                October 24, 2023 - 14:32 — 15:48
              </p>
            </div>
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                Vehicle Identity
              </p>
              <p className="text-sm text-foreground">Model S Plaid · *8921</p>
            </div>
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                Location
              </p>
              <p className="text-sm text-foreground">
                HyperHub Station · Port-822
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                122 Industrial Way, San Francisco, CA
              </p>
            </div>
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                Connector Type
              </p>
              <p className="text-sm text-foreground">CCS Combo 2 · 350kW Peak</p>
            </div>
          </div>

          {/* Metrics Box */}
          <div className="mb-8 grid grid-cols-2 rounded-xl border border-border bg-accent/50 py-6">
            <div className="flex flex-col items-center justify-center border-r border-border px-4 text-center">
              <p className="text-3xl font-bold text-foreground">64.2</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                kWh Delivered
              </p>
            </div>
            <div className="flex flex-col items-center justify-center px-4 text-center">
              <p className="text-3xl font-bold text-foreground">76</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                Minutes Charged
              </p>
            </div>
          </div>

          {/* Breakdown */}
          <div className="mb-8 space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
              Breakdown
            </p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Energy Consumption (64.2 kWh @ $0.42/kWh)</span>
              <span className="font-semibold text-foreground">$26.96</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Facility Service Fee</span>
              <span className="font-semibold text-foreground">$2.50</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Idle Fee (Overstay 12 min)</span>
              <span className="font-semibold text-foreground">$4.00</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Applicable Tax (8.5%)</span>
              <span className="font-semibold text-foreground">$2.84</span>
            </div>
          </div>

          <hr className="mb-6 border-border" />

          {/* Total */}
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-1">
                Total Charged
              </p>
              <p className="text-sm text-muted-foreground">Billed to VISA ···· 4429</p>
            </div>
            <p className="text-4xl font-bold tracking-tight text-foreground">$36.30</p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Thank you for powering with VoltCore.</p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Carbon Offset for this session: 42.8kg CO2e
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-foreground p-2">
              <QrCode className="h-full w-full text-background" />
            </div>
          </div>

        </div>

        {/* Print Button */}
        <div className="mt-8 flex justify-center">
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
