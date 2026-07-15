"use client";

import { FormEvent, useState } from "react";
import { Alert, Button, Card, Label, TextInput } from "flowbite-react";
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
    <Card className="w-full max-w-md border-gray-200 bg-white shadow-sm">
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase text-teal-700">
            Risk Calculator
          </p>
          <h1 className="text-3xl font-semibold text-stone-900">Acessar plataforma</h1>
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <TextInput
            id="email"
            autoComplete="email"
            inputMode="email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            value={email}
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="password">Senha</Label>
          <TextInput
            id="password"
            autoComplete="current-password"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            value={password}
            className="mt-2"
          />
        </div>

        {fieldError ? <Alert color="warning">{fieldError}</Alert> : null}
        {safeError ? <Alert color="failure">{safeError}</Alert> : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button color="teal" disabled={submitting} type="submit" className="sm:flex-1">
            {submitting ? "Entrando..." : "Entrar"}
          </Button>
          <Button color="light" onClick={handleGoogleLogin} type="button" className="sm:flex-1">
            Google
          </Button>
        </div>
      </form>
    </Card>
  );
}
