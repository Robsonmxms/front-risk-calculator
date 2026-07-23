import { beforeEach, describe, expect, it, vi } from "vitest";
import { loginWithPassword } from "../../src/features/auth/authApi";
import { clearSession } from "../../src/features/auth/sessionStore";

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
});
