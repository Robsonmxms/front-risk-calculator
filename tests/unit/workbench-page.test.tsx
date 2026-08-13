import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WorkbenchPage from "../../src/app/(dashboard)/dashboard/workbench/page";
import { AuthProvider } from "../../src/features/auth/AuthProvider";
import { clearSession, saveSession } from "../../src/features/auth/sessionStore";
import { Actor, SafeUser } from "../../src/features/auth/types";

const authApiMocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  loginWithPassword: vi.fn(),
  logout: vi.fn()
}));

const workbenchApiMocks = vi.hoisted(() => ({
  createReviewItem: vi.fn(),
  getAdvisorCharts: vi.fn(),
  getWorkbench: vi.fn(),
  listReviewItems: vi.fn(),
  updateReviewItem: vi.fn()
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
vi.mock("../../src/features/workbench/workbenchApi", () => workbenchApiMocks);

const actor: Actor = {
  id: "usr_advisor",
  email: "advisor@example.com",
  name: "Advisor User",
  role: "user",
  officeMemberships: [
    {
      officeId: "ofc_main",
      officeName: "Orion Advisory",
      role: "advisor"
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

const clientActor: Actor = {
  ...actor,
  id: "usr_client",
  email: "client@example.com",
  name: "Cliente Principal",
  officeMemberships: [
    {
      officeId: "ofc_main",
      officeName: "Orion Advisory",
      role: "client"
    }
  ]
};

const clientUser: SafeUser = {
  ...safeUser,
  id: clientActor.id,
  email: clientActor.email,
  name: clientActor.name
};

const reviewItem = {
  id: "rev_main_report",
  officeId: "ofc_main",
  title: "Revisar pacote mensal de risco",
  severity: "medium",
  status: "open",
  resourceType: "client",
  resourceId: "client_main",
  clientId: "client_main",
  assignedToUserId: "usr_advisor",
  dueDate: "2026-07-20",
  createdBy: "usr_user",
  createdAt: "2026-07-09T00:00:00.000Z",
  updatedAt: "2026-07-09T00:00:00.000Z"
};

const advisorCharts = {
  officeId: "ofc_main",
  advisorUserId: "usr_advisor",
  range: "90d",
  filters: {
    clientStatus: []
  },
  charts: {
    bookValueTrend: [
      { date: "2026-07-12", value: 218100, clientCount: 1, portfolioCount: 1 },
      { date: "2026-07-15", value: 245800, clientCount: 1, portfolioCount: 1 }
    ],
    riskReturnScatter: [
      {
        id: "prt_main",
        clientId: "client_main",
        clientName: "Marina Silva",
        portfolioId: "prt_main",
        portfolioName: "Core Growth",
        value: 245800,
        annualizedReturnPercent: 8.4,
        volatilityPercent: 12.8,
        maxDrawdownPercent: 8.7,
        riskBand: "watch",
        freshness: "fresh",
        drillDown: { clientId: "client_main", portfolioId: "prt_main" }
      }
    ],
    drawdownDistribution: [
      {
        clientId: "client_main",
        clientName: "Marina Silva",
        value: 8.7,
        portfolioCount: 1,
        riskBand: "watch",
        freshness: "fresh",
        drillDown: { clientId: "client_main" }
      }
    ],
    volatilityDistribution: [
      {
        clientId: "client_main",
        clientName: "Marina Silva",
        value: 12.8,
        portfolioCount: 1,
        riskBand: "watch",
        freshness: "fresh",
        drillDown: { clientId: "client_main" }
      }
    ],
    sectorExposureHeatmap: [
      {
        clientId: "client_main",
        clientName: "Marina Silva",
        sector: "Technology",
        weightPercent: 58,
        marketValueUsd: 142564,
        drillDown: { clientId: "client_main" }
      }
    ],
    allocationBreakdown: [
      { label: "Microsoft", weightPercent: 22, marketValueUsd: 54000 },
      { label: "VTI", weightPercent: 28, marketValueUsd: 68800 }
    ],
    alertSeverityTimeline: [{ date: "2026-07-15", low: 0, medium: 1, high: 1, total: 2 }],
    reportPipeline: [
      { status: "delivered", count: 1, clientCount: 1, staleCount: 0 },
      { status: "pending_approval", count: 1, clientCount: 1, staleCount: 1 }
    ],
    workbenchAging: [
      { bucket: "overdue", low: 0, medium: 1, high: 0, total: 1 },
      { bucket: "due_7d", low: 0, medium: 0, high: 0, total: 0 },
      { bucket: "due_30d", low: 0, medium: 0, high: 0, total: 0 },
      { bucket: "no_due_date", low: 0, medium: 0, high: 0, total: 0 }
    ],
    staleDataBacklog: [
      {
        portfolioId: "prt_main",
        portfolioName: "Core Growth",
        clientId: "client_main",
        clientName: "Marina Silva",
        freshness: "partial",
        analyticsState: "pending",
        marketDataState: "ready",
        reason: "Snapshot analítico pendente",
        drillDown: { clientId: "client_main", portfolioId: "prt_main" }
      }
    ]
  },
  rankings: {
    needsAttention: [
      {
        rank: 1,
        clientId: "client_main",
        clientName: "Marina Silva",
        score: 45,
        reasons: ["Métricas em faixa de observação", "Pacotes de relatório em andamento"],
        value: 245800,
        riskBand: "watch",
        freshness: "partial",
        openReviewItemCount: 1,
        highAlertCount: 1,
        pendingReportCount: 1,
        drillDown: { clientId: "client_main" }
      }
    ]
  },
  dataQuality: {
    status: "partial",
    issues: [{ code: "advisor_charts.analytics_partial", severity: "warning", message: "Partial" }],
    sourceCounts: {
      clients: 1,
      households: 1,
      portfolios: 1,
      analyticsSnapshots: 1,
      reportPackages: 2,
      alerts: 2,
      reviewItems: 1
    }
  }
};

describe("workbench page", () => {
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
    workbenchApiMocks.getWorkbench.mockResolvedValue({
      officeId: "ofc_main",
      generatedAt: "2026-07-16T00:00:00.000Z",
      assignedClients: [
        {
          id: "client_main",
          officeId: "ofc_main",
          name: "Marina Silva",
          email: "marina.silva@example.com",
          householdName: "Silva Family",
          status: "active",
          onboardingStatus: "complete",
          riskProfileDescriptor: "Balanced growth profile",
          accountCount: 1,
          portfolioCount: 1,
          createdAt: "2026-07-09T00:00:00.000Z",
          updatedAt: "2026-07-09T00:00:00.000Z"
        }
      ],
      portfoliosNeedingAttention: [],
      reviewItems: [reviewItem],
      counts: {
        assignedClients: 1,
        portfoliosNeedingAttention: 0,
        openReviewItems: 1,
        highSeverityReviewItems: 0,
        pendingReports: 0,
        openAlerts: 0
      }
    });
    workbenchApiMocks.listReviewItems.mockResolvedValue({ reviewItems: [reviewItem] });
    workbenchApiMocks.getAdvisorCharts.mockResolvedValue(advisorCharts);
    workbenchApiMocks.createReviewItem.mockResolvedValue({
      ...reviewItem,
      id: "rev_new",
      title: "Revisar premissas das análises",
      severity: "high"
    });
    workbenchApiMocks.updateReviewItem.mockResolvedValue({
      ...reviewItem,
      status: "closed",
      closedAt: "2026-07-16T00:00:00.000Z"
    });
  });

  afterEach(() => {
    cleanup();
    clearSession();
  });

  it("renders workbench sections, filters review items, creates and updates review items", async () => {
    render(
      <AuthProvider>
        <WorkbenchPage />
      </AuthProvider>
    );

    expect(await screen.findByText("Revisar pacote mensal de risco")).toBeInTheDocument();
    expect(await screen.findByText("Monitoramento do livro de clientes")).toBeInTheDocument();
    expect(screen.getByText("Clientes que pedem atenção")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "1. Marina Silva" })).toHaveAttribute(
      "href",
      "/dashboard/clients/client_main"
    );
    expect(screen.getAllByText(/245\.800,00/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("fontes parciais").length).toBeGreaterThan(0);
    expect(workbenchApiMocks.getAdvisorCharts).toHaveBeenCalledWith("ofc_main", {
      advisorUserId: undefined,
      freshness: "",
      range: "90d",
      riskBand: ""
    });
    expect(screen.getByRole("link", { name: "cliente: Marina Silva" })).toHaveAttribute(
      "href",
      "/dashboard/clients/client_main"
    );
    expect(screen.queryByText("cliente: client_main")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Prazo")).toHaveValue("");
    expect(screen.getByText("Silva Family").closest("a")).toHaveAttribute(
      "href",
      "/dashboard/clients/client_main"
    );

    fireEvent.change(screen.getByLabelText("Filtrar severidade"), {
      target: { value: "medium" }
    });
    await waitFor(() => {
      expect(workbenchApiMocks.listReviewItems).toHaveBeenLastCalledWith("ofc_main", {
        status: "open",
        severity: "medium"
      });
    });

    fireEvent.change(screen.getByLabelText("Filtrar faixa de risco"), {
      target: { value: "high" }
    });
    await waitFor(() => {
      expect(workbenchApiMocks.getAdvisorCharts).toHaveBeenLastCalledWith("ofc_main", {
        advisorUserId: undefined,
        freshness: "",
        range: "90d",
        riskBand: "high"
      });
    });

    fireEvent.change(screen.getByLabelText("Título"), {
      target: { value: "Revisar premissas das análises" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Criar item" }));
    await waitFor(() => {
      expect(workbenchApiMocks.createReviewItem).toHaveBeenCalledWith("ofc_main", {
        title: "Revisar premissas das análises",
        severity: "medium",
        resourceType: "client",
        resourceId: "client_main",
        clientId: "client_main",
        portfolioId: undefined,
        assignedToUserId: "usr_advisor",
        dueDate: undefined,
        notes: undefined
      });
    });
    expect(await screen.findByText("Item de acompanhamento criado.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Status Revisar pacote mensal de risco"), {
      target: { value: "closed" }
    });
    await waitFor(() => {
      expect(workbenchApiMocks.updateReviewItem).toHaveBeenCalledWith("rev_main_report", {
        status: "closed"
      });
    });
  });

  it("blocks client office users from opening the staff workbench route", async () => {
    window.sessionStorage.clear();
    clearSession();
    saveSession({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      actor: clientActor
    });
    authApiMocks.getCurrentUser.mockResolvedValue({ actor: clientActor, user: clientUser });

    render(
      <AuthProvider>
        <WorkbenchPage />
      </AuthProvider>
    );

    expect(
      await screen.findByText(
        "Esta área é restrita à equipe. Os pacotes disponíveis para cliente ficam no portal."
      )
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Abrir portal do cliente" })).toHaveAttribute(
      "href",
      "/dashboard/client-portal"
    );
    expect(screen.queryByText("Revisar pacote mensal de risco")).not.toBeInTheDocument();
    expect(workbenchApiMocks.getWorkbench).not.toHaveBeenCalled();
    expect(workbenchApiMocks.getAdvisorCharts).not.toHaveBeenCalled();
    expect(workbenchApiMocks.listReviewItems).not.toHaveBeenCalled();
    expect(workbenchApiMocks.createReviewItem).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Criar item" })).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Status Revisar pacote mensal de risco")
    ).not.toBeInTheDocument();
    expect(workbenchApiMocks.updateReviewItem).not.toHaveBeenCalled();
  });
});
