"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Car,
  Loader2,
  Lock,
  Mail,
  Phone,
  User,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveTokens, saveUser } from "@/lib/auth-storage";
import { api, ApiCallError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { LoginResponse } from "@/lib/api-types";

export default function RegisterPage() {
  const router = useRouter();
  const { refreshMe } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);

  // Step 1
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // Step 2
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [plateNumber, setPlateNumber] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const splitName = (full: string): { firstName?: string; lastName?: string } => {
    const trimmed = full.trim();
    if (!trimmed) return {};
    const parts = trimmed.split(/\s+/);
    if (parts.length === 1) return { firstName: parts[0] };
    return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) return setError("Email is required.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setStep(2);
  };

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    setStep(1);
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting || step !== 2) return;
    setError(null);
    if (!fullName.trim()) return setError("Full name is required.");

    setSubmitting(true);
    try {
      const { firstName, lastName } = splitName(fullName);
      const result = await api.post<LoginResponse>(
        "/auth/register",
        {
          email: email.trim(),
          password,
          ...(firstName ? { firstName } : {}),
          ...(lastName ? { lastName } : {}),
          ...(phone.trim() ? { phone: phone.trim() } : {}),
          ...(plateNumber.trim() ? { plateNumber: plateNumber.trim() } : {}),
        },
        { skipAuth: true },
      );

      saveTokens({ access: result.token, refresh: result.refreshToken });
      saveUser(result.user);
      await refreshMe();
      router.push("/user");
    } catch (err) {
      if (err instanceof ApiCallError) {
        if (err.status === 409) setError("An account with this email already exists.");
        else setError(err.message || "Registration failed");
      } else {
        setError("Network error. Is the API server running?");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="dark relative min-h-screen overflow-hidden bg-background text-foreground selection:bg-primary/30">
      <div className="absolute inset-0 z-0">
        <video
          src="https://www.pexels.com/download/video/7700793/"
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover -scale-x-100"
          style={{ objectFit: "cover", width: "100%", height: "100%" }}
        />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-2xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <section className="group relative w-full overflow-hidden rounded-3xl border border-white/10 bg-black/40 p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] backdrop-blur-xl sm:p-8 lg:p-10">
          <div className="relative flex flex-col gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-inner">
                  <UserPlus className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary/80">Join VoltCore</p>
              </div>

              <div className="space-y-1.5">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Create an account.</h1>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {step === 1
                    ? "Set up your credentials to access the EV parking network."
                    : "Tell us a bit about yourself to finalize your registration."}
                </p>
              </div>
            </div>

            <form className="space-y-5 relative min-h-[280px]" onSubmit={onSubmit} noValidate>
              {/* Step 1 */}
              <div
                className={`transition-all duration-300 absolute w-full ${
                  step === 1
                    ? "opacity-100 translate-x-0 pointer-events-auto"
                    : "opacity-0 -translate-x-10 pointer-events-none"
                }`}
              >
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="reg-email" className="text-sm font-medium text-foreground ml-1">Email</label>
                    <div className="group/input flex h-11 items-center gap-3 rounded-xl border border-border/50 bg-background/50 px-3 transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50">
                      <Mail className="h-4 w-4 text-muted-foreground group-focus-within/input:text-primary" />
                      <input
                        id="reg-email"
                        type="email"
                        autoComplete="email"
                        placeholder="driver@example.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={submitting}
                        className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="reg-password" className="text-sm font-medium text-foreground ml-1">Password</label>
                    <div className="group/input flex h-11 items-center gap-3 rounded-xl border border-border/50 bg-background/50 px-3 transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50">
                      <Lock className="h-4 w-4 text-muted-foreground group-focus-within/input:text-primary" />
                      <input
                        id="reg-password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="••••••••"
                        minLength={8}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={submitting}
                        className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="reg-confirm" className="text-sm font-medium text-foreground ml-1">Confirm Password</label>
                    <div className="group/input flex h-11 items-center gap-3 rounded-xl border border-border/50 bg-background/50 px-3 transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50">
                      <Lock className="h-4 w-4 text-muted-foreground group-focus-within/input:text-primary" />
                      <input
                        id="reg-confirm"
                        type="password"
                        autoComplete="new-password"
                        placeholder="••••••••"
                        minLength={8}
                        required
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        disabled={submitting}
                        className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>
                </div>

                {error && step === 1 && (
                  <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="mt-8">
                  <Button onClick={handleNext} type="button" className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90">
                    Continue
                  </Button>
                </div>
              </div>

              {/* Step 2 */}
              <div
                className={`transition-all duration-300 absolute w-full ${
                  step === 2
                    ? "opacity-100 translate-x-0 pointer-events-auto"
                    : "opacity-0 translate-x-10 pointer-events-none"
                }`}
              >
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="reg-name" className="text-sm font-medium text-foreground ml-1">Full Name</label>
                    <div className="group/input flex h-11 items-center gap-3 rounded-xl border border-border/50 bg-background/50 px-3 transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50">
                      <User className="h-4 w-4 text-muted-foreground group-focus-within/input:text-primary" />
                      <input
                        id="reg-name"
                        type="text"
                        autoComplete="name"
                        placeholder="Alex Mercer"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={submitting}
                        className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="reg-phone" className="text-sm font-medium text-foreground ml-1">Phone Number</label>
                    <div className="group/input flex h-11 items-center gap-3 rounded-xl border border-border/50 bg-background/50 px-3 transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50">
                      <Phone className="h-4 w-4 text-muted-foreground group-focus-within/input:text-primary" />
                      <input
                        id="reg-phone"
                        type="tel"
                        autoComplete="tel"
                        placeholder="+1 (555) 000-0000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={submitting}
                        className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="reg-plate" className="text-sm font-medium text-foreground ml-1">Plate Number</label>
                    <div className="group/input flex h-11 items-center gap-3 rounded-xl border border-border/50 bg-background/50 px-3 transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50">
                      <Car className="h-4 w-4 text-muted-foreground group-focus-within/input:text-primary" />
                      <input
                        id="reg-plate"
                        type="text"
                        placeholder="XYZ-9081"
                        value={plateNumber}
                        onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                        disabled={submitting}
                        className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>
                </div>

                {error && step === 2 && (
                  <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="mt-8 flex gap-3">
                  <Button
                    onClick={handleBack}
                    type="button"
                    variant="outline"
                    disabled={submitting}
                    className="h-11 w-11 shrink-0 rounded-xl border-border/50 bg-background/50 transition-all hover:bg-background/80 px-0"
                  >
                    <ArrowLeft className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting || !fullName}
                    className="h-11 flex-1 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating…
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </div>
              </div>
            </form>

            <div className="text-center text-sm text-muted-foreground mt-4">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Log in
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
