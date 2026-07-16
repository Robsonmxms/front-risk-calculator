export type AuditOutcome = "success" | "failure";
export type AuditSeverity = "info" | "warning" | "critical";
export type AuditResourceType =
  | "auth"
  | "office"
  | "permission"
  | "client"
  | "household"
  | "account"
  | "portfolio"
  | "ledger"
  | "analytics"
  | "market_data"
  | "report"
  | "alert"
  | "notification"
  | "delivery"
  | "portal"
  | "review";

export type SafeAuditMetadataValue = string | number | boolean | null;
export type SafeAuditMetadata = Record<string, SafeAuditMetadataValue>;

export interface AuditEvent {
  id: string;
  officeId: string;
  actorId?: string;
  actorName?: string;
  action: string;
  resourceType: AuditResourceType;
  resourceId: string;
  clientId?: string;
  portfolioId?: string;
  outcome: AuditOutcome;
  severity: AuditSeverity;
  reviewRequired: boolean;
  metadata: SafeAuditMetadata;
  createdAt: string;
}

export interface AuditEventFilters {
  actorId?: string;
  action?: string;
  outcome?: AuditOutcome | "";
  severity?: AuditSeverity | "";
  resourceType?: AuditResourceType | "";
  resourceId?: string;
  clientId?: string;
  portfolioId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface AuditEventPage {
  auditEvents: AuditEvent[];
  total: number;
  page: number;
  pageSize: number;
}

export type SupervisionReviewStatus = "open" | "assigned" | "resolved";

export interface SupervisionReview {
  id: string;
  officeId: string;
  auditEventId: string;
  status: SupervisionReviewStatus;
  severity: AuditSeverity;
  assignedToUserId?: string;
  resolutionComment?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface AuditExportJob {
  id: string;
  officeId: string;
  requestedBy: string;
  format: "csv" | "json";
  status: "completed";
  eventCount: number;
  filters: SafeAuditMetadata;
  downloadUrl: string;
  createdAt: string;
  completedAt: string;
}
