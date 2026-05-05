import Link from "next/link";
import { notFound } from "next/navigation";
import SlotAssignmentForm from "@/components/slot-assignment-form";

type ManagementSlotDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ManagementSlotDetailPage({ params }: ManagementSlotDetailPageProps) {
  const { id } = await params;
  const slotId = Number(id);

  if (!Number.isInteger(slotId) || slotId < 1 || slotId > 10) {
    notFound();
  }

  const defaultKind = slotId <= 4 ? "charge-and-park" : "parking-only";

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border/70 bg-card/95 p-4 shadow-sm sm:p-6 dark:shadow-none">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">Slot Assignment</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Slot {slotId}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Fill vehicle and slot data, then assign this slot.</p>
          </div>
          <Link
            href="/supervisor/management"
            className="rounded-lg border border-border/70 bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted/40"
          >
            Back to management
          </Link>
        </div>

        <SlotAssignmentForm slotId={slotId} defaultKind={defaultKind} />
      </section>
    </div>
  );
}
