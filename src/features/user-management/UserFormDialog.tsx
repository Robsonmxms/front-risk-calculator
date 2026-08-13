"use client";

import { FormEvent, useEffect, useState } from "react";
import { Alert } from "../../components/atoms/alert";
import { Button } from "../../components/atoms/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle
} from "../../components/atoms/dialog";
import { FieldError, Label } from "../../components/atoms/form";
import { Input } from "../../components/atoms/input";
import { Select } from "../../components/atoms/select";
import { ApiError } from "../../lib/api/client";
import type {
  CreateManagedUserInput,
  SafeUser,
  UpdateManagedUserInput,
  UserRole,
  UserStatus
} from "../../lib/contracts/auth";
import { createManagedUser, updateManagedUser } from "./userManagementApi";
import { roleCopy } from "./userManagementPresentation";

type FormValues = {
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  initialPassword: string;
};

export function UserFormDialog({
  open,
  mode,
  actorRole,
  targetRole,
  user,
  onOpenChange,
  onSaved
}: {
  open: boolean;
  mode: "create" | "edit";
  actorRole: UserRole;
  targetRole: UserRole;
  user?: SafeUser;
  onOpenChange: (open: boolean) => void;
  onSaved: (user: SafeUser, previousRole?: UserRole) => void;
}) {
  const [values, setValues] = useState<FormValues>(() => initialValues(targetRole, user));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(initialValues(targetRole, user));
      setFieldErrors({});
      setError(undefined);
      setConfirming(false);
    }
  }, [open, targetRole, user]);

  const close = (nextOpen: boolean) => {
    if (!nextOpen) {
      setValues((current) => ({ ...current, initialPassword: "" }));
    }
    onOpenChange(nextOpen);
  };

  const requiresConfirmation =
    mode === "edit" &&
    Boolean(
      user &&
      ((values.status === "disabled" && user.status !== "disabled") || values.role !== user.role)
    );

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    if (saving) return;
    if (requiresConfirmation && !confirming) {
      setConfirming(true);
      return;
    }

    setSaving(true);
    setError(undefined);
    setFieldErrors({});
    try {
      const saved =
        mode === "create"
          ? await createManagedUser({
              name: values.name,
              email: values.email,
              role: targetRole,
              status: values.status,
              initialPassword: values.initialPassword
            } satisfies CreateManagedUserInput)
          : await updateManagedUser(user!.id, {
              name: values.name,
              email: values.email,
              status: values.status,
              ...(actorRole === "admin" ? { role: values.role } : {})
            } satisfies UpdateManagedUserInput);
      setValues((current) => ({ ...current, initialPassword: "" }));
      onSaved(saved, user?.role);
      close(false);
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(messageForApiError(caught));
        setFieldErrors(extractFieldErrors(caught.details));
      } else {
        setError("Não foi possível salvar o cadastro. Tente novamente.");
      }
      setConfirming(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent aria-describedby="user-form-description">
        <DialogTitle>
          {mode === "create"
            ? `Novo ${roleCopy[targetRole].singularLower}`
            : `Editar ${roleCopy[user?.role ?? targetRole].singularLower}`}
        </DialogTitle>
        <DialogDescription id="user-form-description">
          {confirming
            ? "Revise o impacto da alteração antes de confirmar."
            : "Os dados são validados e as permissões aplicáveis são confirmadas pela plataforma."}
        </DialogDescription>

        {confirming && user ? (
          <div className="mt-5 space-y-4">
            <Alert variant="warning">
              <p className="font-semibold">Confirme a alteração de {user.name}.</p>
              <dl className="mt-3 grid gap-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt>Perfil atual</dt>
                  <dd className="font-medium">{roleCopy[user.role].singular}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Perfil resultante</dt>
                  <dd className="font-medium">{roleCopy[values.role].singular}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Status atual</dt>
                  <dd className="font-medium">
                    {user.status === "active" ? "Ativo" : "Desativado"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Status resultante</dt>
                  <dd className="font-medium">
                    {values.status === "active" ? "Ativo" : "Desativado"}
                  </dd>
                </div>
              </dl>
              <p className="mt-3">
                A alteração de perfil ou status encerra as sessões de renovação da pessoa afetada.
              </p>
            </Alert>
            {error ? <Alert variant="failure">{error}</Alert> : null}
            <DialogFooter>
              <Button variant="outline" disabled={saving} onClick={() => setConfirming(false)}>
                Voltar
              </Button>
              <Button
                variant={values.status === "disabled" ? "destructive" : "default"}
                disabled={saving}
                onClick={() => void submit()}
              >
                {saving ? "Salvando..." : "Confirmar alteração"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form className="mt-5 space-y-4" onSubmit={submit} noValidate>
            {error ? <Alert variant="failure">{error}</Alert> : null}
            <div>
              <Label htmlFor="managed-user-name">Nome</Label>
              <Input
                id="managed-user-name"
                className="mt-2"
                value={values.name}
                onChange={(event) => setValues({ ...values, name: event.target.value })}
                aria-invalid={Boolean(fieldErrors.name)}
                aria-describedby={fieldErrors.name ? "managed-user-name-error" : undefined}
                required
              />
              <div id="managed-user-name-error">
                <FieldError>{fieldErrors.name}</FieldError>
              </div>
            </div>
            <div>
              <Label htmlFor="managed-user-email">E-mail</Label>
              <Input
                id="managed-user-email"
                type="email"
                className="mt-2"
                value={values.email}
                onChange={(event) => setValues({ ...values, email: event.target.value })}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? "managed-user-email-error" : undefined}
                required
              />
              <div id="managed-user-email-error">
                <FieldError>{fieldErrors.email}</FieldError>
              </div>
            </div>
            {mode === "create" ? (
              <div>
                <Label htmlFor="managed-user-password">Senha inicial</Label>
                <Input
                  id="managed-user-password"
                  type="password"
                  autoComplete="new-password"
                  className="mt-2"
                  value={values.initialPassword}
                  onChange={(event) =>
                    setValues({ ...values, initialPassword: event.target.value })
                  }
                  aria-invalid={Boolean(fieldErrors.initialPassword)}
                  aria-describedby="managed-user-password-help managed-user-password-error"
                  required
                />
                <p id="managed-user-password-help" className="mt-1 text-xs text-muted-foreground">
                  Use 12 ou mais caracteres, com maiúscula, minúscula, número e símbolo.
                </p>
                <div id="managed-user-password-error">
                  <FieldError>{fieldErrors.initialPassword}</FieldError>
                </div>
              </div>
            ) : null}
            {mode === "edit" && actorRole === "admin" ? (
              <div>
                <Label htmlFor="managed-user-role">Perfil global</Label>
                <Select
                  id="managed-user-role"
                  className="mt-2"
                  value={values.role}
                  onChange={(event) =>
                    setValues({ ...values, role: event.target.value as UserRole })
                  }
                >
                  <option value="admin">Administrador</option>
                  <option value="analyst">Analista</option>
                  <option value="user">Usuário</option>
                </Select>
              </div>
            ) : null}
            <div>
              <Label htmlFor="managed-user-status">Status</Label>
              <Select
                id="managed-user-status"
                className="mt-2"
                value={values.status}
                onChange={(event) =>
                  setValues({ ...values, status: event.target.value as UserStatus })
                }
              >
                <option value="active">Ativo</option>
                <option value="disabled">Desativado</option>
              </Select>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" disabled={saving}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={saving}>
                {saving
                  ? "Salvando..."
                  : mode === "create"
                    ? "Criar cadastro"
                    : "Salvar alterações"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function initialValues(targetRole: UserRole, user?: SafeUser): FormValues {
  return {
    name: user?.name ?? "",
    email: user?.email ?? "",
    role: user?.role ?? targetRole,
    status: user?.status ?? "active",
    initialPassword: ""
  };
}

function extractFieldErrors(details: unknown): Record<string, string> {
  if (!details || typeof details !== "object" || !("fields" in details)) return {};
  const fields = (details as { fields?: unknown }).fields;
  if (!Array.isArray(fields)) return {};
  return Object.fromEntries(
    fields.flatMap((field) => {
      if (!field || typeof field !== "object") return [];
      const path = "path" in field ? String(field.path) : "";
      const message = "message" in field ? String(field.message) : "Campo inválido.";
      return path ? [[path, message]] : [];
    })
  );
}

function messageForApiError(error: ApiError): string {
  const messages: Record<string, string> = {
    "user.email_conflict": "Já existe um cadastro com este e-mail.",
    "user.self_management_forbidden": "Você não pode editar a própria conta neste fluxo.",
    "user.target_role_forbidden": "Você não tem autoridade para gerenciar este perfil.",
    "user.resulting_role_forbidden": "Você não tem autoridade para definir o perfil solicitado.",
    "user.last_active_admin_required":
      "A plataforma precisa manter ao menos um administrador ativo.",
    "user.not_found": "O cadastro não foi encontrado ou não está mais disponível."
  };
  return (
    messages[error.code] ?? "Não foi possível salvar o cadastro. Revise os dados e tente novamente."
  );
}
