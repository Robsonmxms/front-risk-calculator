import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ClientDirectoryPage from "../../src/app/(dashboard)/dashboard/clients/page";
import ClientDetailPage from "../../src/app/(dashboard)/dashboard/clients/[clientId]/page";
import { AuthProvider } from "../../src/features/auth/AuthProvider";
import { clearSession, saveSession } from "../../src/features/auth/sessionStore";
import { Actor, SafeUser } from "../../src/features/auth/types";

const navigationMocks = vi.hoisted(() => ({
  clientId: "client_main"
}));

const authApiMocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  loginWithGoogle: vi.fn(),
  loginWithPassword: vi.fn(),
  logout: vi.fn()
}));

const clientApiMocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  createHousehold: vi.fn(),
  getClient: vi.fn(),
  listClients: vi.fn(),
  listHouseholds: vi.fn(),
  updateClient: vi.fn(),
  updateHousehold: vi.fn()
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ clientId: navigationMocks.clientId }),
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
vi.mock("../../src/features/client/clientApi", () => clientApiMocks);

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

const household = {
  id: "hh_main",
  officeId: "ofc_main",
  name: "Silva Family",
  status: "active",
  createdAt: "2026-07-09T00:00:00.000Z",
  updatedAt: "2026-07-09T00:00:00.000Z"
};

const client = {
  id: "client_main",
  officeId: "ofc_main",
  householdId: "hh_main",
  householdName: "Silva Family",
  name: "Marina Silva",
  email: "marina.silva@example.com",
  documentLabel: "CPF ending 0123",
  status: "active",
  onboardingStatus: "complete",
  advisorUserId: "usr_advisor",
  advisorName: "Advisor User",
  riskProfileDescriptor: "Balanced growth profile",
  accountCount: 1,
  portfolioCount: 1,
  createdAt: "2026-07-09T00:00:00.000Z",
  updatedAt: "2026-07-09T00:00:00.000Z"
};

describe("client pages", () => {
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
    clientApiMocks.listClients.mockResolvedValue({ clients: [client] });
    clientApiMocks.listHouseholds.mockResolvedValue({ households: [household] });
    clientApiMocks.createClient.mockResolvedValue({
      ...client,
      id: "client_new",
      name: "New Client",
      email: "new.client@example.com"
    });
    clientApiMocks.getClient.mockResolvedValue({
      ...client,
      household,
      notes: "Prefers monthly risk reporting.",
      accounts: [
        {
          id: "acct_main",
          officeId: "ofc_main",
          name: "Main Portfolio Account",
          portfolioCount: 1
        }
      ],
      portfolios: [
        {
          id: "prt_main",
          officeId: "ofc_main",
          accountId: "acct_main",
          accountName: "Main Portfolio Account",
          clientId: "client_main",
          clientName: "Marina Silva",
          householdId: "hh_main",
          householdName: "Silva Family",
          name: "Core Growth",
          baseCurrency: "USD",
          membershipRole: "owner",
          holdingsCount: 4,
          transactionCount: 3,
          totalCostBasis: 218100,
          freshness: "fresh",
          status: "ready",
          analyticsState: "ready",
          marketDataState: "ready"
        }
      ]
    });
    clientApiMocks.updateClient.mockResolvedValue({
      ...client,
      status: "archived",
      archivedAt: "2026-07-16T00:00:00.000Z",
      household,
      accounts: [],
      portfolios: []
    });
  });

  afterEach(() => {
    cleanup();
    clearSession();
  });

  it("filters the client directory and creates a client", async () => {
    render(
      <AuthProvider>
        <ClientDirectoryPage />
      </AuthProvider>
    );

    expect(await screen.findByRole("heading", { name: "Orion Advisory" })).toBeInTheDocument();
    expect(screen.getByText("Marina Silva")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Buscar clientes"), {
      target: { value: "marina" }
    });
    await waitFor(() => {
      expect(clientApiMocks.listClients).toHaveBeenLastCalledWith("ofc_main", {
        search: "marina",
        status: "",
        householdId: "",
        onboardingStatus: ""
      });
    });

    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "New Client" }
    });
    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "new.client@example.com" }
    });
    fireEvent.change(screen.getByLabelText("Perfil de risco"), {
      target: { value: "Liquidity reserve profile" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Criar cliente" }));

    await waitFor(() => {
      expect(clientApiMocks.createClient).toHaveBeenCalledWith("ofc_main", {
        name: "New Client",
        email: "new.client@example.com",
        householdId: undefined,
        riskProfileDescriptor: "Liquidity reserve profile",
        notes: undefined,
        onboardingStatus: "onboarding",
        advisorUserId: "usr_user"
      });
    });
    expect(await screen.findByText("Cliente criado.")).toBeInTheDocument();
  });

  it("renders client detail and archives the client", async () => {
    render(
      <AuthProvider>
        <ClientDetailPage />
      </AuthProvider>
    );

    expect(await screen.findByRole("heading", { name: "Marina Silva" })).toBeInTheDocument();
    expect(screen.getAllByText("Main Portfolio Account").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Core Growth" })).toHaveAttribute(
      "href",
      "/dashboard/portfolios/prt_main"
    );

    fireEvent.click(screen.getByRole("button", { name: "Arquivar cliente" }));
    await waitFor(() => {
      expect(clientApiMocks.updateClient).toHaveBeenCalledWith("client_main", {
        status: "archived"
      });
    });
    expect(await screen.findByText("Cliente arquivado.")).toBeInTheDocument();
  });
});
