"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Bell, CheckCircle2, CreditCard, Globe, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { api, ApiCallError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { UserPaymentMethodDto, WalletDto } from "@/lib/api-types";

interface MeDto {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: "ADMIN" | "SUPERVISOR" | "USER";
  roleLevel: number;
  region: string | null;
  uid: string;
  avatarUrl: string | null;
  initials?: string;
  lastLoginAt?: string | null;
}

export default function UserSettingsPage() {
  const { refreshMe } = useAuth();
  const [activeTab, setActiveTab] = useState("Profile");

  const [me, setMe] = useState<MeDto | null>(null);
  const [wallet, setWallet] = useState<WalletDto | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<UserPaymentMethodDto[]>([]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [autoRefillEnabled, setAutoRefillEnabled] = useState(false);

  const [measurement, setMeasurement] = useState("METRIC");
  const [currency, setCurrency] = useState("USD");
  const [timezone, setTimezone] = useState("UTC");

  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [m, w, pm] = await Promise.all([
        api.get<MeDto>("/me"),
        api.get<WalletDto>("/me/wallet"),
        api.get<UserPaymentMethodDto[]>("/me/finances/payment-methods"),
      ]);
      setMe(m);
      setWallet(w);
      setPaymentMethods(pm);
      setFirstName(m.firstName ?? "");
      setLastName(m.lastName ?? "");
      setAutoRefillEnabled(w.autoRefillEnabled);
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

  const dirty = me
    ? firstName !== (me.firstName ?? "") ||
      lastName !== (me.lastName ?? "") ||
      (wallet ? autoRefillEnabled !== wallet.autoRefillEnabled : false)
    : false;

  const save = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      // Profile
      if (me && (firstName !== (me.firstName ?? "") || lastName !== (me.lastName ?? ""))) {
        await api.patch("/me", { firstName: firstName.trim(), lastName: lastName.trim() });
      }
      // Wallet auto-refill
      if (wallet && autoRefillEnabled !== wallet.autoRefillEnabled) {
        await api.patch("/me/wallet", { autoRefillEnabled });
      }
      await refreshMe();
      await load();
      setSuccess("Saved.");
    } catch (err) {
      if (err instanceof ApiCallError) setError(err.message || "Save failed");
      else setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    if (me) {
      setFirstName(me.firstName ?? "");
      setLastName(me.lastName ?? "");
    }
    if (wallet) setAutoRefillEnabled(wallet.autoRefillEnabled);
    setError(null);
    setSuccess(null);
  };

  if (isLoading || !me) {
    return (
      <div className="flex min-h-96 items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const defaultCard = paymentMethods.find((p) => p.isDefault) ?? paymentMethods[0];

  return (
    <div className="bg-background px-4 py-3 text-foreground sm:px-6 sm:py-3 md:px-8">
      <div className="mb-6 md:mb-8">
        <h1 className="mb-2 text-2xl font-semibold sm:text-3xl">Account Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your personal profile, payment methods, and notification preferences.
        </p>
      </div>

      <div className="mb-6 flex gap-5 overflow-x-auto border-b border-border/10 pb-1 md:mb-8 md:gap-6">
        {["Profile", "Billing Methods", "Notifications", "Preferences"].map((tab) => (
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

      {success && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          {/* Profile */}
          <div className="rounded-xl border border-border/10 bg-card p-4 sm:p-6">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold sm:mb-8">
              <User className="w-5 h-5" /> Personal Details
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground tracking-wider mb-2 uppercase">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-muted-foreground/10 border border-border/20 rounded-md px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground tracking-wider mb-2 uppercase">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-muted-foreground/10 border border-border/20 rounded-md px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    disabled={saving}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground tracking-wider mb-2 uppercase">
                  Email Address
                </label>
                <input
                  type="email"
                  value={me.email}
                  readOnly
                  className="w-full bg-muted/30 border border-border/20 rounded-md px-4 py-2 text-sm text-muted-foreground focus:outline-none"
                />
                <p className="mt-1 text-[10px] text-muted-foreground">Contact support to change your email.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground tracking-wider mb-2 uppercase">
                  User ID
                </label>
                <input
                  type="text"
                  value={me.uid}
                  readOnly
                  className="w-full bg-muted/30 border border-border/20 rounded-md px-4 py-2 text-sm font-mono text-muted-foreground focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Notifications (visual-only; no backend storage yet) */}
          <div className="rounded-xl border border-border/10 bg-card p-4 sm:p-6">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold sm:mb-8">
              <Bell className="w-5 h-5" /> Auto-Refill
            </h2>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-medium mb-1">Wallet Auto-Refill</h3>
                <p className="text-sm text-muted-foreground">
                  Automatically top up your wallet from your default card when the balance falls below{" "}
                  {wallet ? `$${(wallet.autoRefillThresholdCents / 100).toFixed(2)}` : "—"}.
                </p>
              </div>
              <Button
                type="button"
                onClick={() => setAutoRefillEnabled((v) => !v)}
                disabled={saving}
                variant="ghost"
                aria-pressed={autoRefillEnabled}
                className={`relative h-6 w-11 shrink-0 self-start justify-start rounded-full border border-border p-0.5 transition-colors duration-200 ease-in-out sm:self-center ${
                  autoRefillEnabled ? "bg-secondary dark:bg-muted-foreground" : "bg-muted dark:bg-muted/70"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-foreground shadow ring-0 transition duration-200 ease-in-out ${
                    autoRefillEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </Button>
            </div>

            <p className="mt-6 text-[10px] uppercase tracking-widest text-muted-foreground/60">
              Notification preferences below are coming soon — they don't save yet.
            </p>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          {/* Preferences (UI only) */}
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

              <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
                Preferences are visual-only for now.
              </p>
            </div>
          </div>

          {/* Default Payment */}
          <div className="rounded-xl border border-border/10 bg-card p-4 sm:p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <CreditCard className="w-5 h-5" /> Default Payment
            </h2>
            {defaultCard ? (
              <div className="flex items-center gap-4 bg-muted-foreground/10 p-4 rounded-lg border border-border/20">
                <div className="bg-foreground text-background font-bold px-2 py-1 rounded text-xs">
                  {defaultCard.brand}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {defaultCard.brand} ending in {defaultCard.last4}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Expires {String(defaultCard.expiryMonth).padStart(2, "0")}/{defaultCard.expiryYear}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No payment method on file.</p>
            )}
            <Button variant="outline" className="w-full mt-4 h-auto py-2.5 text-xs text-muted-foreground hover:text-foreground" disabled>
              MANAGE PAYMENT METHODS
            </Button>
          </div>
        </div>
      </div>

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
          {saving ? "SAVING…" : "SAVE PREFERENCES"}
        </Button>
      </div>
    </div>
  );
}
