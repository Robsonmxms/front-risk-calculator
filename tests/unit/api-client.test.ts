import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  apiFetch,
  apiFetchEnvelope,
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
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe(
      "Bearer new-access-token"
    );
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
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        jsonResponse(200, {
          data: { portfolios: [] },
          meta: { count: 0 }
        })
      )
    );

    await expect(
      apiFetchEnvelope<{ portfolios: [] }, { count: number }>("/accounts")
    ).resolves.toEqual({
      data: { portfolios: [] },
      meta: { count: 0 }
    });
  });
});
