"use client";

import { Bell, Search } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const ghostIconBtnClass =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-0 bg-transparent text-muted-foreground transition hover:bg-muted/40 hover:text-foreground";

export function DashboardNavbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="flex h-[65px] items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 px-0 sm:pr-4">
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
            className={cn(ghostIconBtnClass, "relative")}
            aria-label="Notifications, 3 unread"
          >
            <Bell className="h-[18px] w-[18px]" strokeWidth={2} />
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground ring-2 ring-background">
              3
            </span>
          </button>

          <ThemeToggle className="border-0 bg-transparent hover:border-0 hover:bg-muted/40" />

          <div
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary ring-1 ring-primary/20 sm:flex"
            title="Marcus Vane"
          >
            MV
          </div>
        </div>
      </div>
    </header>
  );
}
