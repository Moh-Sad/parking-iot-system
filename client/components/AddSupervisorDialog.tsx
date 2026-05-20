"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const stationOptions = [
  { label: "Central Hub", value: "central_hub" },
  { label: "North Station", value: "north_station" },
  { label: "South Station", value: "south_station" },
  { label: "East Terminal", value: "east_terminal" },
];

export function AddSupervisorDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [station, setStation] = useState("");

  const handleSend = () => {
    // Here you would normally send the invitation
    console.log("Sending invitation to:", email, "for station:", station);
    setOpen(false);
    setEmail("");
    setStation("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90"
          >
            <UserPlus className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
            Add supervisor
          </Button>
        }
      />
      
      <DialogContent className="sm:max-w-106.25 bg-background border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground">Invite Supervisor</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Send an email invitation to a new supervisor and assign them to a station.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="flex flex-col gap-3">
            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="supervisor@voltcore.io"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-card border-border text-foreground focus-visible:ring-primary focus-visible:ring-offset-background"
            />
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="station" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Assigned Station
            </Label>
            <Select
              value={station}
              onValueChange={setStation}
              options={stationOptions}
              placeholder="Select a station"
              className="bg-card border-border text-foreground focus-visible:ring-primary focus-visible:ring-offset-background"
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setOpen(false)}
            className="border-border text-foreground hover:bg-muted"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            onClick={handleSend}
            disabled={!email || !station}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Send Invitation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
