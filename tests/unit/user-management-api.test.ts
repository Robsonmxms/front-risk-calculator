import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createManagedUser,
  listManagedUsers,
  updateManagedUser
} from "../../src/features/user-management/userManagementApi";
import { clearSession, saveSession } from "../../src/features/auth/sessionStore";

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body
  } as Response;
}

describe("user management API", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.sessionStorage.clear();
    window.localStorage.clear();
    clearSession();
    saveSession({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      actor: {
        id: "usr_admin",
        name: "Admin",
        email: "admin@example.com",
        role: "admin",
        officeMemberships: [],
        accountMemberships: []
      }
    });
  });

  it("serializes role, filters, and pagination and preserves response metadata", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse(200, {
        data: [],
        meta: {
          pagination: {
            page: 2,
            per_page: 20,
            total_items: 22,
            total_pages: 2,
            has_next: false,
            has_prev: true
          }
        }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      listManagedUsers({
        role: "analyst",
        search: "maria silva",
        status: "active",
        page: 2,
        perPage: 20
      })
    ).resolves.toMatchObject({ meta: { pagination: { page: 2, total_items: 22 } } });

    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:8000/api/v1/users?role=analyst&page=2&per_page=20&search=maria+silva&status=active"
    );
  });

  it("uses the canonical collection and resource contracts for writes", async () => {
    const created = {
      id: "usr_new",
      name: "Nova Pessoa",
      email: "nova@example.com",
      role: "user",
      status: "active"
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(201, { data: created }))
      .mockResolvedValueOnce(jsonResponse(200, { data: { ...created, status: "disabled" } }));
    vi.stubGlobal("fetch", fetchMock);

    await createManagedUser({
      name: created.name,
      email: created.email,
      role: "user",
      status: "active",
      initialPassword: "Strong#Password1"
    });
    await updateManagedUser(created.id, { status: "disabled" });

    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:8000/api/v1/users");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "POST" });
    expect(fetchMock.mock.calls[1][0]).toBe("http://localhost:8000/api/v1/users/usr_new");
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: "PATCH" });
  });
});
