"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, Lock, Mail, Shield, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, homeForRole } from "@/lib/auth-context";
import { ApiCallError } from "@/lib/api";

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await login(email.trim(), password);
      if (result.mustCompleteProfile) {
        router.push("/auth/access");
        return;
      }
      router.push(homeForRole(result.role));
    } catch (err) {
      if (err instanceof ApiCallError) {
        setError(err.message || "Login failed");
      } else {
        setError("Network error. Is the API server running?");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground selection:bg-primary/30">
      {/* Enhanced Ambient Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(var(--primary),0.12),transparent_24%),radial-gradient(circle_at_82%_82%,rgba(var(--secondary-foreground),0.08),transparent_22%)]" />
      <div className="absolute inset-0 opacity-20 mask-[radial-gradient(ellipse_at_center,transparent_20%,black)] bg-[grid-white/[0.02]]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-2xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <section className="group relative w-full overflow-hidden rounded-[2.5rem] border border-border/50 bg-secondary/40 p-6 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] backdrop-blur-2xl transition-all duration-500 hover:border-border/80 sm:p-8 lg:p-12">
          {/* Decorative Glows */}
          <div className="absolute left-[-10%] top-[-10%] h-64 w-64 rounded-full bg-primary/10 blur-[80px] transition-opacity group-hover:opacity-100" />
          <div className="absolute bottom-[-15%] right-[-5%] h-72 w-72 rounded-full bg-secondary-foreground/5 blur-[90px]" />

          <div className="relative flex flex-col gap-10">
            {/* Header Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-inner">
                  <Shield className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/80">
                  Secure access
                </p>
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Welcome back.
                </h1>
                <p className="max-w-md text-sm leading-relaxed text-secondary-foreground/60 sm:text-base">
                  Enter your credentials to manage your industrial EV parking network.
                </p>
              </div>
            </div>

            {/* Form Section */}
            <form className="space-y-6" onSubmit={onSubmit} noValidate>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-semibold text-secondary-foreground/80 ml-1">Email</label>
                  <div className="group/input flex h-14 items-center gap-3 rounded-2xl border border-border/50 bg-background/40 px-4 transition-all focus-within:border-primary/50 focus-within:bg-background/80 focus-within:ring-4 focus-within:ring-primary/10">
                    <Mail className="h-5 w-5 text-secondary-foreground/40 transition-colors group-focus-within/input:text-primary" />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="operator@voltcore.com"
                      className="h-full w-full bg-transparent text-sm outline-none placeholder:text-secondary-foreground/30"
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-semibold text-secondary-foreground/80 ml-1">Password</label>
                  <div className="group/input flex h-14 items-center gap-3 rounded-2xl border border-border/50 bg-background/40 px-4 transition-all focus-within:border-primary/50 focus-within:bg-background/80 focus-within:ring-4 focus-within:ring-primary/10">
                    <Lock className="h-5 w-5 text-secondary-foreground/40 transition-colors group-focus-within/input:text-primary" />
                    <input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-full w-full bg-transparent text-sm outline-none placeholder:text-secondary-foreground/30"
                      disabled={submitting}
                    />
                  </div>
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

              <div className="flex items-center justify-between px-1 text-sm">
                <label className="flex cursor-pointer items-center gap-2 text-secondary-foreground/60 transition-colors hover:text-secondary-foreground">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border/50 bg-background text-primary accent-primary focus:ring-primary/30"
                  />
                  Remember me
                </label>
                <Link href="/auth/recovery" className="font-semibold text-primary transition-opacity hover:opacity-80">
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                disabled={submitting || !email || !password}
                className="h-14 w-full rounded-2xl bg-primary text-base font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-[0.98] hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Enter Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>

            {/* Footer Note */}
            <p className="text-center text-xs text-secondary-foreground/40">
              By signing in, you agree to our <Link href="#" className="underline decoration-primary/30 underline-offset-4 hover:text-primary">Terms of Service</Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
