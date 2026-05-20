"use client";
import {
  AlertTriangle,
  RefreshCw,
  FileText,
  ChevronRight,
  CheckCircle2,
  Info,
  Download,
  CircleDot,
  Zap,
} from "lucide-react";
export default function UserLogsPage() {
  return (
    <div className="mt-2 flex flex-col gap-6 sm:mt-4 max-w-5xl">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-xl font-semibold text-foreground mb-1">
            Notification Center
          </h1>
          <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
            Real-Time Infrastructure Oversight
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 rounded border border-border text-[10px] font-bold tracking-wider text-foreground hover:bg-muted/30 transition-colors uppercase">
            Mark all as read
          </button>
          <button className="px-4 py-2 rounded bg-foreground text-background text-[10px] font-bold tracking-wider hover:opacity-90 transition-opacity uppercase">
            Archive log
          </button>
        </div>
      </div>
      {/* ── Alerts Section ── */}
      <div className="bg-[#0a0a0a] border border-border/40 rounded-xl p-5 md:p-6 flex flex-col gap-4">
        {/* Section Header */}
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={16} className="text-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Alerts</h2>
          <span className="ml-2 px-2 py-0.5 rounded-full bg-foreground text-background text-[10px] font-bold tracking-wider uppercase">
            2 New
          </span>
        </div>
        {/* Alert Items */}
        <div className="flex flex-col gap-3">
          {/* Alert 1 */}
          <div className="relative bg-[#141414] rounded-lg p-4 pl-5 flex items-center justify-between group cursor-pointer hover:bg-[#1a1a1a] transition-colors border border-transparent hover:border-border/40">
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-foreground rounded-l-lg" />
            <div className="flex items-start gap-4">
              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-foreground shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Critical Voltage Drop: Station #402
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Thermal sensors at Sector G indicate abnormal fluctuation. Shutdown procedure initialized.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-muted-foreground pl-4">
              <span className="text-[10px] font-medium tracking-wider">14:22 PM</span>
              <ChevronRight size={14} className="opacity-50 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          {/* Alert 2 */}
          <div className="relative bg-[#141414] rounded-lg p-4 pl-5 flex items-center justify-between group cursor-pointer hover:bg-[#1a1a1a] transition-colors border border-transparent hover:border-border/40">
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-foreground rounded-l-lg" />
            <div className="flex items-start gap-4">
              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-foreground shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Unauthorized Access Attempt
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Cabinet 04 physical seal broken. Security dispatched to location.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-muted-foreground pl-4">
              <span className="text-[10px] font-medium tracking-wider">13:05 PM</span>
              <ChevronRight size={14} className="opacity-50 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>
      </div>
      {/* ── Middle Section: System & Billing ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* System Column */}
        <div className="bg-[#0a0a0a] border border-border/40 rounded-xl p-5 md:p-6 flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <RefreshCw size={16} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">System</h2>
          </div>
          <div className="flex flex-col gap-6">
            <div className="flex items-start gap-4">
              <div className="shrink-0 mt-0.5">
                <CheckCircle2 size={16} className="text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Firmware Update Successful
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  v 2.4.0 deployed across 156 nodes without interruption.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="shrink-0 mt-0.5">
                <Info size={16} className="text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Scheduled Maintenance Notice
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Node Cluster Alpha offline for cooling optimization on 12/04.
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Billing Column */}
        <div className="bg-[#0a0a0a] border border-border/40 rounded-xl p-5 md:p-6 flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Billing</h2>
          </div>
          <div className="bg-[#141414] border border-border/40 rounded-lg p-5 flex flex-col gap-2 mt-auto mb-auto">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase mb-1">
                  Invoice Generated
                </p>
                <h3 className="text-base font-bold text-foreground">
                  #VC-8832-G
                </h3>
              </div>
              <p className="text-sm font-bold text-foreground">
                $12,440.00
              </p>
            </div>
            <div className="flex items-end justify-between mt-4">
              <p className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">
                Due in 4 days
              </p>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <Download size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* ── Bottom Section: Network Status ── */}
      <div className="relative bg-[#0a0a0a] border border-border/40 rounded-xl p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full border border-border/40 flex items-center justify-center shrink-0">
            <CircleDot size={16} className="text-foreground" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground tracking-[0.15em] uppercase mb-1">
              Network Stability
            </p>
            <h3 className="text-lg font-bold text-foreground">
              98.4% Nominal
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-8 pr-12">
          <div className="text-right">
            <p className="text-[10px] font-bold text-muted-foreground tracking-[0.15em] uppercase mb-1">
              Active Nodes
            </p>
            <p className="text-base font-bold text-foreground">
              1,044
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-muted-foreground tracking-[0.15em] uppercase mb-1">
              MTTR AVG
            </p>
            <p className="text-base font-bold text-foreground">
              14m
            </p>
          </div>
        </div>
        {/* Floating Action Button (like the image bottom right) */}
        <button className="absolute -right-4 -bottom-4 w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center shadow-lg hover:scale-105 transition-transform z-10">
          <Zap size={20} className="fill-current" />
        </button>
      </div>
    </div>
  );
}