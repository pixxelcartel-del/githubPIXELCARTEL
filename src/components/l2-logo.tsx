import { cn } from "@/lib/utils";

export function L2Logo({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <span className={cn("inline-flex items-baseline gap-2", className)} aria-label="L squared">
      <span className={cn("font-serif text-3xl font-semibold italic leading-none tracking-normal text-current", markClassName)}>
        L<sup className="ml-0.5 text-[0.58em] font-normal">2</sup>
      </span>
    </span>
  );
}
