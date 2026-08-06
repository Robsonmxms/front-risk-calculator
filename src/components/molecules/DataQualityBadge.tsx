import { Badge } from "../atoms/badge";

export type DataQualityStatus = "complete" | "partial" | "empty";

export function DataQualityBadge({ status }: { status: DataQualityStatus }) {
  const labels: Record<DataQualityStatus, string> = {
    complete: "completo",
    partial: "parcial",
    empty: "sem dados"
  };
  return <Badge variant={status === "partial" ? "warning" : "outline"}>{labels[status]}</Badge>;
}
