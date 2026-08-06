import { ClientSummary } from "../client/types";
import { ReportPackageStatus } from "../delivery/types";
import { DataQualityIssue, PortfolioFreshness } from "../portfolio/types";
import { PortfolioListItem } from "../portfolio/types";

export type ReviewItemSeverity = "low" | "medium" | "high";
export type ReviewItemStatus = "open" | "in_progress" | "closed";
export type ReviewResourceType =
  "client" | "portfolio" | "analytics" | "report" | "alert" | "notification";

export interface ReviewItem {
  id: string;
  officeId: string;
  title: string;
  severity: ReviewItemSeverity;
  status: ReviewItemStatus;
  resourceType: ReviewResourceType;
  resourceId: string;
  clientId?: string;
  portfolioId?: string;
  assignedToUserId?: string;
  dueDate?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

export interface StaffWorkbench {
  officeId: string;
  generatedAt: string;
  assignedClients: ClientSummary[];
  portfoliosNeedingAttention: PortfolioListItem[];
  reviewItems: ReviewItem[];
  counts: {
    assignedClients: number;
    portfoliosNeedingAttention: number;
    openReviewItems: number;
    highSeverityReviewItems: number;
    pendingReports: number;
    openAlerts: number;
  };
}

export type AdvisorChartRange = "30d" | "90d" | "ytd" | "1y" | "all";
export type AdvisorRiskBand = "low" | "watch" | "high";
export type AdvisorFreshness = PortfolioFreshness;
export type AdvisorChartDataQualityStatus = AdvisorFreshness | "empty";

export interface AdvisorDrillDownLink {
  clientId?: string;
  householdId?: string;
  portfolioId?: string;
  reportPackageId?: string;
  alertId?: string;
  reviewItemId?: string;
}

export interface AdvisorBookValueTrendPoint {
  date: string;
  value: number;
  clientCount: number;
  portfolioCount: number;
}

export interface AdvisorRiskReturnPoint {
  id: string;
  clientId?: string;
  clientName?: string;
  householdId?: string;
  householdName?: string;
  portfolioId: string;
  portfolioName: string;
  value: number;
  annualizedReturnPercent?: number;
  volatilityPercent?: number;
  maxDrawdownPercent?: number;
  sharpeRatio?: number;
  riskBand: AdvisorRiskBand;
  freshness: AdvisorFreshness;
  drillDown: AdvisorDrillDownLink;
}

export interface AdvisorClientRiskDistributionPoint {
  clientId: string;
  clientName: string;
  householdId?: string;
  householdName?: string;
  value: number;
  portfolioCount: number;
  riskBand: AdvisorRiskBand;
  freshness: AdvisorFreshness;
  drillDown: AdvisorDrillDownLink;
}

export interface AdvisorSectorHeatmapCell {
  clientId: string;
  clientName: string;
  householdId?: string;
  sector: string;
  weightPercent: number;
  marketValueUsd: number;
  drillDown: AdvisorDrillDownLink;
}

export interface AdvisorAllocationBreakdownPoint {
  label: string;
  weightPercent: number;
  marketValueUsd: number;
}

export interface AdvisorAlertSeverityTimelinePoint {
  date: string;
  low: number;
  medium: number;
  high: number;
  total: number;
}

export interface AdvisorReportPipelinePoint {
  status: ReportPackageStatus;
  count: number;
  clientCount: number;
  staleCount: number;
  latestUpdatedAt?: string;
}

export interface AdvisorWorkbenchAgingPoint {
  bucket: "overdue" | "due_7d" | "due_30d" | "no_due_date";
  low: number;
  medium: number;
  high: number;
  total: number;
}

export interface AdvisorStaleDataBacklogItem {
  portfolioId: string;
  portfolioName: string;
  clientId?: string;
  clientName?: string;
  householdId?: string;
  householdName?: string;
  freshness: AdvisorFreshness;
  analyticsState: string;
  marketDataState: string;
  reason: string;
  daysSinceLastTransaction?: number;
  drillDown: AdvisorDrillDownLink;
}

export interface AdvisorNeedsAttentionItem {
  rank: number;
  clientId: string;
  clientName: string;
  householdId?: string;
  householdName?: string;
  score: number;
  reasons: string[];
  value: number;
  riskBand: AdvisorRiskBand;
  freshness: AdvisorFreshness;
  openReviewItemCount: number;
  highAlertCount: number;
  pendingReportCount: number;
  drillDown: AdvisorDrillDownLink;
}

export interface AdvisorChartBundle {
  officeId: string;
  advisorUserId: string;
  range: AdvisorChartRange;
  filters: {
    teamId?: string;
    clientStatus: string[];
    riskBand?: AdvisorRiskBand;
    freshness?: AdvisorFreshness;
  };
  charts: {
    bookValueTrend: AdvisorBookValueTrendPoint[];
    riskReturnScatter: AdvisorRiskReturnPoint[];
    drawdownDistribution: AdvisorClientRiskDistributionPoint[];
    volatilityDistribution: AdvisorClientRiskDistributionPoint[];
    sectorExposureHeatmap: AdvisorSectorHeatmapCell[];
    allocationBreakdown: AdvisorAllocationBreakdownPoint[];
    alertSeverityTimeline: AdvisorAlertSeverityTimelinePoint[];
    reportPipeline: AdvisorReportPipelinePoint[];
    workbenchAging: AdvisorWorkbenchAgingPoint[];
    staleDataBacklog: AdvisorStaleDataBacklogItem[];
  };
  rankings: {
    needsAttention: AdvisorNeedsAttentionItem[];
  };
  dataQuality: {
    status: AdvisorChartDataQualityStatus;
    issues: DataQualityIssue[];
    sourceCounts: {
      clients: number;
      households: number;
      portfolios: number;
      analyticsSnapshots: number;
      reportPackages: number;
      alerts: number;
      reviewItems: number;
    };
  };
}
