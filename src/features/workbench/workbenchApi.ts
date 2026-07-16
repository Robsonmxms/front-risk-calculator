import { apiFetch } from "../../lib/api/client";
import {
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

export async function getWorkbench(officeId: string) {
  return apiFetch<StaffWorkbench>(`/offices/${officeId}/workbench`);
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
