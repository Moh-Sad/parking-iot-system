"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Download,
  FileText,
  Info,
  Loader2,
  RefreshCw,
  Zap,
} from "lucide-react";
import { api, ApiCallError } from "@/lib/api";
import type { NotificationItem, Paginated } from "@/lib/api-types";
import { formatRelative } from "@/lib/format";

function classify(n: NotificationItem): "alert" | "billing" | "system" {
  if (n.kind === "CRITICAL" || n.kind === "WARNING") return "alert";
  const blob = `${n.title} ${n.body} ${n.link ?? ""}`.toLowerCase();
  if (blob.includes("invoice") || blob.includes("billing") || blob.includes("payment") || blob.includes("/finances")) {
    return "billing";
  }
  return "system";
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
}

export default function UserLogsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (showSpinner: boolean) => {
    if (showSpinner) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);
    try {
      const res = await api.get<Paginated<NotificationItem>>("/me/notifications?limit=50", { unwrap: false });
      setItems(res.data);
    } catch (err) {
      if (err instanceof ApiCallError) setError(err.message || "Failed to load notifications");
      else setError("Network error. Is the API server running?");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load(true);
  }, [load]);

  const markRead = async (id: string) => {
    try {
      await api.post(`/me/notifications/${id}/read`);
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
      );
    } catch {
      /* ignore */
    }
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await api.post("/me/notifications/read-all");
      const now = new Date().toISOString();
      setItems((prev) => prev.map((n) => (n.readAt ? n : { ...n, readAt: now })));
    } catch (err) {
      if (err instanceof ApiCallError) setError(err.message);
    } finally {
      setMarkingAll(false);
    }
  };

  const { alerts, system, billing, unreadAlerts } = useMemo(() => {
    const alerts: NotificationItem[] = [];
    const system: NotificationItem[] = [];
    const billing: NotificationItem[] = [];
    for (const n of items) {
      const c = classify(n);
      if (c === "alert") alerts.push(n);
      else if (c === "billing") billing.push(n);
      else system.push(n);
    }
    const unreadAlerts = alerts.filter((a) => !a.readAt).length;
    return { alerts, system, billing, unreadAlerts };
  }, [items]);

  if (isLoading) {
    return (
      <div className="flex min-h-96 items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-6 sm:mt-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-xl font-semibold text-foreground mb-1">Notification Center</h1>
          <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
            Real-Time Infrastructure Oversight
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void load(false)}
            disabled={isRefreshing}
            aria-label="Refresh"
            className="px-3 py-2 rounded border border-border text-xs text-muted-foreground hover:bg-muted/30 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} />
          </button>
          <button
            type="button"
            onClick={() => void markAllRead()}
            disabled={markingAll || items.every((n) => !!n.readAt)}
            className="px-4 py-2 rounded border border-border text-[10px] font-bold tracking-wider text-foreground hover:bg-muted/30 transition-colors uppercase disabled:opacity-50"
          >
            {markingAll ? "Marking…" : "Mark all as read"}
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Alerts */}
      <div className="bg-card border border-border/40 rounded-xl p-5 md:p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={16} className="text-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Alerts</h2>
          {unreadAlerts > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-foreground text-background text-[10px] font-bold tracking-wider uppercase">
              {unreadAlerts} New
            </span>
          )}
        </div>

        {alerts.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">No alerts.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {alerts.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => {
                  if (!a.readAt) void markRead(a.id);
                  if (a.link) window.location.href = a.link;
                }}
                className="relative bg-muted/40 rounded-lg p-4 pl-5 flex items-center justify-between group cursor-pointer hover:bg-muted/60 transition-colors border border-transparent hover:border-border/40 text-left"
              >
                <div className="absolute left-0 top-0 bottom-0 w-0.75 bg-foreground rounded-l-lg" />
                <div className="flex items-start gap-4">
                  <div className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${a.readAt ? "bg-muted-foreground/50" : "bg-foreground"}`} />
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{a.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{a.body}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-muted-foreground pl-4">
                  <span className="text-[10px] font-medium tracking-wider">{formatTime(a.createdAt)}</span>
                  <ChevronRight size={14} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System */}
        <div className="bg-card border border-border/40 rounded-xl p-5 md:p-6 flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <RefreshCw size={16} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">System</h2>
          </div>
          {system.length === 0 ? (
            <p className="py-2 text-sm text-muted-foreground">No system notifications.</p>
          ) : (
            <div className="flex flex-col gap-6">
              {system.slice(0, 6).map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    if (!n.readAt) void markRead(n.id);
                    if (n.link) window.location.href = n.link;
                  }}
                  className="flex items-start gap-4 text-left"
                >
                  <div className="shrink-0 mt-0.5">
                    {n.kind === "INFO" ? (
                      <Info size={16} className="text-muted-foreground" />
                    ) : (
                      <CheckCircle2 size={16} className="text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <h3 className={`text-sm ${n.readAt ? "font-medium text-muted-foreground" : "font-semibold text-foreground"}`}>
                      {n.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.body}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mt-1">
                      {formatRelative(n.createdAt)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Billing */}
        <div className="bg-card border border-border/40 rounded-xl p-5 md:p-6 flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Billing</h2>
          </div>
          {billing.length === 0 ? (
            <Link
              href="/user/finances"
              className="bg-muted/40 border border-border/40 rounded-lg p-5 flex items-center justify-between text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>No new billing items. View invoices →</span>
            </Link>
          ) : (
            <div className="flex flex-col gap-3">
              {billing.slice(0, 3).map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    if (!b.readAt) void markRead(b.id);
                    if (b.link) window.location.href = b.link;
                  }}
                  className="bg-muted/40 border border-border/40 rounded-lg p-5 flex flex-col gap-2 text-left hover:bg-muted/60 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase mb-1">
                        {b.kind === "CRITICAL" ? "Critical" : "Notice"}
                      </p>
                      <h3 className="text-base font-bold text-foreground">{b.title}</h3>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{b.body}</p>
                  <div className="flex items-end justify-between mt-2">
                    <p className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">
                      {formatRelative(b.createdAt)}
                    </p>
                    {b.link && (
                      <span className="text-muted-foreground hover:text-foreground transition-colors">
                        <Download size={14} />
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Network status (decorative summary) */}
      <div className="relative bg-card border border-border/40 rounded-xl p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full border border-border/40 flex items-center justify-center shrink-0">
            <CircleDot size={16} className="text-foreground" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground tracking-[0.15em] uppercase mb-1">
              Total notifications
            </p>
            <h3 className="text-lg font-bold text-foreground">{items.length}</h3>
          </div>
        </div>
        <div className="flex items-center gap-8 pr-12">
          <div className="text-right">
            <p className="text-[10px] font-bold text-muted-foreground tracking-[0.15em] uppercase mb-1">
              Unread
            </p>
            <p className="text-base font-bold text-foreground">{items.filter((n) => !n.readAt).length}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-muted-foreground tracking-[0.15em] uppercase mb-1">
              Critical
            </p>
            <p className="text-base font-bold text-foreground">{items.filter((n) => n.kind === "CRITICAL").length}</p>
          </div>
        </div>
        <button className="absolute -right-4 -bottom-4 w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center shadow-lg hover:scale-105 transition-transform z-10" aria-label="Quick action">
          <Zap size={20} className="fill-current" />
        </button>
      </div>
    </div>
  );
}
