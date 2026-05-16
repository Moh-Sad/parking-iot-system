"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  CreditCard,
  FileText,
  LayoutDashboard,
  Settings,
  Zap,
} from "lucide-react";

import { cn } from "@/lib/utils";

type DashboardRole = "admin" | "supervisor";

function getDashboardRole(pathname: string): DashboardRole {
  if (pathname === "/supervisor" || pathname.startsWith("/supervisor/")) {
    return "supervisor";
  }
  return "admin";
}

function roleBase(role: DashboardRole): "/admin" | "/supervisor" {
  return role === "supervisor" ? "/supervisor" : "/admin";
}

const navItems = [
  { key: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
  { key: "management" as const, label: "Management", icon: Briefcase },
  { key: "finances" as const, label: "Finances", icon: CreditCard },
  { key: "settings" as const, label: "Settings", icon: Settings },
  { key: "logs" as const, label: "Logs", icon: FileText },
];

function hrefForItem(role: DashboardRole, key: (typeof navItems)[number]["key"]): string {
  const base = roleBase(role);
  if (key === "dashboard") return base;
  if (key === "management") {
    return `${base}/management`;
  }
  return `${base}/${key}`;
}

function isNavActive(
  pathname: string,
  href: string,
  key: (typeof navItems)[number]["key"],
): boolean {
  if (key === "dashboard") {
    return pathname === href;
  }
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const role = getDashboardRole(pathname);
  const homeHref = roleBase(role);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border/80 md:flex",
        "bg-background",
      )}
    >
      <div className="flex h-full flex-col px-3 pb-6 pt-6">
        <Link
          href={homeHref}
          className="group flex shrink-0 items-start gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-foreground/4"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-background shadow-sm transition group-hover:border-border">
            <Zap
              className="h-[22px] w-[22px] text-foreground"
              strokeWidth={2.25}
              aria-hidden
            />
          </span>
          <div className="min-w-0 pt-0.5">
            <p className="text-sm font-bold tracking-wide text-foreground">VOLTCORE</p>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              PRECISION EV NETWORK
            </p>
          </div>
        </Link>

        <nav className="mt-10 flex flex-col gap-2" aria-label="Main">
          {navItems.map(({ key, label, icon: Icon }) => {
            const href = hrefForItem(role, key);
            const active = isNavActive(pathname, href, key);
            return (
              <Link
                key={`${role}-${key}`}
                href={href}
                className={cn(
                  "group relative flex items-center gap-3 overflow-hidden rounded-xl py-3.5 pl-4 pr-3 text-sm font-medium transition-colors duration-200",
                  active
                    ? "bg-muted/40 text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted/25 hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "absolute inset-y-0 left-0 w-[3px] rounded-l-xl bg-primary transition-opacity duration-200",
                    active ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                  )}
                  aria-hidden
                />
                <Icon
                  className={cn(
                    "relative h-[18px] w-[18px] shrink-0 transition-colors",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground group-hover:text-foreground",
                  )}
                  strokeWidth={active ? 2.25 : 2}
                  aria-hidden
                />
                <span className={cn(active ? "font-semibold" : "group-hover:font-medium")}>
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
