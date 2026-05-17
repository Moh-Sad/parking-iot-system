"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  AlertCircle,
  ChevronDown,
  Download,
  Loader2,
  MoreVertical,
  RefreshCw,
  Trash2,
  UserPlus,
  X,
  KeyRound,
} from "lucide-react";
import { api, ApiCallError } from "@/lib/api";
import type { Paginated, UserRow } from "@/lib/api-types";
import { formatDate } from "@/lib/format";

type RoleFilter = "" | "ADMIN" | "SUPERVISOR";
type StatusFilter = "" | "ACTIVE" | "SUSPENDED" | "INVITED";
type LastActivity = "" | "24h" | "7d" | "30d";

const filterSelectClass =
  "w-full appearance-none rounded-lg border border-border bg-card py-2.5 pl-3 pr-9 text-sm font-medium text-foreground outline-none transition-colors hover:border-border focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

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

  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [regionFilter, setRegionFilter] = useState("");
  const [lastActivity, setLastActivity] = useState<LastActivity>("");
  const [search, setSearch] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "20");
    if (roleFilter) params.set("role", roleFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (regionFilter) params.set("region", regionFilter);
    if (lastActivity) params.set("lastActivity", lastActivity);
    if (search.trim()) params.set("q", search.trim());
    return params.toString();
  }, [page, roleFilter, statusFilter, regionFilter, lastActivity, search]);

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

  // Reset to page 1 when filters change.
  useEffect(() => {
    setPage(1);
  }, [roleFilter, statusFilter, regionFilter, lastActivity, search]);

  const regions = Array.from(new Set(rows.map((r) => r.region).filter(Boolean))) as string[];

  const exportCsv = async () => {
    setExporting(true);
    setError(null);
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

  const onCreated = async () => {
    setCreateOpen(false);
    setPage(1);
    await load(false);
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
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90"
          >
            <UserPlus className="h-4 w-4" /> Add supervisor
          </button>
        </div>
      </header>

      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6 lg:flex-row lg:items-end lg:gap-6">
        <FilterField label="System role">
          <div className="relative">
            <select
              className={filterSelectClass}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPERVISOR">Supervisor</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </FilterField>

        <FilterField label="Service region">
          <div className="relative">
            <select
              className={filterSelectClass}
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
            >
              <option value="">All regions</option>
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </FilterField>

        <FilterField label="Operational status">
          <div className="relative">
            <select
              className={filterSelectClass}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            >
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="INVITED">Invited</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </FilterField>

        <FilterField label="Last activity">
          <div className="relative">
            <select
              className={filterSelectClass}
              value={lastActivity}
              onChange={(e) => setLastActivity(e.target.value as LastActivity)}
            >
              <option value="">Any time</option>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </FilterField>

        <FilterField label="Search">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, email, UID…"
            className="h-10 rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
          />
        </FilterField>
      </section>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b border-border/80 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                <th className="px-6 py-4">Name &amp; identifier</th>
                <th className="px-4 py-4">Role</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Region</th>
                <th className="px-4 py-4">Last login</th>
                <th className="px-4 py-4 text-right">Actions</th>
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
              aria-label="Previous page"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground disabled:opacity-40"
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
              aria-label="Next page"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground disabled:opacity-40"
            >
              ›
            </button>
          </nav>
        </footer>
      </section>

      {createOpen && (
        <CreateUserDialog
          onClose={() => setCreateOpen(false)}
          onCreated={onCreated}
          regions={regions}
        />
      )}
    </div>
  );
}

function pageRange(current: number, total: number): number[] {
  // Show up to 5 page buttons centered on current.
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
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
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
            <MoreVertical className="h-4 w-4" />
          </button>
          {open && (
            <div
              role="menu"
              className="absolute right-0 top-10 z-20 w-56 overflow-hidden rounded-xl border border-border bg-background text-left shadow-xl"
            >
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

function CreateUserDialog({
  onClose,
  onCreated,
  regions,
}: {
  onClose: () => void;
  onCreated: () => Promise<void> | void;
  regions: string[];
}) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<"ADMIN" | "SUPERVISOR">("SUPERVISOR");
  const [region, setRegion] = useState(regions[0] ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/users", {
        email: email.trim(),
        ...(firstName.trim() ? { firstName: firstName.trim() } : {}),
        ...(lastName.trim() ? { lastName: lastName.trim() } : {}),
        role,
        ...(region.trim() ? { region: region.trim() } : {}),
      });
      await onCreated();
    } catch (err) {
      if (err instanceof ApiCallError) setError(err.message || "Failed to create user");
      else setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-bold uppercase tracking-widest">Add supervisor</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 p-5" noValidate>
          <div className="space-y-1">
            <label htmlFor="newEmail" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Email *
            </label>
            <input
              id="newEmail"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="supervisor@company.com"
              className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
              disabled={submitting}
            />
            <p className="text-xs text-muted-foreground">An invite email with a setup link will be sent.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="newFirst" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                First name
              </label>
              <input
                id="newFirst"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
                disabled={submitting}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="newLast" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Last name
              </label>
              <input
                id="newLast"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
                disabled={submitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="newRole" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Role
              </label>
              <select
                id="newRole"
                value={role}
                onChange={(e) => setRole(e.target.value as "ADMIN" | "SUPERVISOR")}
                className={filterSelectClass}
                disabled={submitting}
              >
                <option value="SUPERVISOR">Supervisor</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="newRegion" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Region
              </label>
              <input
                id="newRegion"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="EMEA Central"
                list="regions-datalist"
                className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
                disabled={submitting}
              />
              <datalist id="regions-datalist">
                {regions.map((r) => <option key={r} value={r} />)}
              </datalist>
            </div>
          </div>

          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-muted/30"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !email}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              {submitting ? "Inviting…" : "Send invite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
