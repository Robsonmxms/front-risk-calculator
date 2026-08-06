import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OfficeSettingsPage from "../../src/app/(dashboard)/dashboard/offices/[officeId]/settings/page";
import { AuthProvider } from "../../src/features/auth/AuthProvider";
import { clearSession, saveSession } from "../../src/features/auth/sessionStore";
import { Actor, SafeUser } from "../../src/features/auth/types";

const authApiMocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  loginWithPassword: vi.fn(),
  logout: vi.fn()
}));

const officeApiMocks = vi.hoisted(() => ({
  createAdvisoryTeam: vi.fn(),
  createAssignment: vi.fn(),
  deleteAssignment: vi.fn(),
  getMyOfficePermissions: vi.fn(),
  getOffice: vi.fn(),
  listAdvisoryTeams: vi.fn(),
  listOfficeAssignments: vi.fn(),
  listOfficeMembers: vi.fn(),
  updateOffice: vi.fn()
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ officeId: "ofc_main" }),
  useRouter: () => ({ replace: vi.fn() })
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

vi.mock("../../src/features/auth/authApi", () => authApiMocks);
vi.mock("../../src/features/office/officeApi", () => officeApiMocks);

const actor: Actor = {
  id: "usr_user",
  email: "user@example.com",
  name: "Portfolio User",
  role: "user",
  officeMemberships: [
    {
      officeId: "ofc_main",
      officeName: "Orion Advisory",
      role: "office_admin"
    },
    {
      officeId: "ofc_private",
      officeName: "Private Allocation Desk",
      role: "analyst"
    }
  ],
  accountMemberships: []
};

const safeUser: SafeUser = {
  id: actor.id,
  email: actor.email,
  name: actor.name,
  role: actor.role,
  status: "active"
};

const analystActor: Actor = {
  ...actor,
  id: "usr_analyst",
  email: "analyst@example.com",
  name: "Analyst User",
  role: "analyst",
  officeMemberships: [
    {
      officeId: "ofc_main",
      officeName: "Orion Advisory",
      role: "analyst"
    }
  ]
};

const analystSafeUser: SafeUser = {
  id: analystActor.id,
  email: analystActor.email,
  name: analystActor.name,
  role: analystActor.role,
  status: "active"
};

describe("office settings", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    window.sessionStorage.clear();
    window.localStorage.clear();
    clearSession();
    saveSession({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      actor
    });
    authApiMocks.getCurrentUser.mockResolvedValue({ actor, user: safeUser });
    authApiMocks.logout.mockResolvedValue(undefined);
    officeApiMocks.getOffice.mockResolvedValue({
      id: "ofc_main",
      name: "Orion Advisory",
      status: "active",
      createdAt: "2026-07-09T00:00:00.000Z",
      updatedAt: "2026-07-09T00:00:00.000Z"
    });
    officeApiMocks.getMyOfficePermissions.mockResolvedValue({
      officeId: "ofc_main",
      role: "office_admin",
      permissions: [
        "client.read",
        "client.manage",
        "ledger.read",
        "ledger.write",
        "analytics.read",
        "office.members.manage"
      ],
      assignments: [],
      matrix: {
        office_admin: ["office.members.manage", "ledger.write"],
        advisor: ["client.read", "ledger.read", "ledger.write"],
        analyst: ["client.read", "ledger.read", "analytics.read"],
        assistant: ["client.read", "ledger.read"],
        client: ["notifications.read"]
      }
    });
    officeApiMocks.listOfficeMembers.mockResolvedValue({
      members: [
        {
          id: "ofm_user_main",
          officeId: "ofc_main",
          userId: "usr_user",
          userName: "Portfolio User",
          userEmail: "user@example.com",
          role: "office_admin",
          createdAt: "2026-07-09T00:00:00.000Z"
        },
        {
          id: "ofm_advisor_main",
          officeId: "ofc_main",
          userId: "usr_advisor",
          userName: "Advisor User",
          userEmail: "advisor@example.com",
          role: "advisor",
          createdAt: "2026-07-09T00:00:00.000Z"
        }
      ]
    });
    officeApiMocks.listAdvisoryTeams.mockResolvedValue({
      teams: [
        {
          id: "team_core_main",
          officeId: "ofc_main",
          name: "Core Advisory Team",
          description: "Coverage",
          status: "active",
          members: [],
          createdAt: "2026-07-09T00:00:00.000Z",
          updatedAt: "2026-07-09T00:00:00.000Z"
        }
      ]
    });
    officeApiMocks.listOfficeAssignments.mockResolvedValue({
      assignments: [
        {
          id: "asn_core_client_main",
          officeId: "ofc_main",
          resourceType: "client",
          resourceId: "client_main",
          teamId: "team_core_main",
          permissions: ["client.read"],
          createdBy: "usr_user",
          createdAt: "2026-07-09T00:00:00.000Z"
        }
      ]
    });
    officeApiMocks.updateOffice.mockResolvedValue({
      id: "ofc_main",
      name: "Orion Advisory Group",
      status: "active",
      createdAt: "2026-07-09T00:00:00.000Z",
      updatedAt: "2026-07-16T00:00:00.000Z"
    });
    officeApiMocks.createAdvisoryTeam.mockResolvedValue({
      id: "team_planning",
      officeId: "ofc_main",
      name: "Planning Desk",
      description: "Coverage",
      status: "active",
      members: [
        {
          id: "tm_advisor",
          officeId: "ofc_main",
          teamId: "team_planning",
          userId: "usr_advisor",
          userName: "Advisor User",
          userEmail: "advisor@example.com",
          role: "advisor",
          createdAt: "2026-07-16T00:00:00.000Z"
        }
      ],
      createdAt: "2026-07-16T00:00:00.000Z",
      updatedAt: "2026-07-16T00:00:00.000Z"
    });
    officeApiMocks.createAssignment.mockResolvedValue({
      id: "asn_ledger_write",
      officeId: "ofc_main",
      resourceType: "portfolio",
      resourceId: "prt_main",
      assigneeUserId: "usr_advisor",
      permissions: ["ledger.write"],
      createdBy: "usr_user",
      createdAt: "2026-07-16T00:00:00.000Z"
    });
    officeApiMocks.deleteAssignment.mockResolvedValue({
      id: "asn_ledger_write",
      officeId: "ofc_main",
      resourceType: "portfolio",
      resourceId: "prt_main",
      assigneeUserId: "usr_advisor",
      permissions: ["ledger.write"],
      createdBy: "usr_user",
      createdAt: "2026-07-16T00:00:00.000Z",
      revokedAt: "2026-07-16T00:05:00.000Z"
    });
  });

  afterEach(() => {
    cleanup();
    clearSession();
  });

  it("renders office context, members, teams, assignments, and updates settings", async () => {
    render(
      <AuthProvider>
        <OfficeSettingsPage />
      </AuthProvider>
    );

    expect(await screen.findByRole("heading", { name: "Orion Advisory" })).toBeInTheDocument();
    expect(screen.getByLabelText("Selecionar escritório")).toBeInTheDocument();
    expect(screen.getAllByText("Portfolio User").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Core Advisory Team").length).toBeGreaterThan(0);
    expect(screen.getByText("cliente: referência informada")).toBeInTheDocument();
    expect(screen.queryByText("cliente: client_main")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Referência")).toHaveValue("");

    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Orion Advisory Group" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar escritório" }));

    await waitFor(() => {
      expect(officeApiMocks.updateOffice).toHaveBeenCalledWith("ofc_main", {
        name: "Orion Advisory Group",
        status: "active"
      });
    });
    expect(await screen.findByText("Escritório atualizado.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Nome do time"), {
      target: { value: "Planning Desk" }
    });
    fireEvent.click(screen.getByLabelText("Advisor User"));
    fireEvent.click(screen.getByRole("button", { name: "Criar time" }));

    await waitFor(() => {
      expect(officeApiMocks.createAdvisoryTeam).toHaveBeenCalledWith("ofc_main", {
        name: "Planning Desk",
        description: "",
        memberUserIds: ["usr_advisor"]
      });
    });
    expect(await screen.findByText("Time criado.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Usuário"), {
      target: { value: "usr_advisor" }
    });
    fireEvent.change(screen.getByLabelText("Referência"), {
      target: { value: "prt_main" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Criar permissão" }));

    await waitFor(() => {
      expect(officeApiMocks.createAssignment).toHaveBeenCalledWith({
        officeId: "ofc_main",
        assigneeUserId: "usr_advisor",
        teamId: undefined,
        resourceType: "portfolio",
        resourceId: "prt_main",
        permissions: ["ledger.write"]
      });
    });
    expect(await screen.findByText("Permissão por recurso criada.")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Revogar" })[0]);
    await waitFor(() => {
      expect(officeApiMocks.deleteAssignment).toHaveBeenCalledWith("asn_ledger_write");
    });
    expect(await screen.findByText("Permissão por recurso revogada.")).toBeInTheDocument();
  });

  it("shows a denied state without loading administrative team endpoints", async () => {
    clearSession();
    saveSession({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      actor: analystActor
    });
    authApiMocks.getCurrentUser.mockResolvedValue({
      actor: analystActor,
      user: analystSafeUser
    });
    officeApiMocks.getMyOfficePermissions.mockResolvedValueOnce({
      officeId: "ofc_main",
      role: "analyst",
      permissions: ["client.read", "ledger.read", "analytics.read"],
      assignments: [],
      matrix: {
        office_admin: ["office.members.manage", "ledger.write"],
        advisor: ["client.read", "ledger.read", "ledger.write"],
        analyst: ["client.read", "ledger.read", "analytics.read"],
        assistant: ["client.read", "ledger.read"],
        client: ["notifications.read"]
      }
    });

    render(
      <AuthProvider>
        <OfficeSettingsPage />
      </AuthProvider>
    );

    expect(
      await screen.findByText("Ações de equipe indisponíveis para seu perfil neste escritório.")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar escritório" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Criar time" })).not.toBeInTheDocument();
    expect(officeApiMocks.listOfficeMembers).not.toHaveBeenCalled();
    expect(officeApiMocks.listAdvisoryTeams).not.toHaveBeenCalled();
    expect(officeApiMocks.listOfficeAssignments).not.toHaveBeenCalled();
  });
});
