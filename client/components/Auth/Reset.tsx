"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { AlertCircle, CheckCircle2, Loader2, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, ApiCallError } from "@/lib/api";

export default function Reset() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" aria-label="Loading" />
        </main>
      }
    >
      <ResetInner />
    </Suspense>
  );
}

function ResetInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) setError("Reset link is missing or invalid. Please request a new one.");
  }, [token]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    if (!token) return setError("Reset link is missing or invalid.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");

    setSubmitting(true);
    try {
      await api.post("/auth/reset", { token, password }, { skipAuth: true });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      if (err instanceof ApiCallError) setError(err.message || "Could not reset password");
      else setError("Network error. Is the API server running?");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground selection:bg-primary/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(var(--primary),0.08),transparent_30%),radial-gradient(circle_at_82%_82%,rgba(var(--secondary-foreground),0.05),transparent_30%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-2xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <section className="group relative w-full overflow-hidden rounded-2xl border border-border/40 bg-secondary/20 p-6 shadow-2xl backdrop-blur-xl sm:p-8 lg:p-10">
          <div className="relative space-y-8">
            <div className="space-y-3">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Reset Password</h1>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                Ensure your new password contains at least 8 characters.
              </p>
            </div>

            {success ? (
              <div className="rounded-xl border border-primary/30 bg-primary/10 p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">Password updated</p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Redirecting you to the login page…
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={onSubmit} noValidate>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="new-password" className="ml-1 text-sm font-medium text-foreground">
                      New Password
                    </label>
                    <div className="group/input flex h-11 items-center gap-3 rounded-xl border border-border/50 bg-background/50 px-3 transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50">
                      <Lock className="h-4 w-4 text-muted-foreground group-focus-within/input:text-primary" />
                      <input
                        id="new-password"
                        type="password"
                        autoComplete="new-password"
                        minLength={8}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-full w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                        disabled={submitting || !token}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="confirm-password" className="ml-1 text-sm font-medium text-foreground">
                      Confirm Password
                    </label>
                    <div className="group/input flex h-11 items-center gap-3 rounded-xl border border-border/50 bg-background/50 px-3 transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50">
                      <ShieldCheck className="h-4 w-4 text-muted-foreground group-focus-within/input:text-primary" />
                      <input
                        id="confirm-password"
                        type="password"
                        autoComplete="new-password"
                        minLength={8}
                        required
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder="••••••••"
                        className="h-full w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                        disabled={submitting || !token}
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={submitting || !token || !password || !confirm}
                  className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating…
                    </>
                  ) : (
                    "Update Credentials"
                  )}
                </Button>
              </form>
            )}

            <div className="pt-2">
              <div className="h-px w-full bg-border/50" />
              <div className="pt-5 text-center text-sm text-muted-foreground">
                <Link href="/login" className="inline-flex items-center gap-1.5 font-medium hover:text-primary transition-colors">
                  <span>&lsaquo;</span>
                  Back to secure login
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
