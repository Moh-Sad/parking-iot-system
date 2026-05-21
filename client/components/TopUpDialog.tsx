"use client";

import { useCallback, useEffect, useState, type ReactElement } from "react";
import { AlertCircle, CheckCircle2, CreditCard, Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Select } from "@/components/ui/select";
import { api, ApiCallError } from "@/lib/api";
import type { UserPaymentMethodDto } from "@/lib/api-types";
import { formatMoney } from "@/lib/format";

const PRESETS_CENTS = [2000, 5000, 10000, 25000];

interface TopUpDialogProps {
  trigger: ReactElement;
  onSuccess?: () => void | Promise<void>;
}

export function TopUpDialog({ trigger, onSuccess }: TopUpDialogProps) {
  const [open, setOpen] = useState(false);
  const [methods, setMethods] = useState<UserPaymentMethodDto[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState("");
  const [amountCents, setAmountCents] = useState(10000); // $100
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ newBalanceCents: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadMethods = useCallback(async () => {
    try {
      const res = await api.get<UserPaymentMethodDto[]>("/me/finances/payment-methods");
      setMethods(res);
      const def = res.find((m) => m.isDefault) ?? res[0];
      if (def) setSelectedMethodId(def.id);
    } catch (err) {
      if (err instanceof ApiCallError) setError(err.message);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setSuccess(null);
    setError(null);
    void loadMethods();
  }, [open, loadMethods]);

  const submit = async () => {
    if (submitting) return;
    setError(null);
    if (amountCents <= 0) return setError("Amount must be positive.");
    if (!selectedMethodId) return setError("Please add a payment method first.");

    setSubmitting(true);
    try {
      const wallet = await api.post<{ balanceCents: number }>("/me/wallet/top-up", {
        amountCents,
        paymentMethodId: selectedMethodId,
      });
      setSuccess({ newBalanceCents: wallet.balanceCents });
      await onSuccess?.();
    } catch (err) {
      if (err instanceof ApiCallError) setError(err.message || "Top-up failed");
      else setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setSuccess(null);
      setError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-106.25 bg-background border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <Wallet className="h-5 w-5" /> Top up wallet
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Add funds to your VoltCore wallet. Used automatically for charging sessions.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-4 space-y-4">
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Top-up successful</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    New wallet balance:{" "}
                    <span className="font-semibold text-foreground">
                      {formatMoney(success.newBalanceCents, "ETB")}
                    </span>
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={() => handleOpenChange(false)} className="bg-primary text-primary-foreground hover:bg-primary/90">
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className="grid gap-5 py-4">
              <div className="flex flex-col gap-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Quick amounts
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {PRESETS_CENTS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAmountCents(c)}
                      className={`rounded-lg border py-2 text-sm font-semibold transition-colors ${
                        amountCents === c
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-card text-foreground hover:bg-muted/40"
                      }`}
                    >
                      ${c / 100}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="custom-amount" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Custom amount (USD)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <Input
                    id="custom-amount"
                    type="number"
                    min={1}
                    max={10000}
                    step="1"
                    value={(amountCents / 100).toFixed(0)}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (!Number.isFinite(v) || v < 0) return;
                      setAmountCents(Math.round(v * 100));
                    }}
                    disabled={submitting}
                    className="bg-card border-border text-foreground pl-7"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Pay with
                </Label>
                {methods.length === 0 ? (
                  <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm text-muted-foreground">
                    No payment methods on file. Add one in Settings first.
                  </div>
                ) : (
                  <Select
                    value={selectedMethodId}
                    onValueChange={setSelectedMethodId}
                    options={methods.map((m) => ({
                      value: m.id,
                      label: `${m.brand} •••• ${m.last4}${m.isDefault ? " · Default" : ""}`,
                    }))}
                    placeholder="Select a card"
                    className="bg-card border-border text-foreground"
                  />
                )}
              </div>

              {error && (
                <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={submitting}
                className="border-border text-foreground hover:bg-muted"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void submit()}
                disabled={submitting || amountCents <= 0 || !selectedMethodId}
                className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Add {formatMoney(amountCents, "ETB")}
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
