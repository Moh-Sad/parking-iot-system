"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  AlertCircle,
  Bell,
  Car,
  CheckCircle2,
  CreditCard,
  Globe,
  Loader2,
  Plus,
  Star,
  Trash2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  phone: string | null;
  preferences: Preferences | null;
}

interface Preferences {
  currency?: "ETB" | "EUR" | "GBP";
  timezone?: string;
  measurement?: "METRIC" | "IMPERIAL";
  notifications?: {
    chargeAlerts?: boolean;
    balanceWarnings?: boolean;
    receiptEmails?: boolean;
  };
}

interface VehicleDto {
  id: string;
  plateNumber: string;
  driverName: string;
  carType: string;
  model: string | null;
  notes: string | null;
}

const DEFAULT_PREFS: Required<Pick<Preferences, "currency" | "timezone" | "measurement">> & {
  notifications: Required<NonNullable<Preferences["notifications"]>>;
} = {
  currency: "ETB",
  timezone: "UTC",
  measurement: "METRIC",
  notifications: { chargeAlerts: true, balanceWarnings: true, receiptEmails: false },
};

export default function UserSettingsPage() {
  const { refreshMe } = useAuth();
  const [activeTab, setActiveTab] = useState("Profile");

  const [me, setMe] = useState<MeDto | null>(null);
  const [wallet, setWallet] = useState<WalletDto | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<UserPaymentMethodDto[]>([]);
  const [vehicles, setVehicles] = useState<VehicleDto[]>([]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [autoRefillEnabled, setAutoRefillEnabled] = useState(false);
  const [prefs, setPrefs] = useState<typeof DEFAULT_PREFS>(DEFAULT_PREFS);

  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [m, w, pm, vh] = await Promise.all([
        api.get<MeDto>("/me"),
        api.get<WalletDto>("/me/wallet"),
        api.get<UserPaymentMethodDto[]>("/me/finances/payment-methods"),
        api.get<VehicleDto[]>("/me/vehicles"),
      ]);
      setMe(m);
      setWallet(w);
      setPaymentMethods(pm);
      setVehicles(vh);
      setFirstName(m.firstName ?? "");
      setLastName(m.lastName ?? "");
      setPhone(m.phone ?? "");
      setAutoRefillEnabled(w.autoRefillEnabled);
      setPrefs({
        currency: m.preferences?.currency ?? DEFAULT_PREFS.currency,
        timezone: m.preferences?.timezone ?? DEFAULT_PREFS.timezone,
        measurement: m.preferences?.measurement ?? DEFAULT_PREFS.measurement,
        notifications: {
          chargeAlerts: m.preferences?.notifications?.chargeAlerts ?? DEFAULT_PREFS.notifications.chargeAlerts,
          balanceWarnings: m.preferences?.notifications?.balanceWarnings ?? DEFAULT_PREFS.notifications.balanceWarnings,
          receiptEmails: m.preferences?.notifications?.receiptEmails ?? DEFAULT_PREFS.notifications.receiptEmails,
        },
      });
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
      phone !== (me.phone ?? "") ||
      JSON.stringify(prefs) !==
        JSON.stringify({
          currency: me.preferences?.currency ?? DEFAULT_PREFS.currency,
          timezone: me.preferences?.timezone ?? DEFAULT_PREFS.timezone,
          measurement: me.preferences?.measurement ?? DEFAULT_PREFS.measurement,
          notifications: {
            chargeAlerts: me.preferences?.notifications?.chargeAlerts ?? DEFAULT_PREFS.notifications.chargeAlerts,
            balanceWarnings: me.preferences?.notifications?.balanceWarnings ?? DEFAULT_PREFS.notifications.balanceWarnings,
            receiptEmails: me.preferences?.notifications?.receiptEmails ?? DEFAULT_PREFS.notifications.receiptEmails,
          },
        }) ||
      (wallet ? autoRefillEnabled !== wallet.autoRefillEnabled : false)
    : false;

  const save = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const mePatch: Record<string, unknown> = {};
      if (me) {
        if (firstName !== (me.firstName ?? "")) mePatch.firstName = firstName.trim();
        if (lastName !== (me.lastName ?? "")) mePatch.lastName = lastName.trim();
        if (phone !== (me.phone ?? "")) mePatch.phone = phone.trim() || null;
        mePatch.preferences = prefs;
      }
      if (Object.keys(mePatch).length > 0) {
        await api.patch("/me", mePatch);
      }
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
      setPhone(me.phone ?? "");
      setPrefs({
        currency: me.preferences?.currency ?? DEFAULT_PREFS.currency,
        timezone: me.preferences?.timezone ?? DEFAULT_PREFS.timezone,
        measurement: me.preferences?.measurement ?? DEFAULT_PREFS.measurement,
        notifications: {
          chargeAlerts: me.preferences?.notifications?.chargeAlerts ?? DEFAULT_PREFS.notifications.chargeAlerts,
          balanceWarnings: me.preferences?.notifications?.balanceWarnings ?? DEFAULT_PREFS.notifications.balanceWarnings,
          receiptEmails: me.preferences?.notifications?.receiptEmails ?? DEFAULT_PREFS.notifications.receiptEmails,
        },
      });
    }
    if (wallet) setAutoRefillEnabled(wallet.autoRefillEnabled);
    setError(null);
    setSuccess(null);
  };

  const reloadPaymentMethods = async () => {
    try {
      const pm = await api.get<UserPaymentMethodDto[]>("/me/finances/payment-methods");
      setPaymentMethods(pm);
    } catch { /* ignore */ }
  };

  const reloadVehicles = async () => {
    try {
      const vh = await api.get<VehicleDto[]>("/me/vehicles");
      setVehicles(vh);
    } catch { /* ignore */ }
  };

  const setDefaultMethod = async (id: string) => {
    try {
      await api.patch(`/me/finances/payment-methods/${id}`, { isDefault: true });
      await reloadPaymentMethods();
    } catch (err) {
      if (err instanceof ApiCallError) setError(err.message);
    }
  };

  const deleteMethod = async (id: string) => {
    if (!confirm("Remove this payment method?")) return;
    try {
      await api.delete(`/me/finances/payment-methods/${id}`);
      await reloadPaymentMethods();
    } catch (err) {
      if (err instanceof ApiCallError) setError(err.message);
    }
  };

  const deleteVehicle = async (id: string) => {
    if (!confirm("Remove this vehicle?")) return;
    try {
      await api.delete(`/me/vehicles/${id}`);
      await reloadVehicles();
    } catch (err) {
      if (err instanceof ApiCallError) setError(err.message);
    }
  };

  if (isLoading || !me) {
    return (
      <div className="flex min-h-96 items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-background px-4 py-3 text-foreground sm:px-6 sm:py-3 md:px-8">
      <div className="mb-6 md:mb-8">
        <h1 className="mb-2 text-2xl font-semibold sm:text-3xl">Account Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your personal profile, payment methods, vehicles, and notification preferences.
        </p>
      </div>

      <div className="mb-6 flex gap-5 overflow-x-auto border-b border-border/10 pb-1 md:mb-8 md:gap-6">
        {["Profile", "Billing Methods", "Vehicles", "Preferences"].map((tab) => (
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
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground tracking-wider mb-2 uppercase">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-muted-foreground/10 border border-border/20 rounded-md px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    disabled={saving}
                  />
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
          </div>

          {/* Notifications */}
          <div className="rounded-xl border border-border/10 bg-card p-4 sm:p-6">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold sm:mb-8">
              <Bell className="w-5 h-5" /> Notifications
            </h2>

            <div className="space-y-6 sm:space-y-8">
              <ToggleRow
                label="Wallet Auto-Refill"
                description={`Auto top up your wallet when balance falls below ${wallet ? `$${(wallet.autoRefillThresholdCents / 100).toFixed(2)}` : "—"}.`}
                value={autoRefillEnabled}
                onChange={setAutoRefillEnabled}
                disabled={saving}
              />
              <ToggleRow
                label="Charging Complete Alerts"
                description="Notification when your vehicle reaches 100% or the session ends."
                value={prefs.notifications.chargeAlerts}
                onChange={(v) =>
                  setPrefs({ ...prefs, notifications: { ...prefs.notifications, chargeAlerts: v } })
                }
                disabled={saving}
              />
              <ToggleRow
                label="Low Balance Warnings"
                description="Alert when your wallet drops below ETB 10."
                value={prefs.notifications.balanceWarnings}
                onChange={(v) =>
                  setPrefs({ ...prefs, notifications: { ...prefs.notifications, balanceWarnings: v } })
                }
                disabled={saving}
              />
              <ToggleRow
                label="Receipt Emails"
                description="Email PDF receipt after every transaction."
                value={prefs.notifications.receiptEmails}
                onChange={(v) =>
                  setPrefs({ ...prefs, notifications: { ...prefs.notifications, receiptEmails: v } })
                }
                disabled={saving}
              />
            </div>
          </div>

          {/* Vehicles */}
          <div className="rounded-xl border border-border/10 bg-card p-4 sm:p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Car className="w-5 h-5" /> My Vehicles
              </h2>
              <AddVehicleDialog onAdded={reloadVehicles} />
            </div>

            {vehicles.length === 0 ? (
              <p className="text-sm text-muted-foreground">No vehicles registered yet.</p>
            ) : (
              <ul className="divide-y divide-border/40">
                {vehicles.map((v) => (
                  <li key={v.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-semibold">
                        {v.plateNumber}
                        {v.model && <span className="ml-2 text-muted-foreground font-normal">· {v.model}</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{v.carType}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void deleteVehicle(v.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

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
                  value={prefs.currency}
                  onValueChange={(v) => setPrefs({ ...prefs, currency: v as "ETB" | "EUR" | "GBP" })}
                  className="h-10"
                  options={[
                    { label: "ETB", value: "ETB" },
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
                  value={prefs.timezone}
                  onValueChange={(v) => setPrefs({ ...prefs, timezone: v })}
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
                    onClick={() => setPrefs({ ...prefs, measurement: "METRIC" })}
                    variant="outline"
                    className={`h-auto flex-1 py-2.5 ${
                      prefs.measurement === "METRIC"
                        ? "border border-foreground bg-background text-foreground hover:bg-background dark:border-white"
                        : "bg-muted-foreground/10 text-muted-foreground hover:bg-muted/20"
                    }`}
                  >
                    METRIC (kWh)
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setPrefs({ ...prefs, measurement: "IMPERIAL" })}
                    variant="outline"
                    className={`h-auto flex-1 py-2.5 ${
                      prefs.measurement === "IMPERIAL"
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

          {/* Payment methods */}
          <div className="rounded-xl border border-border/10 bg-card p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <CreditCard className="w-5 h-5" /> Payment Methods
              </h2>
              <AddPaymentMethodDialog onAdded={reloadPaymentMethods} />
            </div>

            {paymentMethods.length === 0 ? (
              <p className="text-sm text-muted-foreground">No cards on file.</p>
            ) : (
              <ul className="space-y-2">
                {paymentMethods.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 bg-muted-foreground/10 p-3 rounded-lg border border-border/20">
                    <div className="bg-foreground text-background font-bold px-2 py-1 rounded text-xs">
                      {m.brand}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        •••• {m.last4}
                        {m.isDefault && <span className="ml-2 inline-flex items-center gap-0.5 text-[10px] uppercase tracking-wider text-primary"><Star className="h-3 w-3" /> Default</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Expires {String(m.expiryMonth).padStart(2, "0")}/{m.expiryYear}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!m.isDefault && (
                        <button
                          type="button"
                          onClick={() => void setDefaultMethod(m.id)}
                          className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                          aria-label="Set as default"
                          title="Set as default"
                        >
                          <Star className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => void deleteMethod(m.id)}
                        className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        aria-label="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
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

function ToggleRow({
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

function AddPaymentMethodDialog({ onAdded }: { onAdded: () => Promise<void> | void }) {
  const [open, setOpen] = useState(false);
  const [brand, setBrand] = useState("VISA");
  const [last4, setLast4] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [holderName, setHolderName] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setBrand("VISA");
    setLast4("");
    setExpiryMonth("");
    setExpiryYear("");
    setHolderName("");
    setIsDefault(false);
    setError(null);
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    if (!/^\d{4}$/.test(last4)) return setError("Last 4 digits must be exactly 4 numbers.");
    const m = Number(expiryMonth);
    const y = Number(expiryYear);
    if (!Number.isInteger(m) || m < 1 || m > 12) return setError("Expiry month must be 1-12.");
    if (!Number.isInteger(y) || y < new Date().getFullYear()) return setError("Expiry year must be in the future.");

    setSubmitting(true);
    try {
      await api.post("/me/finances/payment-methods", {
        brand,
        last4,
        expiryMonth: m,
        expiryYear: y,
        ...(holderName.trim() ? { holderName: holderName.trim() } : {}),
        ...(isDefault ? { isDefault: true } : {}),
      });
      reset();
      setOpen(false);
      await onAdded();
    } catch (err) {
      if (err instanceof ApiCallError) setError(err.message || "Could not add card");
      else setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger
        render={
          <Button type="button" variant="outline" size="sm" className="gap-1 text-xs">
            <Plus className="h-3.5 w-3.5" /> Add card
          </Button>
        }
      />
      <DialogContent className="sm:max-w-106.25 bg-background border-border text-foreground">
        <DialogHeader>
          <DialogTitle>Add a payment card</DialogTitle>
          <DialogDescription>
            Demo only — stores brand + last 4 digits. No real card numbers are processed.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Brand</Label>
              <Select
                value={brand}
                onValueChange={setBrand}
                options={[
                  { label: "VISA", value: "VISA" },
                  { label: "MASTERCARD", value: "MASTERCARD" },
                  { label: "AMEX", value: "AMEX" },
                  { label: "DISCOVER", value: "DISCOVER" },
                  { label: "OTHER", value: "OTHER" },
                ]}
                className="bg-card border-border text-foreground"
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Last 4 digits</Label>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={last4}
                onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="1234"
                className="bg-card border-border text-foreground"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Expiry month</Label>
              <Input
                type="number"
                min={1}
                max={12}
                value={expiryMonth}
                onChange={(e) => setExpiryMonth(e.target.value)}
                placeholder="12"
                className="bg-card border-border text-foreground"
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Expiry year</Label>
              <Input
                type="number"
                min={new Date().getFullYear()}
                max={2100}
                value={expiryYear}
                onChange={(e) => setExpiryYear(e.target.value)}
                placeholder="2028"
                className="bg-card border-border text-foreground"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Holder name (optional)</Label>
            <Input
              type="text"
              value={holderName}
              onChange={(e) => setHolderName(e.target.value)}
              className="bg-card border-border text-foreground"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="h-4 w-4 rounded border-border/50 bg-background text-primary focus:ring-primary/30"
            />
            Make default
          </label>
          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add card"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddVehicleDialog({ onAdded }: { onAdded: () => Promise<void> | void }) {
  const [open, setOpen] = useState(false);
  const [plateNumber, setPlateNumber] = useState("");
  const [model, setModel] = useState("");
  const [carType, setCarType] = useState("EV");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setPlateNumber("");
    setModel("");
    setCarType("EV");
    setError(null);
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    if (!plateNumber.trim()) return setError("Plate number is required.");

    setSubmitting(true);
    try {
      await api.post("/me/vehicles", {
        plateNumber: plateNumber.trim().toUpperCase(),
        carType,
        ...(model.trim() ? { model: model.trim() } : {}),
      });
      reset();
      setOpen(false);
      await onAdded();
    } catch (err) {
      if (err instanceof ApiCallError) {
        if (err.status === 409) setError("That plate is already registered.");
        else setError(err.message || "Could not add vehicle");
      } else {
        setError("Network error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger
        render={
          <Button type="button" variant="outline" size="sm" className="gap-1 text-xs">
            <Plus className="h-3.5 w-3.5" /> Add vehicle
          </Button>
        }
      />
      <DialogContent className="sm:max-w-106.25 bg-background border-border text-foreground">
        <DialogHeader>
          <DialogTitle>Register a vehicle</DialogTitle>
          <DialogDescription>
            Link a vehicle to your account so charging sessions are billed automatically.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4 py-4">
          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Plate number</Label>
            <Input
              type="text"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
              placeholder="ABC-1234"
              className="bg-card border-border text-foreground"
            />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Model (optional)</Label>
            <Input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Model S Plaid"
              className="bg-card border-border text-foreground"
            />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Type</Label>
            <Select
              value={carType}
              onValueChange={setCarType}
              options={[
                { label: "EV", value: "EV" },
                { label: "Sedan", value: "SEDAN" },
                { label: "SUV", value: "SUV" },
                { label: "Hatchback", value: "HATCHBACK" },
                { label: "Pickup", value: "PICKUP" },
                { label: "Van", value: "VAN" },
              ]}
              className="bg-card border-border text-foreground"
            />
          </div>
          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add vehicle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
