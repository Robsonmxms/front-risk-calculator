import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearSession } from "../../src/features/auth/sessionStore";
import { getComplianceCharts } from "../../src/features/compliance/complianceApi";
import { getDeliveryCharts } from "../../src/features/delivery/deliveryApi";

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body
  } as Response;
}

describe("compliance and delivery chart api clients", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.sessionStorage.clear();
    window.localStorage.clear();
    clearSession();
  });

  it("requests compliance charts with audit filters and returns metadata", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse(200, {
        data: {
          officeId: "ofc_main",
          range: "30d",
          filters: { severity: "critical" },
          charts: {
            auditEventTimeline: [],
            auditActionBreakdown: [],
            reviewStatusFunnel: [],
            reviewAging: [],
            permissionActivity: [],
            exceptionHeatmap: []
          },
          dataQuality: {
            status: "complete",
            issues: [],
            sourceCounts: {
              auditEvents: 0,
              supervisionReviews: 0,
              redactedAuditMetadataFields: 0
            }
          }
        },
        meta: {
          generatedAt: "2026-07-16T00:00:00.000Z",
          calculationDurationMs: 2
        }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      getComplianceCharts("ofc_main", {
        range: "30d",
        resourceType: "delivery",
        action: "delivery.report.failed",
        severity: "critical"
      })
    ).resolves.toMatchObject({
      data: { officeId: "ofc_main" },
      meta: { calculationDurationMs: 2 }
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:8000/api/v1/offices/ofc_main/compliance/charts?range=30d&resourceType=delivery&action=delivery.report.failed&severity=critical"
    );
  });

  it("requests delivery charts with package, delivery, and channel filters", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse(200, {
        data: {
          officeId: "ofc_main",
          range: "90d",
          filters: { packageStatus: "delivered", deliveryStatus: "failure", channel: "portal" },
          charts: {
            reportLifecycleFunnel: [],
            approvalLatency: [],
            deliveryOutcomeTimeline: [],
            failureReasonBreakdown: [],
            notificationReadStatus: [],
            clientPackageReadiness: []
          },
          dataQuality: {
            status: "empty",
            issues: [],
            sourceCounts: {
              clients: 0,
              portfolios: 0,
              reportPackages: 0,
              reports: 0,
              notifications: 0,
              deliveryAuditEvents: 0
            }
          }
        },
        meta: {
          generatedAt: "2026-07-16T00:00:00.000Z",
          calculationDurationMs: 3
        }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      getDeliveryCharts("ofc_main", {
        range: "90d",
        packageStatus: "delivered",
        deliveryStatus: "failure",
        channel: "portal",
        advisorUserId: "usr_advisor"
      })
    ).resolves.toMatchObject({
      data: { officeId: "ofc_main" },
      meta: { calculationDurationMs: 3 }
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:8000/api/v1/offices/ofc_main/delivery/charts?range=90d&packageStatus=delivered&deliveryStatus=failure&channel=portal&advisorUserId=usr_advisor"
    );
  });
});
