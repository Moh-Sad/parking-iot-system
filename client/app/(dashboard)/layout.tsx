"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Briefcase,
  CircleHelp,
  CreditCard,
  FileText,
  LayoutDashboard,
  Search,
  Settings,
  SlidersHorizontal,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const iconBtnClass =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition hover:border-primary/25 hover:bg-primary/5 hover:text-foreground";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/management", label: "Management", icon: Briefcase },
  { href: "/dashboard/finance", label: "Finance", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/dashboard/admin/logs", label: "Logs", icon: FileText },
] as const;

function isNavActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border/80 md:flex",
          "bg-background",
        )}
      >
        <div className="flex h-full flex-col px-3 pb-6 pt-6">
          <Link
            href="/dashboard"
            className="group flex shrink-0 items-start gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-foreground/[0.04]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-background shadow-sm transition group-hover:border-border">
              <Zap
                className="h-[22px] w-[22px] text-foreground"
                strokeWidth={2.25}
                aria-hidden
              />
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-sm font-bold tracking-wide text-foreground">
                VOLTCORE
              </p>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                PRECISION EV NETWORK
              </p>
            </div>
          </Link>

          <nav className="mt-10 flex flex-col gap-2" aria-label="Main">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = isNavActive(pathname, href);
              return (
                <Link
                  key={href}
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

      <div className="flex min-h-screen flex-col md:pl-64">
        <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-md">
          <div className="flex h-[65px] items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
            <div className="shrink-0">
              <p className="text-base font-bold tracking-tight text-foreground">
                VoltCore IoT
              </p>
            </div>

            <div className="flex min-w-0 flex-1 justify-center px-2 sm:px-4">
              <div className="relative w-full max-w-2xl">
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <input
                  type="search"
                  placeholder="Search systems, stations or nodes..."
                  aria-label="Search"
                  className="h-11 w-full rounded-full border border-border bg-muted/30 py-2 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-primary/15 dark:bg-muted/20"
                />
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
              <button
                type="button"
                className={cn(iconBtnClass, "relative")}
                aria-label="Notifications, 3 unread"
              >
                <Bell className="h-[18px] w-[18px]" strokeWidth={2} />
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground ring-2 ring-background">
                  3
                </span>
              </button>

              <ThemeToggle />

              <div
                className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary ring-1 ring-primary/20 sm:flex"
                title="Marcus Vane"
              >
                MV
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
