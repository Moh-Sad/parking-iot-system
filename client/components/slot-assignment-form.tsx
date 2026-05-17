"use client";

import { useState, type FormEvent } from "react";
import { AlertCircle, Loader2, Plus } from "lucide-react";
import { Select } from "@/components/ui/select";
import { api, ApiCallError } from "@/lib/api";

const slotKinds = [
  { value: "CHARGE_AND_PARK", label: "Charge + Park" },
  { value: "PARKING_ONLY", label: "Parking Only" },
] as const;

const carTypeOptions = [
  { value: "SEDAN", label: "Sedan" },
  { value: "SUV", label: "SUV" },
  { value: "HATCHBACK", label: "Hatchback" },
  { value: "PICKUP", label: "Pickup" },
  { value: "VAN", label: "Van" },
  { value: "EV", label: "EV" },
];

type CarType = (typeof carTypeOptions)[number]["value"];

type SlotAssignmentFormProps = {
  slotId: string;
  defaultKind: "CHARGE_AND_PARK" | "PARKING_ONLY";
  onAssigned?: () => void;
  onCancel?: () => void;
};

export default function SlotAssignmentForm({
  slotId,
  defaultKind,
  onAssigned,
  onCancel,
}: SlotAssignmentFormProps) {
  const [plateNumber, setPlateNumber] = useState("");
  const [driverName, setDriverName] = useState("");
  const [carType, setCarType] = useState<CarType | "">("");
  const [slotType, setSlotType] = useState<string>(defaultKind);
  const [battery, setBattery] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    if (!plateNumber.trim() || !driverName.trim() || !carType) {
      setError("Plate number, driver name, and car type are required.");
      return;
    }

    const payload: Record<string, unknown> = {
      slotId,
      plateNumber: plateNumber.trim().toUpperCase(),
      driverName: driverName.trim(),
      carType,
      slotType,
    };
    if (battery !== "") {
      const n = Number(battery);
      if (!Number.isFinite(n) || n < 0 || n > 100) {
        setError("Battery must be between 0 and 100.");
        return;
      }
      payload.battery = n;
    }
    if (arrivalTime) payload.arrivalTime = new Date(arrivalTime).toISOString();
    if (notes.trim()) payload.notes = notes.trim();

    setSubmitting(true);
    try {
      await api.post("/assignments", payload);
      onAssigned?.();
    } catch (err) {
      if (err instanceof ApiCallError) {
        if (err.status === 409) {
          setError("This slot already has an active assignment.");
        } else {
          setError(err.message || "Failed to assign slot");
        }
      } else {
        setError("Network error. Is the API server running?");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={onSubmit} noValidate>
      <div className="space-y-2">
        <label htmlFor="plate" className="text-xs font-semibold tracking-[0.15em] text-muted-foreground uppercase">
          Plate Number
        </label>
        <input
          id="plate"
          required
          value={plateNumber}
          onChange={(e) => setPlateNumber(e.target.value)}
          placeholder="e.g. ABC-1342"
          className="h-11 w-full rounded-lg border border-border/70 bg-background px-3 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
          disabled={submitting}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="driver" className="text-xs font-semibold tracking-[0.15em] text-muted-foreground uppercase">
          Driver Name
        </label>
        <input
          id="driver"
          required
          value={driverName}
          onChange={(e) => setDriverName(e.target.value)}
          placeholder="e.g. Ahmed Salah"
          className="h-11 w-full rounded-lg border border-border/70 bg-background px-3 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
          disabled={submitting}
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold tracking-[0.15em] text-muted-foreground uppercase">Car Type</label>
        <Select
          value={carType}
          onValueChange={(v) => setCarType(v as CarType)}
          options={carTypeOptions}
          placeholder="Select car type"
          className="h-11 rounded-lg border-border/70 bg-background"
        />
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
      </div>

      <div className="space-y-2">
        <label htmlFor="battery" className="text-xs font-semibold tracking-[0.15em] text-muted-foreground uppercase">
          Battery % {slotType === "CHARGE_AND_PARK" ? "(EV)" : "(optional)"}
        </label>
        <input
          id="battery"
          type="number"
          min={0}
          max={100}
          value={battery}
          onChange={(e) => setBattery(e.target.value)}
          placeholder="0 - 100"
          className="h-11 w-full rounded-lg border border-border/70 bg-background px-3 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
          disabled={submitting}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="arrivalTime" className="text-xs font-semibold tracking-[0.15em] text-muted-foreground uppercase">
          Arrival Time
        </label>
        <input
          id="arrivalTime"
          type="datetime-local"
          value={arrivalTime}
          onChange={(e) => setArrivalTime(e.target.value)}
          className="h-11 w-full rounded-lg border border-border/70 bg-background px-3 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
          disabled={submitting}
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <label htmlFor="notes" className="text-xs font-semibold tracking-[0.15em] text-muted-foreground uppercase">
          Notes
        </label>
        <textarea
          id="notes"
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes about this assignment..."
          className="w-full rounded-lg border border-border/70 bg-background px-3 py-2 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
          disabled={submitting}
        />
      </div>

      {error && (
        <div
          role="alert"
          className="md:col-span-2 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="md:col-span-2 flex flex-wrap gap-3 pt-1">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-95 disabled:opacity-60"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {submitting ? "Assigning…" : "Assign slot"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-lg border border-border/70 bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted/30"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
