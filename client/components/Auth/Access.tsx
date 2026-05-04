import Link from "next/link";
import { ArrowRight, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Access() {
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
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Complete Your Supervisor Profile</h1>
                <p className="text-sm leading-relaxed text-secondary-foreground/60">Setup your credentials to begin managing the Precision EV Network.</p>
              </div>
            </div>

            <form className="space-y-5">
              <div className="space-y-2">
                <label className="ml-1 text-sm font-semibold text-secondary-foreground/80">Assigned Role</label>
                <div className="flex h-14 items-center justify-between gap-3 rounded-2xl border border-border/50 bg-secondary/30 px-4">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-secondary-foreground/45" />
                    <span className="text-sm font-medium text-foreground">Network Supervisor</span>
                  </div>
                  <span className="rounded-md bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground/75">Level 4</span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="ml-1 text-sm font-semibold text-secondary-foreground/80">First Name</label>
                  <input className="h-12 w-full bg-transparent border-b border-border/60 pb-2 text-sm text-foreground outline-none" defaultValue="John" />
                </div>
                <div>
                  <label className="ml-1 text-sm font-semibold text-secondary-foreground/80">Last Name</label>
                  <input className="h-12 w-full bg-transparent border-b border-border/60 pb-2 text-sm text-foreground outline-none" defaultValue="Doe" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="ml-1 text-sm font-semibold text-secondary-foreground/80">Network Password</label>
                <div className="flex h-14 items-center gap-3 rounded-2xl border border-border/50 bg-background/40 px-4">
                  <input type="password" className="h-full w-full bg-transparent text-sm text-foreground outline-none placeholder:text-secondary-foreground/30" defaultValue="••••••••••••" />
                  <EyeOff className="h-5 w-5 text-secondary-foreground/35" />
                </div>
                <div className="px-1">
                  <div className="h-1.5 rounded-full bg-border/60">
                    <div className="h-full w-[58%] rounded-full bg-primary" />
                  </div>
                  <p className="text-sm leading-relaxed text-secondary-foreground/60">Minimum 12 characters required for supervisor access.</p>
                </div>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border/40 bg-secondary/20 p-4 text-sm leading-relaxed text-secondary-foreground/70">
                <input type="checkbox" className="mt-1 h-4 w-4 rounded border-border/50 bg-background text-primary accent-primary focus:ring-primary/30" />
                <span>I accept the VoltCore Terms of Service and Network Governance protocols.</span>
              </label>

              <Button className="h-14 w-full rounded-2xl bg-primary text-base font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-[0.98] hover:bg-primary/90">
                Initialize Access
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              <p className="pt-1 text-center text-xs text-secondary-foreground/45">Already configured? <Link href="/Auth/Login" className="font-semibold text-primary">Back to login</Link></p>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}