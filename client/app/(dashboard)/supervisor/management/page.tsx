"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { api, ApiCallError } from "@/lib/api";
import type { SlotsListResponse, SlotStats, SlotView } from "@/lib/api-types";
import { SlotCard } from "@/components/dashboard/slot-card";

const ZERO_STATS: SlotStats = {
  totalSlots: 0,
  usedSlots: 0,
  availableSlots: 0,
  chargingSlots: 0,
  parkingOnlySlots: 0,
};

async function loadSlots(): Promise<SlotsListResponse> {
  // /slots returns { data, stats } — keep the full envelope.
  return api.get<SlotsListResponse>("/slots", { unwrap: false });
}

export default function ManagementPage() {
  const [slots, setSlots] = useState<SlotView[]>([]);
  const [stats, setStats] = useState<SlotStats>(ZERO_STATS);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (showSpinner: boolean) => {
    if (showSpinner) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);
    try {
      const res = await loadSlots();
      setSlots(res.data);
      setStats(res.stats);
    } catch (err) {
      if (err instanceof ApiCallError) {
        setError(err.message || "Failed to load slots");
      } else {
        setError("Network error. Is the API server running?");
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchData(true);
  }, [fetchData]);

  // Split halfway: with 10 slots that's the original 5/5 layout. With more,
  // it gives two roughly balanced rows.
  const half = Math.ceil(slots.length / 2);
  const topRow = slots.slice(0, half);
  const bottomRow = slots.slice(half);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border/70 bg-card/95 p-4 shadow-sm sm:p-6 dark:shadow-none">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Supervisor Management
              </h1>
              <button
                type="button"
                onClick={() => void fetchData(false)}
                disabled={isLoading || isRefreshing}
                aria-label="Refresh slots"
                className="rounded-md border border-border/60 bg-background p-1.5 text-muted-foreground transition hover:bg-muted/40 hover:text-foreground disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </button>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {isLoading
                ? "Loading live occupancy…"
                : stats.totalSlots > 0
                  ? `Live occupancy across ${stats.totalSlots} slots (${stats.chargingSlots} charging + parking, ${stats.parkingOnlySlots} parking-only).`
                  : "No slots available."}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <StatTile label="Used" value={stats.usedSlots} />
            <StatTile label="Available" value={stats.availableSlots} />
            <StatTile label="Charge + Park" value={stats.chargingSlots} />
            <StatTile label="Parking Only" value={stats.parkingOnlySlots} />
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-64 items-center justify-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : slots.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-10 text-center text-sm text-muted-foreground">
            No slots assigned to your region yet.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5 lg:gap-3">
              {topRow.map((slot) => (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  href={`/supervisor/management/${slot.id}`}
                />
              ))}
            </div>

            {bottomRow.length > 0 && (
              <>
                <div className="my-3 w-full rounded-xl border border-border/60 bg-muted/20 px-4 py-2 text-center text-[10px] font-semibold tracking-[0.35em] text-muted-foreground uppercase">
                  Access Lane
                </div>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5 lg:gap-3">
                  {bottomRow.map((slot) => (
                    <SlotCard
                      key={slot.id}
                      slot={slot}
                      href={`/supervisor/management/${slot.id}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card px-3 py-2 shadow-sm dark:bg-background dark:shadow-none">
      <p className="text-[10px] font-semibold tracking-[0.15em] text-muted-foreground uppercase">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
