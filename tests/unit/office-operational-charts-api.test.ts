import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearSession } from "../../src/features/auth/sessionStore";
import {
  getOfficeAdminCharts,
  getPlatformAdminCharts
} from "../../src/features/office/operationalChartsApi";

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body
  } as Response;
}

describe("office operational charts api client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.sessionStorage.clear();
    window.localStorage.clear();
    clearSession();
  });

  it("requests office admin charts with supported filters and returns metadata", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse(200, {
        data: {
          officeId: "ofc_main",
          range: "30d",
          filters: { role: "advisor", provider: "chart-provider" },
          charts: {
            clientGrowth: [],
            onboardingFunnel: [],
            staffRoleDistribution: [],
            assignmentLoad: [],
            portfolioCoverage: [],
            assetCoverage: [],
            marketDataFreshness: [],
            analyticsQueueHealth: [],
            reportThroughput: [],
            reportFailures: [],
            alertNotificationVolume: [],
            permissionActivity: []
          },
          dataQuality: {
            status: "complete",
            issues: [],
            sourceCounts: {
              clients: 1,
              households: 1,
              accounts: 1,
              portfolios: 1,
              staff: 2,
              assignments: 1,
              analyticsJobs: 0,
              reports: 0,
              reportPackages: 0,
              alerts: 0,
              notifications: 0,
              auditEvents: 0
            }
          }
        },
        meta: {
          generatedAt: "2026-07-15T12:00:00.000Z",
          calculationDurationMs: 4
        }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      getOfficeAdminCharts("ofc_main", {
        range: "30d",
        role: "advisor",
        workflowStatus: "active",
        provider: "chart-provider",
        severity: "high"
      })
    ).resolves.toMatchObject({
      data: {
        officeId: "ofc_main",
        dataQuality: { status: "complete" }
      },
      meta: { calculationDurationMs: 4 }
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:8000/api/v1/offices/ofc_main/admin/charts?range=30d&role=advisor&workflowStatus=active&provider=chart-provider&severity=high"
    );
  });

  it("requests global platform charts through the admin route", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse(200, {
        data: {
          platformId: "global",
          range: "90d",
          filters: {},
          charts: {
            officeStatusDistribution: [],
            officeVolume: [],
            staffRoleDistribution: [],
            tenantDataFreshness: [],
            providerHealth: [],
            jobHealth: [],
            reportThroughput: [],
            alertNotificationVolume: [],
            permissionActivity: []
          },
          dataQuality: {
            status: "complete",
            issues: [],
            sourceCounts: {
              offices: 2,
              clients: 4,
              households: 3,
              accounts: 3,
              portfolios: 2,
              staff: 8,
              assignments: 2,
              analyticsJobs: 0,
              marketDataJobs: 0,
              reports: 0,
              reportPackages: 0,
              alerts: 0,
              notifications: 0,
              auditEvents: 0
            }
          }
        },
        meta: {
          generatedAt: "2026-07-15T12:00:00.000Z",
          calculationDurationMs: 6
        }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getPlatformAdminCharts({ range: "90d" })).resolves.toMatchObject({
      data: { platformId: "global" },
      meta: { calculationDurationMs: 6 }
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:8000/api/v1/admin/platform/charts?range=90d"
    );
  });
});
