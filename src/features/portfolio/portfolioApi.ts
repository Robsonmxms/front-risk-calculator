import { apiFetch, apiFetchBlob, apiFetchEnvelope } from "../../lib/api/client";
import {
  MarketAssetSearchMeta,
  MarketAssetSearchResponse,
  MarketExchange,
  CurrencyConversion,
  AlertCondition,
  AlertSeverity,
  AlertStatus,
  NotificationRecord,
  PortfolioAlert,
  PortfolioAnalyticsReadModel,
  PortfolioChartBundle,
  PortfolioChartInterval,
  PortfolioChartMeta,
  PortfolioChartRange,
  PortfolioDetail,
  PortfolioListResponse,
  PortfolioPosition,
  PortfolioReport,
  PortfolioSnapshot,
  PortfolioTransaction,
  PortfolioImportJob,
  ReportFormat,
  TradePriceQuote
} from "./types";

export async function listPortfolios(): Promise<PortfolioListResponse> {
  return apiFetch<PortfolioListResponse>("/portfolios");
}

export async function createPortfolio(input: {
  accountId: string;
  name: string;
  description?: string;
  baseCurrency: string;
}) {
  return apiFetch<PortfolioDetail>("/portfolios", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function getPortfolio(portfolioId: string): Promise<PortfolioDetail> {
  return apiFetch<PortfolioDetail>(`/portfolios/${portfolioId}`);
}

export async function updatePortfolio(
  portfolioId: string,
  input: { name?: string; description?: string }
) {
  return apiFetch<PortfolioDetail>(`/portfolios/${portfolioId}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export async function listPortfolioTransactions(portfolioId: string) {
  return apiFetch<{ transactions: PortfolioTransaction[] }>(
    `/portfolios/${portfolioId}/transactions`
  );
}

export async function createPortfolioTransaction(
  portfolioId: string,
  input: {
    assetSymbol: string;
    assetName: string;
    tradeDate: string;
    type: "buy" | "sell";
    quantity: number;
    unitPrice: number;
    currency: string;
    notes?: string;
  }
) {
  return apiFetch<PortfolioTransaction>(`/portfolios/${portfolioId}/transactions`, {
    method: "POST",
    headers: {
      "Idempotency-Key": crypto.randomUUID()
    },
    body: JSON.stringify(input)
  });
}

export async function listPortfolioPositions(portfolioId: string, asOf?: string) {
  const query = asOf ? `?asOf=${encodeURIComponent(asOf)}` : "";
  return apiFetch<{ positions: PortfolioPosition[] }>(
    `/portfolios/${portfolioId}/positions${query}`
  );
}

export async function listPortfolioSnapshots(portfolioId: string) {
  return apiFetch<{ snapshots: PortfolioSnapshot[] }>(`/portfolios/${portfolioId}/snapshots`);
}

export async function downloadPortfolioImportTemplate() {
  return apiFetchBlob("/portfolio-imports/template");
}

export async function createPortfolioImport(input: {
  accountId: string;
  file: File;
  idempotencyKey: string;
}) {
  const body = new FormData();
  body.append("accountId", input.accountId);
  body.append("file", input.file);
  return apiFetchEnvelope<PortfolioImportJob, { pollAfterMs: number }>("/portfolio-imports", {
    method: "POST",
    headers: { "Idempotency-Key": input.idempotencyKey },
    body
  });
}

export async function listPortfolioImports(accountId: string) {
  const query = new URLSearchParams({ accountId, page: "1", per_page: "20" });
  return apiFetchEnvelope<
    { imports: PortfolioImportJob[] },
    {
      pagination: {
        page: number;
        per_page: number;
        total_items: number;
        total_pages: number;
        has_next: boolean;
        has_prev: boolean;
      };
    }
  >(`/portfolio-imports?${query.toString()}`);
}

export async function getPortfolioImport(importId: string) {
  return apiFetchEnvelope<PortfolioImportJob, { pollAfterMs: number | null }>(
    `/portfolio-imports/${importId}`
  );
}

export async function downloadPortfolioImportErrorReport(importId: string) {
  return apiFetchBlob(`/portfolio-imports/${importId}/error-report`);
}

export async function searchMarketAssets(query: string, exchangeCode?: string) {
  const params = new URLSearchParams({ q: query });
  if (exchangeCode) {
    params.set("exchange", exchangeCode);
  }

  return apiFetchEnvelope<MarketAssetSearchResponse, MarketAssetSearchMeta>(
    `/market-data/assets/search?${params.toString()}`
  );
}

export async function listMarketExchanges() {
  return apiFetch<{ exchanges: MarketExchange[] }>("/market-data/exchanges");
}

export async function getTradePrice(
  assetId: string,
  input: { tradeDate: string; quantity: number }
) {
  const params = new URLSearchParams({
    tradeDate: input.tradeDate,
    quantity: String(input.quantity)
  });

  return apiFetchEnvelope<
    { tradePrice: TradePriceQuote },
    { providerName: string; priceSource: TradePriceQuote["priceSource"]; asOf: string }
  >(`/market-data/assets/${encodeURIComponent(assetId)}/trade-price?${params.toString()}`);
}

export async function getPortfolioAnalytics(portfolioId: string) {
  return apiFetchEnvelope<PortfolioAnalyticsReadModel, { status: string; baseCurrency: string }>(
    `/portfolios/${portfolioId}/analytics`
  );
}

export async function getPortfolioCharts(
  portfolioId: string,
  input: {
    range?: PortfolioChartRange;
    interval?: PortfolioChartInterval;
    assetSymbols?: string[];
    benchmarkSymbol?: string;
    baseCurrency?: string;
  } = {}
) {
  const params = new URLSearchParams();
  if (input.range) {
    params.set("range", input.range);
  }
  if (input.interval) {
    params.set("interval", input.interval);
  }
  if (input.assetSymbols && input.assetSymbols.length > 0) {
    params.set("assetSymbols", input.assetSymbols.join(","));
  }
  if (input.benchmarkSymbol?.trim()) {
    params.set("benchmarkSymbol", input.benchmarkSymbol.trim().toUpperCase());
  }
  if (input.baseCurrency?.trim()) {
    params.set("baseCurrency", input.baseCurrency.trim().toUpperCase());
  }

  const query = params.toString();
  return apiFetchEnvelope<PortfolioChartBundle, PortfolioChartMeta>(
    `/portfolios/${portfolioId}/charts${query ? `?${query}` : ""}`
  );
}

export async function requestPortfolioAnalyticsRecompute(portfolioId: string) {
  return apiFetch<{ jobId: string; status: string; portfolioId: string }>(
    `/portfolios/${portfolioId}/analytics/recompute`,
    {
      method: "POST"
    }
  );
}

export async function convertCurrency(input: { from: string; to: string; amount: number }) {
  return apiFetchEnvelope<
    { conversion: CurrencyConversion },
    { providerName: string; asOf: string }
  >(
    `/market-data/fx-rate?from=${encodeURIComponent(input.from)}&to=${encodeURIComponent(
      input.to
    )}&amount=${encodeURIComponent(String(input.amount))}`
  );
}

export async function requestPortfolioReport(portfolioId: string, format: ReportFormat) {
  return apiFetchEnvelope<PortfolioReport, { status: string }>(
    `/portfolios/${portfolioId}/reports`,
    {
      method: "POST",
      body: JSON.stringify({ format })
    }
  );
}

export async function listPortfolioReports(portfolioId: string) {
  return apiFetch<{ reports: PortfolioReport[] }>(`/portfolios/${portfolioId}/reports`);
}

export async function downloadPortfolioReport(reportId: string) {
  return apiFetchBlob(`/reports/${reportId}/download`, {
    headers: {
      Accept: "application/pdf,text/csv"
    }
  });
}

export async function listPortfolioAlerts(portfolioId: string) {
  return apiFetch<{ alerts: PortfolioAlert[] }>(`/portfolios/${portfolioId}/alerts`);
}

export async function createPortfolioAlert(
  portfolioId: string,
  input: {
    title: string;
    severity: AlertSeverity;
    condition?: AlertCondition;
  }
) {
  return apiFetch<PortfolioAlert>(`/portfolios/${portfolioId}/alerts`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function updatePortfolioAlert(
  alertId: string,
  input: Partial<{
    title: string;
    severity: AlertSeverity;
    status: AlertStatus;
    condition: AlertCondition;
  }>
) {
  return apiFetch<PortfolioAlert>(`/alerts/${alertId}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export async function listNotifications() {
  return apiFetch<{ notifications: NotificationRecord[] }>("/notifications");
}

export async function markNotificationRead(notificationId: string) {
  return apiFetch<NotificationRecord>(`/notifications/${notificationId}/read`, {
    method: "PATCH"
  });
}
