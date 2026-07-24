import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AnalyticsDiagnosticsPage from "../../src/app/(dashboard)/dashboard/analytics-diagnostics/page";
import { AuthProvider } from "../../src/features/auth/AuthProvider";
import { clearSession, saveSession } from "../../src/features/auth/sessionStore";
import { Actor, SafeUser } from "../../src/features/auth/types";

const authApiMocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  loginWithGoogle: vi.fn(),
  loginWithPassword: vi.fn(),
  logout: vi.fn()
}));

const diagnosticsApiMocks = vi.hoisted(() => ({
  createAnalystChartJob: vi.fn(),
  getAnalystChartJob: vi.fn(),
  getAnalystCharts: vi.fn()
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
vi.mock("../../src/features/analytics-diagnostics/analyticsDiagnosticsApi", () => diagnosticsApiMocks);

const actor: Actor = {
  id: "usr_analyst",
  email: "analyst@risk.local",
  name: "Analyst User",
  role: "analyst",
  officeMemberships: [
    {
      officeId: "ofc_main",
      officeName: "Orion Advisory",
      role: "analyst"
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

const diagnosticsEnvelope = {
  data: {
    officeId: "ofc_main",
    range: "1y",
    filters: {
      portfolioIds: [],
      metrics: ["volatility", "beta", "sharpeRatio"],
      benchmarkSymbol: "SPY"
    },
    charts: {
      riskReturnScatter: [
        {
          portfolioId: "prt_main",
          portfolioName: "Core Growth",
          accountId: "acct_main",
          accountName: "Main Account",
          clientId: "client_main",
          clientName: "Marina Silva",
          valueUsd: 245800,
          annualizedReturnPercent: 8.4,
          volatilityPercent: 12.8,
          maxDrawdownPercent: 8.7,
          beta: 1.1,
          sharpeRatio: 0.9,
          concentrationHhi: 0.22,
          dataQualityStatus: "partial"
        }
      ],
      metricDistributions: [
        {
          metricKey: "volatility",
          unit: "percent",
          buckets: [{ label: "10-15", min: 10, max: 15, count: 1, portfolioIds: ["prt_main"] }]
        },
        {
          metricKey: "beta",
          unit: "ratio",
          buckets: [{ label: "1-1.2", min: 1, max: 1.2, count: 1, portfolioIds: ["prt_main"] }]
        }
      ],
      rollingVolatility: [
        {
          portfolioId: "prt_main",
          portfolioName: "Core Growth",
          accountId: "acct_main",
          accountName: "Main Account",
          date: "2026-07-15",
          value: 12.8,
          sampleSize: 3
        }
      ],
      rollingCorrelation: [
        {
          portfolioId: "prt_main",
          portfolioName: "Core Growth",
          accountId: "acct_main",
          accountName: "Main Account",
          date: "2026-07-15",
          leftSymbol: "MSFT",
          rightSymbol: "NVDA",
          correlation: 0.42
        }
      ],
      sectorExposureHeatmap: [
        {
          portfolioId: "prt_main",
          portfolioName: "Core Growth",
          accountId: "acct_main",
          accountName: "Main Account",
          label: "Technology",
          weightPercent: 58,
          marketValueUsd: 142564
        }
      ],
      assetExposureHeatmap: [
        {
          portfolioId: "prt_main",
          portfolioName: "Core Growth",
          accountId: "acct_main",
          accountName: "Main Account",
          label: "MSFT",
          weightPercent: 22,
          marketValueUsd: 54000
        }
      ],
      benchmarkSensitivity: [
        {
          portfolioId: "prt_main",
          portfolioName: "Core Growth",
          accountId: "acct_main",
          accountName: "Main Account",
          benchmarkSymbol: "SPY",
          portfolioReturnPercent: 8.4,
          benchmarkReturnPercent: 5.2,
          beta: 1.1,
          sensitivity: 1.62
        }
      ],
      riskContribution: [
        {
          portfolioId: "prt_main",
          portfolioName: "Core Growth",
          accountId: "acct_main",
          accountName: "Main Account",
          label: "MSFT",
          weightPercent: 22,
          riskContributionPercent: 2.82
        }
      ],
      concentrationRanking: [
        {
          portfolioId: "prt_main",
          portfolioName: "Core Growth",
          accountId: "acct_main",
          accountName: "Main Account",
          rank: 1,
          concentrationHhi: 0.22,
          topHoldingLabel: "MSFT",
          topHoldingWeightPercent: 22
        }
      ],
      dataQualityTimeline: [
        {
          portfolioId: "prt_main",
          portfolioName: "Core Growth",
          accountId: "acct_main",
          accountName: "Main Account",
          date: "2026-07-15",
          status: "partial",
          issueCode: "analytics.history_unavailable",
          severity: "warning",
          message: "Histórico insuficiente"
        }
      ],
      providerFreshnessMatrix: [
        {
          portfolioId: "prt_main",
          portfolioName: "Core Growth",
          accountId: "acct_main",
          accountName: "Main Account",
          symbol: "MSFT",
          providerName: "diagnostics-fixture",
          freshness: "fresh",
          asOf: "2026-07-15T12:00:00.000Z"
        }
      ]
    },
    dataQuality: {
      status: "partial",
      issues: [
        {
          code: "analytics.history_unavailable",
          severity: "warning",
          message: "Histórico insuficiente",
          metricKeys: ["volatility"]
        }
      ],
      unavailableChartKeys: ["rollingCorrelation"],
      sourceCounts: {
        portfolios: 1,
        snapshots: 1,
        analyticsJobs: 1,
        assets: 2
      }
    }
  },
  meta: {
    generatedAt: "2026-07-24T12:00:00.000Z",
    sourceSnapshotIds: ["snap_1"],
    inputHashes: ["hash_1"],
    calculationDurationMs: 8
  }
};

const pendingJob = {
  data: {
    id: "job_1",
    officeId: "ofc_main",
    requestedBy: "usr_analyst",
    idempotencyKey: "diagnostico-analista-001",
    filters: { range: "1y" },
    inputHash: "hash_job",
    correlationId: "corr_1",
    status: "pending",
    progressPercent: 0,
    sourceSnapshotIds: [],
    resultMetadata: {
      portfolioCount: 1,
      chartKeys: ["riskReturnScatter", "metricDistributions"]
    },
    createdAt: "2026-07-24T12:00:00.000Z",
    updatedAt: "2026-07-24T12:00:00.000Z",
    expiresAt: "2026-07-31T12:00:00.000Z"
  },
  meta: {
    correlationId: "corr_1",
    inputHash: "hash_job"
  }
};

const succeededJob = {
  ...pendingJob,
  data: {
    ...pendingJob.data,
    status: "succeeded",
    progressPercent: 100,
    resultMetadata: {
      ...pendingJob.data.resultMetadata,
      lastSuccessfulResultAt: "2026-07-24T12:05:00.000Z"
    }
  }
};

describe("analytics diagnostics page", () => {
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
    diagnosticsApiMocks.getAnalystCharts.mockResolvedValue(diagnosticsEnvelope);
    diagnosticsApiMocks.createAnalystChartJob.mockResolvedValue(pendingJob);
    diagnosticsApiMocks.getAnalystChartJob.mockResolvedValue(succeededJob);
  });

  afterEach(() => {
    cleanup();
    clearSession();
  });

  it("renders diagnostic filters, chart sections and async job states", async () => {
    render(
      <AuthProvider>
        <AnalyticsDiagnosticsPage />
      </AuthProvider>
    );

    expect(await screen.findByText("Workbench de diagnósticos")).toBeInTheDocument();
    expect(screen.getByText("Dispersão por portfólio")).toBeInTheDocument();
    expect(screen.getAllByText("Core Growth").length).toBeGreaterThan(0);
    expect(screen.getByText("Ranking de portfólios")).toBeInTheDocument();
    expect(screen.getByText("Linha do tempo e provedores")).toBeInTheDocument();
    expect(diagnosticsApiMocks.getAnalystCharts).toHaveBeenCalledWith("ofc_main", {
      accountId: "",
      advisorUserId: "",
      benchmarkSymbol: "SPY",
      clientId: "",
      dataQuality: "",
      householdId: "",
      metrics: [
        "volatility",
        "beta",
        "sharpeRatio",
        "maxDrawdown",
        "concentrationHhi",
        "assetCorrelation"
      ],
      portfolioIds: "",
      range: "1y",
      teamId: ""
    });

    fireEvent.change(screen.getByLabelText("Portfólios"), {
      target: { value: "prt_main" }
    });
    fireEvent.change(screen.getByLabelText("Período"), {
      target: { value: "5y" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    await waitFor(() => {
      expect(diagnosticsApiMocks.getAnalystCharts).toHaveBeenLastCalledWith(
        "ofc_main",
        expect.objectContaining({
          portfolioIds: "prt_main",
          range: "5y"
        })
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Solicitar job" }));
    await waitFor(() => {
      expect(diagnosticsApiMocks.createAnalystChartJob).toHaveBeenCalledWith(
        "ofc_main",
        expect.objectContaining({
          portfolioIds: "prt_main",
          range: "5y"
        }),
        "diagnostico-analista-001"
      );
    });
    expect(await screen.findByText("pendente")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Atualizar" }));
    await waitFor(() => {
      expect(diagnosticsApiMocks.getAnalystChartJob).toHaveBeenCalledWith("ofc_main", "job_1");
    });
    expect(await screen.findByText("concluído")).toBeInTheDocument();
    expect(screen.getByText(/Último resultado bem-sucedido/)).toBeInTheDocument();
  });
});
