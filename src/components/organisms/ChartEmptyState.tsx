import type { ReactNode } from "react";
import { Alert } from "../atoms/alert";

export function ChartEmptyState({
  children,
  tone = "plain"
}: {
  children: ReactNode;
  tone?: "plain" | "info" | "warning";
}) {
  if (tone === "plain") {
    return (
      <div className="flex min-h-[180px] items-center justify-center rounded-md border border-dashed border-border px-4 text-center text-sm text-stone-500">
        {children}
      </div>
    );
  }
  return (
    <Alert
      variant={tone}
      className={
        tone === "info"
          ? "flex min-h-40 items-center bg-blue-50/70"
          : "mt-3 flex min-h-40 items-center bg-amber-50/70"
      }
    >
      <div className="space-y-1">
        <p className="font-semibold">Dados insuficientes</p>
        <p>{children}</p>
      </div>
    </Alert>
  );
}
