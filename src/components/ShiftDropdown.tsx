import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { SHIFT_LABELS, SHIFT_MODES, SHIFT_TAGLINES, type ShiftMode } from "@/lib/pomodoro";

interface ShiftDropdownProps {
  value: ShiftMode;
  onChange: (mode: ShiftMode) => void;
}

export function ShiftDropdown({ value, onChange }: ShiftDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [open]);

  const handleSelect = (mode: ShiftMode) => {
    onChange(mode);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="press flex w-52 items-center justify-between gap-3 rounded-sm border-2 border-border bg-card px-3 py-2 text-left shadow-[6px_6px_0_var(--ink)] outline-none transition-shadow hover:border-gold focus:border-gold"
      >
        <div className="min-w-0">
          <span className="block truncate font-caps text-base tracking-[0.15em] text-foreground">
            {SHIFT_LABELS[value]}
          </span>
          <span className="block truncate text-xs tracking-wide text-muted-foreground">
            {SHIFT_TAGLINES[value]}
          </span>
        </div>
        <ChevronDown
          className={`shrink-0 text-gold transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          size={18}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="anim-rise absolute z-[999] mt-2 w-60 rounded-sm border-2 border-border bg-card p-1 shadow-[8px_8px_0_var(--ink)]"
          style={{ right: 0, top: "100%" }}
        >
          <div className="max-h-72 overflow-y-auto">
            {SHIFT_MODES.map((mode) => {
              const active = mode === value;
              return (
                <button
                  key={mode}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => handleSelect(mode)}
                  className={`press w-full rounded-sm px-3 py-2.5 text-left transition-colors ${
                    active ? "bg-gold text-primary-foreground" : "hover:bg-secondary"
                  }`}
                >
                  <span
                    className={`block font-caps text-base tracking-[0.15em] ${active ? "text-primary-foreground" : "text-foreground"}`}
                  >
                    {SHIFT_LABELS[mode]}
                  </span>
                  <span
                    className={`block text-xs tracking-wide ${active ? "text-primary-foreground/80" : "text-muted-foreground"}`}
                  >
                    {SHIFT_TAGLINES[mode]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
