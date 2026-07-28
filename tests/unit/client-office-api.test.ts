import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearSession } from "../../src/features/auth/sessionStore";
import {
  createClient,
  createHousehold,
  getClient,
  listClients,
  listHouseholds,
  updateClient,
  updateHousehold
} from "../../src/features/client/clientApi";
import {
  createAdvisoryTeam,
  createAssignment,
  deleteAssignment,
  getMyOfficePermissions,
  getOffice,
  listAdvisoryTeams,
  listOfficeAssignments,
  listOfficeMembers,
  updateOffice
} from "../../src/features/office/officeApi";

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body
  } as Response;
}

describe("client and office api clients", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.sessionStorage.clear();
    window.localStorage.clear();
    clearSession();
  });

  it("queries and mutates client records through office-scoped backend routes", async () => {
    const client = {
      id: "client_main",
      officeId: "ofc_main",
      householdId: "hh_main",
      householdName: "Silva",
      name: "Marina Silva",
      email: "marina.silva@example.com",
      status: "active",
      onboardingStatus: "complete",
      advisorUserId: "usr_advisor",
      accountCount: 1,
      portfolioCount: 1,
      createdAt: "2026-07-16T10:00:00.000Z",
      updatedAt: "2026-07-16T10:00:00.000Z"
    };
    const household = {
      id: "hh_main",
      officeId: "ofc_main",
      name: "Silva",
      status: "active",
      createdAt: "2026-07-16T10:00:00.000Z",
      updatedAt: "2026-07-16T10:00:00.000Z"
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, { data: { clients: [client] } }))
      .mockResolvedValueOnce(jsonResponse(200, { data: { ...client, household } }))
      .mockResolvedValueOnce(jsonResponse(201, { data: client }))
      .mockResolvedValueOnce(jsonResponse(200, { data: { ...client, status: "archived" } }))
      .mockResolvedValueOnce(jsonResponse(200, { data: { households: [household] } }))
      .mockResolvedValueOnce(jsonResponse(201, { data: household }))
      .mockResolvedValueOnce(jsonResponse(200, { data: { ...household, name: "Silva Holding" } }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      listClients("ofc_main", {
        search: "Marina",
        status: "active",
        advisorUserId: "usr_advisor",
        householdId: "hh_main",
        onboardingStatus: "complete"
      })
    ).resolves.toMatchObject({ clients: [expect.objectContaining({ id: "client_main" })] });
    await expect(getClient("client_main")).resolves.toMatchObject({ household });
    await expect(
      createClient("ofc_main", {
        householdId: "hh_main",
        name: "Marina Silva",
        email: "marina.silva@example.com",
        onboardingStatus: "complete",
        advisorUserId: "usr_advisor"
      })
    ).resolves.toMatchObject({ id: "client_main" });
    await expect(updateClient("client_main", { status: "archived" })).resolves.toMatchObject({
      status: "archived"
    });
    await expect(listHouseholds("ofc_main")).resolves.toMatchObject({
      households: [expect.objectContaining({ id: "hh_main" })]
    });
    await expect(createHousehold("ofc_main", { name: "Silva" })).resolves.toMatchObject({
      id: "hh_main"
    });
    await expect(updateHousehold("hh_main", { name: "Silva Holding" })).resolves.toMatchObject({
      name: "Silva Holding"
    });

    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:8000/api/v1/offices/ofc_main/clients?search=Marina&status=active&advisorUserId=usr_advisor&householdId=hh_main&onboardingStatus=complete"
    );
    expect(fetchMock.mock.calls[1][0]).toBe("http://localhost:8000/api/v1/clients/client_main");
    expect(fetchMock.mock.calls[2][0]).toBe(
      "http://localhost:8000/api/v1/offices/ofc_main/clients"
    );
    expect(fetchMock.mock.calls[2][1]).toMatchObject({ method: "POST" });
    expect(fetchMock.mock.calls[3][1]).toMatchObject({ method: "PATCH" });
    expect(fetchMock.mock.calls[4][0]).toBe(
      "http://localhost:8000/api/v1/offices/ofc_main/households"
    );
    expect(fetchMock.mock.calls[5][1]).toMatchObject({ method: "POST" });
    expect(fetchMock.mock.calls[6][0]).toBe("http://localhost:8000/api/v1/households/hh_main");
    expect(fetchMock.mock.calls[6][1]).toMatchObject({ method: "PATCH" });
  });

  it("queries and mutates office permissions, teams, and assignments", async () => {
    const office = {
      id: "ofc_main",
      name: "Orion Advisory",
      status: "active",
      createdAt: "2026-07-16T10:00:00.000Z",
      updatedAt: "2026-07-16T10:00:00.000Z"
    };
    const member = {
      id: "ofm_user",
      officeId: "ofc_main",
      userId: "usr_user",
      userName: "Usuario",
      userEmail: "user@risk.local",
      role: "office_admin",
      createdAt: "2026-07-16T10:00:00.000Z"
    };
    const team = {
      id: "team_core",
      officeId: "ofc_main",
      name: "Core",
      status: "active",
      members: [],
      createdAt: "2026-07-16T10:00:00.000Z",
      updatedAt: "2026-07-16T10:00:00.000Z"
    };
    const assignment = {
      id: "asn-1",
      officeId: "ofc_main",
      resourceType: "portfolio",
      resourceId: "prt_main",
      assigneeUserId: "usr_advisor",
      permissions: ["ledger.read"],
      createdBy: "usr_user",
      createdAt: "2026-07-16T10:00:00.000Z"
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, { data: office }))
      .mockResolvedValueOnce(jsonResponse(200, { data: { members: [member] } }))
      .mockResolvedValueOnce(jsonResponse(200, { data: { ...office, name: "Orion Group" } }))
      .mockResolvedValueOnce(
        jsonResponse(200, {
          data: {
            officeId: "ofc_main",
            role: "office_admin",
            permissions: ["client.read", "ledger.read"],
            assignments: [],
            matrix: {
              office_admin: ["client.read", "ledger.read"],
              advisor: ["client.read"],
              analyst: ["ledger.read"],
              assistant: ["client.read"],
              client: ["notifications.read"]
            }
          }
        })
      )
      .mockResolvedValueOnce(jsonResponse(200, { data: { teams: [team] } }))
      .mockResolvedValueOnce(jsonResponse(201, { data: team }))
      .mockResolvedValueOnce(jsonResponse(200, { data: { assignments: [assignment] } }))
      .mockResolvedValueOnce(jsonResponse(201, { data: assignment }))
      .mockResolvedValueOnce(jsonResponse(200, { data: { ...assignment, revokedAt: "now" } }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getOffice("ofc_main")).resolves.toMatchObject({ id: "ofc_main" });
    await expect(listOfficeMembers("ofc_main")).resolves.toMatchObject({
      members: [expect.objectContaining({ userId: "usr_user" })]
    });
    await expect(updateOffice("ofc_main", { name: "Orion Group" })).resolves.toMatchObject({
      name: "Orion Group"
    });
    await expect(getMyOfficePermissions("ofc main")).resolves.toMatchObject({
      role: "office_admin"
    });
    await expect(listAdvisoryTeams("ofc_main")).resolves.toMatchObject({
      teams: [expect.objectContaining({ id: "team_core" })]
    });
    await expect(
      createAdvisoryTeam("ofc_main", {
        name: "Core",
        description: "Coverage",
        memberUserIds: ["usr_advisor"]
      })
    ).resolves.toMatchObject({ id: "team_core" });
    await expect(listOfficeAssignments("ofc_main")).resolves.toMatchObject({
      assignments: [expect.objectContaining({ id: "asn-1" })]
    });
    await expect(
      createAssignment({
        officeId: "ofc_main",
        assigneeUserId: "usr_advisor",
        resourceType: "portfolio",
        resourceId: "prt_main",
        permissions: ["ledger.read"]
      })
    ).resolves.toMatchObject({ id: "asn-1" });
    await expect(deleteAssignment("asn-1")).resolves.toMatchObject({ revokedAt: "now" });

    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:8000/api/v1/offices/ofc_main");
    expect(fetchMock.mock.calls[2][1]).toMatchObject({ method: "PATCH" });
    expect(fetchMock.mock.calls[3][0]).toBe(
      "http://localhost:8000/api/v1/me/permissions?officeId=ofc%20main"
    );
    expect(fetchMock.mock.calls[5][0]).toBe(
      "http://localhost:8000/api/v1/offices/ofc_main/teams"
    );
    expect(fetchMock.mock.calls[5][1]).toMatchObject({ method: "POST" });
    expect(fetchMock.mock.calls[7][0]).toBe(
      "http://localhost:8000/api/v1/clients/client_assignment/assignments"
    );
    expect(fetchMock.mock.calls[7][1]).toMatchObject({ method: "POST" });
    expect(fetchMock.mock.calls[8][0]).toBe("http://localhost:8000/api/v1/assignments/asn-1");
    expect(fetchMock.mock.calls[8][1]).toMatchObject({ method: "DELETE" });
  });

  it("uses compact URLs for empty client filters and direct client assignments", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, { data: { clients: [] } }))
      .mockResolvedValueOnce(
        jsonResponse(201, {
          data: {
            id: "asn-client",
            officeId: "ofc_main",
            resourceType: "client",
            resourceId: "client_main",
            assigneeUserId: "usr_advisor",
            permissions: ["client.read"],
            createdBy: "usr_user",
            createdAt: "2026-07-16T10:00:00.000Z"
          }
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      listClients("ofc_main", {
        search: "",
        status: "",
        onboardingStatus: ""
      })
    ).resolves.toEqual({ clients: [] });
    await expect(
      createAssignment({
        officeId: "ofc_main",
        assigneeUserId: "usr_advisor",
        resourceType: "client",
        resourceId: "client_main",
        permissions: ["client.read"]
      })
    ).resolves.toMatchObject({ id: "asn-client" });

    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:8000/api/v1/offices/ofc_main/clients"
    );
    expect(fetchMock.mock.calls[1][0]).toBe(
      "http://localhost:8000/api/v1/clients/client_main/assignments"
    );
  });
});
