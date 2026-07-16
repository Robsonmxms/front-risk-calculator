"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppHeader } from "../../../../components/layout/AppHeader";
import { Alert } from "../../../../components/ui/alert";
import { Badge, BadgeVariant } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Card } from "../../../../components/ui/card";
import { Label } from "../../../../components/ui/form";
import { Input } from "../../../../components/ui/input";
import { Select } from "../../../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "../../../../components/ui/table";
import { Textarea } from "../../../../components/ui/textarea";
import { useAuth } from "../../../../features/auth/AuthProvider";
import { LogoutButton } from "../../../../features/auth/LogoutButton";
import { ProtectedRoute } from "../../../../features/auth/ProtectedRoute";
import { listClients } from "../../../../features/client/clientApi";
import { ClientSummary } from "../../../../features/client/types";
import {
  approveReportPackage,
  createReportPackage,
  deliverReportPackage,
  listClientReportPackages,
  revokeReportPackage
} from "../../../../features/delivery/deliveryApi";
import { ReportPackage, ReportPackageStatus } from "../../../../features/delivery/types";
import { ApiError } from "../../../../lib/api/client";

const STATUSES: Array<ReportPackageStatus | ""> = [
  "",
  "draft",
  "pending_approval",
  "approved",
  "delivered",
  "viewed",
  "revoked"
];

export default function ReportDeliveryPage() {
  const { actor, activeOffice } = useAuth();
  const officeId = activeOffice?.officeId;
  const canUseDelivery = Boolean(activeOffice && activeOffice.role !== "client");
  const canApprove = actor?.role === "admin" || activeOffice?.role === "office_admin";
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [packages, setPackages] = useState<ReportPackage[]>([]);
  const [statusFilter, setStatusFilter] = useState<ReportPackageStatus | "">("");
  const [title, setTitle] = useState("Client review package");
  const [summaryNotes, setSummaryNotes] = useState("Read-only summary prepared for client review.");
  const [internalNotes, setInternalNotes] = useState("");
  const [portfolioId, setPortfolioId] = useState("prt_main");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId),
    [clients, selectedClientId]
  );

  useEffect(() => {
    if (!officeId || !canUseDelivery) {
      setClients([]);
      setSelectedClientId("");
      setLoading(false);
      return;
    }

    let isActive = true;
    setLoading(true);
    setError(null);
    listClients(officeId, { status: "active" })
      .then((data) => {
        if (!isActive) {
          return;
        }
        setClients(data.clients);
        setSelectedClientId((current) => current || data.clients[0]?.id || "");
      })
      .catch((caught) => {
        if (isActive) {
          setError(getMessage(caught, "Não foi possível carregar clientes."));
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
  }, [canUseDelivery, officeId]);

  useEffect(() => {
    if (!selectedClientId || !canUseDelivery) {
      setPackages([]);
      return;
    }

    let isActive = true;
    setError(null);
    listClientReportPackages(selectedClientId, { status: statusFilter })
      .then((data) => {
        if (isActive) {
          setPackages(data.reportPackages);
        }
      })
      .catch((caught) => {
        if (isActive) {
          setError(getMessage(caught, "Não foi possível carregar pacotes."));
        }
      });

    return () => {
      isActive = false;
    };
  }, [canUseDelivery, selectedClientId, statusFilter]);

  async function handleCreatePackage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedClientId) {
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const created = await createReportPackage(selectedClientId, {
        title,
        summaryNotes,
        internalNotes: internalNotes || undefined,
        submitForApproval: true,
        items: [
          {
            type: "portfolio_summary",
            title: `${portfolioId} overview`,
            portfolioId,
            status: "ready"
          }
        ]
      });
      setPackages((current) => [created, ...current]);
      setNotice("Pacote enviado para aprovação.");
      setInternalNotes("");
    } catch (caught) {
      setError(getMessage(caught, "Não foi possível criar o pacote."));
    } finally {
      setSaving(false);
    }
  }

  async function handleLifecycle(
    reportPackage: ReportPackage,
    action: "approve" | "deliver" | "revoke"
  ) {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const updated =
        action === "approve"
          ? await approveReportPackage(reportPackage.id)
          : action === "deliver"
            ? await deliverReportPackage(reportPackage.id)
            : await revokeReportPackage(reportPackage.id);
      setPackages((current) =>
        current.map((entry) => (entry.id === updated.id ? updated : entry))
      );
      setNotice(`Pacote ${updated.status}.`);
    } catch (caught) {
      setError(getMessage(caught, "Não foi possível atualizar o pacote."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProtectedRoute roles={["admin", "analyst", "user"]}>
      <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-5 lg:px-6">
        <AppHeader
          title="Report delivery"
          active="reportDelivery"
          showAdmin={actor?.role === "admin"}
          actions={
            <>
              {activeOffice ? <Badge variant="outline">{activeOffice.role}</Badge> : null}
              <LogoutButton />
            </>
          }
        />

        {!officeId ? (
          <Alert variant="warning">Selecione um office para abrir delivery.</Alert>
        ) : !canUseDelivery ? (
          <Alert variant="failure">Delivery center indisponível para este perfil.</Alert>
        ) : loading ? (
          <Alert variant="info">Carregando delivery center.</Alert>
        ) : (
          <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="grid gap-4">
              <section className="grid gap-4 md:grid-cols-4">
                <MetricCard label="Clientes" value={clients.length} />
                <MetricCard label="Pacotes" value={packages.length} />
                <MetricCard
                  label="Pendentes"
                  value={packages.filter((entry) => entry.status === "pending_approval").length}
                />
                <MetricCard
                  label="Entregues"
                  value={packages.filter((entry) => ["delivered", "viewed"].includes(entry.status)).length}
                />
              </section>

              {error ? <Alert variant="failure">{error}</Alert> : null}
              {notice ? <Alert variant="success">{notice}</Alert> : null}

              <Card>
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
                  <div>
                    <Label htmlFor="deliveryClient">Cliente</Label>
                    <Select
                      id="deliveryClient"
                      className="mt-2"
                      value={selectedClientId}
                      onChange={(event) => setSelectedClientId(event.target.value)}
                    >
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="packageStatus">Status</Label>
                    <Select
                      id="packageStatus"
                      className="mt-2"
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value as ReportPackageStatus | "")}
                    >
                      {STATUSES.map((status) => (
                        <option key={status || "all"} value={status}>
                          {status || "todos"}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase text-moss">Pacotes</p>
                    <h1 className="text-2xl font-semibold text-stone-900">
                      {selectedClient?.name ?? "Cliente"}
                    </h1>
                  </div>
                  <Badge variant="outline">{packages.length} pacotes</Badge>
                </div>

                {packages.length === 0 ? (
                  <Alert variant="info" className="mt-5">Nenhum pacote neste filtro.</Alert>
                ) : (
                  <div className="mt-5 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Título</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Itens</TableHead>
                          <TableHead>Atualizado</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {packages.map((reportPackage) => (
                          <TableRow key={reportPackage.id}>
                            <TableCell className="font-medium text-stone-900">
                              {reportPackage.title}
                              <p className="text-xs text-stone-500">{reportPackage.summaryNotes}</p>
                            </TableCell>
                            <TableCell>{statusBadge(reportPackage.status)}</TableCell>
                            <TableCell>{reportPackage.items.length}</TableCell>
                            <TableCell>{formatDate(reportPackage.updatedAt)}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-2">
                                {canApprove && reportPackage.status === "pending_approval" ? (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    disabled={saving}
                                    onClick={() => handleLifecycle(reportPackage, "approve")}
                                  >
                                    Aprovar
                                  </Button>
                                ) : null}
                                {canApprove && reportPackage.status === "approved" ? (
                                  <Button
                                    size="sm"
                                    disabled={saving}
                                    onClick={() => handleLifecycle(reportPackage, "deliver")}
                                  >
                                    Entregar
                                  </Button>
                                ) : null}
                                {canApprove && !["revoked", "draft"].includes(reportPackage.status) ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={saving}
                                    onClick={() => handleLifecycle(reportPackage, "revoke")}
                                  >
                                    Revogar
                                  </Button>
                                ) : null}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </Card>
            </div>

            <Card>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-moss">Novo pacote</p>
                <h2 className="text-xl font-semibold text-stone-900">Preparar entrega</h2>
              </div>
              <form className="mt-5 space-y-4" onSubmit={handleCreatePackage}>
                <div>
                  <Label htmlFor="packageTitle">Título</Label>
                  <Input
                    id="packageTitle"
                    className="mt-2"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="summaryNotes">Notas para cliente</Label>
                  <Textarea
                    id="summaryNotes"
                    className="mt-2"
                    rows={4}
                    value={summaryNotes}
                    onChange={(event) => setSummaryNotes(event.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="internalNotes">Notas internas</Label>
                  <Textarea
                    id="internalNotes"
                    className="mt-2"
                    rows={3}
                    value={internalNotes}
                    onChange={(event) => setInternalNotes(event.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="portfolioId">Portfolio</Label>
                  <Input
                    id="portfolioId"
                    className="mt-2"
                    value={portfolioId}
                    onChange={(event) => setPortfolioId(event.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={saving || !selectedClientId || !title.trim()}>
                  Enviar para aprovação
                </Button>
              </form>
            </Card>
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

function statusBadge(status: ReportPackageStatus) {
  const variant: BadgeVariant =
    status === "revoked"
      ? "failure"
      : status === "delivered" || status === "viewed"
        ? "success"
        : status === "approved"
          ? "info"
          : status === "pending_approval"
            ? "warning"
            : "outline";
  return <Badge variant={variant}>{status}</Badge>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function getMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.message;
  }
  return fallback;
}
