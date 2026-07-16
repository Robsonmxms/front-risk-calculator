import { PortfolioListItem } from "../portfolio/types";

export type ReportPackageStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "delivered"
  | "viewed"
  | "revoked";

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
