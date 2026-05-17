"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, homeForRole } from "@/lib/auth-context";
import { api, ApiCallError } from "@/lib/api";

const ROLE_LABEL: Record<"ADMIN" | "SUPERVISOR", string> = {
  ADMIN: "Administrator",
  SUPERVISOR: "Network Supervisor",
};

export default function Access() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, refreshMe } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      if (user.firstName) setFirstName(user.firstName);
      if (user.lastName) setLastName(user.lastName);
    }
  }, [user]);

  const strength = Math.min(100, Math.round((password.length / 16) * 100));

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    if (!accepted) {
      setError("Please accept the Terms of Service to continue.");
      return;
    }
    if (password && password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/auth/access/complete", {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        ...(password ? { password } : {}),
      });
      await refreshMe();
      router.replace(user ? homeForRole(user.role) : "/login");
    } catch (err) {
      if (err instanceof ApiCallError) {
        setError(err.message || "Could not complete profile");
      } else {
        setError("Network error. Is the API server running?");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" aria-label="Loading" />
      </main>
    );
  }

  const roleLabel = ROLE_LABEL[user.role];

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground selection:bg-primary/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(var(--primary),0.12),transparent_24%),radial-gradient(circle_at_82%_82%,rgba(var(--secondary-foreground),0.08),transparent_22%)]" />
      <div className="absolute inset-0 opacity-20 mask-[radial-gradient(ellipse_at_center,transparent_20%,black)] bg-[grid-white/[0.02]]" />

      <div className="relative mx-auto flex min-h-screen w-full items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <section className="w-full max-w-md rounded-[2rem] border border-border/50 bg-secondary/40 p-6 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] backdrop-blur-2xl transition-all sm:p-8">
          <div className="relative space-y-8">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-inner">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/80">Network Access</p>
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Complete Your Profile</h1>
                <p className="text-sm leading-relaxed text-secondary-foreground/60">
                  Setup your credentials to begin managing the parking network.
                </p>
              </div>
            </div>

            <form className="space-y-5" onSubmit={onSubmit} noValidate>
              <div className="space-y-2">
                <label className="ml-1 text-sm font-semibold text-secondary-foreground/80">Assigned Role</label>
                <div className="flex h-14 items-center justify-between gap-3 rounded-2xl border border-border/50 bg-secondary/30 px-4">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-secondary-foreground/45" />
                    <span className="text-sm font-medium text-foreground">{roleLabel}</span>
                  </div>
                  <span className="rounded-md bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground/75">
                    Level {user.roleLevel}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="ml-1 text-sm font-semibold text-secondary-foreground/80">First Name</label>
                  <input
                    id="firstName"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-12 w-full bg-transparent border-b border-border/60 pb-2 text-sm text-foreground outline-none"
                    placeholder="First name"
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="ml-1 text-sm font-semibold text-secondary-foreground/80">Last Name</label>
                  <input
                    id="lastName"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-12 w-full bg-transparent border-b border-border/60 pb-2 text-sm text-foreground outline-none"
                    placeholder="Last name"
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="setupPassword" className="ml-1 text-sm font-semibold text-secondary-foreground/80">
                  Network Password <span className="text-xs font-normal text-secondary-foreground/50">(leave blank to keep current)</span>
                </label>
                <div className="flex h-14 items-center gap-3 rounded-2xl border border-border/50 bg-background/40 px-4">
                  <input
                    id="setupPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-full w-full bg-transparent text-sm text-foreground outline-none placeholder:text-secondary-foreground/30"
                    placeholder="••••••••"
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="rounded-md p-1 text-secondary-foreground/40 transition hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <div className="px-1">
                  <div className="h-1.5 rounded-full bg-border/60">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: password ? `${strength}%` : "0%" }}
                    />
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-secondary-foreground/60">
                    Minimum 8 characters when changing.
                  </p>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border/40 bg-secondary/20 p-4 text-sm leading-relaxed text-secondary-foreground/70">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-border/50 bg-background text-primary accent-primary focus:ring-primary/30"
                />
                <span>I accept the Terms of Service and Network Governance protocols.</span>
              </label>

              <Button
                type="submit"
                disabled={submitting || !firstName || !lastName || !accepted}
                className="h-14 w-full rounded-2xl bg-primary text-base font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-[0.98] hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Initializing…
                  </>
                ) : (
                  <>
                    Initialize Access
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>

              <p className="pt-1 text-center text-xs text-secondary-foreground/45">
                Not the right account?{" "}
                <Link href="/login" className="font-semibold text-primary">Back to login</Link>
              </p>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
