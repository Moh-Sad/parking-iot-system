import Link from "next/link";
import { Car, CarFront, Clock3, PlugZap, SquareParking } from "lucide-react";

type Slot = {
  slotNumber: number;
  id: string;
  kind: "charge-and-park" | "parking-only";
  occupied: boolean;
  vehicle?: string;
  duration?: string;
  battery?: number;
};

const slots: Slot[] = [
  { slotNumber: 1, id: "A-01", kind: "charge-and-park", occupied: true, vehicle: "Tesla Model 3", duration: "01:34:18", battery: 67 },
  { slotNumber: 2, id: "A-02", kind: "charge-and-park", occupied: false },
  { slotNumber: 3, id: "A-03", kind: "charge-and-park", occupied: true, vehicle: "BYD Seal", duration: "00:46:52", battery: 41 },
  { slotNumber: 4, id: "A-04", kind: "charge-and-park", occupied: false },
  { slotNumber: 5, id: "P-05", kind: "parking-only", occupied: true, vehicle: "Hyundai Elantra", duration: "00:21:08" },
  { slotNumber: 6, id: "P-06", kind: "parking-only", occupied: false },
  { slotNumber: 7, id: "P-07", kind: "parking-only", occupied: true, vehicle: "Kia Sportage", duration: "02:03:11" },
  { slotNumber: 8, id: "P-08", kind: "parking-only", occupied: false },
  { slotNumber: 9, id: "P-09", kind: "parking-only", occupied: true, vehicle: "Toyota Corolla", duration: "00:58:33" },
  { slotNumber: 10, id: "P-10", kind: "parking-only", occupied: false },
];

const totalSlots = slots.length;
const chargingSlots = slots.filter((slot) => slot.kind === "charge-and-park").length;
const parkingOnlySlots = slots.filter((slot) => slot.kind === "parking-only").length;
const usedSlots = slots.filter((slot) => slot.occupied).length;
const availableSlots = totalSlots - usedSlots;
const usagePercent = Math.round((usedSlots / totalSlots) * 100);
const topRowSlots = slots.slice(0, 5);
const bottomRowSlots = slots.slice(5);

function slotBadge(kind: Slot["kind"]) {
  return kind === "charge-and-park" ? "Charge + Park" : "Parking";
}

export default function ManagementPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border/70 bg-card/95 p-4 shadow-sm sm:p-6 dark:shadow-none">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Supervisor Management</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Live occupancy view with 10 slots (4 charging + parking, 6 parking-only).
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="rounded-xl border border-border/60 bg-card px-3 py-2 shadow-sm dark:bg-background dark:shadow-none">
              <p className="text-[10px] font-semibold tracking-[0.15em] text-muted-foreground uppercase">Used</p>
              <p className="text-lg font-semibold">{usedSlots}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card px-3 py-2 shadow-sm dark:bg-background dark:shadow-none">
              <p className="text-[10px] font-semibold tracking-[0.15em] text-muted-foreground uppercase">Available</p>
              <p className="text-lg font-semibold">{availableSlots}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card px-3 py-2 shadow-sm dark:bg-background dark:shadow-none">
              <p className="text-[10px] font-semibold tracking-[0.15em] text-muted-foreground uppercase">Charge + Park</p>
              <p className="text-lg font-semibold">{chargingSlots}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card px-3 py-2 shadow-sm dark:bg-background dark:shadow-none">
              <p className="text-[10px] font-semibold tracking-[0.15em] text-muted-foreground uppercase">Parking Only</p>
              <p className="text-lg font-semibold">{parkingOnlySlots}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5 lg:gap-3">
          {topRowSlots.map((slot) => (
            <Link
              key={slot.id}
              href={`/supervisor/management/${slot.slotNumber}`}
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
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.12em] uppercase">{slot.id}</p>
                  <p
                    className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${
                      slot.occupied
                        ? "border-primary-foreground/30 bg-primary-foreground/10"
                        : "border-border/70 bg-muted/30 text-muted-foreground"
                    }`}
                  >
                    {slotBadge(slot.kind)}
                  </p>
                  <p className={`mt-1 text-[9px] font-medium tracking-wide ${slot.occupied ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                    Slot {slot.slotNumber} - Tap to assign
                  </p>
                </div>
                {slot.occupied ? (
                  <Car className="h-6 w-6 text-primary-foreground/90" />
                ) : (
                  <SquareParking className="h-6 w-6 text-muted-foreground" />
                )}
              </div>

              {slot.occupied ? (
                <div className="mt-auto space-y-2">
                  <p className="truncate text-xs font-medium">{slot.vehicle}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-primary-foreground/10 p-2">
                      <p className="mb-1 flex items-center gap-1.5 text-primary-foreground/80">
                        <Clock3 className="h-3.5 w-3.5" />
                        Elapsed
                      </p>
                      <p className="font-semibold">{slot.duration}</p>
                    </div>
                    <div className="rounded-lg bg-primary-foreground/10 p-2">
                      <p className="mb-1 flex items-center gap-1.5 text-primary-foreground/80">
                        <PlugZap className="h-3.5 w-3.5" />
                        {slot.kind === "charge-and-park" ? "Battery" : "Status"}
                      </p>
                      <p className="font-semibold">
                        {slot.kind === "charge-and-park" ? `${slot.battery}%` : "Parked"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-auto rounded-lg border border-dashed border-border/70 bg-muted/20 p-2.5 text-xs text-muted-foreground">
                  <p className="font-medium">Slot available</p>
                  <p className="mt-1">Ready for incoming vehicle.</p>
                </div>
              )}
            </Link>
          ))}
        </div>

        <div className="my-3 w-full rounded-xl border border-border/60 bg-muted/20 px-4 py-2 text-center text-[10px] font-semibold tracking-[0.35em] text-muted-foreground uppercase">
          Access Lane - Zone A
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5 lg:gap-3">
          {bottomRowSlots.map((slot) => (
            <Link
              key={slot.id}
              href={`/supervisor/management/${slot.slotNumber}`}
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
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.12em] uppercase">{slot.id}</p>
                  <p
                    className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${
                      slot.occupied
                        ? "border-primary-foreground/30 bg-primary-foreground/10"
                        : "border-border/70 bg-muted/30 text-muted-foreground"
                    }`}
                  >
                    {slotBadge(slot.kind)}
                  </p>
                  <p className={`mt-1 text-[9px] font-medium tracking-wide ${slot.occupied ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                    Slot {slot.slotNumber} - Tap to assign
                  </p>
                </div>
                {slot.occupied ? (
                  <Car className="h-6 w-6 text-primary-foreground/90" />
                ) : (
                  <SquareParking className="h-6 w-6 text-muted-foreground" />
                )}
              </div>

              {slot.occupied ? (
                <div className="mt-auto space-y-2">
                  <p className="truncate text-xs font-medium">{slot.vehicle}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-primary-foreground/10 p-2">
                      <p className="mb-1 flex items-center gap-1.5 text-primary-foreground/80">
                        <Clock3 className="h-3.5 w-3.5" />
                        Elapsed
                      </p>
                      <p className="font-semibold">{slot.duration}</p>
                    </div>
                    <div className="rounded-lg bg-primary-foreground/10 p-2">
                      <p className="mb-1 flex items-center gap-1.5 text-primary-foreground/80">
                        <PlugZap className="h-3.5 w-3.5" />
                        {slot.kind === "charge-and-park" ? "Battery" : "Status"}
                      </p>
                      <p className="font-semibold">
                        {slot.kind === "charge-and-park" ? `${slot.battery}%` : "Parked"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-auto rounded-lg border border-dashed border-border/70 bg-muted/20 p-2.5 text-xs text-muted-foreground">
                  <p className="font-medium">Slot available</p>
                  <p className="mt-1">Ready for incoming vehicle.</p>
                </div>
              )}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
