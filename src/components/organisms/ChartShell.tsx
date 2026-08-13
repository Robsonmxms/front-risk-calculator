import type { ReactNode } from "react";
import { Card } from "../atoms/card";

export function ChartShell({
  eyebrow,
  title,
  aside,
  children,
  headingLevel = "h3"
}: {
  eyebrow: string;
  title: string;
  aside?: ReactNode;
  children: ReactNode;
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-moss">{eyebrow}</p>
          <Heading className="text-lg font-semibold text-stone-900">{title}</Heading>
        </div>
        {aside}
      </div>
      <div className="mt-5 min-h-[220px]">{children}</div>
    </Card>
  );
}
