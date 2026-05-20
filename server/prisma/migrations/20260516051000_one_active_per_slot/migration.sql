-- Enforce a single ACTIVE assignment per slot.
CREATE UNIQUE INDEX IF NOT EXISTS "one_active_per_slot"
  ON "slot_assignments" ("slotId")
  WHERE "status" = 'ACTIVE';
