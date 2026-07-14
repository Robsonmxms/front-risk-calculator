import { AccountMemberRole } from "../auth/types";

export type PortfolioFreshness = "fresh" | "stale" | "partial";
export type PortfolioStatus = "ready" | "syncing" | "degraded";
export type ReportStatus = "ready" | "generating";
export type AlertSeverity = "low" | "medium" | "high";

export interface PortfolioListItem {
  accountId: string;
  accountName: string;
  membershipRole: AccountMemberRole;
  currency: string;
  marketValue: number;
  unrealizedPnl: number;
  dayChangePercent: number;
  holdingsCount: number;
  openAlerts: number;
  reportStatus: ReportStatus;
  riskScore: number;
  freshness: PortfolioFreshness;
  status: PortfolioStatus;
}

export interface PortfolioHolding {
  symbol: string;
  name: string;
  assetClass: string;
  quantity: number;
  weightPercent: number;
  marketValue: number;
  dayChangePercent: number;
}

export interface PortfolioTransaction {
  id: string;
  tradeDate: string;
  type: "buy" | "sell" | "dividend" | "rebalance";
  description: string;
  quantity: number;
  amount: number;
  currency: string;
  status: "posted" | "pending";
}

export interface AllocationSlice {
  label: string;
  weightPercent: number;
}

export interface PerformancePoint {
  label: string;
  returnPercent: number;
}

export interface PortfolioReport {
  id: string;
  name: string;
  asOf: string;
  status: ReportStatus;
  format: "pdf" | "csv";
}

export interface PortfolioAlert {
  id: string;
  title: string;
  severity: AlertSeverity;
  status: "open" | "monitoring";
}

export interface PortfolioAnalytics {
  riskScore: number;
  volatilityPercent: number;
  valueAtRisk95: number;
  maxDrawdownPercent: number;
  diversificationScore: number;
  notes: string[];
}

export interface PortfolioMeta {
  status: PortfolioStatus;
  freshness: PortfolioFreshness;
  asOf: string;
  lastSuccessfulSyncAt: string;
  warnings: string[];
}

export interface PortfolioDashboard {
  accountId: string;
  accountName: string;
  membershipRole: AccountMemberRole;
  currency: string;
  marketValue: number;
  costBasis: number;
  unrealizedPnl: number;
  dayChangePercent: number;
  holdingsCount: number;
  openAlerts: number;
  reportStatus: ReportStatus;
  analytics: PortfolioAnalytics;
  allocation: AllocationSlice[];
  performance: PerformancePoint[];
  holdings: PortfolioHolding[];
  transactions: PortfolioTransaction[];
  reports: PortfolioReport[];
  alerts: PortfolioAlert[];
  insights: string[];
  meta: PortfolioMeta;
}

export interface PortfolioListResponse {
  portfolios: PortfolioListItem[];
}
