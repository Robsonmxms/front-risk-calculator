import { AccountMemberRole } from "../auth/types";

export type PortfolioFreshness = "fresh" | "stale" | "partial";
export type PortfolioStatus = "ready" | "syncing" | "degraded";
export type ProcessingState = "ready" | "pending";
export type PortfolioTransactionType = "buy" | "sell";

export interface PortfolioListItem {
  id: string;
  accountId: string;
  accountName: string;
  name: string;
  description?: string;
  baseCurrency: string;
  membershipRole: AccountMemberRole;
  holdingsCount: number;
  transactionCount: number;
  totalCostBasis: number;
  freshness: PortfolioFreshness;
  status: PortfolioStatus;
  analyticsState: ProcessingState;
  marketDataState: ProcessingState;
  lastTransactionDate?: string;
}

export interface PortfolioDetail extends PortfolioListItem {
  createdAt: string;
  updatedAt: string;
  warnings: string[];
}

export interface PortfolioTransaction {
  id: string;
  portfolioId: string;
  assetSymbol: string;
  assetName: string;
  tradeDate: string;
  type: PortfolioTransactionType;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  currency: string;
  notes?: string;
  createdAt: string;
}

export interface PortfolioPosition {
  portfolioId: string;
  assetSymbol: string;
  assetName: string;
  quantity: number;
  averageCost: number;
  totalCostBasis: number;
  currency: string;
  lastTransactionDate: string;
}

export interface PortfolioSnapshot {
  id: string;
  portfolioId: string;
  asOfDate: string;
  createdAt: string;
  positions: PortfolioPosition[];
  transactionCount: number;
  totalCostBasis: number;
}

export interface PortfolioListResponse {
  portfolios: PortfolioListItem[];
}

export interface MarketAsset {
  id: string;
  symbol: string;
  providerSymbol: string;
  name: string;
  exchange?: string;
  currency: string;
  assetType: "stock" | "etf" | "fund" | "crypto";
  region?: string;
  sector?: string;
  providerName: string;
  isActive: boolean;
  updatedAt: string;
}

export interface MarketAssetSearchResponse {
  assets: MarketAsset[];
}

export interface MarketAssetSearchMeta {
  count: number;
  providerStatus: "available" | "degraded";
}
