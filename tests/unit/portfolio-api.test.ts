import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  convertCurrency,
  createPortfolio,
  createPortfolioImport,
  createPortfolioAlert,
  createPortfolioTransaction,
  downloadPortfolioReport,
  getPortfolio,
  getPortfolioAnalytics,
  getPortfolioCharts,
  getTradePrice,
  listPortfolioAlerts,
  listPortfolioImports,
  listNotifications,
  listPortfolioReports,
  listMarketExchanges,
  listPortfolioPositions,
  listPortfolios,
  listPortfolioSnapshots,
  listPortfolioTransactions,
  markNotificationRead,
  requestPortfolioAnalyticsRecompute,
  requestPortfolioReport,
  searchMarketAssets,
  updatePortfolio,
  updatePortfolioAlert
} from "../../src/features/portfolio/portfolioApi";
import { ApiError } from "../../src/lib/api/client";
import { clearSession } from "../../src/features/auth/sessionStore";

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body
  } as Response;
}

describe("portfolio api market data client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.sessionStorage.clear();
    window.localStorage.clear();
    clearSession();
  });

  it("searches assets through the backend market-data endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse(200, {
        data: {
          assets: [
            {
              id: "asset-msft",
              symbol: "MSFT",
              providerSymbol: "MSFT",
              name: "Microsoft Corporation",
              currency: "USD",
              assetType: "stock",
              providerName: "brapi",
              isActive: true,
              updatedAt: "2026-07-15T12:00:00.000Z",
              latestQuote: {
                assetId: "asset-msft",
                symbol: "MSFT",
                providerName: "brapi",
                currency: "USD",
                price: 420.44,
                asOf: "2026-07-15T12:00:00.000Z",
                freshness: "fresh",
                updatedAt: "2026-07-15T12:00:00.000Z"
              }
            }
          ]
        },
        meta: {
          count: 1,
          providerStatus: "available"
        }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(searchMarketAssets("MSFT", "NASDAQ")).resolves.toMatchObject({
      data: {
        assets: [
          expect.objectContaining({
            id: "asset-msft",
            symbol: "MSFT",
            latestQuote: expect.objectContaining({
              price: 420.44,
              currency: "USD"
            })
          })
        ]
      },
      meta: {
        providerStatus: "available"
      }
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:8000/api/v1/market-data/assets/search?q=MSFT&exchange=NASDAQ"
    );
  });

  it("lists exchanges from the backend", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse(200, {
        data: {
          exchanges: [
            {
              code: "B3",
              name: "B3 - Brasil Bolsa Balcao",
              country: "Brazil",
              currency: "BRL",
              yahooSuffix: ".SA",
              aliases: ["B3", "SAO"]
            }
          ]
        },
        meta: { count: 1 }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(listMarketExchanges()).resolves.toEqual({
      exchanges: [
        expect.objectContaining({
          code: "B3",
          currency: "BRL"
        })
      ]
    });
    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:8000/api/v1/market-data/exchanges");
  });

  it("requests a provider-calculated trade price", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse(200, {
        data: {
          tradePrice: {
            assetId: "asset-msft",
            symbol: "MSFT",
            tradeDate: "2026-07-15",
            quantity: 3,
            unitPrice: 420.44,
            totalAmount: 1261.32,
            currency: "USD",
            providerName: "brapi",
            priceSource: "latest_quote",
            asOf: "2026-07-15T12:00:00.000Z"
          }
        },
        meta: {
          providerName: "brapi",
          priceSource: "latest_quote",
          asOf: "2026-07-15T12:00:00.000Z"
        }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      getTradePrice("asset-msft", { tradeDate: "2026-07-15", quantity: 3 })
    ).resolves.toMatchObject({
      data: {
        tradePrice: {
          unitPrice: 420.44,
          totalAmount: 1261.32,
          currency: "USD"
        }
      },
      meta: {
        priceSource: "latest_quote"
      }
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:8000/api/v1/market-data/assets/asset-msft/trade-price?tradeDate=2026-07-15&quantity=3"
    );
  });

  it("covers portfolio CRUD and ledger endpoints through backend-owned routes", async () => {
    const portfolio = {
      id: "prt_main",
      officeId: "ofc_main",
      accountId: "acct_main",
      accountName: "Carteira Principal",
      name: "Carteira Principal",
      baseCurrency: "USD",
      membershipRole: "owner",
      holdingsCount: 1,
      transactionCount: 1,
      totalCostBasis: 1200,
      freshness: "fresh",
      status: "ready",
      analyticsState: "ready",
      marketDataState: "ready",
      createdAt: "2026-07-16T10:00:00.000Z",
      updatedAt: "2026-07-16T10:00:00.000Z",
      warnings: []
    };
    const transaction = {
      id: "txn-1",
      portfolioId: "prt_main",
      assetSymbol: "MSFT",
      assetName: "Microsoft Corporation",
      tradeDate: "2026-07-16",
      type: "buy",
      quantity: 3,
      unitPrice: 400,
      totalAmount: 1200,
      currency: "USD",
      createdAt: "2026-07-16T10:00:00.000Z"
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, { data: { portfolios: [portfolio] } }))
      .mockResolvedValueOnce(jsonResponse(201, { data: portfolio }))
      .mockResolvedValueOnce(jsonResponse(200, { data: portfolio }))
      .mockResolvedValueOnce(
        jsonResponse(200, { data: { ...portfolio, name: "Carteira Ajustada" } })
      )
      .mockResolvedValueOnce(jsonResponse(200, { data: { transactions: [transaction] } }))
      .mockResolvedValueOnce(jsonResponse(201, { data: transaction }))
      .mockResolvedValueOnce(
        jsonResponse(200, {
          data: {
            positions: [
              {
                portfolioId: "prt_main",
                assetSymbol: "MSFT",
                assetName: "Microsoft Corporation",
                quantity: 3,
                averageCost: 400,
                totalCostBasis: 1200,
                currency: "USD",
                lastTransactionDate: "2026-07-16"
              }
            ]
          }
        })
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          data: {
            snapshots: [
              {
                id: "snp-1",
                portfolioId: "prt_main",
                asOfDate: "2026-07-16",
                createdAt: "2026-07-16T10:00:00.000Z",
                positions: [],
                transactionCount: 1,
                totalCostBasis: 1200
              }
            ]
          }
        })
      );
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(crypto, "randomUUID").mockReturnValue("idem-1");

    await expect(listPortfolios()).resolves.toMatchObject({
      portfolios: [expect.objectContaining({ id: "prt_main" })]
    });
    await expect(
      createPortfolio({
        accountId: "acct_main",
        name: "Carteira Principal",
        baseCurrency: "USD"
      })
    ).resolves.toMatchObject({ id: "prt_main" });
    await expect(getPortfolio("prt_main")).resolves.toMatchObject({ id: "prt_main" });
    await expect(updatePortfolio("prt_main", { name: "Carteira Ajustada" })).resolves.toMatchObject(
      {
        name: "Carteira Ajustada"
      }
    );
    await expect(listPortfolioTransactions("prt_main")).resolves.toMatchObject({
      transactions: [expect.objectContaining({ id: "txn-1" })]
    });
    await expect(
      createPortfolioTransaction("prt_main", {
        assetSymbol: "MSFT",
        assetName: "Microsoft Corporation",
        tradeDate: "2026-07-16",
        type: "buy",
        quantity: 3,
        unitPrice: 400,
        currency: "USD"
      })
    ).resolves.toMatchObject({ id: "txn-1" });
    await expect(listPortfolioPositions("prt_main", "2026-07-16")).resolves.toMatchObject({
      positions: [expect.objectContaining({ assetSymbol: "MSFT" })]
    });
    await expect(listPortfolioSnapshots("prt_main")).resolves.toMatchObject({
      snapshots: [expect.objectContaining({ id: "snp-1" })]
    });

    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:8000/api/v1/portfolios");
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: "POST" });
    expect(fetchMock.mock.calls[2][0]).toBe("http://localhost:8000/api/v1/portfolios/prt_main");
    expect(fetchMock.mock.calls[3][1]).toMatchObject({ method: "PATCH" });
    expect(fetchMock.mock.calls[5][1].headers["Idempotency-Key"]).toBe("idem-1");
    expect(fetchMock.mock.calls[6][0]).toBe(
      "http://localhost:8000/api/v1/portfolios/prt_main/positions?asOf=2026-07-16"
    );
    expect(fetchMock.mock.calls[7][0]).toBe(
      "http://localhost:8000/api/v1/portfolios/prt_main/snapshots"
    );
  });

  it("sends XLSX imports as multipart with idempotency and lists account jobs", async () => {
    const job = {
      id: "import-1",
      type: "portfolio_spreadsheet_import",
      accountId: "acct_main",
      status: "queued",
      phase: "upload_complete",
      originalFileName: "portfolio.xlsx",
      portfolioId: null,
      progress: {
        totalRows: null,
        processedRows: 0,
        succeededRows: 0,
        failedRows: 0,
        percent: 0
      },
      failure: null,
      errorReportAvailable: false,
      createdAt: "2026-08-06T15:00:00.000Z",
      updatedAt: "2026-08-06T15:00:00.000Z",
      completedAt: null
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(202, { data: job, meta: { pollAfterMs: 1000 } }))
      .mockResolvedValueOnce(
        jsonResponse(200, {
          data: { imports: [job] },
          meta: {
            pagination: {
              page: 1,
              per_page: 20,
              total_items: 1,
              total_pages: 1,
              has_next: false,
              has_prev: false
            }
          }
        })
      );
    vi.stubGlobal("fetch", fetchMock);
    const file = new File(["PK"], "portfolio.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    await expect(
      createPortfolioImport({
        accountId: "acct_main",
        file,
        idempotencyKey: "import-key-1"
      })
    ).resolves.toMatchObject({ data: { id: "import-1", status: "queued" } });
    await expect(listPortfolioImports("acct_main")).resolves.toMatchObject({
      data: { imports: [expect.objectContaining({ id: "import-1" })] }
    });

    const uploadOptions = fetchMock.mock.calls[0][1] as RequestInit;
    expect(uploadOptions.method).toBe("POST");
    expect(uploadOptions.body).toBeInstanceOf(FormData);
    expect(uploadOptions.headers).toMatchObject({ "Idempotency-Key": "import-key-1" });
    expect(uploadOptions.headers).not.toHaveProperty("Content-Type");
    expect(fetchMock.mock.calls[1][0]).toBe(
      "http://localhost:8000/api/v1/portfolio-imports?accountId=acct_main&page=1&per_page=20"
    );
  });

  it("requests portfolio chart bundles with range, interval, assets and benchmark", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse(200, {
        data: {
          portfolioId: "prt_main",
          asOfDate: "2026-07-15",
          range: "1m",
          interval: "weekly",
          baseCurrency: "USD",
          charts: {
            assetPrices: [],
            portfolioPerformance: [],
            cumulativeReturn: [],
            allocation: [],
            sectorExposure: [],
            drawdown: [],
            rollingRisk: [],
            correlation: { symbols: [], cells: [] },
            benchmarkComparison: [],
            annotations: []
          },
          dataQuality: {
            status: "partial",
            issues: [],
            staleInputCount: 0,
            unavailableChartKeys: ["assetPrices"]
          }
        },
        meta: {
          sourceSnapshotId: "ans_main",
          generatedAt: "2026-07-16T10:00:00.000Z"
        }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      getPortfolioCharts("prt_main", {
        range: "1m",
        interval: "weekly",
        assetSymbols: ["MSFT", "VTI"],
        benchmarkSymbol: "spy",
        baseCurrency: "usd"
      })
    ).resolves.toMatchObject({
      data: {
        portfolioId: "prt_main",
        dataQuality: { status: "partial" }
      },
      meta: {
        sourceSnapshotId: "ans_main"
      }
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:8000/api/v1/portfolios/prt_main/charts?range=1m&interval=weekly&assetSymbols=MSFT%2CVTI&benchmarkSymbol=SPY&baseCurrency=USD"
    );
  });

  it("uses compact chart URLs when optional chart filters are absent", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse(200, {
        data: {
          portfolioId: "prt_main",
          asOfDate: "2026-07-15",
          range: "1m",
          interval: "daily",
          baseCurrency: "USD",
          charts: {
            assetPrices: [],
            portfolioPerformance: [],
            cumulativeReturn: [],
            allocation: [],
            sectorExposure: [],
            drawdown: [],
            rollingRisk: [],
            correlation: { symbols: [], cells: [] },
            benchmarkComparison: [],
            annotations: []
          },
          dataQuality: {
            status: "complete",
            issues: [],
            staleInputCount: 0,
            unavailableChartKeys: []
          }
        },
        meta: { generatedAt: "2026-07-16T10:00:00.000Z" }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getPortfolioCharts("prt_main")).resolves.toMatchObject({
      data: { portfolioId: "prt_main" }
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:8000/api/v1/portfolios/prt_main/charts"
    );
  });

  it("surfaces backend provider unavailable errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        jsonResponse(503, {
          error: {
            code: "market_data.provider_unavailable",
            message: "Market data provider unavailable"
          }
        })
      )
    );

    await expect(searchMarketAssets("ZZZZ")).rejects.toBeInstanceOf(ApiError);
  });

  it("requests and lists backend-generated reports", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(202, {
          data: {
            id: "rpt-1",
            portfolioId: "prt_main",
            requestedBy: "usr_user",
            format: "pdf",
            status: "pending",
            createdAt: "2026-07-16T10:00:00.000Z",
            updatedAt: "2026-07-16T10:00:00.000Z"
          },
          meta: { status: "pending" }
        })
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          data: {
            reports: [
              {
                id: "rpt-1",
                portfolioId: "prt_main",
                requestedBy: "usr_user",
                format: "pdf",
                status: "ready",
                fileKey: "reports/prt_main/rpt-1.pdf",
                createdAt: "2026-07-16T10:00:00.000Z",
                updatedAt: "2026-07-16T10:01:00.000Z",
                completedAt: "2026-07-16T10:01:00.000Z"
              }
            ]
          },
          meta: { count: 1 }
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(requestPortfolioReport("prt_main", "pdf")).resolves.toMatchObject({
      data: { status: "pending", format: "pdf" }
    });
    await expect(listPortfolioReports("prt_main")).resolves.toMatchObject({
      reports: [expect.objectContaining({ status: "ready", fileKey: "reports/prt_main/rpt-1.pdf" })]
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:8000/api/v1/portfolios/prt_main/reports"
    );
    expect(fetchMock.mock.calls[1][0]).toBe(
      "http://localhost:8000/api/v1/portfolios/prt_main/reports"
    );
  });

  it("downloads reports, recomputes analytics, and converts currency through backend APIs", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(200, {
          data: {
            totalValue: 1200,
            metrics: {},
            insights: [],
            dataQuality: { status: "complete", issues: [] }
          },
          meta: { status: "complete", baseCurrency: "USD" }
        })
      )
      .mockResolvedValueOnce(
        jsonResponse(202, {
          data: { jobId: "job-1", status: "queued", portfolioId: "prt_main" }
        })
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          data: {
            conversion: {
              from: "usd",
              to: "brl",
              amount: 100,
              convertedAmount: 545,
              rate: 5.45,
              providerName: "brapi",
              asOf: "2026-07-16T10:00:00.000Z"
            }
          },
          meta: { providerName: "brapi", asOf: "2026-07-16T10:00:00.000Z" }
        })
      )
      .mockResolvedValueOnce(
        new Response("report-body", {
          status: 200,
          headers: {
            "Content-Disposition": 'attachment; filename="relatorio.pdf"',
            "Content-Type": "application/pdf"
          }
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getPortfolioAnalytics("prt_main")).resolves.toMatchObject({
      meta: { status: "complete" }
    });
    await expect(requestPortfolioAnalyticsRecompute("prt_main")).resolves.toMatchObject({
      jobId: "job-1",
      status: "queued"
    });
    await expect(convertCurrency({ from: "usd", to: "brl", amount: 100 })).resolves.toMatchObject({
      data: { conversion: { convertedAmount: 545 } },
      meta: { providerName: "brapi" }
    });
    await expect(downloadPortfolioReport("rpt-1")).resolves.toMatchObject({
      filename: "relatorio.pdf",
      contentType: "application/pdf"
    });

    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:8000/api/v1/portfolios/prt_main/analytics"
    );
    expect(fetchMock.mock.calls[1][0]).toBe(
      "http://localhost:8000/api/v1/portfolios/prt_main/analytics/recompute"
    );
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: "POST" });
    expect(fetchMock.mock.calls[2][0]).toBe(
      "http://localhost:8000/api/v1/market-data/fx-rate?from=usd&to=brl&amount=100"
    );
    expect(fetchMock.mock.calls[3][0]).toBe("http://localhost:8000/api/v1/reports/rpt-1/download");
    expect(fetchMock.mock.calls[3][1].headers.Accept).toBe("application/pdf,text/csv");
  });

  it("creates alerts and reads notifications through backend endpoints", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(201, {
          data: {
            id: "alt-1",
            portfolioId: "prt_main",
            createdBy: "usr_user",
            title: "Analytics atualizado",
            severity: "medium",
            status: "monitoring",
            condition: { eventType: "analytics.updated" },
            createdAt: "2026-07-16T10:00:00.000Z",
            updatedAt: "2026-07-16T10:00:00.000Z"
          }
        })
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          data: {
            notifications: [
              {
                id: "ntf-1",
                portfolioId: "prt_main",
                title: "Analytics atualizado",
                body: "Evento analytics.updated recebido.",
                severity: "medium",
                status: "unread",
                sourceType: "alert",
                sourceId: "alt-1",
                createdAt: "2026-07-16T10:01:00.000Z"
              }
            ]
          },
          meta: { count: 1 }
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      createPortfolioAlert("prt_main", {
        title: "Analytics atualizado",
        severity: "medium",
        condition: { eventType: "analytics.updated" }
      })
    ).resolves.toMatchObject({ title: "Analytics atualizado", status: "monitoring" });
    await expect(listNotifications()).resolves.toMatchObject({
      notifications: [expect.objectContaining({ sourceType: "alert", status: "unread" })]
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:8000/api/v1/portfolios/prt_main/alerts"
    );
    expect(fetchMock.mock.calls[1][0]).toBe("http://localhost:8000/api/v1/notifications");
  });

  it("lists and updates alerts through backend authorization boundaries", async () => {
    const alert = {
      id: "alt-1",
      portfolioId: "prt_main",
      createdBy: "usr_user",
      title: "Limite de volatilidade",
      severity: "high",
      status: "monitoring",
      condition: {
        eventType: "metric_threshold",
        metricKey: "volatility",
        operator: "gte",
        threshold: 20
      },
      createdAt: "2026-07-16T10:00:00.000Z",
      updatedAt: "2026-07-16T10:00:00.000Z"
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, { data: { alerts: [alert] } }))
      .mockResolvedValueOnce(
        jsonResponse(200, {
          data: { ...alert, status: "disabled", title: "Volatilidade em pausa" }
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(listPortfolioAlerts("prt_main")).resolves.toMatchObject({
      alerts: [expect.objectContaining({ id: "alt-1" })]
    });
    await expect(
      updatePortfolioAlert("alt-1", {
        status: "disabled",
        title: "Volatilidade em pausa"
      })
    ).resolves.toMatchObject({ status: "disabled" });

    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:8000/api/v1/portfolios/prt_main/alerts"
    );
    expect(fetchMock.mock.calls[1][0]).toBe("http://localhost:8000/api/v1/alerts/alt-1");
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: "PATCH" });
  });

  it("surfaces forbidden notification read responses without client-side success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        jsonResponse(403, {
          error: {
            code: "auth.notification_access_denied",
            message: "Notification access denied"
          }
        })
      )
    );

    await expect(markNotificationRead("ntf-1")).rejects.toMatchObject({
      status: 403,
      code: "auth.notification_access_denied"
    });
  });
});
