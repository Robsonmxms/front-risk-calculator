import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearSession } from "../../src/features/auth/sessionStore";
import {
  createAnalystChartJob,
  getAnalystCharts
} from "../../src/features/analytics-diagnostics/analyticsDiagnosticsApi";

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body
  } as Response;
}

describe("analytics diagnostics api client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.sessionStorage.clear();
    window.localStorage.clear();
    clearSession();
  });

  it("requests analyst diagnostics with csv scope and metric filters", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse(200, {
        data: {
          officeId: "ofc_main",
          range: "1y",
          filters: {
            portfolioIds: ["prt_main", "prt_core"],
            metrics: ["volatility", "beta"],
            benchmarkSymbol: "SPY"
          },
          charts: {
            riskReturnScatter: [],
            metricDistributions: [],
            rollingVolatility: [],
            rollingCorrelation: [],
            sectorExposureHeatmap: [],
            assetExposureHeatmap: [],
            benchmarkSensitivity: [],
            riskContribution: [],
            concentrationRanking: [],
            dataQualityTimeline: [],
            providerFreshnessMatrix: []
          },
          dataQuality: {
            status: "complete",
            issues: [],
            unavailableChartKeys: [],
            sourceCounts: {
              portfolios: 2,
              snapshots: 2,
              analyticsJobs: 2,
              assets: 3
            }
          }
        },
        meta: {
          generatedAt: "2026-07-24T12:00:00.000Z",
          sourceSnapshotIds: ["snap_1"],
          inputHashes: ["hash_1"],
          calculationDurationMs: 12
        }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      getAnalystCharts("ofc_main", {
        portfolioIds: " prt_main, prt_core ",
        clientId: "client_main",
        range: "1y",
        metrics: ["volatility", "beta"],
        benchmarkSymbol: "spy",
        dataQuality: "partial"
      })
    ).resolves.toMatchObject({
      data: {
        officeId: "ofc_main",
        dataQuality: { status: "complete" }
      },
      meta: { inputHashes: ["hash_1"] }
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:8000/api/v1/offices/ofc_main/analytics/charts?portfolioIds=prt_main%2Cprt_core&clientId=client_main&range=1y&metrics=volatility%2Cbeta&benchmarkSymbol=SPY&dataQuality=partial"
    );
  });

  it("creates diagnostic jobs with idempotency and backend-compatible csv metrics", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse(202, {
        data: {
          id: "job_1",
          officeId: "ofc_main",
          requestedBy: "usr_analyst",
          idempotencyKey: "diag-001",
          filters: {
            range: "5y",
            portfolioIds: "prt_main",
            metrics: "volatility,beta"
          },
          inputHash: "hash_1",
          correlationId: "corr_1",
          status: "pending",
          progressPercent: 0,
          sourceSnapshotIds: [],
          createdAt: "2026-07-24T12:00:00.000Z",
          updatedAt: "2026-07-24T12:00:00.000Z"
        },
        meta: {
          correlationId: "corr_1",
          inputHash: "hash_1"
        }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      createAnalystChartJob(
        "ofc_main",
        {
          portfolioIds: "prt_main",
          range: "5y",
          metrics: ["volatility", "beta"],
          benchmarkSymbol: "spy"
        },
        "diag-001"
      )
    ).resolves.toMatchObject({
      data: { id: "job_1", status: "pending" },
      meta: { inputHash: "hash_1" }
    });

    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:8000/api/v1/offices/ofc_main/analytics/chart-jobs"
    );
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: "POST",
      headers: expect.objectContaining({ "Idempotency-Key": "diag-001" })
    });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toMatchObject({
      portfolioIds: "prt_main",
      range: "5y",
      metrics: "volatility,beta",
      benchmarkSymbol: "SPY"
    });
  });
});
