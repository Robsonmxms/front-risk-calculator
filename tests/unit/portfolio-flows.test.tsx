import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DashboardPage from "../../src/app/(dashboard)/dashboard/page";
import PortfolioDetailPage from "../../src/app/(dashboard)/dashboard/portfolios/[portfolioId]/page";
import { AuthProvider } from "../../src/features/auth/AuthProvider";
import { Actor, SafeUser } from "../../src/features/auth/types";
import { clearSession, saveSession } from "../../src/features/auth/sessionStore";
import {
  AnalyticsMetric,
  AnalyticsMetricKey,
  AnalyticsMetricSet,
  MarketAsset,
  MarketExchange,
  PortfolioAnalyticsReadModel,
  PortfolioAnalyticsSnapshot,
  PortfolioDetail,
  PortfolioListItem,
  PortfolioPosition,
  PortfolioSnapshot,
  PortfolioTransaction,
  TradePriceQuote
} from "../../src/features/portfolio/types";

const navigationMocks = vi.hoisted(() => ({
  portfolioId: "prt_main",
  replace: vi.fn()
}));

const authApiMocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  loginWithGoogle: vi.fn(),
  loginWithPassword: vi.fn(),
  logout: vi.fn()
}));

const portfolioApiMocks = vi.hoisted(() => ({
  convertCurrency: vi.fn(),
  createPortfolio: vi.fn(),
  createPortfolioAlert: vi.fn(),
  createPortfolioTransaction: vi.fn(),
  downloadPortfolioReport: vi.fn(),
  getPortfolio: vi.fn(),
  getPortfolioAnalytics: vi.fn(),
  getTradePrice: vi.fn(),
  listMarketExchanges: vi.fn(),
  listNotifications: vi.fn(),
  listPortfolioAlerts: vi.fn(),
  listPortfolioPositions: vi.fn(),
  listPortfolioReports: vi.fn(),
  listPortfolioSnapshots: vi.fn(),
  listPortfolioTransactions: vi.fn(),
  listPortfolios: vi.fn(),
  markNotificationRead: vi.fn(),
  requestPortfolioAnalyticsRecompute: vi.fn(),
  requestPortfolioReport: vi.fn(),
  searchMarketAssets: vi.fn()
}));

const realtimeMocks = vi.hoisted(() => ({
  close: vi.fn(),
  connectRealtime: vi.fn()
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ portfolioId: navigationMocks.portfolioId }),
  useRouter: () => ({ replace: navigationMocks.replace })
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

vi.mock("../../src/features/auth/authApi", () => authApiMocks);
vi.mock("../../src/features/portfolio/portfolioApi", () => portfolioApiMocks);
vi.mock("../../src/lib/realtime/client", () => ({
  connectRealtime: realtimeMocks.connectRealtime
}));

const actor: Actor = {
  id: "usr_user",
  email: "investidor@example.com",
  name: "Investidor Principal",
  role: "user",
  officeMemberships: [
    {
      officeId: "ofc_main",
      officeName: "Orion Advisory",
      role: "office_admin"
    }
  ],
  accountMemberships: [
    {
      accountId: "acc_main",
      accountName: "Conta Principal",
      role: "owner"
    }
  ]
};

const safeUser: SafeUser = {
  id: actor.id,
  email: actor.email,
  name: actor.name,
  role: actor.role,
  status: "active"
};

const exchanges: MarketExchange[] = [
  {
    code: "NASDAQ",
    name: "Nasdaq",
    country: "United States",
    currency: "USD",
    yahooSuffix: "",
    aliases: ["NASDAQ"]
  },
  {
    code: "B3",
    name: "B3",
    country: "Brazil",
    currency: "BRL",
    yahooSuffix: ".SA",
    aliases: ["B3"]
  }
];

const marketAsset: MarketAsset = {
  id: "asset-msft",
  symbol: "MSFT",
  providerSymbol: "MSFT",
  name: "Microsoft Corporation",
  exchange: "NASDAQ",
  currency: "USD",
  assetType: "stock",
  region: "US",
  sector: "Technology",
  providerName: "yahoo",
  isActive: true,
  updatedAt: "2026-07-16T10:00:00.000Z",
  latestQuote: {
    assetId: "asset-msft",
    symbol: "MSFT",
    providerName: "yahoo",
    currency: "USD",
    price: 420.44,
    asOf: "2026-07-16T10:00:00.000Z",
    freshness: "fresh",
    updatedAt: "2026-07-16T10:00:00.000Z"
  }
};

const tradePrice: TradePriceQuote = {
  assetId: "asset-msft",
  symbol: "MSFT",
  tradeDate: "2026-07-15",
  quantity: 3,
  unitPrice: 420.44,
  totalAmount: 1261.32,
  currency: "USD",
  providerName: "yahoo",
  priceSource: "historical_close",
  asOf: "2026-07-15T21:00:00.000Z"
};

const currentPosition: PortfolioPosition = {
  portfolioId: "prt_main",
  assetSymbol: "MSFT",
  assetName: "Microsoft Corporation",
  quantity: 3,
  averageCost: 420.44,
  totalCostBasis: 1261.32,
  currency: "USD",
  lastTransactionDate: "2026-07-15"
};

const recordedTransaction: PortfolioTransaction = {
  id: "txn_msft",
  portfolioId: "prt_main",
  assetSymbol: "MSFT",
  assetName: "Microsoft Corporation",
  tradeDate: "2026-07-15",
  type: "buy",
  quantity: 3,
  unitPrice: 420.44,
  totalAmount: 1261.32,
  currency: "USD",
  notes: "Entrada inicial",
  createdAt: "2026-07-16T10:05:00.000Z"
};

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  Object.values(authApiMocks).forEach((mock) => mock.mockReset());
  Object.values(portfolioApiMocks).forEach((mock) => mock.mockReset());
  window.sessionStorage.clear();
  window.localStorage.clear();
  clearSession();

  navigationMocks.portfolioId = "prt_main";
  authApiMocks.getCurrentUser.mockResolvedValue({ actor, user: safeUser });
  authApiMocks.logout.mockResolvedValue(undefined);
  realtimeMocks.connectRealtime.mockImplementation(({ onStatus }) => {
    onStatus("connected");
    return { close: realtimeMocks.close };
  });

  saveSession({
    accessToken: "access-token",
    refreshToken: "refresh-token",
    actor
  });
});

afterEach(() => {
  cleanup();
  clearSession();
});

describe("dashboard portfolio creation flow", () => {
  it("creates a visible portfolio using the authenticated account membership", async () => {
    const createdPortfolio = makePortfolioListItem({
      id: "prt_dividendos",
      name: "Dividendos Brasil",
      description: "Mandato de dividendos",
      baseCurrency: "BRL"
    });

    portfolioApiMocks.listPortfolios.mockResolvedValue({ portfolios: [] });
    portfolioApiMocks.createPortfolio.mockResolvedValue(createdPortfolio);
    portfolioApiMocks.convertCurrency.mockResolvedValue({
      data: {
        conversion: {
          from: "USD",
          to: "BRL",
          rate: 5.2,
          providerName: "yahoo",
          asOf: "2026-07-16T10:00:00.000Z",
          updatedAt: "2026-07-16T10:00:00.000Z",
          amount: 1,
          convertedAmount: 5.2
        }
      },
      meta: { providerName: "yahoo", asOf: "2026-07-16T10:00:00.000Z" }
    });

    renderWithAuth(<DashboardPage />);

    expect(await screen.findByRole("heading", { name: "Investidor Principal" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Dividendos Brasil" }
    });
    fireEvent.change(screen.getByLabelText("Descrição"), {
      target: { value: "Mandato de dividendos" }
    });
    fireEvent.change(screen.getByLabelText("Moeda base"), {
      target: { value: "BRL" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Criar portfolio" }));

    await waitFor(() => {
      expect(portfolioApiMocks.createPortfolio).toHaveBeenCalledWith({
        accountId: "acc_main",
        name: "Dividendos Brasil",
        description: "Mandato de dividendos",
        baseCurrency: "BRL"
      });
    });
    expect(await screen.findByRole("heading", { name: "Dividendos Brasil" })).toBeInTheDocument();
    expect(screen.getByText("Conta Principal · papel owner")).toBeInTheDocument();
  });

  it("blocks invalid FX converter amounts before calling the backend", async () => {
    portfolioApiMocks.listPortfolios.mockResolvedValue({ portfolios: [] });

    renderWithAuth(<DashboardPage />);

    expect(
      await screen.findByRole("heading", { name: "Investidor Principal" })
    ).toBeInTheDocument();

    portfolioApiMocks.convertCurrency.mockClear();
    fireEvent.change(screen.getByLabelText("USD"), {
      target: { value: "-1" }
    });

    expect(
      await screen.findByText("Informe um valor positivo para converter.")
    ).toBeInTheDocument();
    await new Promise((resolve) => window.setTimeout(resolve, 300));
    expect(portfolioApiMocks.convertCurrency).not.toHaveBeenCalled();
  });
});

describe("portfolio detail ledger and market-data flow", () => {
  it("searches a backend market asset, uses backend trade price, records a transaction, and reloads ledger data", async () => {
    let transactionRecorded = false;

    mockPortfolioDetailApi({
      getPortfolio: () =>
        makePortfolioDetail({
          holdingsCount: transactionRecorded ? 1 : 0,
          transactionCount: transactionRecorded ? 1 : 0,
          totalCostBasis: transactionRecorded ? 1261.32 : 0,
          analyticsState: transactionRecorded ? "pending" : "ready",
          marketDataState: transactionRecorded ? "pending" : "ready"
        }),
      listPositions: (_portfolioId, asOf) => ({
        positions: asOf || transactionRecorded ? [currentPosition] : []
      }),
      listTransactions: () => ({
        transactions: transactionRecorded ? [recordedTransaction] : []
      }),
      listSnapshots: () => ({
        snapshots: transactionRecorded
          ? [
              makeSnapshot({
                positions: [currentPosition],
                transactionCount: 1,
                totalCostBasis: 1261.32
              })
            ]
          : []
      })
    });
    portfolioApiMocks.createPortfolioTransaction.mockImplementation(async () => {
      transactionRecorded = true;
      return recordedTransaction;
    });

    renderWithAuth(<PortfolioDetailPage />);

    expect(await screen.findByRole("heading", { name: "Carteira principal" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Data base"), {
      target: { value: "2026-07-01" }
    });
    await waitFor(() => {
      expect(portfolioApiMocks.listPortfolioPositions).toHaveBeenCalledWith(
        "prt_main",
        "2026-07-01"
      );
    });

    fireEvent.change(screen.getByLabelText("Código ou ativo"), {
      target: { value: "MS" }
    });
    await waitFor(() => {
      expect(portfolioApiMocks.searchMarketAssets).toHaveBeenCalledWith("MS", "NASDAQ");
    });

    fireEvent.click(await screen.findByRole("button", { name: /MSFT/i }));
    fireEvent.change(screen.getByLabelText("Data"), {
      target: { value: "2026-07-15" }
    });
    fireEvent.change(screen.getByLabelText("Quantidade"), {
      target: { value: "3" }
    });

    await waitFor(() => {
      expect(portfolioApiMocks.getTradePrice).toHaveBeenCalledWith("asset-msft", {
        tradeDate: "2026-07-15",
        quantity: 3
      });
    });
    expect(await screen.findByText(/Total calculado/i)).toHaveTextContent("fechamento histórico");

    fireEvent.change(screen.getByLabelText("Notas"), {
      target: { value: "Entrada inicial" }
    });
    const submitButton = screen.getByRole("button", { name: "Registrar transação" });
    fireEvent.submit(submitButton.closest("form") as HTMLFormElement);

    await waitFor(() => {
      expect(portfolioApiMocks.createPortfolioTransaction).toHaveBeenCalledWith("prt_main", {
        assetSymbol: "MSFT",
        assetName: "Microsoft Corporation",
        tradeDate: "2026-07-15",
        type: "buy",
        quantity: 3,
        unitPrice: 420.44,
        currency: "USD",
        notes: "Entrada inicial"
      });
    });
    expect(await screen.findByText(/Transacao registrada/i)).toBeInTheDocument();
    expect(screen.getByText("buy MSFT")).toBeInTheDocument();
    expect(screen.getByText("Microsoft Corporation · 2026-07-15")).toBeInTheDocument();
  });

  it("blocks transaction submission until a backend-returned asset is selected", async () => {
    mockPortfolioDetailApi();

    renderWithAuth(<PortfolioDetailPage />);

    expect(await screen.findByRole("heading", { name: "Carteira principal" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Código ou ativo"), {
      target: { value: "MSFT" }
    });
    fireEvent.change(screen.getByLabelText("Quantidade"), {
      target: { value: "3" }
    });
    const submitButton = screen.getByRole("button", { name: "Registrar transação" });
    fireEvent.submit(submitButton.closest("form") as HTMLFormElement);

    expect(
      await screen.findAllByText("Selecione um ativo retornado pelo Yahoo antes de registrar.")
    ).toHaveLength(2);
    expect(portfolioApiMocks.createPortfolioTransaction).not.toHaveBeenCalled();
  });
});

describe("portfolio analytics states", () => {
  it("renders a ready analytics snapshot with available metric cards", async () => {
    mockPortfolioDetailApi({
      analytics: makeAnalyticsReadModel("complete", makeAnalyticsSnapshot())
    });

    renderWithAuth(<PortfolioDetailPage />);

    expect(await screen.findByText("complete")).toBeInTheDocument();
    expect(screen.getByText("Retorno total")).toBeInTheDocument();
    expect(screen.getByText("12.00%")).toBeInTheDocument();
    expect(screen.getByText("Concentração elevada")).toBeInTheDocument();
  });

  it("renders a pending analytics state without a calculated snapshot", async () => {
    mockPortfolioDetailApi({
      analytics: makeAnalyticsReadModel("pending", null)
    });

    renderWithAuth(<PortfolioDetailPage />);

    expect(await screen.findByText("pending")).toBeInTheDocument();
    expect(screen.getByText("Analytics ainda não possui snapshot calculado.")).toBeInTheDocument();
  });

  it("renders partial analytics with unavailable metrics and stale data-quality issues", async () => {
    const snapshot = makeAnalyticsSnapshot({
      status: "partial",
      metrics: makeMetrics({
        beta: makeMetric("beta", "Beta", "ratio", {
          status: "unavailable",
          reason: "Histórico insuficiente para benchmark SPY."
        })
      }),
      dataQuality: {
        issues: [
          {
            code: "market_data.stale",
            severity: "warning",
            message: "Cotação stale para MSFT.",
            symbols: ["MSFT"],
            metricKeys: ["beta"]
          }
        ],
        unavailableMetricCount: 1,
        staleInputCount: 1,
        conversionRates: []
      }
    });

    mockPortfolioDetailApi({
      analytics: makeAnalyticsReadModel("partial", snapshot)
    });

    renderWithAuth(<PortfolioDetailPage />);

    expect(await screen.findByText("partial")).toBeInTheDocument();
    expect(screen.getByText("Snapshot parcial com 1 métricas indisponíveis.")).toBeInTheDocument();
    expect(screen.getByText("Indisponível")).toBeInTheDocument();
    expect(screen.getByText("market_data.stale")).toBeInTheDocument();
    expect(screen.getByText("Cotação stale para MSFT.")).toBeInTheDocument();
  });

  it("renders failed analytics while keeping the last successful snapshot visible", async () => {
    mockPortfolioDetailApi({
      analytics: {
        ...makeAnalyticsReadModel("failed", null),
        lastSuccessfulSnapshot: makeAnalyticsSnapshot(),
        failedJob: {
          id: "job_failed",
          status: "failed",
          errorCode: "analytics.calculation_failed"
        }
      }
    });

    renderWithAuth(<PortfolioDetailPage />);

    expect(await screen.findByText("failed")).toBeInTheDocument();
    expect(
      screen.getByText("O último snapshot bem-sucedido continua visível após a falha mais recente.")
    ).toBeInTheDocument();
    expect(screen.getByText("Retorno total")).toBeInTheDocument();
  });
});

function renderWithAuth(children: React.ReactNode) {
  return render(<AuthProvider>{children}</AuthProvider>);
}

function mockPortfolioDetailApi({
  analytics = makeAnalyticsReadModel("complete", makeAnalyticsSnapshot()),
  getPortfolio = () => makePortfolioDetail(),
  listPositions = () => ({ positions: [currentPosition] }),
  listTransactions = () => ({ transactions: [] }),
  listSnapshots = () => ({ snapshots: [makeSnapshot()] })
}: {
  analytics?: PortfolioAnalyticsReadModel;
  getPortfolio?: () => PortfolioDetail;
  listPositions?: (
    portfolioId: string,
    asOf?: string
  ) => Promise<{ positions: PortfolioPosition[] }> | { positions: PortfolioPosition[] };
  listTransactions?: () => { transactions: PortfolioTransaction[] };
  listSnapshots?: () => { snapshots: PortfolioSnapshot[] };
} = {}) {
  portfolioApiMocks.listMarketExchanges.mockResolvedValue({ exchanges });
  portfolioApiMocks.getPortfolio.mockImplementation(async () => getPortfolio());
  portfolioApiMocks.listPortfolioPositions.mockImplementation((portfolioId, asOf) =>
    Promise.resolve(listPositions(portfolioId, asOf))
  );
  portfolioApiMocks.listPortfolioTransactions.mockImplementation(async () => listTransactions());
  portfolioApiMocks.listPortfolioSnapshots.mockImplementation(async () => listSnapshots());
  portfolioApiMocks.getPortfolioAnalytics.mockResolvedValue({
    data: analytics,
    meta: { status: analytics.status, baseCurrency: "USD" }
  });
  portfolioApiMocks.listPortfolioReports.mockResolvedValue({ reports: [] });
  portfolioApiMocks.listPortfolioAlerts.mockResolvedValue({ alerts: [] });
  portfolioApiMocks.listNotifications.mockResolvedValue({ notifications: [] });
  portfolioApiMocks.searchMarketAssets.mockResolvedValue({
    data: { assets: [marketAsset] },
    meta: { count: 1, providerStatus: "available", exchange: "NASDAQ" }
  });
  portfolioApiMocks.getTradePrice.mockResolvedValue({
    data: { tradePrice },
    meta: {
      providerName: "yahoo",
      priceSource: tradePrice.priceSource,
      asOf: tradePrice.asOf
    }
  });
  portfolioApiMocks.requestPortfolioAnalyticsRecompute.mockResolvedValue({
    jobId: "job_analytics",
    status: "queued",
    portfolioId: "prt_main"
  });
  portfolioApiMocks.requestPortfolioReport.mockResolvedValue({
    data: {
      id: "rpt_pdf",
      portfolioId: "prt_main",
      requestedBy: actor.id,
      format: "pdf",
      status: "pending",
      createdAt: "2026-07-16T10:00:00.000Z",
      updatedAt: "2026-07-16T10:00:00.000Z"
    },
    meta: { status: "pending" }
  });
  portfolioApiMocks.createPortfolioAlert.mockResolvedValue({
    id: "alt_1",
    portfolioId: "prt_main",
    createdBy: actor.id,
    title: "Analytics atualizou métricas monitoradas",
    severity: "medium",
    status: "monitoring",
    condition: { eventType: "analytics.updated" },
    createdAt: "2026-07-16T10:00:00.000Z",
    updatedAt: "2026-07-16T10:00:00.000Z"
  });
  portfolioApiMocks.markNotificationRead.mockResolvedValue(undefined);
}

function makePortfolioListItem(
  overrides: Partial<PortfolioListItem> = {}
): PortfolioListItem {
  return {
    id: "prt_main",
    accountId: "acc_main",
    accountName: "Conta Principal",
    name: "Carteira principal",
    description: "Carteira de acompanhamento",
    baseCurrency: "USD",
    membershipRole: "owner",
    holdingsCount: 1,
    transactionCount: 1,
    totalCostBasis: 1261.32,
    freshness: "fresh",
    status: "ready",
    analyticsState: "ready",
    marketDataState: "ready",
    lastTransactionDate: "2026-07-15",
    ...overrides
  };
}

function makePortfolioDetail(overrides: Partial<PortfolioDetail> = {}): PortfolioDetail {
  return {
    ...makePortfolioListItem(),
    createdAt: "2026-07-16T09:00:00.000Z",
    updatedAt: "2026-07-16T10:00:00.000Z",
    warnings: [],
    ...overrides
  };
}

function makeSnapshot(overrides: Partial<PortfolioSnapshot> = {}): PortfolioSnapshot {
  return {
    id: "snp_main",
    portfolioId: "prt_main",
    asOfDate: "2026-07-15",
    createdAt: "2026-07-16T10:00:00.000Z",
    positions: [currentPosition],
    transactionCount: 1,
    totalCostBasis: 1261.32,
    ...overrides
  };
}

function makeAnalyticsReadModel(
  status: PortfolioAnalyticsReadModel["status"],
  snapshot: PortfolioAnalyticsSnapshot | null
): PortfolioAnalyticsReadModel {
  return {
    portfolioId: "prt_main",
    status,
    baseCurrency: "USD",
    snapshot,
    lastSuccessfulSnapshot: status === "failed" ? snapshot : null
  };
}

function makeAnalyticsSnapshot(
  overrides: Partial<PortfolioAnalyticsSnapshot> = {}
): PortfolioAnalyticsSnapshot {
  return {
    id: "ans_main",
    portfolioId: "prt_main",
    asOfDate: "2026-07-15",
    generatedAt: "2026-07-16T10:00:00.000Z",
    baseCurrency: "USD",
    status: "complete",
    metrics: makeMetrics(),
    positions: [
      {
        portfolioId: "prt_main",
        assetSymbol: "MSFT",
        assetName: "Microsoft Corporation",
        quantity: 3,
        currency: "USD",
        exchange: "NASDAQ",
        sector: "Technology",
        latestPrice: 430,
        latestPriceCurrency: "USD",
        marketValueUsd: 1290,
        costBasisUsd: 1261.32,
        weightPercent: 100,
        dataQuality: []
      }
    ],
    allocation: [
      {
        symbol: "MSFT",
        name: "Microsoft Corporation",
        weightPercent: 100,
        marketValueUsd: 1290
      }
    ],
    sectorExposure: [
      {
        sector: "Technology",
        weightPercent: 100,
        marketValueUsd: 1290
      }
    ],
    performance: [
      { date: "2026-07-14", value: 1250 },
      { date: "2026-07-15", value: 1290 }
    ],
    drawdown: [{ date: "2026-07-15", drawdownPercent: -1.5 }],
    correlation: [
      {
        leftSymbol: "MSFT",
        rightSymbol: "SPY",
        correlation: 0.72
      }
    ],
    insights: [
      {
        id: "ins_concentration",
        severity: "watch",
        title: "Concentração elevada",
        explanation: "A carteira está concentrada em um único ativo.",
        metricKeys: ["concentrationHhi"],
        symbols: ["MSFT"]
      }
    ],
    dataQuality: {
      issues: [],
      unavailableMetricCount: 0,
      staleInputCount: 0,
      conversionRates: []
    },
    inputHash: "hash-main",
    calculationDurationMs: 42,
    ...overrides
  };
}

function makeMetrics(overrides: Partial<AnalyticsMetricSet> = {}): AnalyticsMetricSet {
  return {
    totalReturn: makeMetric("totalReturn", "Retorno total", "percent", { value: 0.12 }),
    annualizedReturn: makeMetric("annualizedReturn", "Retorno anualizado", "percent", {
      value: 0.18
    }),
    maxDrawdown: makeMetric("maxDrawdown", "Drawdown máximo", "percent", { value: -0.05 }),
    volatility: makeMetric("volatility", "Volatilidade", "percent", { value: 0.22 }),
    beta: makeMetric("beta", "Beta", "ratio", { value: 1.08 }),
    sharpeRatio: makeMetric("sharpeRatio", "Sharpe", "ratio", { value: 0.84 }),
    concentrationHhi: makeMetric("concentrationHhi", "HHI", "score", { value: 1 }),
    sectorExposure: makeMetric("sectorExposure", "Exposição setorial", "percent", {
      value: 1
    }),
    assetCorrelation: makeMetric("assetCorrelation", "Correlação", "ratio", { value: 0.72 }),
    ...overrides
  };
}

function makeMetric(
  key: AnalyticsMetricKey,
  label: string,
  unit: AnalyticsMetric["unit"],
  overrides: Partial<AnalyticsMetric> = {}
): AnalyticsMetric {
  return {
    key,
    label,
    unit,
    status: "available",
    value: 0,
    assumptions: ["SPY como benchmark", "252 períodos por ano", "Taxa livre de risco 0"],
    requiredData: ["positions", "market_data"],
    ...overrides
  };
}
