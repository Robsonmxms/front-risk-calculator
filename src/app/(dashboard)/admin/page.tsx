"use client";

import { useEffect, useState } from "react";
import { AppShell } from "../../../components/layout/AppShell";
import { StatePanel } from "../../../components/status/StatePanel";
import { ProtectedRoute } from "../../../features/auth/ProtectedRoute";
import { SafeUser } from "../../../features/auth/types";
import { ApiError, apiFetch } from "../../../lib/api/client";

export default function AdminPage() {
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ users: SafeUser[] }>("/admin/users")
      .then((data) => setUsers(data.users))
      .catch((caught: unknown) => {
        if (caught instanceof ApiError) {
          setError(`${caught.message} (${caught.code})`);
          return;
        }

        setError("Nao foi possivel carregar os usuarios.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedRoute roles={["admin"]}>
      <AppShell>
        <section className="data-section">
          <div className="section-heading">
            <h2>Usuarios</h2>
            <p className="muted">Operacao disponivel apenas para admin.</p>
          </div>
          {loading ? (
            <StatePanel
              tone="loading"
              title="Carregando usuarios"
              description="Buscando o cadastro seguro retornado pelo backend."
            />
          ) : error ? (
            <StatePanel
              tone="error"
              title="Falha ao carregar usuarios"
              description={error}
            />
          ) : users.length === 0 ? (
            <StatePanel
              tone="empty"
              title="Nenhum usuario encontrado"
              description="O backend nao retornou registros para esta consulta administrativa."
            />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Papel</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>{user.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </AppShell>
    </ProtectedRoute>
  );
}
