import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CompliancePage from "../../src/app/(dashboard)/dashboard/compliance/page";
import { AuthProvider } from "../../src/features/auth/AuthProvider";
import { clearSession, saveSession } from "../../src/features/auth/sessionStore";
import { Actor, SafeUser } from "../../src/features/auth/types";

const authApiMocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  loginWithGoogle: vi.fn(),
  loginWithPassword: vi.fn(),
  logout: vi.fn()
}));

const complianceApiMocks = vi.hoisted(() => ({
  getComplianceCharts: vi.fn(),
  listAuditEvents: vi.fn(),
  listSupervisionReviews: vi.fn(),
  requestAuditExport: vi.fn(),
  updateSupervisionReview: vi.fn()
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() })
}));

vi.mock("../../src/features/auth/authApi", () => authApiMocks);
vi.mock("../../src/features/compliance/complianceApi", () => complianceApiMocks);

const actor: Actor = {
  id: "usr_user",
  email: "user@example.com",
  name: "Portfolio User",
  role: "user",
  officeMemberships: [
    {
      officeId: "ofc_main",
      officeName: "Orion Advisory",
      role: "office_admin"
    }
  ],
  accountMemberships: []
};

const safeUser: SafeUser = {
  id: actor.id,
  email: actor.email,
  name: actor.name,
  role: actor.role,
  status: "active"
};

const auditEvent = {
  id: "aud_report_delivery_failed",
  officeId: "ofc_main",
  actorId: "usr_advisor",
  actorName: "Advisor User",
  action: "delivery.report.failed",
  resourceType: "delivery",
  resourceId: "rpt_001",
  clientId: "client_main",
  portfolioId: "prt_main",
  outcome: "failure",
  severity: "critical",
  reviewRequired: true,
  metadata: {
    failureCode: "delivery_timeout",
    channel: "portal"
  },
  createdAt: "2026-07-15T15:30:00.000Z"
};

const review = {
  id: "sv_aud_report_delivery_failed",
  officeId: "ofc_main",
  auditEventId: "aud_report_delivery_failed",
  status: "open",
  severity: "critical",
  assignedToUserId: "usr_user",
  createdAt: "2026-07-15T15:30:00.000Z",
  updatedAt: "2026-07-15T15:35:00.000Z"
};

describe("compliance page", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    window.sessionStorage.clear();
    window.localStorage.clear();
    clearSession();
    saveSession({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      actor
    });
    authApiMocks.getCurrentUser.mockResolvedValue({ actor, user: safeUser });
    authApiMocks.logout.mockResolvedValue(undefined);
    complianceApiMocks.listAuditEvents.mockResolvedValue({
      auditEvents: [auditEvent],
      total: 1,
      page: 1,
      pageSize: 25
    });
    complianceApiMocks.listSupervisionReviews.mockResolvedValue({
      supervisionReviews: [review]
    });
    complianceApiMocks.getComplianceCharts.mockResolvedValue({
      data: {
        officeId: "ofc_main",
        range: "30d",
        filters: {},
        charts: {
          auditEventTimeline: [
            {
              date: "2026-07-15",
              success: 0,
              failure: 1,
              info: 0,
              warning: 0,
              critical: 1,
              total: 1,
              eventIds: ["aud_report_delivery_failed"],
              clientIds: ["client_main"],
              portfolioIds: ["prt_main"]
            }
          ],
          auditActionBreakdown: [
            {
              action: "delivery.report.failed",
              resourceType: "delivery",
              outcome: "failure",
              severity: "critical",
              count: 1,
              eventIds: ["aud_report_delivery_failed"]
            }
          ],
          reviewStatusFunnel: [
            {
              status: "open",
              count: 1,
              reviewIds: ["sv_aud_report_delivery_failed"],
              auditEventIds: ["aud_report_delivery_failed"]
            }
          ],
          reviewAging: [
            {
              bucket: "4-7d",
              count: 1,
              reviewIds: ["sv_aud_report_delivery_failed"],
              auditEventIds: ["aud_report_delivery_failed"]
            }
          ],
          permissionActivity: [],
          exceptionHeatmap: [
            {
              date: "2026-07-15",
              severity: "critical",
              count: 1,
              eventIds: ["aud_report_delivery_failed"]
            }
          ]
        },
        dataQuality: {
          status: "complete",
          issues: [],
          sourceCounts: {
            auditEvents: 1,
            supervisionReviews: 1,
            redactedAuditMetadataFields: 0
          }
        }
      },
      meta: {
        generatedAt: "2026-07-16T00:00:00.000Z",
        calculationDurationMs: 2
      }
    });
    complianceApiMocks.requestAuditExport.mockResolvedValue({
      id: "audexp_001",
      officeId: "ofc_main",
      requestedBy: "usr_user",
      format: "csv",
      status: "completed",
      eventCount: 1,
      filters: {},
      downloadUrl: "/api/v1/offices/ofc_main/audit-exports/audexp_001.csv",
      createdAt: "2026-07-16T00:00:00.000Z",
      completedAt: "2026-07-16T00:00:01.000Z"
    });
    complianceApiMocks.updateSupervisionReview.mockResolvedValue({
      ...review,
      status: "resolved",
      resolutionComment: "Revisado no painel de conformidade.",
      resolvedAt: "2026-07-16T00:00:00.000Z"
    });
  });

  afterEach(() => {
    cleanup();
    clearSession();
  });

  it("renders audit filters, requests exports, and resolves supervision reviews", async () => {
    render(
      <AuthProvider>
        <CompliancePage />
      </AuthProvider>
    );

    expect((await screen.findAllByText("Falha na entrega do relatório")).length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText("delivery.report.failed")).not.toBeInTheDocument();
    expect(screen.queryByText("entrega: rpt_001")).not.toBeInTheDocument();
    expect(screen.queryByText(/delivery_timeout/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "entrega: Entrega de relatório" })).toHaveAttribute(
      "href",
      "/dashboard/clients/client_main"
    );
    expect(screen.getByText(/falha: tempo limite na entrega/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Severidade"), {
      target: { value: "critical" }
    });
    await waitFor(() => {
      expect(complianceApiMocks.listAuditEvents).toHaveBeenLastCalledWith(
        "ofc_main",
        expect.objectContaining({ severity: "critical", page: 1, pageSize: 25 })
      );
      expect(complianceApiMocks.getComplianceCharts).toHaveBeenLastCalledWith(
        "ofc_main",
        expect.objectContaining({ severity: "critical", range: "30d" })
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Exportar CSV" }));
    await waitFor(() => {
      expect(complianceApiMocks.requestAuditExport).toHaveBeenCalledWith("ofc_main", {
        format: "csv",
        filters: expect.objectContaining({ severity: "critical" })
      });
    });
    expect(await screen.findByText("Exportação CSV pronta com 1 evento.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Resolver revisão" }));
    await waitFor(() => {
      expect(complianceApiMocks.updateSupervisionReview).toHaveBeenCalledWith(
        "sv_aud_report_delivery_failed",
        {
          status: "resolved",
          resolutionComment: "Revisado no painel de conformidade."
        }
      );
    });
    expect(await screen.findByText("Revisão de supervisão resolvida.")).toBeInTheDocument();
  });
});
