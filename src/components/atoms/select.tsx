import { SelectHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss/25 disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-ember aria-invalid:focus-visible:ring-ember/25",
        className
      )}
      {...props}
    />
  );
}
