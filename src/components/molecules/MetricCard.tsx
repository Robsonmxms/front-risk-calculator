import type { ReactNode } from "react";
import { Card } from "../atoms/card";
import { cn } from "../../lib/utils";

export function MetricCard({
  label,
  value,
  detail,
  size = "default"
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  size?: "compact" | "default";
}) {
  return (
    <Card className="grid h-full gap-2">
      <span className="block text-xs font-semibold uppercase leading-tight text-stone-500">
        {label}
      </span>
      <strong
        className={cn(
          "block break-words leading-none text-stone-900",
          size === "compact" ? "text-2xl" : "text-3xl"
        )}
      >
        {value}
      </strong>
      {detail ? (
        <span className="text-sm font-normal leading-tight text-stone-600">{detail}</span>
      ) : null}
    </Card>
  );
}
