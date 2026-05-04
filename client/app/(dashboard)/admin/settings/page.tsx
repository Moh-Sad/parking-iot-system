"use client";

import { useState } from "react";
import { Zap, Component, Eye, Globe, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("General");
  const [loadBalancing, setLoadBalancing] = useState(true);
  const [telemetry, setTelemetry] = useState(true);
  const [thermal, setThermal] = useState(false);
  const [measurement, setMeasurement] = useState("METRIC");
  const [currency, setCurrency] = useState("USD");
  const [timezone, setTimezone] = useState("UTC");

  return (
    <div className="bg-background px-4 py-3 text-foreground sm:px-6 sm:py-3 md:px-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="mb-2 text-2xl font-semibold sm:text-3xl">
          System Settings
        </h1>
        <p className="text-muted-foreground text-sm">
          Configure global parameters and hardware integrations for the VoltCore
          network.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-5 overflow-x-auto border-b border-border/10 pb-1 md:mb-8 md:gap-6">
        {["General", "Security", "IoT Configuration", "Billing Setup"].map(
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
          {/* Core Ecosystem Features */}
          <div className="rounded-xl border border-border/10 bg-card p-4 sm:p-6">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold sm:mb-8">
              <Zap className="w-5 h-5" /> Active Core Features
            </h2>

            <div className="space-y-6 sm:space-y-8">
              {/* Toggle 1 */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-medium mb-1">
                    Autonomous Load Balancing
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Distribute power dynamically based on grid strain and
                    vehicle priority.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => setLoadBalancing(!loadBalancing)}
                  variant="ghost"
                  className={`relative h-6 w-11 shrink-0 self-start justify-start rounded-full border border-border p-0.5 transition-colors duration-200 ease-in-out sm:self-center ${
                    loadBalancing
                      ? "bg-secondary dark:bg-muted-foreground"
                      : "bg-muted dark:bg-muted/70"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-foreground shadow ring-0 transition duration-200 ease-in-out ${
                      loadBalancing ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </Button>
              </div>

              {/* Toggle 2 */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-medium mb-1">
                    Precision Telemetry Logging
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Capture real-time millisecond-level data for all active
                    charging sessions.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => setTelemetry(!telemetry)}
                  variant="ghost"
                  className={`relative h-6 w-11 shrink-0 self-start justify-start rounded-full border border-border p-0.5 transition-colors duration-200 ease-in-out sm:self-center ${
                    telemetry
                      ? "bg-secondary dark:bg-muted-foreground"
                      : "bg-muted dark:bg-muted/70"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-foreground shadow ring-0 transition duration-200 ease-in-out ${
                      telemetry ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </Button>
              </div>

              {/* Toggle 3 */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-medium mb-1">
                    Hardware Thermal Monitoring
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Automatically throttle output when station ambient
                    temperature exceeds 45°C.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => setThermal(!thermal)}
                  variant="ghost"
                  className={`relative h-6 w-11 shrink-0 self-start justify-start rounded-full border border-border p-0.5 transition-colors duration-200 ease-in-out sm:self-center ${
                    thermal
                      ? "bg-secondary dark:bg-muted-foreground"
                      : "bg-muted dark:bg-muted/70"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-foreground shadow ring-0 transition duration-200 ease-in-out ${
                      thermal ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </Button>
              </div>
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
                  value={currency}
                  onValueChange={setCurrency}
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
                  value={timezone}
                  onValueChange={setTimezone}
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
                  onClick={() => setMeasurement("METRIC")}
                  variant="outline"
                  className={`h-auto flex-1 py-2.5 ${
                    measurement === "METRIC"
                      ? "border border-foreground bg-background text-foreground hover:bg-background dark:border-white"
                      : "bg-muted-foreground/10 text-muted-foreground hover:bg-muted/20"
                  }`}
                >
                  METRIC (KW/KM)
                </Button>
                <Button
                  type="button"
                  onClick={() => setMeasurement("IMPERIAL")}
                  variant="outline"
                  className={`h-auto flex-1 py-2.5 ${
                    measurement === "IMPERIAL"
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
              <div>
                <label className="block text-xs font-medium text-muted-foreground tracking-wider mb-2 uppercase">
                  Primary API Gateway
                </label>
                <div className="relative">
                  <input
                    type="text"
                    defaultValue="VC-882-XKL-9001-ALPHA"
                    readOnly
                    className="w-full bg-muted-foreground/10 border border-border/20 rounded-md px-4 py-2 text-sm text-foreground focus:outline-none"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground tracking-wider mb-2 uppercase">
                  Network Secret
                </label>
                <input
                  type="password"
                  placeholder="Enter key..."
                  className="w-full bg-muted-foreground/10 border border-border/20 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/60"
                />
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Ensure keys are rotated every 90 days. Unauthorized API calls
                are logged and reported to the security node.
              </p>

              <Button
                type="button"
                variant="outline"
                className="mt-2 h-auto w-full border-border/20 bg-muted py-2.5 hover:bg-muted"
              >
                ROTATE KEYS
              </Button>
            </div>
          </div>

          {/* Hardware Integrity */}
          <div className="relative overflow-hidden rounded-xl border border-border/10 bg-card p-4 sm:p-6">
            <div className="pointer-events-none absolute right-2.5 top-2.5 text-muted-foreground">
              <Cpu className="h-10 w-10 stroke-1 sm:h-12 sm:w-12" />
            </div>

            <h2 className="relative z-10 mb-6 text-lg font-semibold">
              Hardware Integrity
            </h2>

            <div className="space-y-6 relative z-10">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">
                    Station CPU Load
                  </span>
                  <span className="font-mono text-xs font-semibold">12.4%</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-foreground rounded-full"
                    style={{ width: "12.4%" }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">
                    Storage Capacity
                  </span>
                  <span className="font-mono text-xs font-semibold">
                    84.2 TB / 100 TB
                  </span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-foreground rounded-full"
                    style={{ width: "84.2%" }}
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-foreground animate-pulse" />
                <span className="text-xs font-bold tracking-widest uppercase">
                  Operational Excellence
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
          className="h-auto w-full px-6 py-2.5 text-muted-foreground sm:w-auto"
        >
          DISCARD CHANGES
        </Button>
        <Button
          type="button"
          className="h-auto w-full bg-foreground px-6 py-2.5 text-background hover:bg-foreground/90 sm:w-auto"
        >
          SAVE CONFIGURATION
        </Button>
      </div>
    </div>
  );
}
