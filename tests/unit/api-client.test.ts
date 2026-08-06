import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  apiFetch,
  apiFetchBlob,
  apiFetchEnvelope,
  ApiError,
  refreshSession,
  SessionExpiredError
} from "../../src/lib/api/client";
import {
  clearSession,
  getAccessToken,
  saveSession
} from "../../src/features/auth/sessionStore";
import { AuthSession } from "../../src/features/auth/types";

const actor: AuthSession["actor"] = {
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

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body
  } as Response;
}

describe("apiFetch session behavior", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.sessionStorage.clear();
    window.localStorage.clear();
    clearSession();
  });

  it("refreshes once and retries the original request after access token expiry", async () => {
    saveSession({
      accessToken: "old-access-token",
      refreshToken: "refresh-one",
      actor
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(401, {
          error: { code: "auth.access_token_expired", message: "Access token expired" }
        })
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          data: {
            accessToken: "new-access-token",
            refreshToken: "refresh-two",
            actor
          }
        })
      )
      .mockResolvedValueOnce(jsonResponse(200, { data: { ok: true } }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiFetch<{ ok: boolean }>("/users/me")).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe(
      "Bearer old-access-token"
    );
    expect(fetchMock.mock.calls[0][1].cache).toBe("no-store");
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe(
      "Bearer new-access-token"
    );
    expect(fetchMock.mock.calls[2][1].cache).toBe("no-store");
    expect(getAccessToken()).toBe("new-access-token");
    expect(window.localStorage.length).toBe(0);
  });

  it("clears session state when refresh fails", async () => {
    saveSession({
      accessToken: "expired-access-token",
      refreshToken: "refresh-one",
      actor
    });

    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          jsonResponse(401, {
            error: { code: "auth.access_token_expired", message: "Access token expired" }
          })
        )
        .mockResolvedValueOnce(
          jsonResponse(401, {
            error: { code: "auth.refresh_revoked", message: "Refresh token revoked" }
          })
        )
    );

    await expect(apiFetch("/users/me")).rejects.toBeInstanceOf(SessionExpiredError);
    expect(getAccessToken()).toBeNull();
    expect(window.sessionStorage.length).toBe(0);
    expect(window.localStorage.length).toBe(0);
  });

  it("returns envelope metadata when requested", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse(200, {
        data: { portfolios: [] },
        meta: { count: 0 }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      apiFetchEnvelope<{ portfolios: [] }, { count: number }>("/accounts")
    ).resolves.toEqual({
      data: { portfolios: [] },
      meta: { count: 0 }
    });
    expect(fetchMock.mock.calls[0][1]?.cache).toBe("no-store");
    expect(fetchMock.mock.calls[0][1]?.headers).not.toHaveProperty("Content-Type");
  });

  it("returns undefined data for no-content responses", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse(204, undefined));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiFetch<void>("/auth/logout")).resolves.toBeUndefined();
    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty("Content-Type");
  });

  it("sends JSON Content-Type only when a request carries a body", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, { data: { ok: true } }))
      .mockResolvedValueOnce(jsonResponse(200, { data: { ok: true } }));
    vi.stubGlobal("fetch", fetchMock);

    await apiFetch("/read-only");
    await apiFetch("/write", { method: "POST", body: JSON.stringify({ value: 1 }) });

    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty("Content-Type");
    expect(fetchMock.mock.calls[1][1].headers).toMatchObject({
      "Content-Type": "application/json"
    });
  });

  it("uses stable fallback errors when the backend returns a non-json failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        new Response("internal error", {
          status: 500,
          headers: { "Content-Type": "text/plain" }
        })
      )
    );

    await expect(apiFetch("/unstable")).rejects.toMatchObject({
      status: 500,
      code: "api.request_failed",
      message: "Request failed"
    });
  });

  it("does not refresh on unauthorized responses without a refresh token", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        jsonResponse(401, {
          error: { code: "auth.unauthorized", message: "Authentication required" }
        })
      )
    );

    await expect(apiFetch("/users/me")).rejects.toMatchObject({
      status: 401,
      code: "auth.unauthorized"
    });
  });

  it("requires an in-memory refresh token before refreshing explicitly", async () => {
    await expect(refreshSession()).rejects.toBeInstanceOf(SessionExpiredError);
  });

  it("downloads blobs with backend filename and content type metadata", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        new Response("pdf-body", {
          status: 200,
          headers: {
            "Content-Disposition": 'attachment; filename="risk-report.pdf"',
            "Content-Type": "application/pdf"
          }
        })
      )
    );

    const result = await apiFetchBlob("/reports/rpt-1/download", {
      headers: { Accept: "application/pdf" }
    });

    expect(result.filename).toBe("risk-report.pdf");
    expect(result.contentType).toBe("application/pdf");
    await expect(result.blob.text()).resolves.toBe("pdf-body");
  });

  it("surfaces blob endpoint failures through the normal api error envelope", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        jsonResponse(403, {
          error: {
            code: "reports.download_denied",
            message: "Report download denied",
            details: { reportId: "rpt-1" }
          }
        })
      )
    );

    await expect(apiFetchBlob("/reports/rpt-1/download")).rejects.toBeInstanceOf(ApiError);
  });
});
