import { apiFetch, apiFetchEnvelope } from "../../lib/api/client";
import {
  AuditEvent,
  AuditEventFilters,
  AuditEventPage,
  AuditExportJob,
  SupervisionReview,
  SupervisionReviewStatus
} from "./types";

export async function listAuditEvents(
  officeId: string,
  filters: AuditEventFilters = {}
): Promise<AuditEventPage> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  }
  const query = params.toString();
  const envelope = await apiFetchEnvelope<{ auditEvents: AuditEvent[] }, {
    total: number;
    page: number;
    pageSize: number;
  }>(`/offices/${officeId}/audit-events${query ? `?${query}` : ""}`);
  return {
    auditEvents: envelope.data.auditEvents,
    total: envelope.meta?.total ?? envelope.data.auditEvents.length,
    page: envelope.meta?.page ?? filters.page ?? 1,
    pageSize: envelope.meta?.pageSize ?? filters.pageSize ?? envelope.data.auditEvents.length
  };
}

export async function listSupervisionReviews(
  officeId: string,
  filters: {
    status?: SupervisionReviewStatus | "";
    severity?: AuditEventFilters["severity"];
    assignedToUserId?: string;
  } = {}
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      params.set(key, value);
    }
  }
  const query = params.toString();
  return apiFetch<{ supervisionReviews: SupervisionReview[] }>(
    `/offices/${officeId}/supervision-reviews${query ? `?${query}` : ""}`
  );
}

export async function updateSupervisionReview(
  reviewId: string,
  input: Partial<{
    status: SupervisionReviewStatus;
    assignedToUserId: string;
    resolutionComment: string;
  }>
) {
  return apiFetch<SupervisionReview>(`/supervision-reviews/${reviewId}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export async function requestAuditExport(
  officeId: string,
  input: {
    format: "csv" | "json";
    filters?: AuditEventFilters;
  }
) {
  return apiFetch<AuditExportJob>(`/offices/${officeId}/audit-exports`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}
