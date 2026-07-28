import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearSession } from "../../src/features/auth/sessionStore";
import {
  getComplianceCharts,
  listAuditEvents,
  listSupervisionReviews,
  requestAuditExport,
  updateSupervisionReview
} from "../../src/features/compliance/complianceApi";
import {
  approveReportPackage,
  createReportPackage,
  deliverReportPackage,
  getClientPortal,
  getDeliveryCharts,
  listClientReportPackages,
  revokeReportPackage
} from "../../src/features/delivery/deliveryApi";

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

  it("lists audit events with pagination fallbacks and ignores empty filters", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse(200, {
        data: {
          auditEvents: [
            {
              id: "aud-1",
              officeId: "ofc_main",
              action: "auth.login",
              resourceType: "auth",
              resourceId: "usr_user",
              outcome: "success",
              severity: "info",
              reviewRequired: false,
              metadata: {},
              createdAt: "2026-07-16T10:00:00.000Z"
            }
          ]
        }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      listAuditEvents("ofc_main", {
        outcome: "success",
        severity: "",
        page: 2,
        pageSize: 25
      })
    ).resolves.toMatchObject({
      total: 1,
      page: 2,
      pageSize: 25,
      auditEvents: [expect.objectContaining({ action: "auth.login" })]
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:8000/api/v1/offices/ofc_main/audit-events?outcome=success&page=2&pageSize=25"
    );
  });

  it("filters, updates, and exports supervision reviews through backend endpoints", async () => {
    const review = {
      id: "rev-1",
      officeId: "ofc_main",
      auditEventId: "aud-1",
      status: "assigned",
      severity: "critical",
      assignedToUserId: "usr_analyst",
      createdAt: "2026-07-16T10:00:00.000Z",
      updatedAt: "2026-07-16T10:00:00.000Z"
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(200, {
          data: { supervisionReviews: [review] }
        })
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          data: { ...review, status: "resolved", resolutionComment: "Revisado" }
        })
      )
      .mockResolvedValueOnce(
        jsonResponse(202, {
          data: {
            id: "exp-1",
            officeId: "ofc_main",
            requestedBy: "usr_admin",
            format: "csv",
            status: "completed",
            eventCount: 1,
            filters: { severity: "critical" },
            downloadUrl: "/audit-exports/exp-1.csv",
            createdAt: "2026-07-16T10:00:00.000Z",
            completedAt: "2026-07-16T10:00:01.000Z"
          }
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      listSupervisionReviews("ofc_main", {
        status: "assigned",
        severity: "critical",
        assignedToUserId: "usr_analyst"
      })
    ).resolves.toMatchObject({
      supervisionReviews: [expect.objectContaining({ assignedToUserId: "usr_analyst" })]
    });
    await expect(
      updateSupervisionReview("rev-1", {
        status: "resolved",
        resolutionComment: "Revisado"
      })
    ).resolves.toMatchObject({ status: "resolved" });
    await expect(
      requestAuditExport("ofc_main", {
        format: "csv",
        filters: { severity: "critical" }
      })
    ).resolves.toMatchObject({ id: "exp-1", format: "csv" });

    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:8000/api/v1/offices/ofc_main/supervision-reviews?status=assigned&severity=critical&assignedToUserId=usr_analyst"
    );
    expect(fetchMock.mock.calls[1][0]).toBe(
      "http://localhost:8000/api/v1/supervision-reviews/rev-1"
    );
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: "PATCH" });
    expect(JSON.parse(fetchMock.mock.calls[1][1].body as string)).toEqual({
      status: "resolved",
      resolutionComment: "Revisado"
    });
    expect(fetchMock.mock.calls[2][0]).toBe(
      "http://localhost:8000/api/v1/offices/ofc_main/audit-exports"
    );
    expect(fetchMock.mock.calls[2][1]).toMatchObject({ method: "POST" });
  });

  it("manages report package lifecycle through backend-owned delivery APIs", async () => {
    const reportPackage = {
      id: "pkg-1",
      officeId: "ofc_main",
      clientId: "client_main",
      title: "Relatorio mensal",
      summaryNotes: "Resumo",
      status: "draft",
      items: [],
      createdBy: "usr_user",
      createdAt: "2026-07-16T10:00:00.000Z",
      updatedAt: "2026-07-16T10:00:00.000Z"
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(200, {
          data: { reportPackages: [reportPackage] }
        })
      )
      .mockResolvedValueOnce(
        jsonResponse(201, {
          data: { ...reportPackage, status: "pending_approval" }
        })
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          data: { ...reportPackage, status: "approved", approvedBy: "usr_admin" }
        })
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          data: { ...reportPackage, status: "delivered", deliveredBy: "usr_admin" }
        })
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          data: { ...reportPackage, status: "revoked", revokedBy: "usr_admin" }
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(listClientReportPackages("client_main", { status: "draft" })).resolves.toMatchObject({
      reportPackages: [expect.objectContaining({ id: "pkg-1" })]
    });
    await expect(
      createReportPackage("client_main", {
        title: "Relatorio mensal",
        summaryNotes: "Resumo",
        internalNotes: "Conferencia interna",
        submitForApproval: true,
        items: [
          {
            type: "portfolio_summary",
            title: "Resumo de carteira",
            portfolioId: "prt_main",
            status: "ready"
          }
        ]
      })
    ).resolves.toMatchObject({ status: "pending_approval" });
    await expect(approveReportPackage("pkg-1")).resolves.toMatchObject({ status: "approved" });
    await expect(deliverReportPackage("pkg-1")).resolves.toMatchObject({ status: "delivered" });
    await expect(revokeReportPackage("pkg-1")).resolves.toMatchObject({ status: "revoked" });

    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:8000/api/v1/clients/client_main/report-packages?status=draft"
    );
    expect(fetchMock.mock.calls[1][0]).toBe(
      "http://localhost:8000/api/v1/clients/client_main/report-packages"
    );
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: "POST" });
    expect(fetchMock.mock.calls[2][0]).toBe(
      "http://localhost:8000/api/v1/report-packages/pkg-1/approve"
    );
    expect(fetchMock.mock.calls[3][0]).toBe(
      "http://localhost:8000/api/v1/report-packages/pkg-1/deliver"
    );
    expect(fetchMock.mock.calls[4][0]).toBe(
      "http://localhost:8000/api/v1/report-packages/pkg-1/revoke"
    );
  });

  it("loads client portal packages through the authenticated backend endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse(200, {
        data: {
          actorId: "usr_client",
          generatedAt: "2026-07-16T10:00:00.000Z",
          clients: [{ id: "client_main", officeId: "ofc_main", name: "Marina Silva" }],
          packages: []
        }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getClientPortal()).resolves.toMatchObject({
      actorId: "usr_client",
      clients: [expect.objectContaining({ id: "client_main" })]
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:8000/api/v1/client-portal"
    );
  });
});
