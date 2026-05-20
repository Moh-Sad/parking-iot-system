"use client";

import { useState } from "react";
import { Zap, BellRing, Activity, Globe, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

export default function SupervisorSettingsPage() {
  const [activeTab, setActiveTab] = useState("Station Config");
  const [autoThrottle, setAutoThrottle] = useState(true);
  const [maintenance, setMaintenance] = useState(false);
  const [hwAlerts, setHwAlerts] = useState(true);
  const [offlineAlerts, setOfflineAlerts] = useState(true);
  const [currency, setCurrency] = useState("USD");
  const [timezone, setTimezone] = useState("UTC");

  return (
    <div className="bg-background px-4 py-3 text-foreground sm:px-6 sm:py-3 md:px-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="mb-2 text-2xl font-semibold sm:text-3xl">
          Station Management Settings
        </h1>
        <p className="text-muted-foreground text-sm">
          Configure operational controls, hardware alerts, and regional preferences for your assigned nodes.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-5 overflow-x-auto border-b border-border/10 pb-1 md:mb-8 md:gap-6">
        {["Station Config", "Alerts & Logging", "Team Access", "Preferences"].map(
          (tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 rounded-none px-0 pb-3 ${
                activeTab === tab
                  ? "border-b-2 border-foreground text-foreground"
                  : "text-muted-foreground hover:text-foreground/80"
              }`}
            >
              {tab}
            </button>
          ),
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-5">
        {/* Left Column */}
        <div className="lg:col-span-3 space-y-6">
          {/* Operational Controls */}
          <div className="rounded-xl border border-border/10 bg-card p-4 sm:p-6">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold sm:mb-8">
              <Zap className="w-5 h-5" /> Operational Controls
            </h2>

            <div className="space-y-6 sm:space-y-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-medium mb-1">Auto-Throttle on Peak Load</h3>
                  <p className="text-sm text-muted-foreground">
                    Automatically reduce power output to 80% when overall station capacity exceeds safe thresholds.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => setAutoThrottle(!autoThrottle)}
                  variant="ghost"
                  className={`relative h-6 w-11 shrink-0 self-start justify-start rounded-full border border-border p-0.5 transition-colors duration-200 ease-in-out sm:self-center ${
                    autoThrottle ? "bg-secondary dark:bg-muted-foreground" : "bg-muted dark:bg-muted/70"
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-foreground shadow ring-0 transition duration-200 ease-in-out ${autoThrottle ? "translate-x-5" : "translate-x-0"}`} />
                </Button>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-medium mb-1">Fleet Only Mode</h3>
                  <p className="text-sm text-muted-foreground">
                    Restrict charging access exclusively to pre-authorized fleet vehicles. Public access will be denied.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => setMaintenance(!maintenance)}
                  variant="ghost"
                  className={`relative h-6 w-11 shrink-0 self-start justify-start rounded-full border border-border p-0.5 transition-colors duration-200 ease-in-out sm:self-center ${
                    maintenance ? "bg-secondary dark:bg-muted-foreground" : "bg-muted dark:bg-muted/70"
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-foreground shadow ring-0 transition duration-200 ease-in-out ${maintenance ? "translate-x-5" : "translate-x-0"}`} />
                </Button>
              </div>
            </div>
          </div>

          {/* Alerts & Monitoring */}
          <div className="rounded-xl border border-border/10 bg-card p-4 sm:p-6">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold sm:mb-8">
              <BellRing className="w-5 h-5" /> Hardware Alerts
            </h2>

            <div className="space-y-6 sm:space-y-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-medium mb-1">Critical Hardware Failures</h3>
                  <p className="text-sm text-muted-foreground">
                    Immediate push notification when a connector or power module reports an error code.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => setHwAlerts(!hwAlerts)}
                  variant="ghost"
                  className={`relative h-6 w-11 shrink-0 self-start justify-start rounded-full border border-border p-0.5 transition-colors duration-200 ease-in-out sm:self-center ${
                    hwAlerts ? "bg-secondary dark:bg-muted-foreground" : "bg-muted dark:bg-muted/70"
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-foreground shadow ring-0 transition duration-200 ease-in-out ${hwAlerts ? "translate-x-5" : "translate-x-0"}`} />
                </Button>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-medium mb-1">Network Offline Ping</h3>
                  <p className="text-sm text-muted-foreground">
                    Alert if an assigned node drops off the network for more than 5 consecutive minutes.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => setOfflineAlerts(!offlineAlerts)}
                  variant="ghost"
                  className={`relative h-6 w-11 shrink-0 self-start justify-start rounded-full border border-border p-0.5 transition-colors duration-200 ease-in-out sm:self-center ${
                    offlineAlerts ? "bg-secondary dark:bg-muted-foreground" : "bg-muted dark:bg-muted/70"
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-foreground shadow ring-0 transition duration-200 ease-in-out ${offlineAlerts ? "translate-x-5" : "translate-x-0"}`} />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Station Status Overview */}
          <div className="rounded-xl border border-border/10 bg-card p-4 sm:p-6">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold">
              <Activity className="w-5 h-5" /> Node Health
            </h2>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">
                    Average Station Load
                  </span>
                  <span className="font-mono text-xs font-semibold">68.2%</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-foreground rounded-full"
                    style={{ width: "68.2%" }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">
                    Global Uptime
                  </span>
                  <span className="font-mono text-xs font-semibold">
                    99.8%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-foreground rounded-full"
                    style={{ width: "99.8%" }}
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-xs font-bold tracking-widest uppercase text-green-500">
                  All Systems Operational
                </span>
              </div>
            </div>
          </div>

          {/* Regional Settings */}
          <div className="rounded-xl border border-border/10 bg-card p-4 sm:p-6">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold">
              <Globe className="w-5 h-5" /> Regional Display
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-medium text-muted-foreground tracking-wider mb-2 uppercase">
                  Dashboard Currency
                </label>
                <Select
                  value={currency}
                  onValueChange={setCurrency}
                  className="h-10"
                  options={[
                    { label: "USD ($)", value: "USD" },
                    { label: "EUR (€)", value: "EUR" },
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground tracking-wider mb-2 uppercase">
                  Reporting Timezone
                </label>
                <Select
                  value={timezone}
                  onValueChange={setTimezone}
                  className="h-10"
                  options={[
                    { label: "UTC+00:00 (GMT)", value: "UTC" },
                    { label: "UTC-05:00 (EST)", value: "EST" },
                  ]}
                />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="mt-10 flex flex-col gap-3 border-t border-border/10 pt-6 sm:mt-12 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className="h-auto w-full px-6 py-2.5 text-muted-foreground sm:w-auto"
        >
          REVERT CHANGES
        </Button>
        <Button
          type="button"
          className="h-auto w-full bg-foreground px-6 py-2.5 text-background hover:bg-foreground/90 sm:w-auto"
        >
          APPLY STATION CONFIG
        </Button>
      </div>
    </div>
  );
}
