"use client";

import { useState } from "react";

import { Select } from "@/components/ui/select";

const slotKinds = [
  { value: "charge-and-park", label: "Charge + Park" },
  { value: "parking-only", label: "Parking Only" },
] as const;

const carTypeOptions = [
  { value: "sedan", label: "Sedan" },
  { value: "suv", label: "SUV" },
  { value: "hatchback", label: "Hatchback" },
  { value: "pickup", label: "Pickup" },
  { value: "van", label: "Van" },
  { value: "ev", label: "EV" },
];

type SlotAssignmentFormProps = {
  slotId: number;
  defaultKind: string;
};

export default function SlotAssignmentForm({ slotId, defaultKind }: SlotAssignmentFormProps) {
  const [carType, setCarType] = useState("");
  const [slotType, setSlotType] = useState(defaultKind);

  return (
    <form className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <label htmlFor="plate" className="text-xs font-semibold tracking-[0.15em] text-muted-foreground uppercase">
          Plate Number
        </label>
        <input
          id="plate"
          name="plate"
          placeholder="e.g. ABC-1342"
          className="h-11 w-full rounded-lg border border-border/70 bg-background px-3 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="owner" className="text-xs font-semibold tracking-[0.15em] text-muted-foreground uppercase">
          Driver Name
        </label>
        <input
          id="owner"
          name="owner"
          placeholder="e.g. Ahmed Salah"
          className="h-11 w-full rounded-lg border border-border/70 bg-background px-3 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold tracking-[0.15em] text-muted-foreground uppercase">Car Type</label>
        <Select
          value={carType}
          onValueChange={setCarType}
          options={carTypeOptions}
          placeholder="Select car type"
          className="h-11 rounded-lg border-border/70 bg-background"
        />
        <input type="hidden" name="carType" value={carType} />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold tracking-[0.15em] text-muted-foreground uppercase">Slot Type</label>
        <Select
          value={slotType}
          onValueChange={setSlotType}
          options={[...slotKinds]}
          placeholder="Select slot type"
          className="h-11 rounded-lg border-border/70 bg-background"
        />
        <input type="hidden" name="slotType" value={slotType} />
      </div>

      <div className="space-y-2">
        <label htmlFor="battery" className="text-xs font-semibold tracking-[0.15em] text-muted-foreground uppercase">
          Battery % (if charging)
        </label>
        <input
          id="battery"
          name="battery"
          type="number"
          min={0}
          max={100}
          placeholder="0 - 100"
          className="h-11 w-full rounded-lg border border-border/70 bg-background px-3 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="arrivalTime" className="text-xs font-semibold tracking-[0.15em] text-muted-foreground uppercase">
          Arrival Time
        </label>
        <input
          id="arrivalTime"
          name="arrivalTime"
          type="datetime-local"
          className="h-11 w-full rounded-lg border border-border/70 bg-background px-3 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <label htmlFor="notes" className="text-xs font-semibold tracking-[0.15em] text-muted-foreground uppercase">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          placeholder="Optional notes about this assignment..."
          className="w-full rounded-lg border border-border/70 bg-background px-3 py-2 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
        />
      </div>

      <div className="md:col-span-2 flex flex-wrap gap-3 pt-1">
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
        >
          Assign Slot {slotId}
        </button>
        <button
          type="button"
          className="rounded-lg border border-border/70 bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted/30"
        >
          Save Draft
        </button>
      </div>
    </form>
  );
}
