import { beforeEach, describe, expect, it, vi } from "vitest";
import { searchMarketAssets } from "../../src/features/portfolio/portfolioApi";
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
              updatedAt: "2026-07-15T12:00:00.000Z"
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

    await expect(searchMarketAssets("MSFT")).resolves.toMatchObject({
      data: {
        assets: [
          expect.objectContaining({
            id: "asset-msft",
            symbol: "MSFT"
          })
        ]
      },
      meta: {
        providerStatus: "available"
      }
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:8000/api/v1/market-data/assets/search?q=MSFT"
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
});
