"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "../../../components/layout/AppHeader";
import { Alert } from "../../../components/ui/alert";
import { Badge } from "../../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableViewport
} from "../../../components/ui/table";
import { ProtectedRoute } from "../../../features/auth/ProtectedRoute";
import { useAuth } from "../../../features/auth/AuthProvider";
import { LogoutButton } from "../../../features/auth/LogoutButton";
import { SafeUser, UserRole } from "../../../features/auth/types";
import { ApiError, apiFetch } from "../../../lib/api/client";
import {
  getApiErrorMessage,
  labelUserRole,
  labelUserStatus
} from "../../../lib/presentation";

const ADMIN_ROLES: UserRole[] = ["admin"];

export default function AdminPage() {
  const { actor, status } = useAuth();
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || actor?.role !== "admin") {
      setUsers([]);
      setError(null);
      setLoading(status === "loading");
      return;
    }

    let isActive = true;

    setLoading(true);
    setError(null);

    apiFetch<{ users: SafeUser[] }>("/admin/users")
      .then((data) => {
        if (isActive) {
          setUsers(data.users);
        }
      })
      .catch((caught: unknown) => {
        if (!isActive) {
          return;
        }

        if (caught instanceof ApiError) {
          setError(getApiErrorMessage(caught, "Não foi possível carregar os usuários."));
          return;
        }

        setError("Não foi possível carregar os usuários.");
      })
      .finally(() => {
        if (isActive) {
          setLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [actor?.id, actor?.role, status]);

  return (
    <ProtectedRoute roles={ADMIN_ROLES}>
      <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-5 lg:px-6">
        <AppHeader
          title="Administração"
          active="admin"
          showAdmin
          actions={
            <>
              {actor ? <Badge variant="outline">{labelUserRole(actor.role)}</Badge> : null}
              <LogoutButton />
            </>
          }
        />

        <section className="space-y-4 rounded-lg border border-border bg-card p-5 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase text-moss">Administração</p>
            <h1 className="text-2xl font-semibold text-stone-900">Usuários</h1>
            <p className="text-stone-600">Operação disponível apenas para administradores.</p>
          </div>

          {loading ? (
            <Alert variant="info">Buscando o cadastro seguro retornado pela plataforma.</Alert>
          ) : error ? (
            <Alert variant="failure">{error}</Alert>
          ) : users.length === 0 ? (
            <Alert variant="warning">
              A plataforma não retornou registros para esta consulta administrativa.
            </Alert>
          ) : (
            <TableViewport label="Usuários da plataforma">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium text-stone-900">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{labelUserRole(user.role)}</TableCell>
                      <TableCell>{labelUserStatus(user.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableViewport>
          )}
        </section>
      </main>
    </ProtectedRoute>
  );
}
