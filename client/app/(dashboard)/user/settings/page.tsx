"use client";

import { useState } from "react";
import { User, Bell, Globe, Shield, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

export default function UserSettingsPage() {
  const [activeTab, setActiveTab] = useState("Profile");
  const [chargeAlerts, setChargeAlerts] = useState(true);
  const [balanceWarnings, setBalanceWarnings] = useState(true);
  const [receiptEmails, setReceiptEmails] = useState(false);
  const [measurement, setMeasurement] = useState("METRIC");
  const [currency, setCurrency] = useState("USD");
  const [timezone, setTimezone] = useState("UTC");

  return (
    <div className="bg-background px-4 py-3 text-foreground sm:px-6 sm:py-3 md:px-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="mb-2 text-2xl font-semibold sm:text-3xl">
          Account Settings
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage your personal profile, payment methods, and notification preferences.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-5 overflow-x-auto border-b border-border/10 pb-1 md:mb-8 md:gap-6">
        {["Profile", "Billing Methods", "Notifications", "Preferences"].map(
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
          {/* Profile Section */}
          <div className="rounded-xl border border-border/10 bg-card p-4 sm:p-6">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold sm:mb-8">
              <User className="w-5 h-5" /> Personal Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground tracking-wider mb-2 uppercase">
                  Full Name
                </label>
                <input
                  type="text"
                  defaultValue="Alex Mercer"
                  className="w-full bg-muted-foreground/10 border border-border/20 rounded-md px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground tracking-wider mb-2 uppercase">
                  Email Address
                </label>
                <input
                  type="email"
                  defaultValue="alex.mercer@example.com"
                  className="w-full bg-muted-foreground/10 border border-border/20 rounded-md px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground tracking-wider mb-2 uppercase">
                  Vehicle License Plate
                </label>
                <input
                  type="text"
                  defaultValue="XYZ-9081"
                  className="w-full bg-muted-foreground/10 border border-border/20 rounded-md px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="rounded-xl border border-border/10 bg-card p-4 sm:p-6">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold sm:mb-8">
              <Bell className="w-5 h-5" /> Notifications
            </h2>

            <div className="space-y-6 sm:space-y-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-medium mb-1">Charging Complete Alerts</h3>
                  <p className="text-sm text-muted-foreground">
                    Receive a notification when your vehicle reaches 100% charge or the session ends.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => setChargeAlerts(!chargeAlerts)}
                  variant="ghost"
                  className={`relative h-6 w-11 shrink-0 self-start justify-start rounded-full border border-border p-0.5 transition-colors duration-200 ease-in-out sm:self-center ${
                    chargeAlerts ? "bg-secondary dark:bg-muted-foreground" : "bg-muted dark:bg-muted/70"
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-foreground shadow ring-0 transition duration-200 ease-in-out ${chargeAlerts ? "translate-x-5" : "translate-x-0"}`} />
                </Button>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-medium mb-1">Low Balance Warnings</h3>
                  <p className="text-sm text-muted-foreground">
                    Get alerted when your prepaid wallet balance drops below $10.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => setBalanceWarnings(!balanceWarnings)}
                  variant="ghost"
                  className={`relative h-6 w-11 shrink-0 self-start justify-start rounded-full border border-border p-0.5 transition-colors duration-200 ease-in-out sm:self-center ${
                    balanceWarnings ? "bg-secondary dark:bg-muted-foreground" : "bg-muted dark:bg-muted/70"
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-foreground shadow ring-0 transition duration-200 ease-in-out ${balanceWarnings ? "translate-x-5" : "translate-x-0"}`} />
                </Button>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-medium mb-1">Receipt Emails</h3>
                  <p className="text-sm text-muted-foreground">
                    Automatically receive a detailed PDF receipt after every successful transaction.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => setReceiptEmails(!receiptEmails)}
                  variant="ghost"
                  className={`relative h-6 w-11 shrink-0 self-start justify-start rounded-full border border-border p-0.5 transition-colors duration-200 ease-in-out sm:self-center ${
                    receiptEmails ? "bg-secondary dark:bg-muted-foreground" : "bg-muted dark:bg-muted/70"
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-foreground shadow ring-0 transition duration-200 ease-in-out ${receiptEmails ? "translate-x-5" : "translate-x-0"}`} />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Preferences */}
          <div className="rounded-xl border border-border/10 bg-card p-4 sm:p-6">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold">
              <Globe className="w-5 h-5" /> Preferences
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-medium text-muted-foreground tracking-wider mb-2 uppercase">
                  Preferred Currency
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
                    { label: "UTC-08:00 (PST)", value: "PST" },
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground tracking-wider mb-2 uppercase">
                  Measurement System
                </label>
                <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 mt-2">
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
                    METRIC (kWh)
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
                    IMPERIAL (mi/hr)
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Overview snippet */}
          <div className="rounded-xl border border-border/10 bg-card p-4 sm:p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <CreditCard className="w-5 h-5" /> Default Payment
            </h2>
            <div className="flex items-center gap-4 bg-muted-foreground/10 p-4 rounded-lg border border-border/20">
              <div className="bg-foreground text-background font-bold px-2 py-1 rounded text-xs">
                VISA
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Visa ending in 4429</p>
                <p className="text-xs text-muted-foreground">Expires 12/2026</p>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-4 h-auto py-2.5 text-xs text-muted-foreground hover:text-foreground">
              MANAGE PAYMENT METHODS
            </Button>
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
          SAVE PREFERENCES
        </Button>
      </div>
    </div>
  );
}
