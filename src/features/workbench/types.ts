import { ClientSummary } from "../client/types";
import { PortfolioListItem } from "../portfolio/types";

export type ReviewItemSeverity = "low" | "medium" | "high";
export type ReviewItemStatus = "open" | "in_progress" | "closed";
export type ReviewResourceType =
  | "client"
  | "portfolio"
  | "analytics"
  | "report"
  | "alert"
  | "notification";

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
