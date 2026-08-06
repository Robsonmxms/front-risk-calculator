import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearSession } from "../../src/features/auth/sessionStore";
import {
  createReviewItem,
  getAdvisorCharts,
  getWorkbench,
  listReviewItems,
  updateReviewItem
} from "../../src/features/workbench/workbenchApi";

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

  it("uses compact advisor chart URLs when optional filters are empty", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse(200, {
        data: {
          officeId: "ofc_main",
          advisorUserId: "usr_advisor",
          range: "30d",
          filters: { clientStatus: [] },
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
            status: "empty",
            issues: [],
            sourceCounts: {
              clients: 0,
              households: 0,
              portfolios: 0,
              analyticsSnapshots: 0,
              reportPackages: 0,
              alerts: 0,
              reviewItems: 0
            }
          }
        }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      getAdvisorCharts("ofc_main", {
        clientStatus: [],
        riskBand: "",
        freshness: ""
      })
    ).resolves.toMatchObject({ officeId: "ofc_main" });
    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:8000/api/v1/offices/ofc_main/advisor/charts"
    );
  });

  it("loads workbench summaries and manages review items through backend routes", async () => {
    const reviewItem = {
      id: "rev-item-1",
      officeId: "ofc_main",
      title: "Revisar volatilidade",
      severity: "high",
      status: "open",
      resourceType: "portfolio",
      resourceId: "prt_main",
      portfolioId: "prt_main",
      createdBy: "usr_advisor",
      createdAt: "2026-07-16T10:00:00.000Z",
      updatedAt: "2026-07-16T10:00:00.000Z"
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(200, {
          data: {
            officeId: "ofc_main",
            generatedAt: "2026-07-16T10:00:00.000Z",
            assignedClients: [],
            portfoliosNeedingAttention: [],
            reviewItems: [reviewItem],
            counts: {
              assignedClients: 0,
              portfoliosNeedingAttention: 0,
              openReviewItems: 1,
              highSeverityReviewItems: 1,
              pendingReports: 0,
              openAlerts: 0
            }
          }
        })
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          data: { reviewItems: [reviewItem] }
        })
      )
      .mockResolvedValueOnce(jsonResponse(201, { data: reviewItem }))
      .mockResolvedValueOnce(
        jsonResponse(200, {
          data: { ...reviewItem, status: "in_progress", assignedToUserId: "usr_analyst" }
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getWorkbench("ofc_main")).resolves.toMatchObject({
      counts: { openReviewItems: 1 }
    });
    await expect(
      listReviewItems("ofc_main", {
        status: "open",
        severity: "high",
        assignedToUserId: "usr_analyst",
        clientId: "client_main"
      })
    ).resolves.toMatchObject({
      reviewItems: [expect.objectContaining({ id: "rev-item-1" })]
    });
    await expect(
      createReviewItem("ofc_main", {
        title: "Revisar volatilidade",
        severity: "high",
        resourceType: "portfolio",
        resourceId: "prt_main",
        portfolioId: "prt_main",
        assignedToUserId: "usr_analyst",
        dueDate: "2026-07-30",
        notes: "Prioridade alta"
      })
    ).resolves.toMatchObject({ id: "rev-item-1" });
    await expect(
      updateReviewItem("rev-item-1", {
        status: "in_progress",
        assignedToUserId: "usr_analyst"
      })
    ).resolves.toMatchObject({ status: "in_progress" });

    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:8000/api/v1/offices/ofc_main/workbench"
    );
    expect(fetchMock.mock.calls[1][0]).toBe(
      "http://localhost:8000/api/v1/offices/ofc_main/review-items?status=open&severity=high&assignedToUserId=usr_analyst&clientId=client_main"
    );
    expect(fetchMock.mock.calls[2][0]).toBe(
      "http://localhost:8000/api/v1/offices/ofc_main/review-items"
    );
    expect(fetchMock.mock.calls[2][1]).toMatchObject({ method: "POST" });
    expect(fetchMock.mock.calls[3][0]).toBe("http://localhost:8000/api/v1/review-items/rev-item-1");
    expect(fetchMock.mock.calls[3][1]).toMatchObject({ method: "PATCH" });
  });
});
