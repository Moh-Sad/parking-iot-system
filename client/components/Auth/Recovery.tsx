import Link from "next/link";
import { ArrowRight, ShieldCheck, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Recovery() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground selection:bg-primary/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(var(--primary),0.12),transparent_24%),radial-gradient(circle_at_82%_82%,rgba(var(--secondary-foreground),0.08),transparent_22%)]" />
      <div className="absolute inset-0 opacity-20 mask-[radial-gradient(ellipse_at_center,transparent_20%,black)] bg-[grid-white/[0.02]]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-2xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <section className="group relative w-full overflow-hidden rounded-[2.5rem] border border-border/50 bg-secondary/40 p-6 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] backdrop-blur-2xl transition-all duration-500 hover:border-border/80 sm:p-8 lg:p-12">
          <div className="absolute left-[-10%] top-[-10%] h-64 w-64 rounded-full bg-primary/10 blur-[80px] transition-opacity group-hover:opacity-100" />
          <div className="absolute bottom-[-15%] right-[-5%] h-72 w-72 rounded-full bg-secondary-foreground/5 blur-[90px]" />

          <div className="relative flex flex-col gap-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-inner">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/80">
                  Secure recovery
                </p>
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Password Recovery
                </h1>
                <p className="max-w-md text-sm leading-relaxed text-secondary-foreground/60 sm:text-base">
                  Enter your registered email address below to receive secure reset instructions for your IoT network.
                </p>
              </div>
            </div>

            <form className="space-y-6">
              <div className="space-y-2">
                <label className="ml-1 text-sm font-semibold text-secondary-foreground/80">
                  Email Address
                </label>
                <div className="group/input flex h-14 items-center gap-3 rounded-2xl border border-border/50 bg-background/40 px-4 transition-all focus-within:border-primary/50 focus-within:bg-background/80 focus-within:ring-4 focus-within:ring-primary/10">
                  <Mail className="h-5 w-5 text-secondary-foreground/40 transition-colors group-focus-within/input:text-primary" />
                  <input
                    type="email"
                    placeholder="name@voltcore.io"
                    className="h-full w-full bg-transparent text-sm text-foreground outline-none placeholder:text-secondary-foreground/30"
                  />
                </div>
              </div>

              <Button className="h-14 w-full rounded-2xl bg-primary text-base font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-[0.98] hover:bg-primary/90">
                Send Reset Link
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              <div className="space-y-4">
                <div className="flex items-center gap-3 px-1 text-[0.65rem] font-bold uppercase tracking-[0.28em] text-secondary-foreground/35">
                  <span className="h-px flex-1 bg-border/60" />
                  Verification Secure
                  <span className="h-px flex-1 bg-border/60" />
                </div>

                <div className="rounded-2xl border border-border/50 bg-background/40 p-4 shadow-inner">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">2FA Protected</p>
                      <p className="text-xs leading-relaxed text-secondary-foreground/60">
                        You&apos;ll need your mobile authenticator code next.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </form>

            <p className="text-center text-xs text-secondary-foreground/45 sm:text-sm">
              Lost access to your email?{' '}
              <Link href="/Auth/Login" className="font-semibold text-foreground transition-opacity hover:opacity-80">
                Contact Infrastructure Support
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}