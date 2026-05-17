"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth, homeForRole } from "@/lib/auth-context";

export function DashboardGuard({ children }: { children: ReactNode }) {
  const { user, isLoading, isAuthenticated, mustCompleteProfile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (mustCompleteProfile && pathname !== "/auth/access") {
      router.replace("/auth/access");
      return;
    }

    // Role scoping: keep supervisors out of /admin/* and admins out of /supervisor/*.
    if (user?.role === "SUPERVISOR" && pathname.startsWith("/admin")) {
      router.replace(homeForRole("SUPERVISOR"));
      return;
    }
    if (user?.role === "ADMIN" && pathname.startsWith("/supervisor")) {
      router.replace(homeForRole("ADMIN"));
      return;
    }
  }, [isLoading, isAuthenticated, mustCompleteProfile, user?.role, pathname, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" aria-label="Loading" />
      </div>
    );
  }

  return <>{children}</>;
}
