import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WorkbenchPage from "../../src/app/(dashboard)/dashboard/workbench/page";
import { AuthProvider } from "../../src/features/auth/AuthProvider";
import { clearSession, saveSession } from "../../src/features/auth/sessionStore";
import { Actor, SafeUser } from "../../src/features/auth/types";

const authApiMocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  loginWithGoogle: vi.fn(),
  loginWithPassword: vi.fn(),
  logout: vi.fn()
}));

const workbenchApiMocks = vi.hoisted(() => ({
  createReviewItem: vi.fn(),
  getWorkbench: vi.fn(),
  listReviewItems: vi.fn(),
  updateReviewItem: vi.fn()
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
vi.mock("../../src/features/workbench/workbenchApi", () => workbenchApiMocks);

const actor: Actor = {
  id: "usr_advisor",
  email: "advisor@example.com",
  name: "Advisor User",
  role: "user",
  officeMemberships: [
    {
      officeId: "ofc_main",
      officeName: "Orion Advisory",
      role: "advisor"
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

const reviewItem = {
  id: "rev_main_report",
  officeId: "ofc_main",
  title: "Review monthly risk pack",
  severity: "medium",
  status: "open",
  resourceType: "client",
  resourceId: "client_main",
  clientId: "client_main",
  assignedToUserId: "usr_advisor",
  dueDate: "2026-07-20",
  createdBy: "usr_user",
  createdAt: "2026-07-09T00:00:00.000Z",
  updatedAt: "2026-07-09T00:00:00.000Z"
};

describe("workbench page", () => {
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
    workbenchApiMocks.getWorkbench.mockResolvedValue({
      officeId: "ofc_main",
      generatedAt: "2026-07-16T00:00:00.000Z",
      assignedClients: [
        {
          id: "client_main",
          officeId: "ofc_main",
          name: "Marina Silva",
          email: "marina.silva@example.com",
          householdName: "Silva Family",
          status: "active",
          onboardingStatus: "complete",
          riskProfileDescriptor: "Balanced growth profile",
          accountCount: 1,
          portfolioCount: 1,
          createdAt: "2026-07-09T00:00:00.000Z",
          updatedAt: "2026-07-09T00:00:00.000Z"
        }
      ],
      portfoliosNeedingAttention: [],
      reviewItems: [reviewItem],
      counts: {
        assignedClients: 1,
        portfoliosNeedingAttention: 0,
        openReviewItems: 1,
        highSeverityReviewItems: 0,
        pendingReports: 0,
        openAlerts: 0
      }
    });
    workbenchApiMocks.listReviewItems.mockResolvedValue({ reviewItems: [reviewItem] });
    workbenchApiMocks.createReviewItem.mockResolvedValue({
      ...reviewItem,
      id: "rev_new",
      title: "Check analytics assumptions",
      severity: "high"
    });
    workbenchApiMocks.updateReviewItem.mockResolvedValue({
      ...reviewItem,
      status: "closed",
      closedAt: "2026-07-16T00:00:00.000Z"
    });
  });

  afterEach(() => {
    cleanup();
    clearSession();
  });

  it("renders workbench sections, filters review items, creates and updates review items", async () => {
    render(
      <AuthProvider>
        <WorkbenchPage />
      </AuthProvider>
    );

    expect(await screen.findByText("Review monthly risk pack")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Marina Silva/i })).toHaveAttribute(
      "href",
      "/dashboard/clients/client_main"
    );

    fireEvent.change(screen.getByLabelText("Filtrar severidade"), {
      target: { value: "medium" }
    });
    await waitFor(() => {
      expect(workbenchApiMocks.listReviewItems).toHaveBeenLastCalledWith("ofc_main", {
        status: "open",
        severity: "medium"
      });
    });

    fireEvent.change(screen.getByLabelText("Título"), {
      target: { value: "Check analytics assumptions" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Criar review item" }));
    await waitFor(() => {
      expect(workbenchApiMocks.createReviewItem).toHaveBeenCalledWith("ofc_main", {
        title: "Check analytics assumptions",
        severity: "medium",
        resourceType: "client",
        resourceId: "client_main",
        clientId: "client_main",
        portfolioId: undefined,
        assignedToUserId: "usr_advisor",
        dueDate: "2026-07-21",
        notes: undefined
      });
    });
    expect(await screen.findByText("Review item criado.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Status Review monthly risk pack"), {
      target: { value: "closed" }
    });
    await waitFor(() => {
      expect(workbenchApiMocks.updateReviewItem).toHaveBeenCalledWith("rev_main_report", {
        status: "closed"
      });
    });
  });
});
