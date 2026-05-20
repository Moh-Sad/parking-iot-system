"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Lock, Mail, User, Phone, Car, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1);

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    const step1Inputs = document.querySelectorAll('.step-1-input');
    let isValid = true;
    for (const input of Array.from(step1Inputs)) {
      if (!(input as HTMLInputElement).checkValidity()) {
        (input as HTMLInputElement).reportValidity();
        isValid = false;
        break;
      }
    }
    if (isValid) {
      setStep(2);
    }
  };

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    setStep(1);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground selection:bg-primary/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(var(--primary),0.08),transparent_30%),radial-gradient(circle_at_82%_82%,rgba(var(--secondary-foreground),0.05),transparent_30%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-2xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <section className="group relative w-full overflow-hidden rounded-2xl border border-border/40 bg-secondary/20 p-6 shadow-2xl backdrop-blur-xl sm:p-8 lg:p-10">
          
          <div className="relative flex flex-col gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-inner">
                  <UserPlus className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary/80">
                  Join VoltCore
                </p>
              </div>
              
              <div className="space-y-1.5">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Create an account.
                </h1>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {step === 1 
                    ? "Set up your credentials to access the EV parking network." 
                    : "Tell us a bit about yourself to finalize your registration."}
                </p>
              </div>
            </div>

            <form className="space-y-5 relative min-h-[280px]">
              
              {/* Step 1 */}
              <div className={`transition-all duration-300 absolute w-full ${step === 1 ? "opacity-100 translate-x-0 pointer-events-auto" : "opacity-0 -translate-x-10 pointer-events-none"}`}>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground ml-1">Email</label>
                    <div className="group/input flex h-11 items-center gap-3 rounded-xl border border-border/50 bg-background/50 px-3 transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50">
                      <Mail className="h-4 w-4 text-muted-foreground group-focus-within/input:text-primary" />
                      <input
                        type="email"
                        placeholder="driver@example.com"
                        required
                        className="step-1-input h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground ml-1">Password</label>
                    <div className="group/input flex h-11 items-center gap-3 rounded-xl border border-border/50 bg-background/50 px-3 transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50">
                      <Lock className="h-4 w-4 text-muted-foreground group-focus-within/input:text-primary" />
                      <input
                        type="password"
                        placeholder="••••••••"
                        minLength={8}
                        required
                        className="step-1-input h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground ml-1">Confirm Password</label>
                    <div className="group/input flex h-11 items-center gap-3 rounded-xl border border-border/50 bg-background/50 px-3 transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50">
                      <Lock className="h-4 w-4 text-muted-foreground group-focus-within/input:text-primary" />
                      <input
                        type="password"
                        placeholder="••••••••"
                        minLength={8}
                        required
                        className="step-1-input h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <Button onClick={handleNext} type="button" className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90">
                    Continue
                  </Button>
                </div>
              </div>

              {/* Step 2 */}
              <div className={`transition-all duration-300 absolute w-full ${step === 2 ? "opacity-100 translate-x-0 pointer-events-auto" : "opacity-0 translate-x-10 pointer-events-none"}`}>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground ml-1">Full Name</label>
                    <div className="group/input flex h-11 items-center gap-3 rounded-xl border border-border/50 bg-background/50 px-3 transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50">
                      <User className="h-4 w-4 text-muted-foreground group-focus-within/input:text-primary" />
                      <input
                        type="text"
                        placeholder="Alex Mercer"
                        required
                        className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground ml-1">Phone Number</label>
                    <div className="group/input flex h-11 items-center gap-3 rounded-xl border border-border/50 bg-background/50 px-3 transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50">
                      <Phone className="h-4 w-4 text-muted-foreground group-focus-within/input:text-primary" />
                      <input
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        required
                        className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground ml-1">Plate Number</label>
                    <div className="group/input flex h-11 items-center gap-3 rounded-xl border border-border/50 bg-background/50 px-3 transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50">
                      <Car className="h-4 w-4 text-muted-foreground group-focus-within/input:text-primary" />
                      <input
                        type="text"
                        placeholder="XYZ-9081"
                        required
                        className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <Button onClick={handleBack} type="button" variant="outline" className="h-11 w-11 shrink-0 rounded-xl border-border/50 bg-background/50 transition-all hover:bg-background/80 px-0">
                    <ArrowLeft className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                  </Button>
                  <Button type="submit" className="h-11 flex-1 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90">
                    Create Account
                  </Button>
                </div>
              </div>

            </form>

            <div className="text-center text-sm text-muted-foreground mt-4">
              Already have an account? <Link href="/login" className="font-medium text-primary hover:underline">Log in</Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
