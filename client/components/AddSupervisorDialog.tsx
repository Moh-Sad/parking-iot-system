"use client";

import { useState } from "react";
import { AlertCircle, Loader2, UserPlus } from "lucide-react";
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

interface AddSupervisorDialogProps {
  regions: string[];
  onCreated?: () => void | Promise<void>;
}

export function AddSupervisorDialog({ regions, onCreated }: AddSupervisorDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [region, setRegion] = useState("");
  const [role, setRole] = useState<"ADMIN" | "SUPERVISOR">("SUPERVISOR");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const regionOptions = regions.length
    ? regions.map((r) => ({ label: r, value: r }))
    : [
        { label: "EMEA Central", value: "EMEA Central" },
        { label: "APAC Hub", value: "APAC Hub" },
        { label: "North America", value: "North America" },
        { label: "Global Hub", value: "Global Hub" },
      ];

  const reset = () => {
    setEmail("");
    setFirstName("");
    setLastName("");
    setRegion("");
    setRole("SUPERVISOR");
    setError(null);
  };

  const handleSend = async () => {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/users", {
        email: email.trim(),
        ...(firstName.trim() ? { firstName: firstName.trim() } : {}),
        ...(lastName.trim() ? { lastName: lastName.trim() } : {}),
        role,
        ...(region ? { region } : {}),
      });
      reset();
      setOpen(false);
      await onCreated?.();
    } catch (err) {
      if (err instanceof ApiCallError) setError(err.message || "Could not invite supervisor");
      else setError("Network error. Is the API server running?");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger
        render={
          <Button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90"
          >
            <UserPlus className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
            Add supervisor
          </Button>
        }
      />

      <DialogContent className="sm:max-w-106.25 bg-background border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
            Invite Supervisor
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Send an email invitation. The recipient will get a setup link to set their password.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Email address *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="supervisor@voltcore.io"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              className="bg-card border-border text-foreground focus-visible:ring-primary focus-visible:ring-offset-background"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="firstName" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                First name
              </Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={submitting}
                className="bg-card border-border text-foreground"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="lastName" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Last name
              </Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={submitting}
                className="bg-card border-border text-foreground"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="role" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Role
              </Label>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as "ADMIN" | "SUPERVISOR")}
                options={[
                  { label: "Supervisor", value: "SUPERVISOR" },
                  { label: "Admin", value: "ADMIN" },
                ]}
                placeholder="Select role"
                className="bg-card border-border text-foreground"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="region" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Region
              </Label>
              <Select
                value={region}
                onValueChange={setRegion}
                options={regionOptions}
                placeholder="Select a region"
                className="bg-card border-border text-foreground"
              />
            </div>
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
            onClick={() => setOpen(false)}
            disabled={submitting}
            className="border-border text-foreground hover:bg-muted"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={() => void handleSend()}
            disabled={!email || submitting}
            className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              "Send Invitation"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
