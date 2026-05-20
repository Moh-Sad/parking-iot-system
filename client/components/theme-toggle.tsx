"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const STORAGE_KEY = "voltcore-theme";

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
}

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const stored = localStorage.getItem(STORAGE_KEY);
      let isDark: boolean;
      if (stored === "dark") isDark = true;
      else if (stored === "light") isDark = false;
      else isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setDark(isDark);
      applyTheme(isDark);
      setMounted(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    applyTheme(next);
    localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!mounted}
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition hover:border-primary/25 hover:bg-primary/5 hover:text-foreground disabled:opacity-50",
        className,
      )}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {mounted && dark ? (
        <Sun className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
      ) : (
        <Moon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
      )}
    </button>
  );
}
