import Link from "next/link";
import { Car, CarFront, Clock3, PlugZap, SquareParking } from "lucide-react";
import type { SlotView } from "@/lib/api-types";

const KIND_LABEL: Record<SlotView["kind"], string> = {
  CHARGE_AND_PARK: "Charge + Park",
  PARKING_ONLY: "Parking",
};

export function SlotCard({ slot, href }: { slot: SlotView; href: string }) {
  return (
    <Link
      href={href}
      className={`group relative flex min-h-75 flex-col overflow-hidden rounded-md border p-3 transition-all ${
        slot.occupied
          ? "border-primary/35 bg-primary text-primary-foreground"
          : "border-border/70 bg-card text-foreground shadow-sm hover:border-primary/30 hover:shadow-md dark:bg-background dark:shadow-none"
      }`}
    >
      <div className="absolute top-0 left-0 w-full h-full">
        {slot.occupied ? (
          <CarFront className="h-70 w-70 text-muted-foreground/10" />
        ) : (
          <SquareParking className="h-70 w-70 text-muted-foreground/10" />
        )}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-foreground/10 opacity-80 dark:bg-foreground/5" />

      <div className="mb-3 flex items-start justify-between gap-2 relative">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.12em] uppercase">{slot.displayId}</p>
          <p
            className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${
              slot.occupied
                ? "border-primary-foreground/30 bg-primary-foreground/10"
                : "border-border/70 bg-muted/30 text-muted-foreground"
            }`}
          >
            {KIND_LABEL[slot.kind]}
          </p>
          <p
            className={`mt-1 text-[9px] font-medium tracking-wide ${
              slot.occupied ? "text-primary-foreground/80" : "text-muted-foreground"
            }`}
          >
            Slot {slot.slotNumber} - Tap to {slot.occupied ? "manage" : "assign"}
          </p>
        </div>
        {slot.occupied ? (
          <Car className="h-6 w-6 text-primary-foreground/90 relative" />
        ) : (
          <SquareParking className="h-6 w-6 text-muted-foreground relative" />
        )}
      </div>

      {slot.occupied ? (
        <div className="mt-auto space-y-2 relative">
          <p className="truncate text-xs font-medium">{slot.vehicle}</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-primary-foreground/10 p-2">
              <p className="mb-1 flex items-center gap-1.5 text-primary-foreground/80">
                <Clock3 className="h-3.5 w-3.5" />
                Elapsed
              </p>
              <p className="font-semibold">{slot.duration ?? "—"}</p>
            </div>
            <div className="rounded-lg bg-primary-foreground/10 p-2">
              <p className="mb-1 flex items-center gap-1.5 text-primary-foreground/80">
                <PlugZap className="h-3.5 w-3.5" />
                {slot.kind === "CHARGE_AND_PARK" ? "Battery" : "Status"}
              </p>
              <p className="font-semibold">
                {slot.kind === "CHARGE_AND_PARK"
                  ? typeof slot.battery === "number"
                    ? `${slot.battery}%`
                    : "—"
                  : "Parked"}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-auto rounded-lg border border-dashed border-border/70 bg-muted/20 p-2.5 text-xs text-muted-foreground relative">
          <p className="font-medium">Slot available</p>
          <p className="mt-1">Ready for incoming vehicle.</p>
        </div>
      )}
    </Link>
  );
}
