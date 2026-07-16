import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createPortfolioAlert,
  getTradePrice,
  listNotifications,
  listPortfolioReports,
  listMarketExchanges,
  markNotificationRead,
  requestPortfolioReport,
  searchMarketAssets
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
    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:8000/api/v1/market-data/exchanges"
    );
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
