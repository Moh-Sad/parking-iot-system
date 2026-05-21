"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Search,
  LogOut,
  User as UserIcon,
  Building2,
  FileText,
  CreditCard,
  Loader2,
  X,
  CheckCheck,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { NotificationItem, Paginated } from "@/lib/api-types";
import { initialsOf, formatRelative } from "@/lib/format";

interface SearchResults {
  users: { id: string; email: string; uid: string; firstName: string | null; lastName: string | null }[];
  stations: { id: string; name: string; code: string; region: string }[];
  invoices: { id: string; code: string; clientName: string; grandTotalCents: number; status: string }[];
  transactions: { id: string; code: string; status: string; amountCents: number }[];
}

const ghostIconBtnClass =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-0 bg-transparent text-muted-foreground transition hover:bg-muted/40 hover:text-foreground";

const NOTIF_DOT: Record<NotificationItem["kind"], string> = {
  INFO: "bg-muted-foreground",
  WARNING: "bg-yellow-500",
  CRITICAL: "bg-destructive",
};

export function DashboardNavbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="flex h-[65px] items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 px-0 sm:pr-4">
          <SearchBox router={router} />
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
          <NotificationsBell userId={user?.id ?? null} />

          <ThemeToggle className="border-0 bg-transparent hover:border-0 hover:bg-muted/40" />

          <AccountMenu user={user} onLogout={() => void logout()} />
        </div>
      </div>
    </header>
  );
}

/* ---------------- Search ---------------- */

function SearchBox({ router }: { router: ReturnType<typeof useRouter> }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (q.trim().length < 2) {
      setResults(null);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await api.get<SearchResults>(`/search?q=${encodeURIComponent(q.trim())}&limit=5`);
        if (!cancelled) setResults(res);
      } catch {
        if (!cancelled) setResults(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const totalHits =
    (results?.users.length ?? 0) +
    (results?.stations.length ?? 0) +
    (results?.invoices.length ?? 0) +
    (results?.transactions.length ?? 0);

  const navigate = (path: string) => {
    setOpen(false);
    setQ("");
    setResults(null);
    router.push(path);
  };

  return (
    <div ref={wrapRef} className="relative w-full max-w-2xl">
      <Search
        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <input
        type="search"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => q.trim() && setOpen(true)}
        placeholder="Search systems, stations or nodes..."
        aria-label="Search"
        className="h-11 w-full rounded-full border border-border bg-muted/30 py-2 pl-11 pr-10 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-primary/15 dark:bg-muted/20"
      />
      {q && (
        <button
          type="button"
          onClick={() => {
            setQ("");
            setResults(null);
            setOpen(false);
          }}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {open && q.trim().length >= 2 && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-12 z-40 max-h-[60vh] overflow-y-auto rounded-xl border border-border bg-background shadow-xl"
        >
          {isLoading && (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
          {!isLoading && results && totalHits === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">No results.</p>
          )}
          {!isLoading && results && totalHits > 0 && (
            <div className="py-1 text-sm">
              {results.users.length > 0 && (
                <SearchGroup label="Users">
                  {results.users.map((u) => {
                    const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email;
                    return (
                      <SearchItem
                        key={u.id}
                        icon={<UserIcon className="h-4 w-4" />}
                        title={name}
                        subtitle={`${u.uid} · ${u.email}`}
                        onClick={() => navigate(`/admin/management`)}
                      />
                    );
                  })}
                </SearchGroup>
              )}
              {results.stations.length > 0 && (
                <SearchGroup label="Stations">
                  {results.stations.map((s) => (
                    <SearchItem
                      key={s.id}
                      icon={<Building2 className="h-4 w-4" />}
                      title={s.name}
                      subtitle={`${s.code} · ${s.region}`}
                      onClick={() => navigate(`/supervisor/management`)}
                    />
                  ))}
                </SearchGroup>
              )}
              {results.invoices.length > 0 && (
                <SearchGroup label="Invoices">
                  {results.invoices.map((i) => (
                    <SearchItem
                      key={i.id}
                      icon={<FileText className="h-4 w-4" />}
                      title={`${i.code} · ${i.clientName}`}
                      subtitle={`${i.status} · $${(i.grandTotalCents / 100).toFixed(2)}`}
                      onClick={() => navigate(`/supervisor/finances`)}
                    />
                  ))}
                </SearchGroup>
              )}
              {results.transactions.length > 0 && (
                <SearchGroup label="Transactions">
                  {results.transactions.map((t) => (
                    <SearchItem
                      key={t.id}
                      icon={<CreditCard className="h-4 w-4" />}
                      title={t.code}
                      subtitle={`${t.status} · $${(t.amountCents / 100).toFixed(2)}`}
                      onClick={() => navigate(`/admin`)}
                    />
                  ))}
                </SearchGroup>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SearchGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <div className="pb-1">{children}</div>
    </div>
  );
}

function SearchItem({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-muted/60"
    >
      <span className="text-muted-foreground">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-foreground">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>
      </span>
    </button>
  );
}

/* ---------------- Notifications ---------------- */

function NotificationsBell({ userId }: { userId: string | null }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const refreshUnread = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await api.get<Paginated<NotificationItem>>(
        "/me/notifications?unreadOnly=true&limit=1",
        { unwrap: false },
      );
      setUnreadCount(res.meta?.unreadCount ?? 0);
    } catch {
      /* ignore */
    }
  }, [userId]);

  useEffect(() => {
    void refreshUnread();
  }, [refreshUnread]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setIsLoading(true);
    (async () => {
      try {
        const res = await api.get<Paginated<NotificationItem>>(
          "/me/notifications?limit=20",
          { unwrap: false },
        );
        if (!cancelled) {
          setItems(res.data);
          setUnreadCount(res.meta?.unreadCount ?? 0);
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const markRead = async (id: string) => {
    try {
      await api.post(`/me/notifications/${id}/read`);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)));
      setUnreadCount((n) => Math.max(0, n - 1));
    } catch {
      /* ignore */
    }
  };

  const markAllRead = async () => {
    try {
      await api.post("/me/notifications/read-all");
      const now = new Date().toISOString();
      setItems((prev) => prev.map((n) => (n.readAt ? n : { ...n, readAt: now })));
      setUnreadCount(0);
    } catch {
      /* ignore */
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(ghostIconBtnClass, "relative")}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Bell className="h-[18px] w-[18px]" strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground ring-2 ring-background">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-12 z-40 w-96 overflow-hidden rounded-xl border border-border bg-background shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:opacity-80"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : items.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                No notifications.
              </p>
            ) : (
              <ul className="divide-y divide-border/60">
                {items.map((n) => {
                  const unread = !n.readAt;
                  const content = (
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${unread ? NOTIF_DOT[n.kind] : "bg-transparent border border-border"}`}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm ${unread ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                        >
                          {n.title}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.body}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                          {n.kind} · {formatRelative(n.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                  return (
                    <li key={n.id}>
                      {n.link ? (
                        <Link
                          href={n.link}
                          onClick={() => {
                            if (unread) void markRead(n.id);
                            setOpen(false);
                          }}
                          className="block px-4 py-3 transition hover:bg-muted/40"
                        >
                          {content}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (unread) void markRead(n.id);
                          }}
                          className="block w-full px-4 py-3 text-left transition hover:bg-muted/40"
                        >
                          {content}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Account menu ---------------- */

function AccountMenu({
  user,
  onLogout,
}: {
  user: ReturnType<typeof useAuth>["user"];
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const fullName =
    user && (user.firstName || user.lastName)
      ? [user.firstName, user.lastName].filter(Boolean).join(" ")
      : user?.email ?? "Account";
  const initials = initialsOf(user?.firstName, user?.lastName, user?.email);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${fullName}`}
        title={fullName}
        className="hidden h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary ring-1 ring-primary/20 transition hover:bg-primary/25 sm:flex"
      >
        {initials}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-12 z-40 w-64 overflow-hidden rounded-xl border border-border bg-background shadow-xl"
        >
          <div className="border-b border-border/80 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary ring-1 ring-primary/20">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{fullName}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.email ?? ""}</p>
              </div>
            </div>
            {user?.role && (
              <p className="mt-2 inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {user.role}
              </p>
            )}
          </div>
          <div className="py-1 text-sm">
            <button
              type="button"
              role="menuitem"
              disabled
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-muted-foreground/60"
            >
              <UserIcon className="h-4 w-4" />
              Profile (coming soon)
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-foreground transition hover:bg-muted/60"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
