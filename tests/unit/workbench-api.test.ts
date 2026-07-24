import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearSession } from "../../src/features/auth/sessionStore";
import { getAdvisorCharts } from "../../src/features/workbench/workbenchApi";

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body
  } as Response;
}

describe("workbench api client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.sessionStorage.clear();
    window.localStorage.clear();
    clearSession();
  });

  it("requests advisor chart bundles with advisor, range, status and quality filters", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse(200, {
        data: {
          officeId: "ofc_main",
          advisorUserId: "usr_advisor",
          range: "90d",
          filters: {
            clientStatus: ["active"],
            riskBand: "watch",
            freshness: "partial"
          },
          charts: {
            bookValueTrend: [],
            riskReturnScatter: [],
            drawdownDistribution: [],
            volatilityDistribution: [],
            sectorExposureHeatmap: [],
            allocationBreakdown: [],
            alertSeverityTimeline: [],
            reportPipeline: [],
            workbenchAging: [],
            staleDataBacklog: []
          },
          rankings: { needsAttention: [] },
          dataQuality: {
            status: "partial",
            issues: [],
            sourceCounts: {
              clients: 1,
              households: 1,
              portfolios: 1,
              analyticsSnapshots: 0,
              reportPackages: 0,
              alerts: 0,
              reviewItems: 0
            }
          }
        },
        meta: {
          generatedAt: "2026-07-16T10:00:00.000Z",
          assignmentScope: "advisor"
        }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      getAdvisorCharts("ofc_main", {
        advisorUserId: "usr_advisor",
        teamId: "team_core_main",
        range: "90d",
        clientStatus: ["active"],
        riskBand: "watch",
        freshness: "partial"
      })
    ).resolves.toMatchObject({
      officeId: "ofc_main",
      advisorUserId: "usr_advisor",
      dataQuality: { status: "partial" }
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:8000/api/v1/offices/ofc_main/advisor/charts?advisorUserId=usr_advisor&teamId=team_core_main&range=90d&clientStatus=active&riskBand=watch&freshness=partial"
    );
  });
});
