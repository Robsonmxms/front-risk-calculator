"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "../../../../components/layout/AppHeader";
import { Alert } from "../../../../components/ui/alert";
import { Badge } from "../../../../components/ui/badge";
import { Card } from "../../../../components/ui/card";
import { useAuth } from "../../../../features/auth/AuthProvider";
import { LogoutButton } from "../../../../features/auth/LogoutButton";
import { ProtectedRoute } from "../../../../features/auth/ProtectedRoute";
import { getClientPortal } from "../../../../features/delivery/deliveryApi";
import { ClientPortalReadModel } from "../../../../features/delivery/types";
import { ApiError } from "../../../../lib/api/client";

export default function ClientPortalPage() {
  const { actor, activeOffice } = useAuth();
  const [portal, setPortal] = useState<ClientPortalReadModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    setLoading(true);
    setError(null);
    getClientPortal()
      .then((data) => {
        if (isActive) {
          setPortal(data);
        }
      })
      .catch((caught) => {
        if (isActive) {
          setError(getMessage(caught, "Não foi possível carregar o portal."));
        }
      })
      .finally(() => {
        if (isActive) {
          setLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [actor?.id]);

  return (
    <ProtectedRoute roles={["admin", "analyst", "user"]}>
      <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-5 lg:px-6">
        <AppHeader
          title="Client portal"
          active="clientPortal"
          showAdmin={actor?.role === "admin"}
          actions={
            <>
              {activeOffice ? <Badge variant="outline">{activeOffice.officeName}</Badge> : null}
              <LogoutButton />
            </>
          }
        />

        {loading ? (
          <Alert variant="info">Carregando portal.</Alert>
        ) : error ? (
          <Alert variant="failure">{error}</Alert>
        ) : !portal ? (
          <Alert variant="warning">Portal indisponível.</Alert>
        ) : (
          <section className="grid gap-4">
            <section className="grid gap-4 md:grid-cols-3">
              <MetricCard label="Clientes" value={portal.clients.length} />
              <MetricCard label="Pacotes" value={portal.packages.length} />
              <MetricCard
                label="Visualizados"
                value={portal.packages.filter((entry) => entry.status === "viewed").length}
              />
            </section>

            {portal.packages.length === 0 ? (
              <Alert variant="info">Nenhum pacote entregue disponível.</Alert>
            ) : (
              <section className="grid gap-4 lg:grid-cols-2">
                {portal.packages.map((reportPackage) => (
                  <Card key={reportPackage.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase text-moss">Entrega</p>
                        <h1 className="text-2xl font-semibold text-stone-900">
                          {reportPackage.title}
                        </h1>
                        <p className="mt-2 text-sm text-stone-600">{reportPackage.summaryNotes}</p>
                      </div>
                      <Badge variant="success">{reportPackage.status}</Badge>
                    </div>

                    <div className="mt-5 grid gap-3">
                      {reportPackage.portfolios.map((portfolio) => (
                        <Link
                          key={portfolio.id}
                          href={`/dashboard/portfolios/${portfolio.id}`}
                          className="rounded-md border border-border p-3 text-sm hover:border-moss"
                        >
                          <span className="block font-medium text-stone-900">{portfolio.name}</span>
                          <span className="text-stone-500">
                            {portfolio.status} · {portfolio.freshness} · {portfolio.baseCurrency}
                          </span>
                        </Link>
                      ))}
                    </div>

                    <div className="mt-5 grid gap-2">
                      {reportPackage.items.map((item) => (
                        <div
                          key={item.id ?? `${item.type}:${item.title}`}
                          className="flex items-center justify-between gap-3 rounded-md bg-muted/50 px-3 py-2 text-sm"
                        >
                          <span className="font-medium text-stone-800">{item.title}</span>
                          <Badge variant={item.status === "ready" ? "outline" : "warning"}>
                            {item.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </section>
            )}
          </section>
        )}
      </main>
    </ProtectedRoute>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <span className="text-xs font-semibold uppercase text-stone-500">{label}</span>
      <strong className="text-3xl text-stone-900">{value}</strong>
    </Card>
  );
}

function getMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.message;
  }
  return fallback;
}
