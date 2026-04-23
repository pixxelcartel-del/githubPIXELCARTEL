import * as React from "react";
import { cn } from "@/lib/utils";

export function Surface({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ui-surface rounded-lg", className)} {...props} />;
}

export function GlassPanel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ui-glass rounded-lg", className)} {...props} />;
}

export function InkPanel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ui-ink rounded-lg text-white", className)} {...props} />;
}

export function PaperPanel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ui-paper rounded-lg", className)} {...props} />;
}

export function MetricTile({
  label,
  value,
  note,
  icon,
  tone = "cyan",
  className,
}: {
  label: string;
  value: string;
  note?: string;
  icon?: React.ReactNode;
  tone?: "cyan" | "green" | "rose" | "gold";
  className?: string;
}) {
  const toneClass = {
    cyan: "from-[color-mix(in_srgb,var(--cyan)_18%,transparent)]",
    green: "from-[color-mix(in_srgb,var(--green)_18%,transparent)]",
    rose: "from-[color-mix(in_srgb,var(--rose)_16%,transparent)]",
    gold: "from-[color-mix(in_srgb,var(--gold)_20%,transparent)]",
  }[tone];

  return (
    <GlassPanel className={cn("motion-card bg-gradient-to-br to-transparent p-5", toneClass, className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-bold text-muted">{label}</p>
        {icon && <span className="text-[var(--cyan)]">{icon}</span>}
      </div>
      <p className="mt-4 text-3xl font-black text-ink">{value}</p>
      {note && <p className="mt-2 text-sm leading-6 text-soft">{note}</p>}
    </GlassPanel>
  );
}

export function SegmentedSelector({ label, items, active }: { label: string; items: string[]; active: string }) {
  return (
    <div>
      <p className="mb-2 text-xs font-black uppercase tracking-normal text-muted">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className={cn(
              "rounded-md border px-3 py-1.5 text-xs font-bold",
              item === active
                ? "border-[var(--cyan)] bg-[color-mix(in_srgb,var(--cyan)_12%,transparent)] text-ink shadow-[var(--glow-cyan)]"
                : "border-[var(--border)] bg-[var(--surface-soft)] text-muted",
            )}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
