"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { FieldError, Label } from "../../components/ui/form";
import { Input } from "../../components/ui/input";
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
      setFieldError("Informe e-mail e senha válidos.");
      return;
    }

    setSubmitting(true);
    try {
      await login({ email, password });
      router.replace("/dashboard");
    } catch {
      setSafeError("Não foi possível entrar com essas credenciais.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    setSafeError(null);
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const googleIdentity = window.google?.accounts?.id;

    if (!clientId || !googleIdentity) {
      setSafeError("Login com Google indisponível neste ambiente.");
      return;
    }

    googleIdentity.initialize({
      client_id: clientId,
      callback: async ({ credential }) => {
        if (!credential) {
          setSafeError("Login com Google indisponível neste ambiente.");
          return;
        }

        try {
          await loginWithGoogleCredential(credential);
          router.replace("/dashboard");
        } catch {
          setSafeError("Não foi possível entrar com Google.");
        }
      }
    });
    googleIdentity.prompt();
  }

  return (
    <Card className="w-full max-w-md">
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase text-moss">
            Risk Calculator
          </p>
          <h1 className="text-3xl font-semibold text-stone-900">Acessar plataforma</h1>
          <p className="text-sm text-muted-foreground">
            Entre para acompanhar portfolios, ledger e analytics de risco.
          </p>
        </div>

        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            autoComplete="email"
            inputMode="email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            value={email}
            className="mt-2"
            aria-invalid={Boolean(fieldError)}
          />
        </div>

        <div>
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            autoComplete="current-password"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            value={password}
            className="mt-2"
            aria-invalid={Boolean(fieldError)}
          />
        </div>

        <FieldError>{fieldError ?? undefined}</FieldError>
        {safeError ? <Alert variant="failure">{safeError}</Alert> : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button disabled={submitting} type="submit" className="sm:flex-1">
            {submitting ? "Entrando..." : "Entrar"}
          </Button>
          <Button variant="outline" onClick={handleGoogleLogin} type="button" className="sm:flex-1">
            Google
          </Button>
        </div>
      </form>
    </Card>
  );
}
