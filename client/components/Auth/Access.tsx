"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { AlertCircle, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, homeForRole } from "@/lib/auth-context";
import { api, ApiCallError } from "@/lib/api";

const ROLE_LABEL: Record<"ADMIN" | "SUPERVISOR" | "USER", string> = {
  ADMIN: "Administrator",
  SUPERVISOR: "Network Supervisor",
  USER: "Driver",
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
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      if (user.firstName) setFirstName(user.firstName);
      if (user.lastName) setLastName(user.lastName);
    }
  }, [user]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    if (!accepted) return setError("Please accept the Terms of Service to continue.");
    if (password && password.length < 8) return setError("Password must be at least 8 characters.");

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
      if (err instanceof ApiCallError) setError(err.message || "Could not complete profile");
      else setError("Network error. Is the API server running?");
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(var(--primary),0.08),transparent_30%),radial-gradient(circle_at_82%_82%,rgba(var(--secondary-foreground),0.05),transparent_30%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <section className="w-full rounded-2xl border border-border/40 bg-secondary/20 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="relative space-y-8">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-inner">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary/80">Network Access</p>
              </div>

              <div className="space-y-1.5">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Complete Profile</h1>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Setup your credentials to begin managing the network.
                </p>
              </div>
            </div>

            <form className="space-y-5" onSubmit={onSubmit} noValidate>
              <div className="space-y-1.5">
                <label className="ml-1 text-sm font-medium text-foreground">Assigned Role</label>
                <div className="flex h-11 items-center justify-between gap-3 rounded-xl border border-border/50 bg-secondary/30 px-3">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{roleLabel}</span>
                  </div>
                  <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                    Level {user.roleLevel}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="firstName" className="ml-1 text-sm font-medium text-foreground">First Name</label>
                  <input
                    id="firstName"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-11 w-full rounded-xl bg-background/50 border border-border/50 px-3 text-sm text-foreground outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="lastName" className="ml-1 text-sm font-medium text-foreground">Last Name</label>
                  <input
                    id="lastName"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-11 w-full rounded-xl bg-background/50 border border-border/50 px-3 text-sm text-foreground outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="setupPassword" className="ml-1 text-sm font-medium text-foreground">
                  Network Password <span className="text-xs font-normal text-muted-foreground">(leave blank to keep current)</span>
                </label>
                <div className="flex h-11 items-center gap-3 rounded-xl border border-border/50 bg-background/50 px-3 transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50">
                  <input
                    id="setupPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-full w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="px-1 text-xs leading-relaxed text-muted-foreground">
                  Minimum 8 characters when changing.
                </p>
              </div>

              {error && (
                <div role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/40 bg-secondary/20 p-4 text-sm leading-relaxed text-muted-foreground transition-colors hover:bg-secondary/30">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-border/50 bg-background text-primary focus:ring-primary/30"
                />
                <span>I accept the Terms of Service and Network Governance protocols.</span>
              </label>

              <Button
                type="submit"
                disabled={submitting || !firstName || !lastName || !accepted}
                className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Initializing…
                  </>
                ) : (
                  "Initialize Access"
                )}
              </Button>

              <p className="pt-2 text-center text-sm text-muted-foreground">
                Not the right account?{" "}
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Back to login
                </Link>
              </p>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
