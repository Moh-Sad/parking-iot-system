"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, AlertCircle, BellRing, CheckCircle2, Globe, Loader2, Lock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { api, ApiCallError } from "@/lib/api";

interface SettingsShape {
  features: { loadBalancing: boolean; telemetry: boolean; thermalMonitoring: boolean };
  localization: { currency: "USD" | "EUR" | "GBP"; timezone: "UTC" | "EST" | "CET"; measurement: "METRIC" | "IMPERIAL" };
  authentication: { apiGateway: boolean; networkSecret: string };
  hardware: { cpuLoadThreshold: number; storage: number };
  updatedAt: string;
}

interface HealthData {
  healthScore: number;
  latencyMs: number;
  uptimePct: number;
  status: string;
}

function ReadOnlyToggle({
  label,
  description,
  value,
}: {
  label: string;
  description: string;
  value: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h3 className="font-medium mb-1">{label}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div
        aria-disabled
        title="Read-only — only admins can change settings"
        className={`relative h-6 w-11 shrink-0 self-start sm:self-center rounded-full border border-border p-0.5 opacity-70 cursor-not-allowed ${
          value ? "bg-secondary dark:bg-muted-foreground" : "bg-muted dark:bg-muted/70"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-foreground shadow ring-0 transition duration-200 ease-in-out ${
            value ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </div>
    </div>
  );
}

export default function SupervisorSettingsPage() {
  const [activeTab, setActiveTab] = useState("Station Config");
  const [data, setData] = useState<SettingsShape | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [s, h] = await Promise.all([
        api.get<SettingsShape>("/settings"),
        api.get<HealthData>("/dashboard/health"),
      ]);
      setData(s);
      setHealth(h);
    } catch (err) {
      if (err instanceof ApiCallError) setError(err.message || "Failed to load settings");
      else setError("Network error. Is the API server running?");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (isLoading || !data) {
    return (
      <div className="flex min-h-96 items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-background px-4 py-3 text-foreground sm:px-6 sm:py-3 md:px-8">
      <div className="mb-6 md:mb-8">
        <h1 className="mb-2 text-2xl font-semibold sm:text-3xl">Station Management Settings</h1>
        <p className="text-muted-foreground text-sm">
          Operational controls, hardware alerts, and regional preferences for your assigned nodes.
        </p>
      </div>

      <div className="mb-4 flex items-start gap-3 rounded-xl border border-border/40 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        <Lock className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Read-only view. Contact your admin to change network-wide settings. Last updated{" "}
          {new Date(data.updatedAt).toLocaleString()}.
        </span>
      </div>

      <div className="mb-6 flex gap-5 overflow-x-auto border-b border-border/10 pb-1 md:mb-8 md:gap-6">
        {["Station Config", "Alerts & Logging", "Team Access", "Preferences"].map((tab) => (
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
        ))}
      </div>

      {error && (
        <div role="alert" className="mb-4 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-xl border border-border/10 bg-card p-4 sm:p-6">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold sm:mb-8">
              <Zap className="w-5 h-5" /> Operational Controls
            </h2>
            <div className="space-y-6 sm:space-y-8">
              <ReadOnlyToggle
                label="Autonomous Load Balancing"
                description="Distribute power dynamically based on grid strain and vehicle priority."
                value={data.features.loadBalancing}
              />
              <ReadOnlyToggle
                label="Precision Telemetry Logging"
                description="Capture real-time millisecond-level data for all active charging sessions."
                value={data.features.telemetry}
              />
            </div>
          </div>

          <div className="rounded-xl border border-border/10 bg-card p-4 sm:p-6">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold sm:mb-8">
              <BellRing className="w-5 h-5" /> Hardware Alerts
            </h2>
            <div className="space-y-6 sm:space-y-8">
              <ReadOnlyToggle
                label="Hardware Thermal Monitoring"
                description="Automatically throttle output when station ambient temperature exceeds 45°C."
                value={data.features.thermalMonitoring}
              />
              <ReadOnlyToggle
                label="API Gateway"
                description="Public API gateway for IoT device authentication."
                value={data.authentication.apiGateway}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-border/10 bg-card p-4 sm:p-6">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold">
              <Activity className="w-5 h-5" /> Node Health
            </h2>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">CPU Load Threshold</span>
                  <span className="font-mono text-xs font-semibold">{data.hardware.cpuLoadThreshold}%</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-foreground rounded-full" style={{ width: `${data.hardware.cpuLoadThreshold}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Storage Threshold</span>
                  <span className="font-mono text-xs font-semibold">{data.hardware.storage}%</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-foreground rounded-full" style={{ width: `${data.hardware.storage}%` }} />
                </div>
              </div>

              {health && (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Global Uptime</span>
                    <span className="font-mono text-xs font-semibold">{health.uptimePct.toFixed(2)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-foreground rounded-full" style={{ width: `${health.uptimePct}%` }} />
                  </div>
                </div>
              )}

              <div className="pt-4 flex items-center gap-2">
                {health?.status === "healthy" ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-xs font-bold tracking-widest uppercase text-green-500">
                      All Systems Operational
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs font-bold tracking-widest uppercase text-yellow-500">
                      {health?.status ?? "Unknown"}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

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
                  value={data.localization.currency}
                  onValueChange={() => undefined}
                  className="h-10 opacity-70 pointer-events-none"
                  options={[
                    { label: "USD ($)", value: "USD" },
                    { label: "EUR (€)", value: "EUR" },
                    { label: "GBP (£)", value: "GBP" },
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground tracking-wider mb-2 uppercase">
                  Reporting Timezone
                </label>
                <Select
                  value={data.localization.timezone}
                  onValueChange={() => undefined}
                  className="h-10 opacity-70 pointer-events-none"
                  options={[
                    { label: "UTC+00:00 (GMT)", value: "UTC" },
                    { label: "UTC-05:00 (EST)", value: "EST" },
                    { label: "UTC+01:00 (CET)", value: "CET" },
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-col gap-3 border-t border-border/10 pt-6 sm:mt-12 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          disabled
          className="h-auto w-full px-6 py-2.5 text-muted-foreground sm:w-auto disabled:opacity-50"
        >
          REVERT CHANGES
        </Button>
        <Button
          type="button"
          disabled
          className="h-auto w-full bg-foreground px-6 py-2.5 text-background hover:bg-foreground/90 sm:w-auto disabled:opacity-50"
        >
          APPLY STATION CONFIG
        </Button>
      </div>
    </div>
  );
}
