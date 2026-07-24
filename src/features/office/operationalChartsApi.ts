import { apiFetchEnvelope, ApiEnvelope } from "../../lib/api/client";
import {
  OfficeAdminChartBundle,
  OfficeAdminChartFilters,
  OperationalChartsMeta,
  PlatformAdminChartBundle
} from "./operationalChartTypes";

export async function getOfficeAdminCharts(
  officeId: string,
  filters: OfficeAdminChartFilters = {}
): Promise<ApiEnvelope<OfficeAdminChartBundle, OperationalChartsMeta>> {
  const query = buildOperationalChartQuery(filters);
  return apiFetchEnvelope<OfficeAdminChartBundle, OperationalChartsMeta>(
    `/offices/${officeId}/admin/charts${query ? `?${query}` : ""}`
  );
}

export async function getPlatformAdminCharts(
  filters: OfficeAdminChartFilters = {}
): Promise<ApiEnvelope<PlatformAdminChartBundle, OperationalChartsMeta>> {
  const query = buildOperationalChartQuery(filters);
  return apiFetchEnvelope<PlatformAdminChartBundle, OperationalChartsMeta>(
    `/admin/platform/charts${query ? `?${query}` : ""}`
  );
}

function buildOperationalChartQuery(filters: OfficeAdminChartFilters): string {
  const params = new URLSearchParams();
  if (filters.range) {
    params.set("range", filters.range);
  }
  if (filters.role) {
    params.set("role", filters.role);
  }
  if (filters.workflowStatus) {
    params.set("workflowStatus", filters.workflowStatus);
  }
  if (filters.provider) {
    params.set("provider", filters.provider);
  }
  if (filters.severity) {
    params.set("severity", filters.severity);
  }

  return params.toString();
}
