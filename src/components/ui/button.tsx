import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-[var(--ink)] text-[var(--background)] shadow-[var(--shadow-soft)] hover:opacity-90 focus-visible:outline-[var(--ink)]",
        secondary: "ui-glass text-ink hover:bg-[var(--surface-strong)]",
        subtle: "bg-[color-mix(in_srgb,var(--green)_13%,transparent)] text-[var(--green)] ring-1 ring-[color-mix(in_srgb,var(--green)_32%,transparent)] hover:bg-[color-mix(in_srgb,var(--green)_20%,transparent)]",
        ghost: "text-soft hover:bg-[var(--surface-soft)]",
        danger: "bg-[var(--rose)] text-white hover:opacity-90",
      },
      size: {
        sm: "h-9 px-3",
        md: "h-10 px-4",
        lg: "h-12 px-5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

type ButtonClassOptions = VariantProps<typeof buttonVariants> & { className?: string };

export function buttonClassName({ className, ...options }: ButtonClassOptions = {}) {
  return cn(buttonVariants(options), className);
}
