"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "../../components/atoms/alert";
import { Button } from "../../components/atoms/button";
import { Card } from "../../components/atoms/card";
import { FieldError, Label } from "../../components/atoms/form";
import { Input } from "../../components/atoms/input";
import { useAuth } from "./AuthProvider";

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [safeError, setSafeError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const submissionInFlight = useRef(false);

  useEffect(() => {
    if (safeError) {
      errorSummaryRef.current?.focus();
    }
  }, [safeError]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionInFlight.current) {
      return;
    }

    const nextErrors: { email?: string; password?: string } = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Informe um e-mail válido.";
    }
    if (password.length < 8) {
      nextErrors.password = "A senha deve ter pelo menos 8 caracteres.";
    }

    setFieldErrors(nextErrors);
    setSafeError(null);

    if (nextErrors.email || nextErrors.password) {
      if (nextErrors.email) {
        emailRef.current?.focus();
      } else {
        passwordRef.current?.focus();
      }
      return;
    }

    submissionInFlight.current = true;
    setSubmitting(true);
    try {
      await login({ email, password });
      router.replace("/dashboard");
    } catch {
      setSafeError("Não foi possível entrar com essas credenciais.");
    } finally {
      submissionInFlight.current = false;
      setSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-[30rem] p-6 shadow-md sm:p-8">
      <form
        aria-describedby={safeError ? "login-credentials-error" : undefined}
        aria-busy={submitting}
        className="space-y-6"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold text-stone-900">Acessar plataforma</h2>
          <p className="text-sm text-muted-foreground">
            Entre para acompanhar portfólios, movimentações e análises de risco.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            ref={emailRef}
            autoComplete="email"
            inputMode="email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            value={email}
            className="h-11"
            aria-describedby={
              fieldErrors.email ? "email-error" : safeError ? "login-credentials-error" : undefined
            }
            aria-invalid={Boolean(fieldErrors.email || safeError)}
          />
          <div id="email-error">
            <FieldError>{fieldErrors.email}</FieldError>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            ref={passwordRef}
            autoComplete="current-password"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            value={password}
            className="h-11"
            aria-describedby={
              fieldErrors.password
                ? "password-error"
                : safeError
                  ? "login-credentials-error"
                  : undefined
            }
            aria-invalid={Boolean(fieldErrors.password || safeError)}
          />
          <div id="password-error">
            <FieldError>{fieldErrors.password}</FieldError>
          </div>
        </div>

        {safeError ? (
          <div
            id="login-credentials-error"
            ref={errorSummaryRef}
            tabIndex={-1}
            className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember/25"
          >
            <Alert variant="failure">{safeError}</Alert>
          </div>
        ) : null}

        <Button disabled={submitting} type="submit" size="lg" className="w-full">
          {submitting ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </Card>
  );
}
