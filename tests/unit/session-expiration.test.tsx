import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SessionExpiredPage from "../../src/app/(dashboard)/session-expired/page";
import { AuthProvider, useAuth } from "../../src/features/auth/AuthProvider";
import {
  clearSession,
  getAccessToken
} from "../../src/features/auth/sessionStore";
import { Actor } from "../../src/features/auth/types";
import { ApiError } from "../../src/lib/api/client";

const authApiMocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  loginWithGoogle: vi.fn(),
  loginWithPassword: vi.fn(),
  logout: vi.fn()
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

vi.mock("../../src/features/auth/authApi", () => authApiMocks);

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

function AuthProbe() {
  const { status, actor: currentActor } = useAuth();

  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="actor">{currentActor?.email ?? "no actor"}</span>
    </div>
  );
}

describe("session expiration cleanup", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.sessionStorage.clear();
    window.localStorage.clear();
    clearSession();
  });

  it("clears stale session storage when bootstrap confirms expiration", async () => {
    window.sessionStorage.setItem("risk_calculator.access_token", "expired-token");
    window.sessionStorage.setItem("risk_calculator.actor", JSON.stringify(actor));
    authApiMocks.getCurrentUser.mockRejectedValue(
      new ApiError(401, "auth.access_token_expired", "Access token expired")
    );

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("expired");
    });
    expect(screen.getByTestId("actor")).toHaveTextContent("no actor");
    expect(getAccessToken()).toBeNull();
    expect(window.sessionStorage.getItem("risk_calculator.actor")).toBeNull();
    expect(window.localStorage.length).toBe(0);
  });

  it("clears stale session storage on direct session-expired navigation", async () => {
    window.sessionStorage.setItem("risk_calculator.access_token", "expired-token");
    window.sessionStorage.setItem("risk_calculator.actor", JSON.stringify(actor));

    render(<SessionExpiredPage />);

    expect(screen.getByRole("heading", { name: "Sessão expirada" })).toBeInTheDocument();
    await waitFor(() => {
      expect(getAccessToken()).toBeNull();
    });
    expect(window.sessionStorage.getItem("risk_calculator.actor")).toBeNull();
    expect(window.localStorage.length).toBe(0);
  });
});
