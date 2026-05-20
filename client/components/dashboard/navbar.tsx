"use client";

import { Bell, Search } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const ghostIconBtnClass =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/8 bg-white/3 text-white/70 transition hover:bg-white/6 hover:text-white";

export function DashboardNavbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/8 bg-[#090909]/90 backdrop-blur-xl">
      <div className="flex h-16.25 items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="hidden h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/4 text-white/80 lg:flex">
            <Search className="h-4.5 w-4.5" aria-hidden />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.38em] text-white/35">VoltCore IoT</p>
            <h1 className="text-base font-semibold tracking-tight text-white sm:text-lg">Operational Dashboard</h1>
          </div>
        </div>

        <div className="relative hidden min-w-0 flex-1 px-0 sm:block sm:pr-4 lg:px-6">
          <div className="relative w-full max-w-105">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25"
              aria-hidden
            />
            <input
              type="search"
              placeholder="Search system nodes..."
              aria-label="Search"
              className="h-11 w-full rounded-full border border-white/8 bg-white/4 py-2 pl-11 pr-4 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-white/16 focus:bg-white/6"
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            className={cn(ghostIconBtnClass, "relative")}
            aria-label="Notifications, 3 unread"
          >
            <Bell className="h-4.5 w-4.5" strokeWidth={2} />
            <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-white px-1 text-[9px] font-bold leading-none text-black ring-2 ring-[#090909]">
              3
            </span>
          </button>

          <ThemeToggle className="border border-white/8 bg-white/3 text-white/70 hover:bg-white/6 hover:text-white" />

          <div
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[radial-gradient(circle_at_top,#434347,#111)] text-xs font-semibold text-white sm:flex"
            title="Marcus Vane"
          >
            MV
          </div>
        </div>
      </div>
    </header>
  );
}
