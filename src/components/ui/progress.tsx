import { cn } from "@/lib/utils";

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-md bg-[color-mix(in_srgb,var(--ink)_10%,transparent)]", className)}>
      <div
        className="h-full rounded-md bg-gradient-to-r from-[var(--cyan)] to-[var(--green)] shadow-[var(--glow-cyan)] transition-all"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
