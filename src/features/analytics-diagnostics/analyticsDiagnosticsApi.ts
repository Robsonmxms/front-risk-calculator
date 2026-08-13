import { ApiEnvelope, apiFetchEnvelope } from "../../lib/api/client";
import {
  AnalystChartBundle,
  AnalystChartFilters,
  AnalystChartJob,
  AnalystChartJobMeta,
  AnalystChartsMeta
} from "./types";

export async function getAnalystCharts(
  officeId: string,
  filters: AnalystChartFilters = {}
): Promise<ApiEnvelope<AnalystChartBundle, AnalystChartsMeta>> {
  const query = buildAnalystChartSearchParams(filters).toString();
  return apiFetchEnvelope<AnalystChartBundle, AnalystChartsMeta>(
    `/offices/${officeId}/analytics/charts${query ? `?${query}` : ""}`
  );
}

export async function createAnalystChartJob(
  officeId: string,
  filters: AnalystChartFilters,
  idempotencyKey: string
): Promise<ApiEnvelope<AnalystChartJob, AnalystChartJobMeta>> {
  return apiFetchEnvelope<AnalystChartJob, AnalystChartJobMeta>(
    `/offices/${officeId}/analytics/chart-jobs`,
    {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      body: JSON.stringify(normalizeAnalystChartFilters(filters))
    }
  );
}

export async function getAnalystChartJob(
  officeId: string,
  jobId: string
): Promise<ApiEnvelope<AnalystChartJob, AnalystChartJobMeta>> {
  return apiFetchEnvelope<AnalystChartJob, AnalystChartJobMeta>(
    `/offices/${officeId}/analytics/chart-jobs/${jobId}`
  );
}

function buildAnalystChartSearchParams(filters: AnalystChartFilters) {
  const params = new URLSearchParams();
  const normalized = normalizeAnalystChartFilters(filters);
  for (const [key, value] of Object.entries(normalized)) {
    if (Array.isArray(value)) {
      if (value.length > 0) {
        params.set(key, value.join(","));
      }
      continue;
    }
    if (value) {
      params.set(key, value);
    }
  }
  return params;
}

function normalizeAnalystChartFilters(filters: AnalystChartFilters) {
  return {
    portfolioIds: normalizeCsv(filters.portfolioIds),
    clientId: normalizeText(filters.clientId),
    householdId: normalizeText(filters.householdId),
    accountId: normalizeText(filters.accountId),
    advisorUserId: normalizeText(filters.advisorUserId),
    teamId: normalizeText(filters.teamId),
    range: filters.range ?? "1y",
    metrics: filters.metrics?.length ? filters.metrics.join(",") : undefined,
    benchmarkSymbol: normalizeText(filters.benchmarkSymbol)?.toUpperCase(),
    dataQuality: filters.dataQuality || undefined
  };
}

function normalizeCsv(value: string | undefined) {
  return value
    ?.split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .join(",");
}

function normalizeText(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
