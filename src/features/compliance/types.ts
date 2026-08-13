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

export type ComplianceChartRange = "7d" | "30d" | "90d" | "ytd" | "1y" | "all";
export type ComplianceDataQualityStatus = "complete" | "partial" | "empty";

export interface DataQualityIssue {
  code: string;
  severity: "info" | "warning" | "blocking";
  message: string;
}

export interface ComplianceChartsQuery {
  range?: ComplianceChartRange;
  resourceType?: AuditResourceType | "";
  action?: string;
  severity?: AuditSeverity | "";
  status?: SupervisionReviewStatus | "";
  assigneeUserId?: string;
}

export interface ComplianceChartBundle {
  officeId: string;
  range: ComplianceChartRange;
  filters: Omit<ComplianceChartsQuery, "range">;
  charts: {
    auditEventTimeline: Array<{
      date: string;
      success: number;
      failure: number;
      info: number;
      warning: number;
      critical: number;
      total: number;
      eventIds: string[];
      clientIds: string[];
      portfolioIds: string[];
    }>;
    auditActionBreakdown: Array<{
      action: string;
      resourceType: AuditResourceType;
      outcome: AuditOutcome;
      severity: AuditSeverity;
      count: number;
      eventIds: string[];
    }>;
    reviewStatusFunnel: Array<{
      status: SupervisionReviewStatus;
      count: number;
      reviewIds: string[];
      auditEventIds: string[];
    }>;
    reviewAging: Array<{
      bucket: "0-1d" | "2-3d" | "4-7d" | "8-14d" | "15d+";
      count: number;
      reviewIds: string[];
      auditEventIds: string[];
    }>;
    permissionActivity: Array<{
      date: string;
      created: number;
      revoked: number;
      roleChanges: number;
      total: number;
      eventIds: string[];
    }>;
    exceptionHeatmap: Array<{
      date: string;
      severity: AuditSeverity;
      count: number;
      eventIds: string[];
    }>;
  };
  dataQuality: {
    status: ComplianceDataQualityStatus;
    issues: DataQualityIssue[];
    sourceCounts: {
      auditEvents: number;
      supervisionReviews: number;
      redactedAuditMetadataFields: number;
    };
  };
}

export interface ComplianceChartsMeta {
  generatedAt: string;
  calculationDurationMs: number;
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
