"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppHeader, LogoutButton, ProtectedRoute, useAuth } from "../auth";
import { Alert } from "../../components/atoms/alert";
import { Badge } from "../../components/atoms/badge";
import { Button } from "../../components/atoms/button";
import { Card } from "../../components/atoms/card";
import { Label } from "../../components/atoms/form";
import { Input } from "../../components/atoms/input";
import { Select } from "../../components/atoms/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableViewport
} from "../../components/atoms/table";
import { Textarea } from "../../components/atoms/textarea";
import { createClient, listClients, listHouseholds } from "./clientApi";
import { ClientOnboardingStatus, ClientStatus, ClientSummary, Household } from "./types";
import {
  clientStatusVariant,
  getApiErrorMessage,
  labelClientStatus,
  labelOnboardingStatus
} from "../../lib/presentation";

const CLIENT_STATUSES: Array<ClientStatus | ""> = ["", "active", "inactive", "archived"];
const ONBOARDING_STATUSES: Array<ClientOnboardingStatus | ""> = [
  "",
  "invited",
  "onboarding",
  "complete",
  "paused"
];

export default function ClientDirectoryPage() {
  const { actor, activeOffice } = useAuth();
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClientStatus | "">("");
  const [onboardingFilter, setOnboardingFilter] = useState<ClientOnboardingStatus | "">("");
  const [householdFilter, setHouseholdFilter] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [riskProfileDescriptor, setRiskProfileDescriptor] = useState("");
  const [householdId, setHouseholdId] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const officeId = activeOffice?.officeId;
  const isClientOffice = activeOffice?.role === "client";
  const activeClients = useMemo(
    () => clients.filter((client) => client.status === "active").length,
    [clients]
  );

  useEffect(() => {
    if (!officeId || isClientOffice) {
      setClients([]);
      setHouseholds([]);
      setLoading(false);
      setError(null);
      return;
    }

    let isActive = true;
    setLoading(true);
    setError(null);

    Promise.all([
      listClients(officeId, {
        search,
        status: statusFilter,
        householdId: householdFilter,
        onboardingStatus: onboardingFilter
      }),
      listHouseholds(officeId)
    ])
      .then(([clientData, householdData]) => {
        if (!isActive) {
          return;
        }
        setClients(clientData.clients);
        setHouseholds(householdData.households);
      })
      .catch((caught) => {
        if (isActive) {
          setError(getApiErrorMessage(caught, "Não foi possível carregar clientes."));
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
  }, [householdFilter, isClientOffice, officeId, onboardingFilter, search, statusFilter]);

  async function handleCreateClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!officeId) {
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const client = await createClient(officeId, {
        name,
        email,
        householdId: householdId || undefined,
        riskProfileDescriptor: riskProfileDescriptor || undefined,
        notes: notes || undefined,
        onboardingStatus: "onboarding",
        advisorUserId: actor?.id
      });
      setClients((current) => [client, ...current]);
      setName("");
      setEmail("");
      setRiskProfileDescriptor("");
      setHouseholdId("");
      setNotes("");
      setNotice("Cliente criado.");
    } catch (caught) {
      setError(getApiErrorMessage(caught, "Não foi possível criar o cliente."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProtectedRoute roles={["admin", "analyst", "user"]}>
      <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-5 lg:px-6">
        <AppHeader
          title="Carteira de clientes"
          active="clients"
          showAdmin={actor?.role === "admin"}
          actions={
            <>
              {activeOffice ? <Badge variant="outline">{activeOffice.officeName}</Badge> : null}
              <LogoutButton />
            </>
          }
        />

        {!officeId ? (
          <Alert variant="warning">Selecione um escritório para ver clientes.</Alert>
        ) : isClientOffice ? (
          <Alert variant="info">
            A carteira de clientes é uma área da equipe. Use o portal do cliente para acompanhar
            pacotes e informações compartilhadas.
          </Alert>
        ) : (
          <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="grid gap-4">
              <Card>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase text-moss">Clientes</p>
                    <h1 className="text-3xl font-semibold text-stone-900">
                      {activeOffice?.officeName}
                    </h1>
                    <p className="text-sm text-stone-600">
                      {clients.length} registros · {activeClients} ativos
                    </p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-4">
                    <Input
                      aria-label="Buscar clientes"
                      placeholder="Buscar"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                    <Select
                      aria-label="Filtrar status"
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value as ClientStatus | "")}
                    >
                      {CLIENT_STATUSES.map((status) => (
                        <option key={status || "all"} value={status}>
                          {status ? labelClientStatus(status) : "todos"}
                        </option>
                      ))}
                    </Select>
                    <Select
                      aria-label="Filtrar onboarding"
                      value={onboardingFilter}
                      onChange={(event) =>
                        setOnboardingFilter(event.target.value as ClientOnboardingStatus | "")
                      }
                    >
                      {ONBOARDING_STATUSES.map((status) => (
                        <option key={status || "all"} value={status}>
                          {status ? labelOnboardingStatus(status) : "todos os cadastros"}
                        </option>
                      ))}
                    </Select>
                    <Select
                      aria-label="Filtrar grupo familiar"
                      value={householdFilter}
                      onChange={(event) => setHouseholdFilter(event.target.value)}
                    >
                      <option value="">grupos familiares</option>
                      {households.map((household) => (
                        <option key={household.id} value={household.id}>
                          {household.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
              </Card>

              {error ? <Alert variant="failure">{error}</Alert> : null}
              {loading ? <Alert variant="info">Carregando clientes.</Alert> : null}

              {!loading && clients.length === 0 ? (
                <Alert variant="info">Nenhum cliente encontrado para este escritório.</Alert>
              ) : (
                <Card>
                  <TableViewport label="Clientes do escritório">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Grupo familiar</TableHead>
                          <TableHead>Assessor</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Cadastro</TableHead>
                          <TableHead>Portfólios</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clients.map((client) => (
                          <TableRow key={client.id}>
                            <TableCell className="font-medium text-stone-900">
                              <Link
                                href={`/dashboard/clients/${client.id}`}
                                className="hover:text-moss"
                              >
                                {client.name}
                              </Link>
                              <p className="text-xs text-stone-500">{client.email}</p>
                            </TableCell>
                            <TableCell>{client.householdName ?? "Sem grupo familiar"}</TableCell>
                            <TableCell>{client.advisorName ?? "Sem assessor"}</TableCell>
                            <TableCell>
                              <Badge variant={clientStatusVariant(client.status)}>
                                {labelClientStatus(client.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>{labelOnboardingStatus(client.onboardingStatus)}</TableCell>
                            <TableCell>{client.portfolioCount}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableViewport>
                </Card>
              )}
            </div>

            <Card>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-moss">Novo cliente</p>
                <h2 className="text-xl font-semibold text-stone-900">Cadastro mínimo</h2>
              </div>
              {notice ? <Alert variant="info">{notice}</Alert> : null}
              <form className="mt-5 space-y-4" onSubmit={handleCreateClient}>
                <div>
                  <Label htmlFor="clientName">Nome</Label>
                  <Input
                    id="clientName"
                    className="mt-2"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="clientEmail">E-mail</Label>
                  <Input
                    id="clientEmail"
                    className="mt-2"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="clientHousehold">Grupo familiar</Label>
                  <Select
                    id="clientHousehold"
                    className="mt-2"
                    value={householdId}
                    onChange={(event) => setHouseholdId(event.target.value)}
                  >
                    <option value="">Sem grupo familiar</option>
                    {households.map((household) => (
                      <option key={household.id} value={household.id}>
                        {household.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="riskProfileDescriptor">Perfil de risco</Label>
                  <Input
                    id="riskProfileDescriptor"
                    className="mt-2"
                    value={riskProfileDescriptor}
                    onChange={(event) => setRiskProfileDescriptor(event.target.value)}
                    placeholder="Ex.: perfil moderado com controle de risco"
                  />
                </div>
                <div>
                  <Label htmlFor="clientNotes">Notas</Label>
                  <Textarea
                    id="clientNotes"
                    className="mt-2"
                    rows={4}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                  />
                </div>
                <Button type="submit" disabled={saving || !name.trim() || !email.trim()}>
                  {saving ? "Criando..." : "Criar cliente"}
                </Button>
              </form>
            </Card>
          </section>
        )}
      </main>
    </ProtectedRoute>
  );
}
