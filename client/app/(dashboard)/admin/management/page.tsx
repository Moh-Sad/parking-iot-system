"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { AlertCircle, Download, KeyRound, Loader2, MoreVertical, RefreshCw, Trash2 } from "lucide-react";
import { AddSupervisorDialog } from "@/components/AddSupervisorDialog";
import { Select } from "@/components/ui/select";
import { api, ApiCallError } from "@/lib/api";
import type { Paginated, UserRow } from "@/lib/api-types";
import { formatDate } from "@/lib/format";

const STATUS_DOT: Record<UserRow["status"], string> = {
  ACTIVE: "bg-emerald-500",
  SUSPENDED: "bg-destructive",
  INVITED: "bg-yellow-500",
};

const STATUS_LABEL: Record<UserRow["status"], string> = {
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
  INVITED: "Invited",
};

function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

export default function SupervisorManagementPage() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [meta, setMeta] = useState<Paginated<UserRow>["meta"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [activityFilter, setActivityFilter] = useState("");

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "20");
    if (roleFilter) params.set("role", roleFilter);
    if (regionFilter) params.set("region", regionFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (activityFilter) params.set("lastActivity", activityFilter);
    return params.toString();
  }, [page, roleFilter, regionFilter, statusFilter, activityFilter]);

  const load = useCallback(
    async (showSpinner: boolean) => {
      if (showSpinner) setIsLoading(true);
      else setIsRefreshing(true);
      setError(null);
      try {
        const res = await api.get<Paginated<UserRow>>(`/users?${buildQuery()}`, { unwrap: false });
        setRows(res.data);
        setMeta(res.meta);
      } catch (err) {
        if (err instanceof ApiCallError) setError(err.message || "Failed to load users");
        else setError("Network error. Is the API server running?");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [buildQuery],
  );

  useEffect(() => {
    void load(true);
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [roleFilter, regionFilter, statusFilter, activityFilter]);

  const regions = Array.from(new Set(rows.map((r) => r.region).filter(Boolean))) as string[];

  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await api.raw(`/users/export.csv?${buildQuery()}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "users.csv";
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

  const deleteUser = async (row: UserRow) => {
    if (!confirm(`Delete ${row.name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${row.id}`);
      await load(false);
    } catch (err) {
      if (err instanceof ApiCallError) setError(err.message);
    }
  };

  const resetPassword = async (row: UserRow) => {
    try {
      await api.post(`/users/${row.id}/reset-password`);
      alert(`Sent password reset link to ${row.email}.`);
    } catch (err) {
      if (err instanceof ApiCallError) setError(err.message);
    }
  };

  const roleOptions = [
    { label: "All Roles", value: "" },
    { label: "Admin", value: "ADMIN" },
    { label: "Supervisor", value: "SUPERVISOR" },
    { label: "User", value: "USER" },
  ];

  const regionOptions = [
    { label: "All regions", value: "" },
    ...regions.map((r) => ({ label: r, value: r })),
  ];

  const statusOptions = [
    { label: "All Statuses", value: "" },
    { label: "Active", value: "ACTIVE" },
    { label: "Suspended", value: "SUSPENDED" },
    { label: "Invited", value: "INVITED" },
  ];

  const activityOptions = [
    { label: "Any Time", value: "" },
    { label: "Last 24 hours", value: "24h" },
    { label: "Last 7 days", value: "7d" },
    { label: "Last 30 days", value: "30d" },
  ];

  const totalPages = meta?.totalPages ?? 1;
  const pagesToShow = pageRange(page, totalPages);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Network operations
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Supervisor Management
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void load(false)}
            disabled={isRefreshing}
            aria-label="Refresh"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-transparent text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => void exportCsv()}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-transparent px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-foreground transition-colors hover:bg-muted/30 disabled:opacity-60"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" strokeWidth={2} />}
            Export CSV
          </button>
          <AddSupervisorDialog regions={regions} onCreated={() => load(false)} />
        </div>
      </header>

      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6 lg:flex-row lg:items-end lg:gap-6">
        <FilterField label="System role">
          <Select
            value={roleFilter}
            onValueChange={setRoleFilter}
            options={roleOptions}
            placeholder="Select role"
            className="bg-card border-border text-foreground"
          />
        </FilterField>
        <FilterField label="Service region">
          <Select
            value={regionFilter}
            onValueChange={setRegionFilter}
            options={regionOptions}
            placeholder="Select region"
            className="bg-card border-border text-foreground"
          />
        </FilterField>
        <FilterField label="Operational status">
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
            options={statusOptions}
            placeholder="Select status"
            className="bg-card border-border text-foreground"
          />
        </FilterField>
        <FilterField label="Last activity">
          <Select
            value={activityFilter}
            onValueChange={setActivityFilter}
            options={activityOptions}
            placeholder="Select activity"
            className="bg-card border-border text-foreground"
          />
        </FilterField>
      </section>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-200 text-left text-sm">
            <thead>
              <tr className="border-b border-border/80 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                <th className="px-6 py-4 font-bold">Name &amp; identifier</th>
                <th className="px-4 py-4 font-bold">Role</th>
                <th className="px-4 py-4 font-bold">Status</th>
                <th className="px-4 py-4 font-bold">Region</th>
                <th className="px-4 py-4 font-bold">Last login</th>
                <th className="px-4 py-4 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-muted-foreground">
                    No users match these filters.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <UserTableRow
                    key={row.id}
                    row={row}
                    onResetPassword={resetPassword}
                    onDelete={deleteUser}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        <footer className="flex flex-col gap-4 border-t border-border/80 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {meta ? (
              <>
                Showing <span className="font-medium text-foreground">{rows.length}</span> of{" "}
                <span className="font-medium text-foreground">{meta.total}</span> users
              </>
            ) : (
              "—"
            )}
          </p>
          <nav className="flex items-center gap-2" aria-label="Pagination">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground disabled:opacity-40"
              aria-label="Previous page"
            >
              ‹
            </button>
            {pagesToShow.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                aria-current={n === page ? "page" : undefined}
                className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-xs font-bold ${
                  n === page
                    ? "bg-foreground text-background"
                    : "border border-border text-foreground transition-colors hover:bg-muted/30"
                }`}
              >
                {String(n).padStart(2, "0")}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground disabled:opacity-40"
              aria-label="Next page"
            >
              ›
            </button>
          </nav>
        </footer>
      </section>
    </div>
  );
}

function pageRange(current: number, total: number): number[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const start = Math.max(1, Math.min(total - 4, current - 2));
  return Array.from({ length: 5 }, (_, i) => start + i);
}

function UserTableRow({
  row,
  onResetPassword,
  onDelete,
}: {
  row: UserRow;
  onResetPassword: (row: UserRow) => Promise<void>;
  onDelete: (row: UserRow) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <tr className="group transition-colors hover:bg-muted/10">
      <td className="px-6 py-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border/80 bg-muted/20 text-xs font-bold text-foreground">
            {row.initials}
          </span>
          <div className="min-w-0">
            <div className="font-semibold text-foreground">{row.name}</div>
            <div className="text-xs text-muted-foreground">{row.uid} · {row.email}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-5 text-foreground">{row.role}</td>
      <td className="px-4 py-5">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[row.status]}`} aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-wide text-foreground">
            {STATUS_LABEL[row.status]}
          </span>
        </div>
      </td>
      <td className="px-4 py-5 text-foreground">{row.region ?? "—"}</td>
      <td className="px-4 py-5 font-mono text-xs text-muted-foreground">
        {row.lastLogin ? formatDate(row.lastLogin) : "Never"}
      </td>
      <td className="px-4 py-5 text-right">
        <div ref={ref} className="relative inline-block">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
            aria-label={`Actions for ${row.name}`}
            aria-haspopup="menu"
            aria-expanded={open}
          >
            <MoreVertical className="h-4 w-4" strokeWidth={2} aria-hidden />
          </button>
          {open && (
            <div role="menu" className="absolute right-0 top-10 z-20 w-56 overflow-hidden rounded-xl border border-border bg-background text-left shadow-xl">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  void onResetPassword(row);
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm transition hover:bg-muted/60"
              >
                <KeyRound className="h-4 w-4" /> Send password reset
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  void onDelete(row);
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-destructive transition hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" /> Delete user
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
