"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export function LoginForm() {
  const router = useRouter();
  const { login, loginWithGoogleCredential } = useAuth();
  const [email, setEmail] = useState("user@example.com");
  const [password, setPassword] = useState("Password123!");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [safeError, setSafeError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldError(null);
    setSafeError(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) {
      setFieldError("Informe email e senha validos.");
      return;
    }

    setSubmitting(true);
    try {
      await login({ email, password });
      router.replace("/dashboard");
    } catch {
      setSafeError("Nao foi possivel entrar com essas credenciais.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    setSafeError(null);
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const googleIdentity = window.google?.accounts?.id;

    if (!clientId || !googleIdentity) {
      setSafeError("Google login indisponivel neste ambiente.");
      return;
    }

    googleIdentity.initialize({
      client_id: clientId,
      callback: async ({ credential }) => {
        if (!credential) {
          setSafeError("Google login indisponivel neste ambiente.");
          return;
        }

        try {
          await loginWithGoogleCredential(credential);
          router.replace("/dashboard");
        } catch {
          setSafeError("Nao foi possivel entrar com Google.");
        }
      }
    });
    googleIdentity.prompt();
  }

  return (
    <form className="login-panel" onSubmit={handleSubmit} noValidate>
      <div className="login-panel__heading">
        <p className="eyebrow">Risk Calculator</p>
        <h1>Acessar plataforma</h1>
      </div>

      <label>
        <span>Email</span>
        <input
          autoComplete="email"
          inputMode="email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          value={email}
        />
      </label>

      <label>
        <span>Senha</span>
        <input
          autoComplete="current-password"
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          value={password}
        />
      </label>

      {fieldError ? <p className="form-message form-message--warning">{fieldError}</p> : null}
      {safeError ? <p className="form-message form-message--danger">{safeError}</p> : null}

      <button className="button button--primary" disabled={submitting} type="submit">
        {submitting ? "Entrando..." : "Entrar"}
      </button>
      <button className="button button--secondary" onClick={handleGoogleLogin} type="button">
        Google
      </button>
    </form>
  );
}
