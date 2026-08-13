import { apiFetch, apiFetchEnvelope, ApiEnvelope } from "../../lib/api/client";
import {
  ClientPortalReadModel,
  DeliveryChartBundle,
  DeliveryChartsMeta,
  DeliveryChartsQuery,
  ReportPackage,
  ReportPackageItem,
  ReportPackageStatus
} from "./types";

export async function listClientReportPackages(
  clientId: string,
  filters: { status?: ReportPackageStatus | "" } = {}
) {
  const params = new URLSearchParams();
  if (filters.status) {
    params.set("status", filters.status);
  }
  const query = params.toString();
  return apiFetch<{ reportPackages: ReportPackage[] }>(
    `/clients/${clientId}/report-packages${query ? `?${query}` : ""}`
  );
}

export async function createReportPackage(
  clientId: string,
  input: {
    title: string;
    summaryNotes: string;
    internalNotes?: string;
    items: ReportPackageItem[];
    submitForApproval?: boolean;
  }
) {
  return apiFetch<ReportPackage>(`/clients/${clientId}/report-packages`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function approveReportPackage(packageId: string) {
  return apiFetch<ReportPackage>(`/report-packages/${packageId}/approve`, {
    method: "POST"
  });
}

export async function deliverReportPackage(packageId: string) {
  return apiFetch<ReportPackage>(`/report-packages/${packageId}/deliver`, {
    method: "POST"
  });
}

export async function revokeReportPackage(packageId: string) {
  return apiFetch<ReportPackage>(`/report-packages/${packageId}/revoke`, {
    method: "POST"
  });
}

export async function getClientPortal() {
  return apiFetch<ClientPortalReadModel>("/client-portal");
}

export async function getDeliveryCharts(
  officeId: string,
  filters: DeliveryChartsQuery = {}
): Promise<ApiEnvelope<DeliveryChartBundle, DeliveryChartsMeta>> {
  const query = buildQuery(filters);
  return apiFetchEnvelope<DeliveryChartBundle, DeliveryChartsMeta>(
    `/offices/${officeId}/delivery/charts${query ? `?${query}` : ""}`
  );
}

function buildQuery(filters: object): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  }
  return params.toString();
}
