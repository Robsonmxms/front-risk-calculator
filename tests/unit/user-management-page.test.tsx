import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../../src/features/auth/AuthProvider";
import { clearSession, saveSession } from "../../src/features/auth/sessionStore";
import { UserManagementPage } from "../../src/features/user-management/UserManagementPage";
import type { Actor, SafeUser, UserRole } from "../../src/lib/contracts/auth";

const navigationMocks = vi.hoisted(() => ({ replace: vi.fn() }));
const authApiMocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  loginWithPassword: vi.fn(),
  logout: vi.fn()
}));
const userApiMocks = vi.hoisted(() => ({
  createManagedUser: vi.fn(),
  listManagedUsers: vi.fn(),
  updateManagedUser: vi.fn()
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: navigationMocks.replace })
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));
vi.mock("../../src/features/auth/authApi", () => authApiMocks);
vi.mock("../../src/features/user-management/userManagementApi", () => userApiMocks);

const pagination = {
  page: 1,
  per_page: 20,
  total_items: 2,
  total_pages: 1,
  has_next: false,
  has_prev: false
};

function actorFor(role: UserRole): Actor {
  return {
    id: `usr_${role}`,
    name: role === "admin" ? "Admin Principal" : "Analista Principal",
    email: `${role}@example.com`,
    role,
    officeMemberships: [],
    accountMemberships: []
  };
}

function renderAs(role: "admin" | "analyst", targetRole: UserRole, users: SafeUser[]) {
  const actor = actorFor(role);
  saveSession({ accessToken: "access-token", refreshToken: "refresh-token", actor });
  authApiMocks.getCurrentUser.mockResolvedValue({
    actor,
    user: { ...actor, status: "active" }
  });
  userApiMocks.listManagedUsers.mockResolvedValue({
    data: users,
    meta: { pagination: { ...pagination, total_items: users.length } }
  });

  render(
    <AuthProvider>
      <UserManagementPage targetRole={targetRole} />
    </AuthProvider>
  );
  return actor;
}

describe("hierarchical user management page", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    window.sessionStorage.clear();
    window.localStorage.clear();
    clearSession();
    authApiMocks.logout.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    clearSession();
  });

  it("shows all role rosters to admins and makes the current account read-only", async () => {
    const actor = actorFor("admin");
    renderAs("admin", "admin", [
      { ...actor, status: "active" },
      {
        id: "usr_admin_two",
        name: "Admin Secundária",
        email: "admin.two@example.com",
        role: "admin",
        status: "active"
      }
    ]);

    expect(await screen.findByRole("heading", { name: "Administradores" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Administradores" })).toHaveAttribute(
      "href",
      "/dashboard/users/admins"
    );
    expect(screen.getByRole("link", { name: "Analistas" })).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("link", { name: "Usuários" })
        .some((link) => link.getAttribute("href") === "/dashboard/users/users")
    ).toBe(true);
    expect(screen.getAllByText("Sua conta").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Você não pode editar a própria conta neste fluxo.").length).toBe(2);
    expect(screen.getAllByRole("button", { name: /Editar/ }).length).toBe(2);
  });

  it("limits analysts to user rosters and creates users without a role selector", async () => {
    const created: SafeUser = {
      id: "usr_new",
      name: "Cliente Novo",
      email: "cliente.novo@example.com",
      role: "user",
      status: "active"
    };
    userApiMocks.createManagedUser.mockResolvedValue(created);
    renderAs("analyst", "user", []);

    expect(await screen.findByRole("heading", { name: "Usuários" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Administradores" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Analistas" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Novo usuário" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("button", { name: "Fechar" })).toBeInTheDocument();
    expect(within(dialog).queryByLabelText("Perfil global")).not.toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText("Nome"), {
      target: { value: created.name }
    });
    fireEvent.change(within(dialog).getByLabelText("E-mail"), {
      target: { value: created.email }
    });
    fireEvent.change(within(dialog).getByLabelText("Senha inicial"), {
      target: { value: "Strong#Password1" }
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Criar cadastro" }));

    await waitFor(() => {
      expect(userApiMocks.createManagedUser).toHaveBeenCalledWith({
        name: created.name,
        email: created.email,
        role: "user",
        status: "active",
        initialPassword: "Strong#Password1"
      });
    });
    expect(
      await screen.findByText("Cadastro de Cliente Novo salvo com sucesso.")
    ).toBeInTheDocument();
  });

  it("supports failure recovery and server-side status filtering", async () => {
    userApiMocks.listManagedUsers
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValue({ data: [], meta: { pagination: { ...pagination, total_items: 0 } } });
    renderAs("admin", "analyst", []);

    expect(
      await screen.findByText("Não foi possível carregar os cadastros. Tente novamente.")
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    await waitFor(() => expect(userApiMocks.listManagedUsers).toHaveBeenCalledTimes(2));

    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "disabled" } });
    await waitFor(() => {
      expect(userApiMocks.listManagedUsers).toHaveBeenLastCalledWith(
        expect.objectContaining({ role: "analyst", status: "disabled", page: 1 })
      );
    });
  });

  it("does not let a stale roster response replace a newer filtered result", async () => {
    let resolveFirst!: (value: unknown) => void;
    userApiMocks.listManagedUsers.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFirst = resolve;
      })
    );
    renderAs("admin", "user", []);

    await screen.findByRole("heading", { name: "Usuários" });
    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "disabled" } });
    expect(
      await screen.findByText("Nenhum usuário encontrado com os filtros selecionados.")
    ).toBeInTheDocument();

    resolveFirst({
      data: [
        {
          id: "usr_stale",
          name: "Resposta Antiga",
          email: "stale@example.com",
          role: "user",
          status: "active"
        }
      ],
      meta: { pagination }
    });
    await waitFor(() => expect(screen.queryByText("Resposta Antiga")).not.toBeInTheDocument());
  });

  it("blocks standard users before any management request is sent", async () => {
    const actor = actorFor("user");
    saveSession({ accessToken: "access-token", refreshToken: "refresh-token", actor });
    authApiMocks.getCurrentUser.mockResolvedValue({
      actor,
      user: { ...actor, status: "active" }
    });

    render(
      <AuthProvider>
        <UserManagementPage targetRole="user" />
      </AuthProvider>
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("Acesso não autorizado.");
    await waitFor(() => expect(navigationMocks.replace).toHaveBeenCalledWith("/unauthorized"));
    expect(userApiMocks.listManagedUsers).not.toHaveBeenCalled();
  });

  it("requires confirmation for role changes and links to the resulting roster", async () => {
    const managed: SafeUser = {
      id: "usr_analyst_two",
      name: "Analista Dois",
      email: "analista.dois@example.com",
      role: "analyst",
      status: "active"
    };
    userApiMocks.updateManagedUser.mockResolvedValue({ ...managed, role: "user" });
    renderAs("admin", "analyst", [managed]);

    expect((await screen.findAllByText("Analista Dois")).length).toBe(2);
    fireEvent.click(screen.getAllByRole("button", { name: /Editar/ })[0]);
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Perfil global"), {
      target: { value: "user" }
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Salvar alterações" }));
    expect(await within(dialog).findByText("Perfil resultante")).toBeInTheDocument();
    expect(within(dialog).getByText("Status atual")).toBeInTheDocument();
    expect(within(dialog).getByText(/encerra as sessões de renovação/)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirmar alteração" }));

    await waitFor(() => {
      expect(userApiMocks.updateManagedUser).toHaveBeenCalledWith(
        managed.id,
        expect.objectContaining({ role: "user" })
      );
    });
    expect(await screen.findByRole("link", { name: "Abrir Usuários." })).toHaveAttribute(
      "href",
      "/dashboard/users/users"
    );
  });
});
