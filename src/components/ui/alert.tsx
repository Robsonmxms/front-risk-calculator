import { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

type AlertVariant = "default" | "info" | "warning" | "failure" | "success";

const variantClasses: Record<AlertVariant, string> = {
  default: "border-border bg-card text-card-foreground",
  info: "border-blue-200 bg-blue-50 text-blue-950",
  warning: "border-amber-200 bg-amber-50 text-amber-950",
  failure: "border-rose-200 bg-rose-50 text-rose-950",
  success: "border-emerald-200 bg-emerald-50 text-emerald-950"
};

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
}

export function Alert({ className, variant = "default", ...props }: AlertProps) {
  return (
    <div
      className={cn("rounded-md border px-4 py-3 text-sm", variantClasses[variant], className)}
      role={variant === "failure" ? "alert" : "status"}
      {...props}
    />
  );
}
