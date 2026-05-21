import Link from "next/link";
import { Lock, Mail, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Login() {
  return (
    <main className="dark relative min-h-screen overflow-hidden bg-background text-foreground selection:bg-primary/30">
      <div className="absolute inset-0 z-0">
        <video
          src="https://www.pexels.com/download/video/7700793/"
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover"
          style={{ objectFit: 'cover', width: '100%', height: '100%' }}
        />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-2xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <section className="group relative w-full overflow-hidden rounded-3xl border border-white/10 bg-black/40 p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] backdrop-blur-xl sm:p-8 lg:p-10">
          
          <div className="relative flex flex-col gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-inner">
                  <Shield className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary/80">
                  Secure access
                </p>
              </div>
              
              <div className="space-y-1.5">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Welcome back.
                </h1>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Enter your credentials to manage your industrial EV parking network.
                </p>
              </div>
            </div>

            <form className="space-y-5">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground ml-1">Email</label>
                  <div className="group/input flex h-11 items-center gap-3 rounded-xl border border-border/50 bg-background/50 px-3 transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50">
                    <Mail className="h-4 w-4 text-muted-foreground group-focus-within/input:text-primary" />
                    <input
                      type="email"
                      placeholder="operator@voltcore.com"
                      className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
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
                      className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end px-1 text-sm">
                  <Link href="/auth/recovery" className="font-medium text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90">
                Log in
              </Button>
            </form>

            <div className="flex flex-col gap-4 text-center text-sm text-muted-foreground">
              <p>
                Don&apos;t have an account? <Link href="/register" className="font-medium text-primary hover:underline">Sign up</Link>
              </p>
              <p className="text-xs">
                By signing in, you agree to our <Link href="#" className="hover:text-primary hover:underline">Terms of Service</Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}