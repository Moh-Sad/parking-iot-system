import Link from "next/link";
import { ShieldCheck, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Recovery() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground selection:bg-primary/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(var(--primary),0.08),transparent_30%),radial-gradient(circle_at_82%_82%,rgba(var(--secondary-foreground),0.05),transparent_30%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-2xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <section className="group relative w-full overflow-hidden rounded-2xl border border-border/40 bg-secondary/20 p-6 shadow-2xl backdrop-blur-xl sm:p-8 lg:p-10">
          
          <div className="relative flex flex-col gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-inner">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary/80">
                  Secure recovery
                </p>
              </div>

              <div className="space-y-1.5">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Password Recovery
                </h1>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Enter your registered email address below to receive secure reset instructions for your IoT network.
                </p>
              </div>
            </div>

            <form className="space-y-5">
              <div className="space-y-1.5">
                <label className="ml-1 text-sm font-medium text-foreground">
                  Email Address
                </label>
                <div className="group/input flex h-11 items-center gap-3 rounded-xl border border-border/50 bg-background/50 px-3 transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50">
                  <Mail className="h-4 w-4 text-muted-foreground group-focus-within/input:text-primary" />
                  <input
                    type="email"
                    placeholder="name@voltcore.io"
                    className="h-full w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              <Button className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90">
                Send Reset Link
              </Button>

              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-3 px-1 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  <span className="h-px flex-1 bg-border/60" />
                  Verification Secure
                  <span className="h-px flex-1 bg-border/60" />
                </div>
              </div>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Lost access to your email?{' '}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Contact Infrastructure Support
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}