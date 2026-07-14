"use client";

import { AppShell } from "../../../components/layout/AppShell";
import { ProtectedRoute } from "../../../features/auth/ProtectedRoute";
import { useAuth } from "../../../features/auth/AuthProvider";

export default function DashboardPage() {
  const { actor } = useAuth();

  return (
    <ProtectedRoute roles={["admin", "analyst", "user"]}>
      <AppShell>
        <section className="dashboard-grid">
          <div className="summary-panel">
            <p className="eyebrow">Sessao ativa</p>
            <h2>{actor?.name}</h2>
            <p className="muted">
              {actor?.email} · papel {actor?.role}
            </p>
          </div>

          <div className="summary-panel summary-panel--accent">
            <p className="eyebrow">Autorizacao</p>
            <h2>{actor?.accountMemberships.length ?? 0}</h2>
            <p className="muted">contas disponiveis para esta sessao</p>
          </div>
        </section>

        <section className="data-section">
          <div className="section-heading">
            <h2>Contas acessiveis</h2>
            <p className="muted">Acesso efetivo recebido do backend.</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Conta</th>
                <th>Papel na conta</th>
              </tr>
            </thead>
            <tbody>
              {actor?.accountMemberships.map((membership) => (
                <tr key={membership.accountId}>
                  <td>{membership.accountName}</td>
                  <td>{membership.role}</td>
                </tr>
              ))}
              {actor?.accountMemberships.length === 0 ? (
                <tr>
                  <td colSpan={2}>Nenhuma conta vinculada.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </section>
      </AppShell>
    </ProtectedRoute>
  );
}
