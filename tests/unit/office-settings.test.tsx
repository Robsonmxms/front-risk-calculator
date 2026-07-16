import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OfficeSettingsPage from "../../src/app/(dashboard)/dashboard/offices/[officeId]/settings/page";
import { AuthProvider } from "../../src/features/auth/AuthProvider";
import { clearSession, saveSession } from "../../src/features/auth/sessionStore";
import { Actor, SafeUser } from "../../src/features/auth/types";

const authApiMocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  loginWithGoogle: vi.fn(),
  loginWithPassword: vi.fn(),
  logout: vi.fn()
}));

const officeApiMocks = vi.hoisted(() => ({
  getOffice: vi.fn(),
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
  });

  afterEach(() => {
    cleanup();
    clearSession();
  });

  it("renders office context, members, and updates office settings", async () => {
    render(
      <AuthProvider>
        <OfficeSettingsPage />
      </AuthProvider>
    );

    expect(await screen.findByRole("heading", { name: "Orion Advisory" })).toBeInTheDocument();
    expect(screen.getByLabelText("Selecionar office")).toBeInTheDocument();
    expect(screen.getByText("Portfolio User")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Orion Advisory Group" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar office" }));

    await waitFor(() => {
      expect(officeApiMocks.updateOffice).toHaveBeenCalledWith("ofc_main", {
        name: "Orion Advisory Group",
        status: "active"
      });
    });
    expect(await screen.findByText("Office atualizado.")).toBeInTheDocument();
  });
});
