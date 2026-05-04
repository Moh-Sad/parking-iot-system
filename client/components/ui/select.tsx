import * as React from "react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type SelectOption = {
  label: string;
  value: string;
};

type SelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
};

function Select({
  value,
  onValueChange,
  options,
  placeholder = "Select option",
  className,
}: SelectProps) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex h-10 w-full cursor-pointer items-center justify-between rounded-md border border-input bg-muted-foreground/10 px-3 py-2 text-sm text-foreground shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          className,
        )}
        aria-expanded={open}
      >
        <span className={cn(!selected && "text-muted-foreground")}>
          {selected?.label ?? placeholder}
        </span>
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-sm">
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              open && "rotate-180",
            )}
          />
        </span>
      </button>

      {open ? (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onValueChange(option.value);
                setOpen(false);
              }}
              className={cn(
                "flex w-full cursor-pointer items-center justify-between rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-muted-foreground/10",
                value === option.value && "bg-muted-foreground/10 text-foreground",
              )}
            >
              <span>{option.label}</span>
              {value === option.value ? <Check className="h-4 w-4" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export { Select };
