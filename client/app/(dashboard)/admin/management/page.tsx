"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Download, MoreVertical } from "lucide-react";
import { AddSupervisorDialog } from "@/components/AddSupervisorDialog";
import { Select } from "@/components/ui/select";

const supervisors = [
  {
    initials: "ER",
    name: "Elena Rodriguez",
    uid: "UID: VC-092-ER",
    role: "Network Lead",
    status: "active" as const,
    region: "EMEA Central",
    lastLogin: "2023.10.27 // 14:32:01",
  },
  {
    initials: "TK",
    name: "Takumi Kobayashi",
    uid: "UID: VC-044-TK",
    role: "Regional Admin",
    status: "inactive" as const,
    region: "APAC Hub",
    lastLogin: "2023.10.25 // 09:15:44",
  },
  {
    initials: "MS",
    name: "Marcus Sterling",
    uid: "UID: VC-118-MS",
    role: "Fleet Manager",
    status: "active" as const,
    region: "North America",
    lastLogin: "2023.10.27 // 16:55:12",
  },
  {
    initials: "SJ",
    name: "Sarah Jenkins",
    uid: "UID: VC-201-SJ",
    role: "System Security",
    status: "active" as const,
    region: "Global Hub",
    lastLogin: "2023.10.27 // 17:01:29",
  },
];

function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

export default function SupervisorManagementPage() {
  const [roleFilter, setRoleFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("global");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activityFilter, setActivityFilter] = useState("any");
  const totalCount = 128;

  const roleOptions = [
    { label: "All Roles", value: "all" },
    { label: "Network Lead", value: "lead" },
    { label: "Regional Admin", value: "admin" },
  ];

  const regionOptions = [
    { label: "Global View", value: "global" },
    { label: "EMEA", value: "emea" },
    { label: "APAC", value: "apac" },
  ];

  const statusOptions = [
    { label: "All Statuses", value: "all" },
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
  ];

  const activityOptions = [
    { label: "Any Time", value: "any" },
    { label: "Last 24 hours", value: "24h" },
    { label: "Last 7 days", value: "7d" },
  ];

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
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-transparent px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-foreground transition-colors hover:bg-muted/30"
          >
            <Download className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
            Export CSV
          </button>
          <AddSupervisorDialog />
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
              {supervisors.map((row) => (
                <tr key={row.uid} className="group transition-colors hover:bg-muted/10">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border/80 bg-muted/20 text-xs font-bold text-foreground">
                        {row.initials}
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold text-foreground">{row.name}</div>
                        <div className="text-xs text-muted-foreground">{row.uid}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-5 text-foreground">{row.role}</td>
                  <td className="px-4 py-5">
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          row.status === "active"
                            ? "h-2 w-2 shrink-0 rounded-full bg-emerald-500"
                            : "h-2 w-2 shrink-0 rounded-full bg-muted-foreground/50"
                        }
                        aria-hidden
                      />
                      <span
                        className={
                          row.status === "active"
                            ? "text-xs font-semibold uppercase tracking-wide text-foreground"
                            : "text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                        }
                      >
                        {row.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-5 text-foreground">{row.region}</td>
                  <td className="px-4 py-5 font-mono text-xs text-muted-foreground">{row.lastLogin}</td>
                  <td className="px-4 py-5 text-right">
                    <button
                      type="button"
                      className="inline-flex rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                      aria-label={`Actions for ${row.name}`}
                    >
                      <MoreVertical className="h-4 w-4" strokeWidth={2} aria-hidden />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="flex flex-col gap-4 border-t border-border/80 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{supervisors.length}</span> of{" "}
            <span className="font-medium text-foreground">{totalCount}</span> supervisors
          </p>
          <nav className="flex items-center gap-2" aria-label="Pagination">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground disabled:opacity-40"
              disabled
              aria-label="Previous page"
            >
              ‹
            </button>
            <button
              type="button"
              className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-foreground px-3 text-xs font-bold text-background"
              aria-current="page"
            >
              01
            </button>
            <button
              type="button"
              className="flex h-9 min-w-9 items-center justify-center rounded-lg border border-border text-xs font-bold text-foreground transition-colors hover:bg-muted/30"
            >
              02
            </button>
            <button
              type="button"
              className="flex h-9 min-w-9 items-center justify-center rounded-lg border border-border text-xs font-bold text-foreground transition-colors hover:bg-muted/30"
            >
              03
            </button>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground"
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
