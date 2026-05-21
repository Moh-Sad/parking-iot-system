import Link from "next/link";
import { EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Access() {
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
                <p className="text-sm leading-relaxed text-muted-foreground">Setup your credentials to begin managing the Precision EV Network.</p>
              </div>
            </div>

            <form className="space-y-5">
              <div className="space-y-1.5">
                <label className="ml-1 text-sm font-medium text-foreground">Assigned Role</label>
                <div className="flex h-11 items-center justify-between gap-3 rounded-xl border border-border/50 bg-secondary/30 px-3">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Network Supervisor</span>
                  </div>
                  <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Level 4</span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="ml-1 text-sm font-medium text-foreground">First Name</label>
                  <input className="h-11 w-full rounded-xl bg-background/50 border border-border/50 px-3 text-sm text-foreground outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/50" defaultValue="John" />
                </div>
                <div className="space-y-1.5">
                  <label className="ml-1 text-sm font-medium text-foreground">Last Name</label>
                  <input className="h-11 w-full rounded-xl bg-background/50 border border-border/50 px-3 text-sm text-foreground outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/50" defaultValue="Doe" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="ml-1 text-sm font-medium text-foreground">Network Password</label>
                <div className="flex h-11 items-center gap-3 rounded-xl border border-border/50 bg-background/50 px-3 transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50">
                  <input type="password" minLength={8} required className="h-full w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" defaultValue="••••••••••••" />
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="px-1 text-xs leading-relaxed text-muted-foreground">Minimum 8 characters required.</p>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/40 bg-secondary/20 p-4 text-sm leading-relaxed text-muted-foreground transition-colors hover:bg-secondary/30">
                <input type="checkbox" className="mt-1 h-4 w-4 rounded border-border/50 bg-background text-primary focus:ring-primary/30" />
                <span>I accept the Terms of Service and Network Governance protocols.</span>
              </label>

              <Button className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90">
                Initialize Access
              </Button>

              <p className="pt-2 text-center text-sm text-muted-foreground">Already configured? <Link href="/login" className="font-medium text-primary hover:underline">Back to login</Link></p>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}