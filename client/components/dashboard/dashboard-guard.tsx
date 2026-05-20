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

    // Role scoping: each role can only browse its own area.
    const role = user?.role;
    if (!role) return;
    const inAdmin = pathname.startsWith("/admin");
    const inSupervisor = pathname.startsWith("/supervisor");
    const inUser = pathname.startsWith("/user");

    if (role === "SUPERVISOR" && (inAdmin || inUser)) {
      router.replace(homeForRole("SUPERVISOR"));
      return;
    }
    if (role === "ADMIN" && (inSupervisor || inUser)) {
      router.replace(homeForRole("ADMIN"));
      return;
    }
    if (role === "USER" && (inAdmin || inSupervisor)) {
      router.replace(homeForRole("USER"));
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
