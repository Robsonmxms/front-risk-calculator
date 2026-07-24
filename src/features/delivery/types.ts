import { PortfolioListItem } from "../portfolio/types";

export type ReportPackageStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "delivered"
  | "viewed"
  | "revoked";

export type DeliveryChartRange = "7d" | "30d" | "90d" | "ytd" | "1y" | "all";
export type DeliveryDataQualityStatus = "complete" | "partial" | "empty";
export type ReportStatus = "pending" | "running" | "ready" | "failed";
export type NotificationStatus = "unread" | "read";
export type DeliveryStatusFilter =
  | ReportPackageStatus
  | ReportStatus
  | NotificationStatus
  | "success"
  | "failure";

export interface DataQualityIssue {
  code: string;
  severity: "info" | "warning" | "blocking";
  message: string;
}

export interface DeliveryChartsQuery {
  range?: DeliveryChartRange;
  packageStatus?: ReportPackageStatus | "";
  deliveryStatus?: DeliveryStatusFilter | "";
  channel?: string;
  clientId?: string;
  householdId?: string;
  advisorUserId?: string;
}

export type ReportPackageItemType = "report" | "analytics_snapshot" | "portfolio_summary";
export type ReportPackageItemStatus = "ready" | "pending" | "unavailable";

export interface ReportPackageItem {
  id?: string;
  type: ReportPackageItemType;
  title: string;
  portfolioId?: string;
  reportId?: string;
  analyticsSnapshotId?: string;
  format?: "pdf" | "csv" | "json";
  status: ReportPackageItemStatus;
}

export interface ReportPackage {
  id: string;
  officeId: string;
  clientId: string;
  householdId?: string;
  title: string;
  summaryNotes: string;
  internalNotes?: string;
  status: ReportPackageStatus;
  items: ReportPackageItem[];
  createdBy: string;
  approvedBy?: string;
  deliveredBy?: string;
  viewedBy?: string;
  revokedBy?: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  deliveredAt?: string;
  viewedAt?: string;
  revokedAt?: string;
}

export interface ClientPortalPackage
  extends Omit<ReportPackage, "internalNotes" | "createdBy" | "approvedBy" | "deliveredBy" | "revokedBy"> {
  status: "delivered" | "viewed";
  portfolios: PortfolioListItem[];
}

export interface ClientPortalReadModel {
  actorId: string;
  generatedAt: string;
  clients: Array<{
    id: string;
    officeId: string;
    name: string;
    householdName?: string;
  }>;
  packages: ClientPortalPackage[];
}

export interface DeliveryChartBundle {
  officeId: string;
  range: DeliveryChartRange;
  filters: Omit<DeliveryChartsQuery, "range">;
  charts: {
    reportLifecycleFunnel: Array<{
      status: ReportPackageStatus;
      count: number;
      reportPackageIds: string[];
      clientIds: string[];
    }>;
    approvalLatency: Array<{
      bucket: "0-4h" | "4-24h" | "1-3d" | "3d+";
      count: number;
      averageHours: number;
      reportPackageIds: string[];
    }>;
    deliveryOutcomeTimeline: Array<{
      date: string;
      delivered: number;
      viewed: number;
      failed: number;
      revoked: number;
      total: number;
      reportPackageIds: string[];
      eventIds: string[];
    }>;
    failureReasonBreakdown: Array<{
      failureCode: string;
      channel?: string;
      count: number;
      eventIds: string[];
      reportPackageIds: string[];
    }>;
    notificationReadStatus: Array<{
      status: NotificationStatus;
      count: number;
      notificationIds: string[];
    }>;
    clientPackageReadiness: Array<{
      clientId: string;
      clientName: string;
      householdId?: string;
      readyCount: number;
      pendingCount: number;
      failedItemCount: number;
      staleNotificationCount: number;
      latestPackageStatus?: ReportPackageStatus;
      latestPackageUpdatedAt?: string;
      reportPackageIds: string[];
      notificationIds: string[];
    }>;
  };
  dataQuality: {
    status: DeliveryDataQualityStatus;
    issues: DataQualityIssue[];
    sourceCounts: {
      clients: number;
      portfolios: number;
      reportPackages: number;
      reports: number;
      notifications: number;
      deliveryAuditEvents: number;
    };
  };
}

export interface DeliveryChartsMeta {
  generatedAt: string;
  calculationDurationMs: number;
}
