import { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export type BadgeVariant = "default" | "info" | "success" | "warning" | "failure" | "outline";

const variantClasses: Record<BadgeVariant, string> = {
  default: "border-transparent bg-muted text-muted-foreground",
  info: "border-blue-200 bg-blue-50 text-blue-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  failure: "border-rose-200 bg-rose-50 text-rose-800",
  outline: "border-border bg-background text-foreground"
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
