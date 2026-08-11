"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "../../components/atoms/alert";
import { Badge } from "../../components/atoms/badge";
import { Button, LinkButton } from "../../components/atoms/button";
import { Card } from "../../components/atoms/card";
import { Label } from "../../components/atoms/form";
import { Input } from "../../components/atoms/input";
import { Select } from "../../components/atoms/select";
import { UserRoster } from "../../components/organisms/UserRoster";
import { ApiError } from "../../lib/api/client";
import type { SafeUser, UserPagination, UserRole, UserStatus } from "../../lib/contracts/auth";
import { AppHeader, LogoutButton, ProtectedRoute, useAuth } from "../auth";
import { UserFormDialog } from "./UserFormDialog";
import { listManagedUsers } from "./userManagementApi";
import { roleCopy, roleRosterPath } from "./userManagementPresentation";

const EMPTY_PAGINATION: UserPagination = {
  page: 1,
  per_page: 20,
  total_items: 0,
  total_pages: 0,
  has_next: false,
  has_prev: false
};

export function UserManagementPage({ targetRole }: { targetRole: UserRole }) {
  const { actor, status } = useAuth();
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<{
    message: string;
    resultingRole?: UserRole;
  }>();
  const [reloadKey, setReloadKey] = useState(0);
  const [creating, setCreating] = useState(false);
  const [editingUser, setEditingUser] = useState<SafeUser>();
  const requestSequence = useRef(0);
  const allowedRoles = useMemo<UserRole[]>(
    () => (targetRole === "user" ? ["admin", "analyst"] : ["admin"]),
    [targetRole]
  );
  const rosterRoles = useMemo<UserRole[]>(
    () => (actor?.role === "admin" ? ["admin", "analyst", "user"] : ["user"]),
    [actor?.role]
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    if (status !== "authenticated" || !actor || !allowedRoles.includes(actor.role)) {
      setUsers([]);
      setLoading(status === "loading");
      return;
    }

    const sequence = ++requestSequence.current;
    const controller = new AbortController();
    setLoading(true);
    setError(undefined);
    listManagedUsers({
      role: targetRole,
      search: search || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
      page,
      perPage: 20,
      signal: controller.signal
    })
      .then((response) => {
        if (sequence !== requestSequence.current) return;
        setUsers(response.data);
        setPagination(response.meta?.pagination ?? EMPTY_PAGINATION);
      })
      .catch((caught) => {
        if (controller.signal.aborted || sequence !== requestSequence.current) return;
        setUsers([]);
        setPagination(EMPTY_PAGINATION);
        setError(listErrorMessage(caught));
      })
      .finally(() => {
        if (sequence === requestSequence.current) setLoading(false);
      });

    return () => controller.abort();
  }, [actor, allowedRoles, page, reloadKey, search, status, statusFilter, targetRole]);

  const rosterItems = useMemo(
    () =>
      users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        roleLabel: roleCopy[user.role].singular,
        statusLabel: user.status === "active" ? "Ativo" : "Desativado",
        status: user.status,
        isSelf: user.id === actor?.id
      })),
    [actor?.id, users]
  );

  const saved = (savedUser: SafeUser, previousRole?: UserRole) => {
    const roleChanged = previousRole && previousRole !== savedUser.role;
    setSuccess({
      message: roleChanged
        ? `${savedUser.name} agora está no perfil ${roleCopy[savedUser.role].singular}.`
        : `Cadastro de ${savedUser.name} salvo com sucesso.`,
      resultingRole: roleChanged ? savedUser.role : undefined
    });
    if (roleChanged) {
      setUsers((current) => current.filter((user) => user.id !== savedUser.id));
    }
    setReloadKey((current) => current + 1);
  };

  return (
    <ProtectedRoute roles={allowedRoles}>
      <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-5 lg:px-6">
        <AppHeader
          title="Gestão de usuários"
          active="users"
          actions={
            <>
              {actor ? <Badge variant="outline">{roleCopy[actor.role].singular}</Badge> : null}
              <LogoutButton />
            </>
          }
        />

        <nav aria-label="Perfis de usuários" className="flex flex-wrap gap-2">
          {rosterRoles.map((role) => (
            <LinkButton
              key={role}
              href={roleRosterPath(role)}
              variant={role === targetRole ? "default" : "outline"}
              aria-current={role === targetRole ? "page" : undefined}
            >
              {roleCopy[role].plural}
            </LinkButton>
          ))}
        </nav>

        <Card className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-moss">
                Perfis globais
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-stone-900">
                {roleCopy[targetRole].plural}
              </h1>
              <p className="mt-1 max-w-2xl text-stone-600">{roleCopy[targetRole].description}</p>
            </div>
            <Button onClick={() => setCreating(true)}>
              Novo {roleCopy[targetRole].singularLower}
            </Button>
          </div>

          {success ? (
            <Alert variant="success" aria-live="polite">
              {success.message}{" "}
              {success.resultingRole ? (
                <Link
                  className="font-semibold underline underline-offset-2"
                  href={roleRosterPath(success.resultingRole)}
                >
                  Abrir {roleCopy[success.resultingRole].plural}.
                </Link>
              ) : null}
            </Alert>
          ) : null}

          <div className="grid gap-4 rounded-lg border border-border bg-muted/20 p-4 sm:grid-cols-[minmax(0,1fr)_220px]">
            <div>
              <Label htmlFor="user-roster-search">Buscar por nome ou e-mail</Label>
              <Input
                id="user-roster-search"
                type="search"
                className="mt-2"
                placeholder={`Buscar em ${roleCopy[targetRole].plural.toLowerCase()}`}
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="user-roster-status">Status</Label>
              <Select
                id="user-roster-status"
                className="mt-2"
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value as UserStatus | "all");
                  setPage(1);
                }}
              >
                <option value="all">Todos os status</option>
                <option value="active">Ativos</option>
                <option value="disabled">Desativados</option>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {loading
                ? "Atualizando resultado..."
                : `${pagination.total_items} ${pagination.total_items === 1 ? "cadastro encontrado" : "cadastros encontrados"}`}
            </p>
            {search || statusFilter !== "all" ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                  setStatusFilter("all");
                  setPage(1);
                }}
              >
                Limpar filtros
              </Button>
            ) : null}
          </div>

          <UserRoster
            users={rosterItems}
            loading={loading}
            error={error}
            emptyMessage={`Nenhum ${roleCopy[targetRole].singularLower} encontrado com os filtros selecionados.`}
            onEdit={(userId) => setEditingUser(users.find((user) => user.id === userId))}
            onRetry={() => setReloadKey((current) => current + 1)}
          />

          {!loading && !error && pagination.total_pages > 1 ? (
            <nav
              aria-label={`Paginação de ${roleCopy[targetRole].plural.toLowerCase()}`}
              className="flex items-center justify-between border-t border-border pt-4"
            >
              <Button
                variant="outline"
                disabled={!pagination.has_prev}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {pagination.page} de {pagination.total_pages}
              </span>
              <Button
                variant="outline"
                disabled={!pagination.has_next}
                onClick={() => setPage((current) => current + 1)}
              >
                Próxima
              </Button>
            </nav>
          ) : null}
        </Card>

        {actor ? (
          <>
            <UserFormDialog
              open={creating}
              mode="create"
              actorRole={actor.role}
              targetRole={targetRole}
              onOpenChange={setCreating}
              onSaved={saved}
            />
            <UserFormDialog
              open={Boolean(editingUser)}
              mode="edit"
              actorRole={actor.role}
              targetRole={targetRole}
              user={editingUser}
              onOpenChange={(open) => {
                if (!open) setEditingUser(undefined);
              }}
              onSaved={saved}
            />
          </>
        ) : null}
      </main>
    </ProtectedRoute>
  );
}

function listErrorMessage(caught: unknown): string {
  if (caught instanceof ApiError) {
    if (
      caught.code === "user.management_forbidden" ||
      caught.code === "user.target_role_forbidden"
    ) {
      return "Você não tem autoridade para consultar este perfil de usuário.";
    }
  }
  return "Não foi possível carregar os cadastros. Tente novamente.";
}
