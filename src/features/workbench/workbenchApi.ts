import { apiFetch } from "../../lib/api/client";
import {
  AdvisorChartBundle,
  AdvisorChartRange,
  AdvisorFreshness,
  AdvisorRiskBand,
  ReviewItem,
  ReviewItemSeverity,
  ReviewItemStatus,
  ReviewResourceType,
  StaffWorkbench
} from "./types";

export interface ReviewItemFilters {
  status?: ReviewItemStatus | "";
  severity?: ReviewItemSeverity | "";
  assignedToUserId?: string;
  clientId?: string;
}

export interface AdvisorChartFilters {
  advisorUserId?: string;
  teamId?: string;
  range?: AdvisorChartRange;
  clientStatus?: string[];
  riskBand?: AdvisorRiskBand | "";
  freshness?: AdvisorFreshness | "";
}

export async function getWorkbench(officeId: string) {
  return apiFetch<StaffWorkbench>(`/offices/${officeId}/workbench`);
}

export async function getAdvisorCharts(officeId: string, filters: AdvisorChartFilters = {}) {
  const params = new URLSearchParams();
  if (filters.advisorUserId) {
    params.set("advisorUserId", filters.advisorUserId);
  }
  if (filters.teamId) {
    params.set("teamId", filters.teamId);
  }
  if (filters.range) {
    params.set("range", filters.range);
  }
  if (filters.clientStatus?.length) {
    params.set("clientStatus", filters.clientStatus.join(","));
  }
  if (filters.riskBand) {
    params.set("riskBand", filters.riskBand);
  }
  if (filters.freshness) {
    params.set("freshness", filters.freshness);
  }
  const query = params.toString();
  return apiFetch<AdvisorChartBundle>(
    `/offices/${officeId}/advisor/charts${query ? `?${query}` : ""}`
  );
}

export async function listReviewItems(officeId: string, filters: ReviewItemFilters = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      params.set(key, value);
    }
  }
  const query = params.toString();
  return apiFetch<{ reviewItems: ReviewItem[] }>(
    `/offices/${officeId}/review-items${query ? `?${query}` : ""}`
  );
}

export async function createReviewItem(
  officeId: string,
  input: {
    title: string;
    severity: ReviewItemSeverity;
    resourceType: ReviewResourceType;
    resourceId: string;
    clientId?: string;
    portfolioId?: string;
    assignedToUserId?: string;
    dueDate?: string;
    notes?: string;
  }
) {
  return apiFetch<ReviewItem>(`/offices/${officeId}/review-items`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function updateReviewItem(
  reviewItemId: string,
  input: Partial<{
    title: string;
    severity: ReviewItemSeverity;
    status: ReviewItemStatus;
    assignedToUserId: string;
    dueDate: string;
    notes: string;
  }>
) {
  return apiFetch<ReviewItem>(`/review-items/${reviewItemId}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}
