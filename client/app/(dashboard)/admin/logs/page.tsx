import { CalendarDays, ChevronLeft, ChevronRight, Download, Dot } from "lucide-react";

import { Button } from "@/components/ui/button";

const metricCards = [
  { label: "Critical Errors", value: "0", hint: "Stable" },
  { label: "Daily Actions", value: "1,402", hint: "+12% vs LY" },
  { label: "Network Uptime", value: "99.99%", hint: "" },
  { label: "Active Nodes", value: "482", hint: "" },
];

const filterTabs = ["Live Stream", "Auth", "Network", "Deployments"] as const;

const logs = [
  {
    timestamp: "2023-10-31 14:02:11.231",
    component: "CORE-AUTH-V4",
    user: "m.andersson",
    action: "API_KEY_REVOKE",
    details: "target_id: ak_8829...x21",
    status: "SUCCESS",
    statusTone: "default",
  },
  {
    timestamp: "2023-10-31 14:01:58.882",
    component: "STATION-GRID",
    user: "system_node_02",
    action: "FIRMWARE_UPDATE_INIT",
    details: "version: v2.4.1-rc",
    status: "IN PROGRESS",
    statusTone: "muted",
  },
  {
    timestamp: "2023-10-31 13:58:02.001",
    component: "IOT-GATEWAY",
    user: "unauthorized_bot",
    action: "LOGIN_ATTEMPT_DENIED",
    details: "origin: 82.112.44.1",
    status: "FLAGGED",
    statusTone: "destructive",
  },
  {
    timestamp: "2023-10-31 13:55:42.912",
    component: "CORE-FINANCE",
    user: "j.smith",
    action: "BILLING_RECONCILE",
    details: "range: 2023Q3_GLOBAL",
    status: "SUCCESS",
    statusTone: "default",
  },
  {
    timestamp: "2023-10-31 13:52:10.111",
    component: "NODE-DEPLOY",
    user: "deploy_admin",
    action: "STATION_PROVISION",
    details: "id: LON-2210-A",
    status: "SUCCESS",
    statusTone: "default",
  },
  {
    timestamp: "2023-10-31 13:50:05.442",
    component: "SYSTEM-ENV",
    user: "root_auto",
    action: "BACKUP_SNAPSHOT_CREATE",
    details: "storage: S3_US_WEST_1",
    status: "SUCCESS",
    statusTone: "default",
  },
] as const;

function statusClass(tone: "default" | "muted" | "destructive") {
  if (tone === "destructive") {
    return "border-destructive/30 bg-destructive/15 text-destructive";
  }
  if (tone === "muted") {
    return "border-border bg-muted/20 text-muted-foreground";
  }
  return "border-border bg-muted/10 text-foreground";
}

export default function AdminLogsPage() {
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
              className="h-9 border-border/60 bg-muted/10 text-xs text-muted-foreground hover:bg-muted/20"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              2023.10.24 - 2023.10.31
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-9 border-border/60 bg-muted/10 text-xs font-semibold tracking-wide"
            >
              <Download className="h-3.5 w-3.5" />
              EXPORT CSV
            </Button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {metricCards.map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-border/50 bg-background p-4 sm:p-5"
            >
              <p className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                {card.label}
              </p>
              <div className="mt-3 flex items-end gap-2">
                <p className="text-4xl leading-none font-semibold tracking-tight">
                  {card.value}
                </p>
                {card.hint ? (
                  <span className="pb-0.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                    {card.hint}
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-xl border border-border/60 bg-background">
          <div className="flex flex-col gap-3 border-b border-border/60 bg-muted/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {filterTabs.map((tab, index) => (
                <Button
                  key={tab}
                  type="button"
                  variant="ghost"
                  className={`h-7 rounded-full border px-3 text-[10px] font-semibold tracking-wide uppercase ${
                    index === 0
                      ? "border-border bg-muted text-foreground"
                      : "border-border/70 bg-transparent text-muted-foreground hover:bg-muted/20 hover:text-foreground"
                  }`}
                >
                  {index === 0 ? <Dot className="-ml-1 h-4 w-4" /> : null}
                  {tab}
                </Button>
              ))}
            </div>
            <p className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              652,891 TOTAL EVENTS
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-245 w-full text-left">
              <thead className="border-b border-border/60 bg-muted/10">
                <tr className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">System Component</th>
                  <th className="px-4 py-3">User / Identity</th>
                  <th className="px-4 py-3">Action & Parameters</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={`${log.timestamp}-${log.component}`}
                    className="border-b border-border/50 text-sm hover:bg-muted/10"
                  >
                    <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">
                      {log.timestamp}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex rounded-sm border border-border/70 bg-muted/20 px-2 py-1 text-[10px] font-semibold tracking-wide">
                        {log.component}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-2 text-sm">
                        <span className="h-2.5 w-2.5 rounded-full border border-border bg-muted" />
                        <span className="text-muted-foreground">{log.user}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-medium">{log.action}</span>
                      <span className="text-muted-foreground"> - {log.details}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span
                        className={`inline-flex rounded-md border px-2 py-1 text-[10px] font-semibold tracking-wide uppercase ${statusClass(log.statusTone)}`}
                      >
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-border/60 bg-muted/10 px-4 py-3 text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase sm:flex-row sm:items-center sm:justify-between">
            <p>Showing 50 of 652,891 entries</p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="h-7 w-7 rounded-md border border-border/70 text-muted-foreground"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="px-2">PAGE 1 / 13,058</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="h-7 w-7 rounded-md border border-border/70 text-muted-foreground"
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
