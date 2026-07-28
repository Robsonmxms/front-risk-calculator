import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getCurrentUser,
  loginWithGoogle,
  loginWithPassword,
  logout
} from "../../src/features/auth/authApi";
import {
  clearSession,
  getAccessToken,
  saveSession
} from "../../src/features/auth/sessionStore";
import { AuthSession } from "../../src/features/auth/types";

const actor: AuthSession["actor"] = {
  id: "usr_user",
  email: "user@risk.local",
  name: "Usuario",
  role: "user",
  officeMemberships: [],
  accountMemberships: []
};

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body
  } as Response;
}

describe("auth API", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.sessionStorage.clear();
    window.localStorage.clear();
    clearSession();
  });

  it("uses no-store and surfaces stable login error codes", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse(401, {
        error: { code: "auth.invalid_credentials", message: "Invalid credentials" }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      loginWithPassword({ email: "user@example.com", password: "wrong-password" })
    ).rejects.toMatchObject({
      status: 401,
      code: "auth.invalid_credentials"
    });
    expect(fetchMock.mock.calls[0][1]?.cache).toBe("no-store");
  });

  it("stores Google login sessions returned by the backend", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse(200, {
        data: {
          accessToken: "access-google",
          refreshToken: "refresh-google",
          actor
        }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      loginWithGoogle({
        idToken: "google-id-token",
        redirectUri: "http://localhost/login"
      })
    ).resolves.toMatchObject({
      accessToken: "access-google",
      actor: { email: "user@risk.local" }
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:8000/api/v1/auth/google"
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toEqual({
      idToken: "google-id-token",
      redirectUri: "http://localhost/login"
    });
    expect(getAccessToken()).toBe("access-google");
  });

  it("loads the current authenticated user through the protected API client", async () => {
    saveSession({
      accessToken: "access-one",
      refreshToken: "refresh-one",
      actor
    });
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse(200, {
        data: {
          actor,
          user: {
            id: actor.id,
            email: actor.email,
            name: actor.name,
            role: actor.role,
            status: "active",
            createdAt: "2026-07-16T10:00:00.000Z",
            updatedAt: "2026-07-16T10:00:00.000Z"
          }
        }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(getCurrentUser()).resolves.toMatchObject({
      actor: { id: "usr_user" },
      user: { email: "user@risk.local" }
    });
    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:8000/api/v1/users/me");
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer access-one");
  });

  it("revokes refresh tokens when present and always clears local session", async () => {
    saveSession({
      accessToken: "access-one",
      refreshToken: "refresh-one",
      actor
    });
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse(204, undefined));
    vi.stubGlobal("fetch", fetchMock);

    await logout();

    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:8000/api/v1/auth/logout"
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toEqual({
      refreshToken: "refresh-one"
    });
    expect(getAccessToken()).toBeNull();
  });

  it("clears local session even when backend logout is unavailable", async () => {
    saveSession({
      accessToken: "access-one",
      refreshToken: "refresh-one",
      actor
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValueOnce(new Error("network unavailable"))
    );

    await expect(logout()).resolves.toBeUndefined();
    expect(getAccessToken()).toBeNull();
  });
});
