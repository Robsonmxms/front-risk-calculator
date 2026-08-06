import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LoginPage from "../../src/app/(auth)/login/page";
import { AuthProvider } from "../../src/features/auth/AuthProvider";
import { clearSession } from "../../src/features/auth/sessionStore";
import { AuthSession } from "../../src/features/auth/types";

const authApiMocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  loginWithPassword: vi.fn(),
  logout: vi.fn()
}));

const routerMocks = vi.hoisted(() => ({
  replace: vi.fn()
}));

vi.mock("next/font/google", () => ({
  Cormorant_Garamond: () => ({ className: "premium-display-font" })
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMocks
}));

vi.mock("../../src/features/auth/authApi", () => authApiMocks);

const session: AuthSession = {
  accessToken: "access-token",
  refreshToken: "refresh-token",
  actor: {
    id: "usr_user",
    email: "user@risk.local",
    name: "Usuário",
    role: "user",
    officeMemberships: [],
    accountMemberships: []
  }
};

describe("password-only login page", () => {
  beforeEach(() => {
    clearSession();
    window.sessionStorage.clear();
    window.localStorage.clear();
    authApiMocks.getCurrentUser.mockReset();
    authApiMocks.loginWithPassword.mockReset();
    authApiMocks.logout.mockReset();
    routerMocks.replace.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the brand before the right-side password form without legacy trust content", () => {
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );

    const wordmark = screen.getByRole("heading", { name: "Risk Calculator" });
    const formHeading = screen.getByRole("heading", { name: "Acessar plataforma" });
    const formRegion = screen.getByRole("region", { name: "Acesso à plataforma" });

    expect(wordmark).toHaveClass("premium-display-font");
    expect(
      wordmark.compareDocumentPosition(formRegion) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(formRegion).toHaveClass("lg:justify-end");
    expect(formHeading).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.queryByText("Sessão")).not.toBeInTheDocument();
    expect(screen.queryByText("Dados")).not.toBeInTheDocument();
    expect(screen.queryByText("Ambiente")).not.toBeInTheDocument();
    expect(screen.queryByText("Google")).not.toBeInTheDocument();
  });

  it("associates validation errors and focuses the first invalid field", () => {
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    const email = screen.getByLabelText("E-mail");
    const password = screen.getByLabelText("Senha");
    expect(email).toHaveFocus();
    expect(email).toHaveAttribute("aria-describedby", "email-error");
    expect(password).toHaveAttribute("aria-describedby", "password-error");
    expect(screen.getByText("Informe um e-mail válido.")).toBeInTheDocument();
    expect(screen.getByText("A senha deve ter pelo menos 8 caracteres.")).toBeInTheDocument();
    expect(authApiMocks.loginWithPassword).not.toHaveBeenCalled();
  });

  it("announces rejected credentials and keeps password submission single-flight", async () => {
    let rejectLogin: ((reason?: unknown) => void) | undefined;
    authApiMocks.loginWithPassword.mockImplementationOnce(
      () =>
        new Promise<AuthSession>((_resolve, reject) => {
          rejectLogin = reject;
        })
    );

    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );

    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "user@risk.local" }
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "Password123!" }
    });

    const submitButton = screen.getByRole("button", { name: "Entrar" });
    const form = submitButton.closest("form") as HTMLFormElement;
    fireEvent.submit(form);
    fireEvent.submit(form);

    expect(authApiMocks.loginWithPassword).toHaveBeenCalledTimes(1);
    expect(submitButton).toBeDisabled();

    rejectLogin?.(new Error("invalid credentials"));

    const error = await screen.findByText("Não foi possível entrar com essas credenciais.");
    await waitFor(() => expect(error.parentElement).toHaveFocus());
    expect(screen.getByLabelText("E-mail")).toHaveAttribute(
      "aria-describedby",
      "login-credentials-error"
    );
    expect(routerMocks.replace).not.toHaveBeenCalled();
  });

  it("redirects once after a successful password login", async () => {
    authApiMocks.loginWithPassword.mockResolvedValueOnce(session);

    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );

    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "user@risk.local" }
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "Password123!" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(authApiMocks.loginWithPassword).toHaveBeenCalledWith({
        email: "user@risk.local",
        password: "Password123!"
      });
      expect(routerMocks.replace).toHaveBeenCalledTimes(1);
      expect(routerMocks.replace).toHaveBeenCalledWith("/dashboard");
    });
  });
});
