"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Battery, Car, Clock3, Loader2, MapPin, StopCircle } from "lucide-react";
import { api, ApiCallError } from "@/lib/api";
import SlotAssignmentForm from "@/components/slot-assignment-form";
import { formatRelative } from "@/lib/format";

interface SlotDetailData {
  slot: {
    id: string;
    slotNumber: number;
    displayId: string;
    kind: "CHARGE_AND_PARK" | "PARKING_ONLY";
    isActive: boolean;
    station: { id: string; name: string; region: string };
  };
  activeAssignment: {
    id: string;
    arrivalTime: string;
    battery: number | null;
    notes: string | null;
    vehicle: { id: string; plateNumber: string; driverName: string; carType: string };
  } | null;
}

const KIND_LABEL: Record<SlotDetailData["slot"]["kind"], string> = {
  CHARGE_AND_PARK: "Charge + Park",
  PARKING_ONLY: "Parking Only",
};

export default function ManagementSlotDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [detail, setDetail] = useState<SlotDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);

  const fetchDetail = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<SlotDetailData>(`/slots/${id}`);
      setDetail(res);
    } catch (err) {
      if (err instanceof ApiCallError) {
        if (err.status === 404) {
          setError("Slot not found.");
        } else if (err.status === 403) {
          setError("You don't have access to this slot.");
        } else {
          setError(err.message || "Failed to load slot");
        }
      } else {
        setError("Network error. Is the API server running?");
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    void fetchDetail();
  }, [id, fetchDetail]);

  const closeAssignment = async () => {
    if (!detail?.activeAssignment) return;
    if (!confirm("End this parking session?")) return;
    setClosing(true);
    setError(null);
    try {
      await api.post(`/assignments/${detail.activeAssignment.id}/close`);
      await fetchDetail();
    } catch (err) {
      if (err instanceof ApiCallError) setError(err.message || "Failed to close session");
      else setError("Network error");
    } finally {
      setClosing(false);
    }
  };

  const onAssigned = () => {
    void fetchDetail();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <section className="rounded-2xl border border-border/70 bg-card/95 p-6 shadow-sm dark:shadow-none">
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error ?? "Slot not found."}</span>
        </div>
        <Link
          href="/supervisor/management"
          className="mt-4 inline-flex rounded-lg border border-border/70 bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted/40"
        >
          Back to management
        </Link>
      </section>
    );
  }

  const { slot, activeAssignment } = detail;
  const occupied = !!activeAssignment;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border/70 bg-card/95 p-4 shadow-sm sm:p-6 dark:shadow-none">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              Slot Assignment
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              {slot.displayId}{" "}
              <span className="text-base font-normal text-muted-foreground">
                · {KIND_LABEL[slot.kind]}
              </span>
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {slot.station.name} — {slot.station.region}
            </p>
          </div>
          <Link
            href="/supervisor/management"
            className="rounded-lg border border-border/70 bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted/40"
          >
            Back to management
          </Link>
        </div>

        {occupied ? (
          <ActiveAssignmentPanel
            assignment={activeAssignment!}
            slotKind={slot.kind}
            onClose={closeAssignment}
            closing={closing}
          />
        ) : (
          <SlotAssignmentForm
            slotId={slot.id}
            defaultKind={slot.kind === "CHARGE_AND_PARK" ? "CHARGE_AND_PARK" : "PARKING_ONLY"}
            onAssigned={onAssigned}
            onCancel={() => router.push("/supervisor/management")}
          />
        )}
      </section>
    </div>
  );
}

function ActiveAssignmentPanel({
  assignment,
  slotKind,
  onClose,
  closing,
}: {
  assignment: NonNullable<SlotDetailData["activeAssignment"]>;
  slotKind: SlotDetailData["slot"]["kind"];
  onClose: () => void;
  closing: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 sm:p-5">
        <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">Active session</p>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DetailRow icon={<Car className="h-4 w-4" />} label="Vehicle">
            <span className="font-semibold text-foreground">{assignment.vehicle.plateNumber}</span>
            <span className="ml-2 text-muted-foreground">· {assignment.vehicle.driverName}</span>
          </DetailRow>
          <DetailRow icon={<Clock3 className="h-4 w-4" />} label="Arrived">
            {formatRelative(assignment.arrivalTime)}
          </DetailRow>
          <DetailRow icon={<Battery className="h-4 w-4" />} label="Battery">
            {slotKind === "CHARGE_AND_PARK"
              ? typeof assignment.battery === "number"
                ? `${assignment.battery}%`
                : "—"
              : "N/A"}
          </DetailRow>
          <DetailRow icon={<Car className="h-4 w-4" />} label="Type">
            {assignment.vehicle.carType}
          </DetailRow>
        </div>
        {assignment.notes && (
          <p className="mt-3 rounded-md bg-background/60 p-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Notes: </span>
            {assignment.notes}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onClose}
        disabled={closing}
        className="inline-flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-2 text-sm font-semibold text-destructive transition hover:bg-destructive/10 disabled:opacity-60"
      >
        {closing ? <Loader2 className="h-4 w-4 animate-spin" /> : <StopCircle className="h-4 w-4" />}
        {closing ? "Ending…" : "End session"}
      </button>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-sm">{children}</p>
    </div>
  );
}
