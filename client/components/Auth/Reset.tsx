import Link from "next/link";
import { Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Reset() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground selection:bg-primary/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(var(--primary),0.08),transparent_30%),radial-gradient(circle_at_82%_82%,rgba(var(--secondary-foreground),0.05),transparent_30%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-2xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <section className="group relative w-full overflow-hidden rounded-2xl border border-border/40 bg-secondary/20 p-6 shadow-2xl backdrop-blur-xl sm:p-8 lg:p-10">
          
          <div className="relative space-y-8">
            <div className="space-y-3">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Reset Password
              </h1>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                Ensure your new password contains at least 8 characters.
              </p>
            </div>

            <form className="space-y-5">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="ml-1 text-sm font-medium text-foreground">
                    New Password
                  </label>
                  <div className="group/input flex h-11 items-center gap-3 rounded-xl border border-border/50 bg-background/50 px-3 transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50">
                    <Lock className="h-4 w-4 text-muted-foreground group-focus-within/input:text-primary" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      minLength={8}
                      required
                      className="h-full w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="ml-1 text-sm font-medium text-foreground">
                    Confirm Password
                  </label>
                  <div className="group/input flex h-11 items-center gap-3 rounded-xl border border-border/50 bg-background/50 px-3 transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50">
                    <ShieldCheck className="h-4 w-4 text-muted-foreground group-focus-within/input:text-primary" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      minLength={8}
                      required
                      className="h-full w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
              </div>

              <Button className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90">
                Update Credentials
              </Button>
            </form>

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