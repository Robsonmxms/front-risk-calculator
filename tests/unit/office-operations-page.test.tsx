import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OfficeOperationsPage from "../../src/app/(dashboard)/dashboard/offices/[officeId]/operations/page";
import { AuthProvider } from "../../src/features/auth/AuthProvider";
import { clearSession, saveSession } from "../../src/features/auth/sessionStore";
import { Actor, SafeUser } from "../../src/features/auth/types";
import {
  OfficeAdminChartBundle,
  PlatformAdminChartBundle
} from "../../src/features/office/operationalChartTypes";

const authApiMocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  loginWithGoogle: vi.fn(),
  loginWithPassword: vi.fn(),
  logout: vi.fn()
}));

const chartApiMocks = vi.hoisted(() => ({
  getOfficeAdminCharts: vi.fn(),
  getPlatformAdminCharts: vi.fn()
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ officeId: "ofc_main" }),
  useRouter: () => ({ replace: vi.fn() })
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

vi.mock("../../src/features/auth/authApi", () => authApiMocks);
vi.mock("../../src/features/office/operationalChartsApi", () => chartApiMocks);

const officeAdminActor: Actor = {
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

const globalAdminActor: Actor = {
  ...officeAdminActor,
  id: "usr_admin",
  email: "admin@example.com",
  name: "Administrador",
  role: "admin"
};

const analystActor: Actor = {
  ...officeAdminActor,
  id: "usr_analyst",
  email: "analyst@example.com",
  name: "Analista",
  role: "analyst",
  officeMemberships: [
    {
      officeId: "ofc_main",
      officeName: "Orion Advisory",
      role: "analyst"
    }
  ]
};

describe("office operations page", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    window.sessionStorage.clear();
    window.localStorage.clear();
    clearSession();
    authApiMocks.logout.mockResolvedValue(undefined);
    chartApiMocks.getOfficeAdminCharts.mockResolvedValue({
      data: officeCharts,
      meta: { generatedAt: "2026-07-15T12:00:00.000Z", calculationDurationMs: 4 }
    });
    chartApiMocks.getPlatformAdminCharts.mockResolvedValue({
      data: platformCharts,
      meta: { generatedAt: "2026-07-15T12:00:00.000Z", calculationDurationMs: 6 }
    });
  });

  afterEach(() => {
    cleanup();
    clearSession();
  });

  it("renders office admin charts and refreshes filters", async () => {
    setupSession(officeAdminActor);

    render(
      <AuthProvider>
        <OfficeOperationsPage />
      </AuthProvider>
    );

    expect(await screen.findByRole("heading", { name: "Indicadores administrativos" })).toBeInTheDocument();
    expect(screen.getByText("Crescimento")).toBeInTheDocument();
    expect(screen.getByText("Onboarding")).toBeInTheDocument();
    expect(screen.getByText("Dados de mercado")).toBeInTheDocument();
    expect(screen.queryByText("Administração global")).not.toBeInTheDocument();
    expect(chartApiMocks.getOfficeAdminCharts).toHaveBeenCalledWith(
      "ofc_main",
      expect.objectContaining({ range: "30d" })
    );

    fireEvent.change(screen.getByLabelText("Período"), { target: { value: "90d" } });

    await waitFor(() => {
      expect(chartApiMocks.getOfficeAdminCharts).toHaveBeenCalledWith(
        "ofc_main",
        expect.objectContaining({ range: "90d" })
      );
    });
  });

  it("renders platform charts only for global admins", async () => {
    setupSession(globalAdminActor);

    render(
      <AuthProvider>
        <OfficeOperationsPage />
      </AuthProvider>
    );

    expect(await screen.findByText("Administração global")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Plataforma" })).toBeInTheDocument();
    expect(chartApiMocks.getPlatformAdminCharts).toHaveBeenCalledWith(
      expect.objectContaining({ range: "30d" })
    );
  });

  it("shows a denied state for non-admin office members without calling chart endpoints", async () => {
    setupSession(analystActor);

    render(
      <AuthProvider>
        <OfficeOperationsPage />
      </AuthProvider>
    );

    expect(
      await screen.findByText("Operação disponível apenas para administração do escritório.")
    ).toBeInTheDocument();
    expect(chartApiMocks.getOfficeAdminCharts).not.toHaveBeenCalled();
    expect(chartApiMocks.getPlatformAdminCharts).not.toHaveBeenCalled();
  });
});

function setupSession(actor: Actor) {
  const user: SafeUser = {
    id: actor.id,
    email: actor.email,
    name: actor.name,
    role: actor.role,
    status: "active"
  };
  saveSession({
    accessToken: "access-token",
    refreshToken: "refresh-token",
    actor
  });
  authApiMocks.getCurrentUser.mockResolvedValue({ actor, user });
}

const officeCharts: OfficeAdminChartBundle = {
  officeId: "ofc_main",
  range: "30d",
  filters: {},
  charts: {
    clientGrowth: [
      {
        date: "2026-07-09",
        clients: 2,
        households: 1,
        accounts: 1,
        portfolios: 1,
        staff: 3,
        clientIds: ["client_main", "client_spouse"],
        householdIds: ["hh_main"],
        portfolioIds: ["prt_main"],
        staffUserIds: ["usr_user", "usr_advisor", "usr_analyst"]
      },
      {
        date: "2026-07-15",
        clients: 3,
        households: 2,
        accounts: 1,
        portfolios: 1,
        staff: 4,
        clientIds: ["client_main", "client_spouse", "client_founder"],
        householdIds: ["hh_main", "hh_founders"],
        portfolioIds: ["prt_main"],
        staffUserIds: ["usr_user", "usr_advisor", "usr_analyst", "usr_assistant"]
      }
    ],
    onboardingFunnel: [
      { status: "invited", count: 0, clientIds: [] },
      { status: "onboarding", count: 1, clientIds: ["client_spouse"] },
      { status: "complete", count: 1, clientIds: ["client_main"] },
      { status: "paused", count: 1, clientIds: ["client_founder"] }
    ],
    staffRoleDistribution: [
      { role: "office_admin", count: 1, userIds: ["usr_user"] },
      { role: "advisor", count: 1, userIds: ["usr_advisor"] },
      { role: "analyst", count: 1, userIds: ["usr_analyst"] },
      { role: "assistant", count: 1, userIds: ["usr_assistant"] },
      { role: "client", count: 0, userIds: [] }
    ],
    assignmentLoad: [
      {
        assigneeUserId: "usr_advisor",
        assigneeName: "Assessor",
        role: "advisor",
        clientCount: 1,
        householdCount: 0,
        accountCount: 0,
        portfolioCount: 0,
        totalAssignments: 1,
        assignmentIds: ["asn_001"]
      }
    ],
    portfolioCoverage: [
      { status: "ready", freshness: "fresh", count: 1, totalCostBasis: 162199.2, portfolioIds: ["prt_main"] }
    ],
    assetCoverage: [
      {
        assetSymbol: "MSFT",
        assetName: "Microsoft",
        portfolioCount: 1,
        totalQuantity: 120,
        totalCostBasis: 49200,
        portfolioIds: ["prt_main"]
      }
    ],
    marketDataFreshness: [
      {
        providerName: "chart-provider",
        status: "available",
        freshness: "fresh",
        requestCount: 4,
        errorCount: 0,
        averageLatencyMs: 120,
        jobCount: 0,
        failedJobCount: 0
      }
    ],
    analyticsQueueHealth: [
      { status: "missing", count: 1, failedCount: 0, portfolioIds: ["prt_main"] }
    ],
    reportThroughput: [
      { status: "ready", count: 1, portfolioCount: 1, reportIds: ["rpt_001"], reportPackageIds: [] }
    ],
    reportFailures: [],
    alertNotificationVolume: [
      {
        date: "2026-07-15",
        low: 0,
        medium: 1,
        high: 1,
        info: 0,
        total: 2,
        alertIds: ["alt_001"],
        notificationIds: ["ntf_001"]
      }
    ],
    permissionActivity: [
      {
        date: "2026-07-09",
        created: 1,
        revoked: 0,
        roleChanges: 0,
        total: 1,
        eventIds: ["aud_001"],
        assignmentIds: ["asn_001"]
      }
    ]
  },
  dataQuality: {
    status: "partial",
    issues: [
      {
        code: "office_charts.analytics_snapshot_missing",
        severity: "warning",
        message: "Snapshot missing"
      }
    ],
    sourceCounts: {
      clients: 3,
      households: 2,
      accounts: 1,
      portfolios: 1,
      staff: 4,
      assignments: 1,
      analyticsJobs: 0,
      reports: 1,
      reportPackages: 0,
      alerts: 1,
      notifications: 1,
      auditEvents: 1
    }
  }
};

const platformCharts: PlatformAdminChartBundle = {
  platformId: "global",
  range: "30d",
  filters: {},
  charts: {
    officeStatusDistribution: [{ status: "active", count: 2 }],
    officeVolume: [
      { bucket: "offices", count: 2 },
      { bucket: "clients", count: 4 },
      { bucket: "households", count: 3 },
      { bucket: "accounts", count: 3 },
      { bucket: "portfolios", count: 2 },
      { bucket: "staff", count: 8 }
    ],
    staffRoleDistribution: [{ role: "office_admin", count: 2 }],
    tenantDataFreshness: [{ freshness: "fresh", officeCount: 1, portfolioCount: 1 }],
    providerHealth: [],
    jobHealth: [{ kind: "analytics", status: "failed", count: 1 }],
    reportThroughput: [{ status: "ready", count: 1, portfolioCount: 1 }],
    alertNotificationVolume: [{ date: "2026-07-15", low: 0, medium: 0, high: 1, info: 0, total: 1 }],
    permissionActivity: [{ date: "2026-07-09", created: 1, revoked: 0, roleChanges: 0, total: 1 }]
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
      analyticsJobs: 1,
      marketDataJobs: 0,
      reports: 1,
      reportPackages: 0,
      alerts: 1,
      notifications: 0,
      auditEvents: 1
    }
  }
};
