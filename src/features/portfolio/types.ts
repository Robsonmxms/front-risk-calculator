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
  latestQuote?: {
    assetId: string;
    symbol: string;
    providerName: string;
    currency: string;
    price: number;
    asOf: string;
    freshness: "fresh" | "partial" | "stale";
    updatedAt: string;
  };
}

export interface MarketAssetSearchResponse {
  assets: MarketAsset[];
}

export interface MarketAssetSearchMeta {
  count: number;
  providerStatus: "available" | "degraded";
  exchange?: string;
}

export interface MarketExchange {
  code: string;
  name: string;
  country: string;
  currency: string;
  yahooSuffix: string;
  aliases: string[];
}

export interface TradePriceQuote {
  assetId: string;
  symbol: string;
  tradeDate: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  currency: string;
  providerName: string;
  priceSource: "latest_quote" | "historical_close";
  asOf: string;
}

export type AnalyticsReadStatus = "complete" | "partial" | "pending" | "failed";
export type AnalyticsMetricStatus = "available" | "unavailable";
export type AnalyticsMetricUnit = "percent" | "ratio" | "currency" | "score";
export type RiskInsightSeverity = "info" | "watch" | "high";

export type AnalyticsMetricKey =
  | "totalReturn"
  | "annualizedReturn"
  | "maxDrawdown"
  | "volatility"
  | "beta"
  | "sharpeRatio"
  | "concentrationHhi"
  | "sectorExposure"
  | "assetCorrelation";

export interface AnalyticsMetric {
  key: AnalyticsMetricKey;
  label: string;
  unit: AnalyticsMetricUnit;
  status: AnalyticsMetricStatus;
  value?: number;
  reason?: string;
  assumptions: string[];
  requiredData: string[];
}

export type AnalyticsMetricSet = Record<AnalyticsMetricKey, AnalyticsMetric>;

export interface DataQualityIssue {
  code: string;
  severity: "info" | "warning" | "blocking";
  message: string;
  symbols?: string[];
  metricKeys?: AnalyticsMetricKey[];
}

export interface AnalyticsPosition {
  portfolioId: string;
  assetSymbol: string;
  assetName: string;
  quantity: number;
  currency: string;
  exchange?: string;
  sector: string;
  latestPrice?: number;
  latestPriceCurrency?: string;
  marketValueUsd?: number;
  costBasisUsd?: number;
  weightPercent?: number;
  dataQuality: DataQualityIssue[];
}

export interface AllocationPoint {
  symbol: string;
  name: string;
  weightPercent: number;
  marketValueUsd: number;
}

export interface SectorExposurePoint {
  sector: string;
  weightPercent: number;
  marketValueUsd: number;
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
}

export interface DrawdownPoint {
  date: string;
  drawdownPercent: number;
}

export interface CorrelationCell {
  leftSymbol: string;
  rightSymbol: string;
  correlation: number;
}

export interface RiskInsight {
  id: string;
  severity: RiskInsightSeverity;
  title: string;
  explanation: string;
  metricKeys: AnalyticsMetricKey[];
  symbols?: string[];
}

export interface CurrencyConversionAudit {
  from: string;
  to: "USD";
  rate: number;
  providerName: string;
  asOf: string;
}

export interface PortfolioAnalyticsSnapshot {
  id: string;
  portfolioId: string;
  asOfDate: string;
  generatedAt: string;
  baseCurrency: "USD";
  status: "complete" | "partial";
  metrics: AnalyticsMetricSet;
  positions: AnalyticsPosition[];
  allocation: AllocationPoint[];
  sectorExposure: SectorExposurePoint[];
  performance: TimeSeriesPoint[];
  drawdown: DrawdownPoint[];
  correlation: CorrelationCell[];
  insights: RiskInsight[];
  dataQuality: {
    issues: DataQualityIssue[];
    unavailableMetricCount: number;
    staleInputCount: number;
    conversionRates: CurrencyConversionAudit[];
  };
  inputHash: string;
  calculationDurationMs: number;
}

export interface PortfolioAnalyticsReadModel {
  portfolioId: string;
  status: AnalyticsReadStatus;
  baseCurrency: "USD";
  snapshot: PortfolioAnalyticsSnapshot | null;
  lastSuccessfulSnapshot: PortfolioAnalyticsSnapshot | null;
  failedJob?: {
    id: string;
    status: "queued" | "running" | "succeeded" | "failed";
    errorCode?: string;
  };
}

export interface CurrencyConversion {
  from: string;
  to: string;
  rate: number;
  providerName: string;
  asOf: string;
  updatedAt: string;
  amount: number;
  convertedAmount: number;
}

export type ReportFormat = "pdf" | "csv";
export type ReportStatus = "pending" | "running" | "ready" | "failed";
export type AlertSeverity = "low" | "medium" | "high";
export type AlertStatus = "open" | "monitoring" | "disabled";
export type NotificationStatus = "unread" | "read";

export interface PortfolioReport {
  id: string;
  portfolioId: string;
  requestedBy: string;
  format: ReportFormat;
  status: ReportStatus;
  fileKey?: string;
  contentType?: string;
  failureCode?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface AlertCondition {
  eventType:
    | "analytics.updated"
    | "market_data.updated"
    | "report.generated"
    | "metric_threshold";
  metricKey?: AnalyticsMetricKey;
  operator?: "gte" | "lte";
  threshold?: number;
}

export interface PortfolioAlert {
  id: string;
  portfolioId: string;
  createdBy: string;
  title: string;
  severity: AlertSeverity;
  status: AlertStatus;
  condition: AlertCondition;
  createdAt: string;
  updatedAt: string;
  lastTriggeredAt?: string;
}

export interface NotificationRecord {
  id: string;
  portfolioId?: string;
  userId?: string;
  title: string;
  body: string;
  severity: AlertSeverity | "info";
  status: NotificationStatus;
  sourceType: "report" | "alert" | "system";
  sourceId: string;
  createdAt: string;
  readAt?: string;
}

export interface RealtimeMessage {
  id: string;
  type:
    | "analytics.updated"
    | "analytics.failed"
    | "market_data.updated"
    | "market_data.failed"
    | "report.generated"
    | "report.failed"
    | "notification.sent"
    | "portfolio.updated";
  portfolioId?: string;
  userId?: string;
  payload: Record<string, unknown>;
  createdAt: string;
}
