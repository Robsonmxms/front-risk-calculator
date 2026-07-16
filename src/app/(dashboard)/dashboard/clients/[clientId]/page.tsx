"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppHeader } from "../../../../../components/layout/AppHeader";
import { Alert } from "../../../../../components/ui/alert";
import { Badge } from "../../../../../components/ui/badge";
import { Button } from "../../../../../components/ui/button";
import { Card } from "../../../../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "../../../../../components/ui/table";
import { useAuth } from "../../../../../features/auth/AuthProvider";
import { LogoutButton } from "../../../../../features/auth/LogoutButton";
import { ProtectedRoute } from "../../../../../features/auth/ProtectedRoute";
import { getClient, updateClient } from "../../../../../features/client/clientApi";
import { ClientDetail } from "../../../../../features/client/types";
import { ApiError } from "../../../../../lib/api/client";

export default function ClientDetailPage() {
  const { actor, activeOffice } = useAuth();
  const params = useParams<{ clientId: string }>();
  const clientId = params.clientId;
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    setLoading(true);
    setError(null);

    getClient(clientId)
      .then((data) => {
        if (isActive) {
          setClient(data);
        }
      })
      .catch((caught) => {
        if (isActive) {
          setError(getMessage(caught, "Não foi possível carregar o cliente."));
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
  }, [clientId]);

  async function handleArchive() {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await updateClient(clientId, { status: "archived" });
      setClient(updated);
      setNotice("Cliente arquivado.");
    } catch (caught) {
      setError(getMessage(caught, "Não foi possível arquivar o cliente."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProtectedRoute roles={["admin", "analyst", "user"]}>
      <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-5 lg:px-6">
        <AppHeader
          title="Client detail"
          active="clients"
          showAdmin={actor?.role === "admin"}
          actions={
            <>
              {activeOffice ? <Badge variant="outline">{activeOffice.officeName}</Badge> : null}
              <LogoutButton />
            </>
          }
        />

        {loading ? (
          <Alert variant="info">Carregando cliente.</Alert>
        ) : error ? (
          <Alert variant="failure">{error}</Alert>
        ) : !client ? (
          <Alert variant="warning">Cliente não encontrado.</Alert>
        ) : (
          <section className="grid gap-4 lg:grid-cols-[360px_1fr]">
            <Card>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-moss">Cliente</p>
                <h1 className="text-3xl font-semibold text-stone-900">{client.name}</h1>
                <p className="text-sm text-stone-600">{client.email}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={client.status === "archived" ? "outline" : "default"}>
                    {client.status}
                  </Badge>
                  <Badge variant="outline">{client.onboardingStatus}</Badge>
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm text-stone-700">
                <p>
                  <span className="font-medium text-stone-900">Household:</span>{" "}
                  {client.householdName ?? "Sem household"}
                </p>
                <p>
                  <span className="font-medium text-stone-900">Advisor:</span>{" "}
                  {client.advisorName ?? "Sem advisor"}
                </p>
                <p>
                  <span className="font-medium text-stone-900">Documento:</span>{" "}
                  {client.documentLabel ?? "Não informado"}
                </p>
                <p>
                  <span className="font-medium text-stone-900">Perfil:</span>{" "}
                  {client.riskProfileDescriptor}
                </p>
                {client.notes ? <p>{client.notes}</p> : null}
              </div>

              {notice ? <Alert variant="info" className="mt-5">{notice}</Alert> : null}
              <Button
                type="button"
                className="mt-5"
                variant="outline"
                disabled={saving || client.status === "archived"}
                onClick={handleArchive}
              >
                Arquivar cliente
              </Button>
            </Card>

            <div className="grid gap-4">
              {client.status === "archived" ? (
                <Alert variant="warning">
                  Cliente arquivado permanece disponível para consulta histórica.
                </Alert>
              ) : null}

              <Card>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase text-moss">Portfolios</p>
                    <h2 className="text-xl font-semibold text-stone-900">Vínculos do cliente</h2>
                  </div>
                  <Badge variant="outline">{client.portfolios.length} portfolios</Badge>
                </div>

                <div className="mt-5 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Portfolio</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Analytics</TableHead>
                        <TableHead>Market data</TableHead>
                        <TableHead>Transactions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {client.portfolios.map((portfolio) => (
                        <TableRow key={portfolio.id}>
                          <TableCell className="font-medium text-stone-900">
                            <Link href={`/dashboard/portfolios/${portfolio.id}`} className="hover:text-moss">
                              {portfolio.name}
                            </Link>
                            <p className="text-xs text-stone-500">{portfolio.accountName}</p>
                          </TableCell>
                          <TableCell>{portfolio.status}</TableCell>
                          <TableCell>{portfolio.analyticsState}</TableCell>
                          <TableCell>{portfolio.marketDataState}</TableCell>
                          <TableCell>{portfolio.transactionCount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>

              <Card>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase text-moss">Accounts</p>
                    <h2 className="text-xl font-semibold text-stone-900">Contas vinculadas</h2>
                  </div>
                  <Badge variant="outline">{client.accounts.length} contas</Badge>
                </div>
                <div className="mt-5 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Conta</TableHead>
                        <TableHead>Portfolios</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {client.accounts.map((account) => (
                        <TableRow key={account.id}>
                          <TableCell className="font-medium text-stone-900">{account.name}</TableCell>
                          <TableCell>{account.portfolioCount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>
          </section>
        )}
      </main>
    </ProtectedRoute>
  );
}

function getMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.message;
  }
  return fallback;
}
