import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ClientPortalPage from "../../src/app/(dashboard)/dashboard/client-portal/page";
import ReportDeliveryPage from "../../src/app/(dashboard)/dashboard/report-delivery/page";
import { AuthProvider } from "../../src/features/auth/AuthProvider";
import { clearSession, saveSession } from "../../src/features/auth/sessionStore";
import { Actor, SafeUser } from "../../src/features/auth/types";

const authApiMocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  loginWithGoogle: vi.fn(),
  loginWithPassword: vi.fn(),
  logout: vi.fn()
}));

const clientApiMocks = vi.hoisted(() => ({
  getClient: vi.fn(),
  listClients: vi.fn()
}));

const deliveryApiMocks = vi.hoisted(() => ({
  approveReportPackage: vi.fn(),
  createReportPackage: vi.fn(),
  deliverReportPackage: vi.fn(),
  getClientPortal: vi.fn(),
  listClientReportPackages: vi.fn(),
  revokeReportPackage: vi.fn()
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() })
}));

vi.mock("../../src/features/auth/authApi", () => authApiMocks);
vi.mock("../../src/features/client/clientApi", () => clientApiMocks);
vi.mock("../../src/features/delivery/deliveryApi", () => deliveryApiMocks);

const staffActor: Actor = {
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

const clientActor: Actor = {
  id: "usr_client",
  email: "client@example.com",
  name: "Client Viewer",
  role: "user",
  officeMemberships: [
    {
      officeId: "ofc_main",
      officeName: "Orion Advisory",
      role: "client"
    }
  ],
  accountMemberships: []
};

const staffUser: SafeUser = {
  id: staffActor.id,
  email: staffActor.email,
  name: staffActor.name,
  role: staffActor.role,
  status: "active"
};

const clientUser: SafeUser = {
  id: clientActor.id,
  email: clientActor.email,
  name: clientActor.name,
  role: clientActor.role,
  status: "active"
};

const client = {
  id: "client_main",
  officeId: "ofc_main",
  householdName: "Silva Family",
  name: "Marina Silva",
  email: "marina.silva@example.com",
  status: "active",
  onboardingStatus: "complete",
  riskProfileDescriptor: "Balanced growth profile",
  accountCount: 1,
  portfolioCount: 1,
  createdAt: "2026-07-09T00:00:00.000Z",
  updatedAt: "2026-07-09T00:00:00.000Z"
};

const clientPortfolio = {
  id: "prt_main",
  officeId: "ofc_main",
  accountId: "acct_main",
  accountName: "Main Portfolio Account",
  clientId: "client_main",
  clientName: "Marina Silva",
  name: "Core Growth",
  baseCurrency: "USD",
  membershipRole: "viewer",
  holdingsCount: 4,
  transactionCount: 3,
  totalCostBasis: 218100,
  freshness: "fresh",
  status: "ready",
  analyticsState: "ready",
  marketDataState: "ready"
};

const deliveredPackage = {
  id: "rpkg_delivered_main",
  officeId: "ofc_main",
  clientId: "client_main",
  householdId: "hh_main_silva",
  title: "Resumo de risco de julho",
  summaryNotes: "Resumo do portfólio preparado para o ciclo de revisão de julho.",
  internalNotes: "Acompanhamento restrito à equipe.",
  status: "delivered",
  items: [
    {
      id: "rpkg_item_main_summary",
      type: "portfolio_summary",
      title: "Visão geral Core Growth",
      portfolioId: "prt_main",
      status: "ready"
    }
  ],
  createdBy: "usr_advisor",
  approvedBy: "usr_user",
  deliveredBy: "usr_user",
  createdAt: "2026-07-14T10:00:00.000Z",
  updatedAt: "2026-07-15T11:00:00.000Z",
  approvedAt: "2026-07-15T10:00:00.000Z",
  deliveredAt: "2026-07-15T11:00:00.000Z"
};

const pendingPackage = {
  ...deliveredPackage,
  id: "rpkg_pending_main",
  title: "Revisão de alocação pendente",
  status: "pending_approval",
  internalNotes: "Aguardando geração final do relatório."
};

describe("report delivery pages", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    window.sessionStorage.clear();
    window.localStorage.clear();
    clearSession();
    saveSession({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      actor: staffActor
    });
    authApiMocks.getCurrentUser.mockResolvedValue({ actor: staffActor, user: staffUser });
    authApiMocks.logout.mockResolvedValue(undefined);
    clientApiMocks.listClients.mockResolvedValue({ clients: [client] });
    clientApiMocks.getClient.mockResolvedValue({
      ...client,
      accounts: [],
      portfolios: [clientPortfolio]
    });
    deliveryApiMocks.listClientReportPackages.mockResolvedValue({
      reportPackages: [pendingPackage, deliveredPackage]
    });
    deliveryApiMocks.createReportPackage.mockResolvedValue({
      ...pendingPackage,
      id: "rpkg_created",
      title: "Pacote de revisão do cliente"
    });
    deliveryApiMocks.approveReportPackage.mockResolvedValue({
      ...pendingPackage,
      status: "approved",
      approvedAt: "2026-07-16T00:00:00.000Z"
    });
    deliveryApiMocks.deliverReportPackage.mockResolvedValue({
      ...pendingPackage,
      status: "delivered",
      deliveredAt: "2026-07-16T00:10:00.000Z"
    });
    deliveryApiMocks.revokeReportPackage.mockResolvedValue({
      ...deliveredPackage,
      status: "revoked",
      revokedAt: "2026-07-16T00:20:00.000Z"
    });
    deliveryApiMocks.getClientPortal.mockResolvedValue({
      actorId: "usr_client",
      generatedAt: "2026-07-16T00:00:00.000Z",
      clients: [{ id: "client_main", officeId: "ofc_main", name: "Marina Silva" }],
      packages: [
        {
          ...deliveredPackage,
          internalNotes: undefined,
          status: "viewed",
          portfolios: [
            {
              ...clientPortfolio
            }
          ]
        }
      ]
    });
  });

  afterEach(() => {
    cleanup();
    clearSession();
  });

  it("creates, approves, and delivers packages in the delivery center", async () => {
    render(
      <AuthProvider>
        <ReportDeliveryPage />
      </AuthProvider>
    );

    expect(await screen.findByText("Revisão de alocação pendente")).toBeInTheDocument();
    expect(clientApiMocks.listClients).toHaveBeenCalledWith("ofc_main", { status: "active" });
    expect(deliveryApiMocks.listClientReportPackages).toHaveBeenCalledWith("client_main", {
      status: ""
    });
    expect(clientApiMocks.getClient).toHaveBeenCalledWith("client_main");
    expect(await screen.findByDisplayValue("Core Growth")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Enviar para aprovação" }));
    await waitFor(() => {
      expect(deliveryApiMocks.createReportPackage).toHaveBeenCalledWith("client_main", {
        title: "Pacote de revisão do cliente",
        summaryNotes: "Resumo somente leitura preparado para a revisão do cliente.",
        internalNotes: undefined,
        submitForApproval: true,
        items: [
          {
            type: "portfolio_summary",
            title: "Resumo do portfólio Core Growth",
            portfolioId: "prt_main",
            status: "ready"
          }
        ]
      });
    });
    expect(await screen.findByText("Pacote enviado para aprovação.")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Aprovar" })[1]);
    await waitFor(() => {
      expect(deliveryApiMocks.approveReportPackage).toHaveBeenCalledWith("rpkg_pending_main");
    });

    fireEvent.click(await screen.findByRole("button", { name: "Entregar" }));
    await waitFor(() => {
      expect(deliveryApiMocks.deliverReportPackage).toHaveBeenCalledWith("rpkg_pending_main");
    });
  });

  it("renders the client portal as a read-only package view", async () => {
    window.sessionStorage.clear();
    clearSession();
    saveSession({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      actor: clientActor
    });
    authApiMocks.getCurrentUser.mockResolvedValue({ actor: clientActor, user: clientUser });

    render(
      <AuthProvider>
        <ClientPortalPage />
      </AuthProvider>
    );

    expect(await screen.findByText("Resumo de risco de julho")).toBeInTheDocument();
    expect(screen.getByText("Resumo do portfólio preparado para o ciclo de revisão de julho.")).toBeInTheDocument();
    expect(screen.queryByText("Acompanhamento restrito à equipe.")).not.toBeInTheDocument();
    expect(screen.getByText("Core Growth")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Core Growth/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Mesa" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Clientes" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Portal" })).toHaveAttribute(
      "href",
      "/dashboard/client-portal"
    );
    expect(deliveryApiMocks.getClientPortal).toHaveBeenCalled();
  });
});
