import { ApiEnvelope, apiFetch, apiFetchEnvelope } from "../../lib/api/client";
import {
  PortfolioDashboard,
  PortfolioListResponse,
  PortfolioMeta
} from "./types";

export interface PortfolioDashboardMeta
  extends Pick<PortfolioMeta, "freshness" | "status" | "asOf"> {}

export async function listPortfolios(): Promise<PortfolioListResponse> {
  return apiFetch<PortfolioListResponse>("/accounts");
}

export async function getPortfolioDashboard(
  accountId: string
): Promise<ApiEnvelope<PortfolioDashboard, PortfolioDashboardMeta>> {
  return apiFetchEnvelope<PortfolioDashboard, PortfolioDashboardMeta>(
    `/accounts/${accountId}/dashboard`
  );
}
