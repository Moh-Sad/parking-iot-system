"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, ApiCallError } from "@/lib/api";
import type { AuditLogRow, LogsMetrics, Paginated } from "@/lib/api-types";

const COMPONENT_TABS = ["", "Auth", "Slots", "Invoices", "Settings"] as const;
type Tab = (typeof COMPONENT_TABS)[number];

const STATUS_TONE: Record<AuditLogRow["status"], string> = {
  SUCCESS: "border-border bg-muted/10 text-foreground",
  IN_PROGRESS: "border-border bg-muted/20 text-muted-foreground",
  FLAGGED: "border-destructive/30 bg-destructive/15 text-destructive",
};

const STATUS_LABEL: Record<AuditLogRow["status"], string> = {
  SUCCESS: "SUCCESS",
  IN_PROGRESS: "IN PROGRESS",
  FLAGGED: "FLAGGED",
};

function formatTimestamp(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function formatDetails(details: unknown): string {
  if (!details || typeof details !== "object") return "";
  return Object.entries(details as Record<string, unknown>)
    .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
    .join(" · ");
}

export default function AdminLogsPage() {
  const [rows, setRows] = useState<AuditLogRow[]>([]);
  const [meta, setMeta] = useState<Paginated<AuditLogRow>["meta"] | null>(null);
  const [metrics, setMetrics] = useState<LogsMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<Tab>("");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "20");
    if (tab) params.set("component", tab);
    return params.toString();
  }, [page, tab]);

  const load = useCallback(
    async (showSpinner: boolean) => {
      if (showSpinner) setIsLoading(true);
      else setIsRefreshing(true);
      setError(null);
      try {
        const [logsRes, metricsRes] = await Promise.all([
          api.get<Paginated<AuditLogRow>>(`/logs?${query}`, { unwrap: false }),
          api.get<LogsMetrics>("/logs/metrics"),
        ]);
        setRows(logsRes.data);
        setMeta(logsRes.meta);
        setMetrics(metricsRes);
      } catch (err) {
        if (err instanceof ApiCallError) setError(err.message || "Failed to load logs");
        else setError("Network error. Is the API server running?");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [query],
  );

  useEffect(() => {
    void load(true);
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [tab]);

  const exportCsv = async () => {
    setExporting(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (tab) params.set("component", tab);
      const res = await api.raw(`/logs/export.csv?${params.toString()}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "audit-logs.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const totalPages = meta?.totalPages ?? 1;

  return (
    <div className="space-y-6 bg-background text-foreground">
      <section className="rounded-xl border border-border/50 bg-card p-4 sm:p-6">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <h1 className="text-2xl font-semibold">System Audit Logs</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Real-time monitoring of all network events and user interactions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => void load(false)}
              disabled={isRefreshing}
              className="h-9 border-border/60 bg-muted/10 text-xs text-muted-foreground hover:bg-muted/20"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled
              className="h-9 border-border/60 bg-muted/10 text-xs text-muted-foreground hover:bg-muted/20"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              All dates
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void exportCsv()}
              disabled={exporting}
              className="h-9 border-border/60 bg-muted/10 text-xs font-semibold tracking-wide"
            >
              {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              EXPORT CSV
            </Button>
          </div>
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

        <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Critical Errors" value={metrics?.criticalErrors ?? 0} hint={metrics && metrics.criticalErrors === 0 ? "Stable" : "Needs attention"} />
          <MetricCard label="Daily Actions" value={metrics?.dailyActions ?? 0} hint="Last 24 hours" />
          <MetricCard label="Network Uptime" value={metrics ? `${metrics.networkUptime}%` : "—"} hint="" />
          <MetricCard label="Active Nodes" value={metrics?.activeNodes ?? 0} hint="Stations online" />
        </div>

        <div className="overflow-hidden rounded-xl border border-border/60 bg-background">
          <div className="flex flex-col gap-3 border-b border-border/60 bg-muted/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {COMPONENT_TABS.map((t) => {
                const active = t === tab;
                return (
                  <button
                    key={t || "all"}
                    type="button"
                    onClick={() => setTab(t)}
                    className={`h-7 rounded-full border px-3 text-[10px] font-semibold tracking-wide uppercase transition ${
                      active
                        ? "border-border bg-muted text-foreground"
                        : "border-border/70 bg-transparent text-muted-foreground hover:bg-muted/20 hover:text-foreground"
                    }`}
                  >
                    {t || "Live Stream"}
                  </button>
                );
              })}
            </div>
            {meta && (
              <p className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                {meta.total.toLocaleString()} TOTAL EVENTS
              </p>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-245 w-full text-left">
              <thead className="border-b border-border/60 bg-muted/10">
                <tr className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">System Component</th>
                  <th className="px-4 py-3">User / Identity</th>
                  <th className="px-4 py-3">Action &amp; Parameters</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      No log entries.
                    </td>
                  </tr>
                ) : (
                  rows.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-border/50 text-sm hover:bg-muted/10"
                    >
                      <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex rounded-sm border border-border/70 bg-muted/20 px-2 py-1 text-[10px] font-semibold tracking-wide">
                          {log.component}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-2 text-sm">
                          <span className="h-2.5 w-2.5 rounded-full border border-border bg-muted" />
                          <span className="text-muted-foreground">{log.user?.name ?? "system"}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-medium">{log.action}</span>
                        {formatDetails(log.details) && (
                          <span className="text-muted-foreground"> · {formatDetails(log.details)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span
                          className={`inline-flex rounded-md border px-2 py-1 text-[10px] font-semibold tracking-wide uppercase ${STATUS_TONE[log.status]}`}
                        >
                          {STATUS_LABEL[log.status]}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-border/60 bg-muted/10 px-4 py-3 text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase sm:flex-row sm:items-center sm:justify-between">
            <p>
              {meta
                ? `Showing ${rows.length.toLocaleString()} of ${meta.total.toLocaleString()} entries`
                : "—"}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-7 w-7 rounded-md border border-border/70 text-muted-foreground disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="px-2">
                PAGE {page} / {totalPages.toLocaleString()}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-7 w-7 rounded-md border border-border/70 text-muted-foreground disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value, hint }: { label: string; value: number | string; hint: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-background p-4 sm:p-5">
      <p className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">{label}</p>
      <div className="mt-3 flex items-end gap-2">
        <p className="text-4xl leading-none font-semibold tracking-tight">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        {hint ? (
          <span className="pb-0.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            {hint}
          </span>
        ) : null}
      </div>
    </div>
  );
}
