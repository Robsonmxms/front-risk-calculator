import { apiFetch, apiFetchEnvelope } from "../../lib/api/client";
import {
  MarketAssetSearchMeta,
  MarketAssetSearchResponse,
  PortfolioDetail,
  PortfolioListResponse,
  PortfolioPosition,
  PortfolioSnapshot,
  PortfolioTransaction
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
  return apiFetch<{ positions: PortfolioPosition[] }>(`/portfolios/${portfolioId}/positions${query}`);
}

export async function listPortfolioSnapshots(portfolioId: string) {
  return apiFetch<{ snapshots: PortfolioSnapshot[] }>(`/portfolios/${portfolioId}/snapshots`);
}

export async function searchMarketAssets(query: string) {
  return apiFetchEnvelope<MarketAssetSearchResponse, MarketAssetSearchMeta>(
    `/market-data/assets/search?q=${encodeURIComponent(query)}`
  );
}
