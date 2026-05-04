import Link from "next/link";
import { ArrowRight, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Reset() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground selection:bg-primary/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(var(--primary),0.12),transparent_24%),radial-gradient(circle_at_82%_82%,rgba(var(--secondary-foreground),0.08),transparent_22%)]" />
      <div className="absolute inset-0 opacity-20 mask-[radial-gradient(ellipse_at_center,transparent_20%,black)] bg-[grid-white/[0.02]]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-2xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <section className="group relative w-full overflow-hidden rounded-[2.5rem] border border-border/50 bg-secondary/40 p-6 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] backdrop-blur-2xl transition-all duration-500 hover:border-border/80 sm:p-8 lg:p-12">
          <div className="absolute left-[-10%] top-[-10%] h-64 w-64 rounded-full bg-primary/10 blur-[80px] transition-opacity group-hover:opacity-100" />
          <div className="absolute bottom-[-15%] right-[-5%] h-72 w-72 rounded-full bg-secondary-foreground/5 blur-[90px]" />

          <div className="relative space-y-10">
            <div className="space-y-3">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Reset Password
              </h1>
              <p className="max-w-sm text-sm leading-relaxed text-secondary-foreground/60 sm:text-base">
                Ensure your new password contains at least 8 characters including a symbol.
              </p>
            </div>

            <form className="space-y-6">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="ml-1 text-sm font-semibold text-secondary-foreground/80">
                    New Password
                  </label>
                  <div className="group/input flex h-14 items-center gap-3 rounded-2xl border border-border/50 bg-background/40 px-4 transition-all focus-within:border-primary/50 focus-within:bg-background/80 focus-within:ring-4 focus-within:ring-primary/10">
                    <Lock className="h-5 w-5 text-secondary-foreground/40 transition-colors group-focus-within/input:text-primary" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="h-full w-full bg-transparent text-sm text-foreground outline-none placeholder:text-secondary-foreground/30"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="ml-1 text-sm font-semibold text-secondary-foreground/80">
                    Confirm Password
                  </label>
                  <div className="group/input flex h-14 items-center gap-3 rounded-2xl border border-border/50 bg-background/40 px-4 transition-all focus-within:border-primary/50 focus-within:bg-background/80 focus-within:ring-4 focus-within:ring-primary/10">
                    <ShieldCheck className="h-5 w-5 text-secondary-foreground/40 transition-colors group-focus-within/input:text-primary" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="h-full w-full bg-transparent text-sm text-foreground outline-none placeholder:text-secondary-foreground/30"
                    />
                  </div>
                </div>
              </div>

              <Button className="h-14 w-full rounded-2xl bg-primary text-base font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-[0.98] hover:bg-primary/90">
                Update Credentials
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </form>

            <div className="pt-2">
              <div className="h-px w-full bg-border/50" />
              <div className="pt-5 text-center text-sm text-secondary-foreground/60">
                <Link href="/Auth/Login" className="inline-flex items-center gap-1.5 font-semibold transition-opacity hover:text-secondary-foreground">
                  <span className="text-primary">&lsaquo;</span>
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