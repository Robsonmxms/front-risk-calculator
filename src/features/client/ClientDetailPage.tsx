"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppHeader, LogoutButton, ProtectedRoute, useAuth } from "../auth";
import { Alert } from "../../components/atoms/alert";
import { Badge } from "../../components/atoms/badge";
import { Button } from "../../components/atoms/button";
import { Card } from "../../components/atoms/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableViewport
} from "../../components/atoms/table";
import { getClient, updateClient } from "./clientApi";
import { ClientDetail } from "./types";
import {
  clientStatusVariant,
  getApiErrorMessage,
  labelClientStatus,
  labelOnboardingStatus,
  labelPortfolioStatus,
  labelProcessingState
} from "../../lib/presentation";

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
          setError(getApiErrorMessage(caught, "Não foi possível carregar o cliente."));
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
      setError(getApiErrorMessage(caught, "Não foi possível arquivar o cliente."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProtectedRoute roles={["admin", "analyst", "user"]}>
      <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-5 lg:px-6">
        <AppHeader
          title="Detalhe do cliente"
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
                  <Badge variant={clientStatusVariant(client.status)}>
                    {labelClientStatus(client.status)}
                  </Badge>
                  <Badge variant="outline">{labelOnboardingStatus(client.onboardingStatus)}</Badge>
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm text-stone-700">
                <p>
                  <span className="font-medium text-stone-900">Grupo familiar:</span>{" "}
                  {client.householdName ?? "Sem grupo familiar"}
                </p>
                <p>
                  <span className="font-medium text-stone-900">Assessor:</span>{" "}
                  {client.advisorName ?? "Sem assessor"}
                </p>
                <p>
                  <span className="font-medium text-stone-900">Documento:</span>{" "}
                  {client.documentLabel ?? "Não informado"}
                </p>
                <p>
                  <span className="font-medium text-stone-900">Perfil:</span>{" "}
                  {client.riskProfileDescriptor || "Não informado"}
                </p>
                {client.notes ? <p>{client.notes}</p> : null}
              </div>

              {notice ? (
                <Alert variant="info" className="mt-5">
                  {notice}
                </Alert>
              ) : null}
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
                    <p className="text-xs font-semibold uppercase text-moss">Portfólios</p>
                    <h2 className="text-xl font-semibold text-stone-900">Vínculos do cliente</h2>
                  </div>
                  <Badge variant="outline">{client.portfolios.length} portfólios</Badge>
                </div>

                <TableViewport className="mt-5" label="Portfólios vinculados ao cliente">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Portfólio</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Análises</TableHead>
                        <TableHead>Dados de mercado</TableHead>
                        <TableHead>Transações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {client.portfolios.map((portfolio) => (
                        <TableRow key={portfolio.id}>
                          <TableCell className="font-medium text-stone-900">
                            <Link
                              href={`/dashboard/portfolios/${portfolio.id}`}
                              className="hover:text-moss"
                            >
                              {portfolio.name}
                            </Link>
                            <p className="text-xs text-stone-500">{portfolio.accountName}</p>
                          </TableCell>
                          <TableCell>{labelPortfolioStatus(portfolio.status)}</TableCell>
                          <TableCell>{labelProcessingState(portfolio.analyticsState)}</TableCell>
                          <TableCell>{labelProcessingState(portfolio.marketDataState)}</TableCell>
                          <TableCell>{portfolio.transactionCount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableViewport>
              </Card>

              <Card>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase text-moss">Contas</p>
                    <h2 className="text-xl font-semibold text-stone-900">Contas vinculadas</h2>
                  </div>
                  <Badge variant="outline">{client.accounts.length} contas</Badge>
                </div>
                <TableViewport className="mt-5" label="Contas vinculadas ao cliente">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Conta</TableHead>
                        <TableHead>Portfólios</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {client.accounts.map((account) => (
                        <TableRow key={account.id}>
                          <TableCell className="font-medium text-stone-900">
                            {account.name}
                          </TableCell>
                          <TableCell>{account.portfolioCount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableViewport>
              </Card>
            </div>
          </section>
        )}
      </main>
    </ProtectedRoute>
  );
}
