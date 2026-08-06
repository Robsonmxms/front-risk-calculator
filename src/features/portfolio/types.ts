import { AccountMemberRole } from "../auth/types";

export type PortfolioFreshness = "fresh" | "stale" | "partial";
export type PortfolioStatus = "ready" | "syncing" | "degraded";
export type ProcessingState = "ready" | "pending";
export type PortfolioTransactionType = "buy" | "sell";

export interface PortfolioListItem {
  id: string;
  officeId: string;
  accountId: string;
  accountName: string;
  clientId?: string;
  clientName?: string;
  householdId?: string;
  householdName?: string;
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

export type PortfolioImportStatus = "queued" | "validating" | "committing" | "succeeded" | "failed";

export type PortfolioImportPhase =
  | "upload_complete"
  | "reading_workbook"
  | "staging_rows"
  | "validating_ledger"
  | "creating_portfolio"
  | "completed"
  | "validation_failed"
  | "technical_failed";

export interface PortfolioImportRowError {
  rowNumber: number;
  externalId?: string;
  field: string;
  code: string;
  message: string;
}

export interface PortfolioImportJob {
  id: string;
  type: "portfolio_spreadsheet_import";
  accountId: string;
  status: PortfolioImportStatus;
  phase: PortfolioImportPhase;
  originalFileName: string;
  portfolioId: string | null;
  progress: {
    totalRows: number | null;
    processedRows: number;
    succeededRows: number;
    failedRows: number;
    percent: number;
  };
  failure: {
    code: string;
    message: string;
    errorCount: number;
    errors: PortfolioImportRowError[];
  } | null;
  errorReportAvailable: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
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

export type PortfolioChartRange = "1m" | "3m" | "6m" | "ytd" | "1y" | "3y" | "5y" | "all";
export type PortfolioChartInterval = "daily" | "weekly" | "monthly";
export type PortfolioChartDataQualityStatus = "complete" | "partial" | "pending" | "failed";

export interface AssetPriceChartPoint {
  date: string;
  close: number;
  adjustedClose: number;
}

export interface AssetPriceChartSeries {
  assetId: string;
  symbol: string;
  name: string;
  currency: string;
  providerName: string;
  freshness: PortfolioFreshness;
  points: AssetPriceChartPoint[];
}

export interface CumulativeReturnPoint {
  date: string;
  returnPercent: number;
}

export interface RollingRiskPoint {
  date: string;
  volatilityPercent: number;
  rollingReturnPercent: number;
  sampleSize: number;
}

export interface BenchmarkComparisonPoint {
  date: string;
  symbol: string;
  returnPercent: number;
}

export interface ChartAnnotation {
  id: string;
  date: string;
  type: "transaction" | "analytics" | "market_data" | "report" | "alert";
  label: string;
  portfolioId: string;
  relatedId?: string;
}

export interface PortfolioChartBundle {
  portfolioId: string;
  asOfDate: string;
  range: PortfolioChartRange;
  interval: PortfolioChartInterval;
  baseCurrency: string;
  charts: {
    assetPrices: AssetPriceChartSeries[];
    portfolioPerformance: TimeSeriesPoint[];
    cumulativeReturn: CumulativeReturnPoint[];
    allocation: AllocationPoint[];
    sectorExposure: SectorExposurePoint[];
    drawdown: DrawdownPoint[];
    rollingRisk: RollingRiskPoint[];
    correlation: {
      symbols: string[];
      cells: CorrelationCell[];
    };
    benchmarkComparison: BenchmarkComparisonPoint[];
    annotations: ChartAnnotation[];
  };
  dataQuality: {
    status: PortfolioChartDataQualityStatus;
    issues: DataQualityIssue[];
    staleInputCount: number;
    unavailableChartKeys: string[];
  };
}

export interface PortfolioChartMeta {
  sourceSnapshotId?: string;
  generatedAt: string;
  latestJobStatus?: string;
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
  reasonCode?: string;
  observationCount: number;
  effectiveHorizonDays: number;
  calculationVersion: string;
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
  updatedAt: string;
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
  freshness: PortfolioFreshness;
  sourceAgeSeconds: number;
  sourceType: "live" | "fallback" | "deterministic";
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
  eventType: "analytics.updated" | "market_data.updated" | "report.generated" | "metric_threshold";
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
