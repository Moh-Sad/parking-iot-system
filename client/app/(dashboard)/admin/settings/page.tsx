"use client";

import { useCallback, useEffect, useState } from "react";
import { Zap, Component, Eye, EyeOff, Globe, Cpu, AlertCircle, CheckCircle2, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { api, ApiCallError } from "@/lib/api";

interface SettingsShape {
  features: {
    loadBalancing: boolean;
    telemetry: boolean;
    thermalMonitoring: boolean;
  };
  localization: {
    currency: "USD" | "EUR" | "GBP";
    timezone: "UTC" | "EST" | "CET";
    measurement: "METRIC" | "IMPERIAL";
  };
  authentication: {
    apiGateway: boolean;
    networkSecret: string;
  };
  hardware: {
    cpuLoadThreshold: number;
    storage: number;
  };
  updatedAt: string;
}

const TABS = ["General", "Security", "IoT Configuration", "Billing Setup"] as const;

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("General");
  const [data, setData] = useState<SettingsShape | null>(null);
  const [draft, setDraft] = useState<SettingsShape | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [rotated, setRotated] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<SettingsShape>("/settings");
      setData(res);
      setDraft(res);
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

  const update = <K extends keyof SettingsShape>(section: K, patch: Partial<SettingsShape[K]>) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const current = prev[section] as Record<string, unknown>;
      return { ...prev, [section]: { ...current, ...patch } } as SettingsShape;
    });
  };

  const dirty = data && draft && JSON.stringify(data) !== JSON.stringify(draft);

  const save = async () => {
    if (!draft || !data) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      // Diff each section and send only changed sections
      const payload: Record<string, unknown> = {};
      (["features", "localization", "authentication", "hardware"] as const).forEach((section) => {
        if (JSON.stringify(data[section]) !== JSON.stringify(draft[section])) {
          payload[section] = draft[section];
        }
      });
      const updated = await api.patch<SettingsShape>("/settings", payload);
      setData(updated);
      setDraft(updated);
      setSuccess("Settings saved.");
    } catch (err) {
      if (err instanceof ApiCallError) setError(err.message || "Save failed");
      else setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    setDraft(data);
    setError(null);
    setSuccess(null);
  };

  const rotateKeys = async () => {
    if (!confirm("Rotate the network secret? The current one will stop working immediately.")) return;
    setRotating(true);
    setError(null);
    setRotated(null);
    try {
      const { networkSecret } = await api.post<{ networkSecret: string }>(
        "/settings/network-secret/rotate",
      );
      setRotated(networkSecret);
      await load();
    } catch (err) {
      if (err instanceof ApiCallError) setError(err.message || "Rotate failed");
      else setError("Network error");
    } finally {
      setRotating(false);
    }
  };

  if (isLoading || !draft) {
    return (
      <div className="flex min-h-96 items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-background px-4 py-3 text-foreground sm:px-6 sm:py-3 md:px-8">
      <div className="mb-6 md:mb-8">
        <h1 className="mb-2 text-2xl font-semibold sm:text-3xl">System Settings</h1>
        <p className="text-muted-foreground text-sm">
          Configure global parameters and hardware integrations for the parking network.
        </p>
      </div>

      <div className="mb-6 flex gap-5 overflow-x-auto border-b border-border/10 pb-1 md:mb-8 md:gap-6">
        {TABS.map((tab) => (
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
        <div
          role="alert"
          className="mb-4 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-5">
        {/* Left Column */}
        <div className="lg:col-span-3 space-y-6">
          {/* Active Core Features */}
          <div className="rounded-xl border border-border/10 bg-card p-4 sm:p-6">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold sm:mb-8">
              <Zap className="w-5 h-5" /> Active Core Features
            </h2>

            <div className="space-y-6 sm:space-y-8">
              <FeatureToggle
                label="Autonomous Load Balancing"
                description="Distribute power dynamically based on grid strain and vehicle priority."
                value={draft.features.loadBalancing}
                onChange={(v) => update("features", { loadBalancing: v })}
                disabled={saving}
              />
              <FeatureToggle
                label="Precision Telemetry Logging"
                description="Capture real-time millisecond-level data for all active charging sessions."
                value={draft.features.telemetry}
                onChange={(v) => update("features", { telemetry: v })}
                disabled={saving}
              />
              <FeatureToggle
                label="Hardware Thermal Monitoring"
                description="Automatically throttle output when station ambient temperature exceeds 45°C."
                value={draft.features.thermalMonitoring}
                onChange={(v) => update("features", { thermalMonitoring: v })}
                disabled={saving}
              />
            </div>
          </div>

          {/* Localization */}
          <div className="rounded-xl border border-border/10 bg-card p-4 sm:p-6">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold">
              <Globe className="w-5 h-5" /> Localization
            </h2>

            <div className="mb-6 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-muted-foreground tracking-wider mb-2 uppercase">
                  Default Currency
                </label>
                <Select
                  value={draft.localization.currency}
                  onValueChange={(v) => update("localization", { currency: v as SettingsShape["localization"]["currency"] })}
                  className="h-10"
                  options={[
                    { label: "USD ($)", value: "USD" },
                    { label: "EUR (€)", value: "EUR" },
                    { label: "GBP (£)", value: "GBP" },
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground tracking-wider mb-2 uppercase">
                  Timezone
                </label>
                <Select
                  value={draft.localization.timezone}
                  onValueChange={(v) => update("localization", { timezone: v as SettingsShape["localization"]["timezone"] })}
                  className="h-10"
                  options={[
                    { label: "UTC+00:00 (GMT)", value: "UTC" },
                    { label: "UTC-05:00 (EST)", value: "EST" },
                    { label: "UTC+01:00 (CET)", value: "CET" },
                  ]}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground tracking-wider mb-2 uppercase">
                Measurement System
              </label>
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <Button
                  type="button"
                  onClick={() => update("localization", { measurement: "METRIC" })}
                  variant="outline"
                  className={`h-auto flex-1 py-2.5 ${
                    draft.localization.measurement === "METRIC"
                      ? "border border-foreground bg-background text-foreground hover:bg-background dark:border-white"
                      : "bg-muted-foreground/10 text-muted-foreground hover:bg-muted/20"
                  }`}
                >
                  METRIC (KW/KM)
                </Button>
                <Button
                  type="button"
                  onClick={() => update("localization", { measurement: "IMPERIAL" })}
                  variant="outline"
                  className={`h-auto flex-1 py-2.5 ${
                    draft.localization.measurement === "IMPERIAL"
                      ? "border border-foreground bg-background text-foreground hover:bg-background dark:border-white"
                      : "bg-muted-foreground/10 text-muted-foreground hover:bg-muted/20"
                  }`}
                >
                  IMPERIAL (HP/MI)
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Node Authentication */}
          <div className="rounded-xl border border-border/10 bg-card p-4 sm:p-6">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold">
              <Component className="w-5 h-5" /> Node Authentication
            </h2>

            <div className="space-y-6">
              <FeatureToggle
                label="API Gateway"
                description="Enable the public API gateway for IoT device authentication."
                value={draft.authentication.apiGateway}
                onChange={(v) => update("authentication", { apiGateway: v })}
                disabled={saving}
              />

              <div>
                <label className="block text-xs font-medium text-muted-foreground tracking-wider mb-2 uppercase">
                  Network Secret
                </label>
                <div className="relative">
                  <input
                    type={showSecret ? "text" : "password"}
                    value={draft.authentication.networkSecret}
                    readOnly
                    className="w-full bg-muted-foreground/10 border border-border/20 rounded-md px-4 py-2 pr-10 text-sm font-mono focus:outline-none"
                  />
                  <Button
                    type="button"
                    onClick={() => setShowSecret((v) => !v)}
                    variant="ghost"
                    size="icon-sm"
                    aria-label={showSecret ? "Hide secret" : "Show masked secret"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Stored masked. Rotate to reveal a fresh value once.
                </p>
              </div>

              {rotated && (
                <div className="rounded-md border border-primary/30 bg-primary/10 p-3 text-sm">
                  <p className="mb-1 font-semibold">New secret (copy now — shown once):</p>
                  <code className="block break-all rounded bg-background px-2 py-1 font-mono text-xs">
                    {rotated}
                  </code>
                </div>
              )}

              <p className="text-xs text-muted-foreground leading-relaxed">
                Ensure keys are rotated every 90 days. Unauthorized API calls are logged and reported.
              </p>

              <Button
                type="button"
                variant="outline"
                onClick={() => void rotateKeys()}
                disabled={rotating}
                className="mt-2 h-auto w-full gap-2 border-border/20 bg-muted py-2.5 hover:bg-muted disabled:opacity-60"
              >
                {rotating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                {rotating ? "ROTATING…" : "ROTATE KEYS"}
              </Button>
            </div>
          </div>

          {/* Hardware Integrity */}
          <div className="relative overflow-hidden rounded-xl border border-border/10 bg-card p-4 sm:p-6">
            <div className="pointer-events-none absolute right-2.5 top-2.5 text-muted-foreground">
              <Cpu className="h-10 w-10 stroke-1 sm:h-12 sm:w-12" />
            </div>

            <h2 className="relative z-10 mb-6 text-lg font-semibold">Hardware Integrity</h2>

            <div className="space-y-6 relative z-10">
              <BarRow
                label="CPU Load Threshold"
                valueLabel={`${draft.hardware.cpuLoadThreshold}%`}
                percent={draft.hardware.cpuLoadThreshold}
              />
              <BarRow
                label="Storage Threshold"
                valueLabel={`${draft.hardware.storage}%`}
                percent={draft.hardware.storage}
              />

              <div className="pt-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-foreground animate-pulse" />
                <span className="text-xs font-bold tracking-widest uppercase">
                  Last updated {new Date(draft.updatedAt).toLocaleString()}
                </span>
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
          onClick={discard}
          disabled={!dirty || saving}
          className="h-auto w-full px-6 py-2.5 text-muted-foreground sm:w-auto disabled:opacity-50"
        >
          DISCARD CHANGES
        </Button>
        <Button
          type="button"
          onClick={() => void save()}
          disabled={!dirty || saving}
          className="h-auto w-full bg-foreground px-6 py-2.5 text-background hover:bg-foreground/90 sm:w-auto disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {saving ? "SAVING…" : "SAVE CONFIGURATION"}
        </Button>
      </div>
    </div>
  );
}

function FeatureToggle({
  label,
  description,
  value,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h3 className="font-medium mb-1">{label}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Button
        type="button"
        onClick={() => onChange(!value)}
        disabled={disabled}
        variant="ghost"
        aria-pressed={value}
        className={`relative h-6 w-11 shrink-0 self-start justify-start rounded-full border border-border p-0.5 transition-colors duration-200 ease-in-out sm:self-center ${
          value ? "bg-secondary dark:bg-muted-foreground" : "bg-muted dark:bg-muted/70"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-foreground shadow ring-0 transition duration-200 ease-in-out ${
            value ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </Button>
    </div>
  );
}

function BarRow({ label, valueLabel, percent }: { label: string; valueLabel: string; percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-xs font-semibold">{valueLabel}</span>
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-foreground rounded-full" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}
