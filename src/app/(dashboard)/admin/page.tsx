"use client";

import { useEffect, useState } from "react";
import { AppShell } from "../../../components/layout/AppShell";
import { ProtectedRoute } from "../../../features/auth/ProtectedRoute";
import { SafeUser } from "../../../features/auth/types";
import { apiFetch } from "../../../lib/api/client";

export default function AdminPage() {
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ users: SafeUser[] }>("/admin/users")
      .then((data) => setUsers(data.users))
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
            <p className="muted">Carregando...</p>
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
