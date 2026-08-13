import type { OfficeMembershipRole } from "../auth";

export type OfficeAdminChartRange = "7d" | "30d" | "90d" | "ytd" | "1y" | "all";
export type OfficeAdminSeverityFilter = "low" | "medium" | "high" | "info" | "warning" | "critical";
export type OfficeAdminDataQualityStatus = "complete" | "partial" | "stale" | "empty";
export type MarketDataFreshness = "fresh" | "partial" | "stale";

export interface OfficeAdminChartFilters {
  range?: OfficeAdminChartRange;
  role?: OfficeMembershipRole;
  workflowStatus?: string;
  provider?: string;
  severity?: OfficeAdminSeverityFilter;
}

export interface DataQualityIssue {
  code: string;
  severity: "info" | "warning" | "blocking";
  message: string;
}

export interface OfficeClientGrowthPoint {
  date: string;
  clients: number;
  households: number;
  accounts: number;
  portfolios: number;
  staff: number;
  clientIds: string[];
  householdIds: string[];
  portfolioIds: string[];
  staffUserIds: string[];
}

export interface OfficeOnboardingFunnelPoint {
  status: "invited" | "onboarding" | "complete" | "paused";
  count: number;
  clientIds: string[];
}

export interface OfficeStaffRoleDistributionPoint {
  role: OfficeMembershipRole;
  count: number;
  userIds: string[];
}

export interface OfficeAssignmentLoadPoint {
  assigneeUserId?: string;
  assigneeName: string;
  role?: OfficeMembershipRole;
  teamId?: string;
  teamName?: string;
  clientCount: number;
  householdCount: number;
  accountCount: number;
  portfolioCount: number;
  totalAssignments: number;
  assignmentIds: string[];
}

export interface OfficeCoveragePoint {
  status: string;
  freshness: MarketDataFreshness;
  count: number;
  totalCostBasis: number;
  portfolioIds: string[];
}

export interface OfficeAssetCoveragePoint {
  assetSymbol: string;
  assetName: string;
  portfolioCount: number;
  totalQuantity: number;
  totalCostBasis: number;
  portfolioIds: string[];
}

export interface OfficeMarketDataFreshnessPoint {
  providerName: string;
  status: "available" | "degraded" | "unavailable" | "unconfigured";
  freshness: MarketDataFreshness;
  requestCount: number;
  errorCount: number;
  averageLatencyMs: number;
  jobCount: number;
  failedJobCount: number;
  lastSuccessAt?: string;
  lastFailureAt?: string;
  lastErrorCode?: string;
}

export interface OfficeAnalyticsQueueHealthPoint {
  status: string;
  count: number;
  failedCount: number;
  portfolioIds: string[];
  latestUpdatedAt?: string;
}

export interface OfficeReportThroughputPoint {
  status: string;
  count: number;
  portfolioCount: number;
  reportIds?: string[];
  reportPackageIds?: string[];
  latestUpdatedAt?: string;
}

export interface OfficeReportFailurePoint {
  failureCode: string;
  count: number;
  reportIds: string[];
  portfolioIds: string[];
  latestFailedAt?: string;
}

export interface OfficeAlertNotificationVolumePoint {
  date: string;
  low: number;
  medium: number;
  high: number;
  info: number;
  total: number;
  alertIds?: string[];
  notificationIds?: string[];
}

export interface OfficePermissionActivityPoint {
  date: string;
  created: number;
  revoked: number;
  roleChanges: number;
  total: number;
  eventIds?: string[];
  assignmentIds?: string[];
}

export interface OfficeAdminChartBundle {
  officeId: string;
  range: OfficeAdminChartRange;
  filters: Omit<OfficeAdminChartFilters, "range">;
  charts: {
    clientGrowth: OfficeClientGrowthPoint[];
    onboardingFunnel: OfficeOnboardingFunnelPoint[];
    staffRoleDistribution: OfficeStaffRoleDistributionPoint[];
    assignmentLoad: OfficeAssignmentLoadPoint[];
    portfolioCoverage: OfficeCoveragePoint[];
    assetCoverage: OfficeAssetCoveragePoint[];
    marketDataFreshness: OfficeMarketDataFreshnessPoint[];
    analyticsQueueHealth: OfficeAnalyticsQueueHealthPoint[];
    reportThroughput: OfficeReportThroughputPoint[];
    reportFailures: OfficeReportFailurePoint[];
    alertNotificationVolume: OfficeAlertNotificationVolumePoint[];
    permissionActivity: OfficePermissionActivityPoint[];
  };
  dataQuality: {
    status: OfficeAdminDataQualityStatus;
    issues: DataQualityIssue[];
    sourceCounts: {
      clients: number;
      households: number;
      accounts: number;
      portfolios: number;
      staff: number;
      assignments: number;
      analyticsJobs: number;
      reports: number;
      reportPackages: number;
      alerts: number;
      notifications: number;
      auditEvents: number;
    };
  };
}

export interface PlatformAdminChartBundle {
  platformId: "global";
  range: OfficeAdminChartRange;
  filters: OfficeAdminChartFilters;
  charts: {
    officeStatusDistribution: Array<{ status: string; count: number }>;
    officeVolume: Array<{ bucket: string; count: number }>;
    staffRoleDistribution: Array<{ role: OfficeMembershipRole; count: number }>;
    tenantDataFreshness: Array<{
      freshness: MarketDataFreshness;
      officeCount: number;
      portfolioCount: number;
    }>;
    providerHealth: Array<{
      providerName: string;
      status: "available" | "degraded" | "unavailable" | "unconfigured";
      requestCount: number;
      errorCount: number;
      averageLatencyMs: number;
    }>;
    jobHealth: Array<{
      kind: "analytics" | "market_data" | "report";
      status: string;
      count: number;
    }>;
    reportThroughput: OfficeReportThroughputPoint[];
    alertNotificationVolume: OfficeAlertNotificationVolumePoint[];
    permissionActivity: OfficePermissionActivityPoint[];
  };
  dataQuality: {
    status: OfficeAdminDataQualityStatus;
    issues: DataQualityIssue[];
    sourceCounts: {
      offices: number;
      clients: number;
      households: number;
      accounts: number;
      portfolios: number;
      staff: number;
      assignments: number;
      analyticsJobs: number;
      marketDataJobs: number;
      reports: number;
      reportPackages: number;
      alerts: number;
      notifications: number;
      auditEvents: number;
    };
  };
}

export interface OperationalChartsMeta {
  generatedAt: string;
  calculationDurationMs: number;
}
