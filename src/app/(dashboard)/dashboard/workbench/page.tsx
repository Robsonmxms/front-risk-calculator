"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { AppHeader } from "../../../../components/layout/AppHeader";
import { Alert } from "../../../../components/ui/alert";
import { Badge } from "../../../../components/ui/badge";
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
import {
  createReviewItem,
  getWorkbench,
  listReviewItems,
  updateReviewItem
} from "../../../../features/workbench/workbenchApi";
import {
  ReviewItem,
  ReviewItemSeverity,
  ReviewItemStatus,
  ReviewResourceType,
  StaffWorkbench
} from "../../../../features/workbench/types";
import {
  formatResourceReference,
  getApiErrorMessage,
  labelAlertSeverity,
  labelOfficeRole,
  labelPortfolioFreshness,
  labelPortfolioStatus,
  labelResourceType,
  labelReviewStatus
} from "../../../../lib/presentation";

const SEVERITIES: Array<ReviewItemSeverity | ""> = ["", "low", "medium", "high"];
const STATUSES: Array<ReviewItemStatus | ""> = ["", "open", "in_progress", "closed"];

export default function WorkbenchPage() {
  const { actor, activeOffice } = useAuth();
  const officeId = activeOffice?.officeId;
  const isClientOffice = activeOffice?.role === "client";
  const [workbench, setWorkbench] = useState<StaffWorkbench | null>(null);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [severityFilter, setSeverityFilter] = useState<ReviewItemSeverity | "">("");
  const [statusFilter, setStatusFilter] = useState<ReviewItemStatus | "">("open");
  const [title, setTitle] = useState("");
  const [resourceType, setResourceType] = useState<ReviewResourceType>("client");
  const [resourceId, setResourceId] = useState("");
  const [clientId, setClientId] = useState("");
  const [severity, setSeverity] = useState<ReviewItemSeverity>("medium");
  const [dueDate, setDueDate] = useState("2026-07-21");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!officeId) {
      setWorkbench(null);
      setReviewItems([]);
      setLoading(false);
      return;
    }

    let isActive = true;
    setLoading(true);
    setError(null);

    Promise.all([
      getWorkbench(officeId),
      listReviewItems(officeId, { status: statusFilter, severity: severityFilter })
    ])
      .then(([workbenchData, itemData]) => {
        if (!isActive) {
          return;
        }
        setWorkbench(workbenchData);
        setReviewItems(itemData.reviewItems);
      })
      .catch((caught) => {
        if (isActive) {
          setError(getApiErrorMessage(caught, "Não foi possível carregar a mesa de acompanhamento."));
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
  }, [officeId, severityFilter, statusFilter]);

  useEffect(() => {
    if (!workbench || isClientOffice || resourceId) {
      return;
    }

    if (resourceType === "client") {
      const firstClient = workbench.assignedClients[0];
      setResourceId(firstClient?.id ?? "");
      setClientId(firstClient?.id ?? "");
      return;
    }

    if (resourceType === "portfolio") {
      const firstPortfolio = workbench.portfoliosNeedingAttention[0];
      setResourceId(firstPortfolio?.id ?? "");
      setClientId(firstPortfolio?.clientId ?? "");
    }
  }, [isClientOffice, resourceId, resourceType, workbench]);

  async function handleCreateReviewItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!officeId) {
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const item = await createReviewItem(officeId, {
        title,
        severity,
        resourceType,
        resourceId,
        clientId: clientId || undefined,
        portfolioId: resourceType === "portfolio" ? resourceId : undefined,
        assignedToUserId: actor?.id,
        dueDate,
        notes: notes || undefined
      });
      setReviewItems((current) => [item, ...current]);
      setTitle("");
      setNotes("");
      setNotice("Item de acompanhamento criado.");
    } catch (caught) {
      setError(getApiErrorMessage(caught, "Não foi possível criar o item de acompanhamento."));
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(item: ReviewItem, status: ReviewItemStatus) {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await updateReviewItem(item.id, { status });
      setReviewItems((current) =>
        current.map((entry) => (entry.id === updated.id ? updated : entry))
      );
      setNotice("Item de acompanhamento atualizado.");
    } catch (caught) {
      setError(getApiErrorMessage(caught, "Não foi possível atualizar o item de acompanhamento."));
    } finally {
      setSaving(false);
    }
  }

  function handleResourceTypeChange(nextType: ReviewResourceType) {
    setResourceType(nextType);

    if (nextType === "client") {
      const firstClient = workbench?.assignedClients[0];
      setResourceId(firstClient?.id ?? "");
      setClientId(firstClient?.id ?? "");
      return;
    }

    if (nextType === "portfolio") {
      const firstPortfolio = workbench?.portfoliosNeedingAttention[0];
      setResourceId(firstPortfolio?.id ?? "");
      setClientId(firstPortfolio?.clientId ?? "");
      return;
    }

    setResourceId("");
    setClientId("");
  }

  return (
    <ProtectedRoute roles={["admin", "analyst", "user"]}>
      <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-5 lg:px-6">
        <AppHeader
          title="Mesa de acompanhamento"
          active="workbench"
          showAdmin={actor?.role === "admin"}
          actions={
            <>
              {activeOffice ? <Badge variant="outline">{labelOfficeRole(activeOffice.role)}</Badge> : null}
              <LogoutButton />
            </>
          }
        />

        {!officeId ? (
          <Alert variant="warning">Selecione um escritório para abrir a mesa de acompanhamento.</Alert>
        ) : loading ? (
          <Alert variant="info">Carregando mesa de acompanhamento.</Alert>
        ) : error ? (
          <Alert variant="failure">{error}</Alert>
        ) : !workbench ? (
          <Alert variant="warning">Mesa de acompanhamento indisponível.</Alert>
        ) : (
          <section
            className={
              isClientOffice ? "grid gap-4" : "grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]"
            }
          >
            <div className="grid gap-4">
              <section className="grid gap-4 md:grid-cols-4">
                <MetricCard label="Clientes" value={workbench.counts.assignedClients} />
                <MetricCard label="Atenção" value={workbench.counts.portfoliosNeedingAttention} />
                <MetricCard label="Em aberto" value={workbench.counts.openReviewItems} />
                <MetricCard label="Alta atenção" value={workbench.counts.highSeverityReviewItems} />
              </section>

              {notice ? <Alert variant="info">{notice}</Alert> : null}

              <Card>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase text-moss">Fila de acompanhamento</p>
                    <h1 className="text-2xl font-semibold text-stone-900">Itens de acompanhamento</h1>
                  </div>
                  <div className="flex gap-2">
                    <Select
                      aria-label="Filtrar severidade"
                      value={severityFilter}
                      onChange={(event) =>
                        setSeverityFilter(event.target.value as ReviewItemSeverity | "")
                      }
                    >
                      {SEVERITIES.map((entry) => (
                        <option key={entry || "all"} value={entry}>
                          {entry ? labelAlertSeverity(entry) : "todas as severidades"}
                        </option>
                      ))}
                    </Select>
                    <Select
                      aria-label="Filtrar status"
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value as ReviewItemStatus | "")}
                    >
                      {STATUSES.map((entry) => (
                        <option key={entry || "all"} value={entry}>
                          {entry ? labelReviewStatus(entry) : "todos os status"}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                {reviewItems.length === 0 ? (
                  <Alert variant="info" className="mt-5">Nenhum item de acompanhamento neste filtro.</Alert>
                ) : (
                  <div className="mt-5 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Título</TableHead>
                          <TableHead>Recurso</TableHead>
                          <TableHead>Severidade</TableHead>
                          <TableHead>Prazo</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reviewItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium text-stone-900">{item.title}</TableCell>
                            <TableCell>{resourceLink(item, workbench, isClientOffice)}</TableCell>
                            <TableCell>{labelAlertSeverity(item.severity)}</TableCell>
                            <TableCell>{item.dueDate ?? "Sem prazo"}</TableCell>
                            <TableCell>
                              {isClientOffice ? (
                                labelReviewStatus(item.status)
                              ) : (
                                <Select
                                  aria-label={`Status ${item.title}`}
                                  value={item.status}
                                  disabled={saving}
                                  onChange={(event) =>
                                    handleStatusChange(item, event.target.value as ReviewItemStatus)
                                  }
                                >
                                  <option value="open">{labelReviewStatus("open")}</option>
                                  <option value="in_progress">{labelReviewStatus("in_progress")}</option>
                                  <option value="closed">{labelReviewStatus("closed")}</option>
                                </Select>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </Card>

              <Card>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase text-moss">Clientes</p>
                    <h2 className="text-xl font-semibold text-stone-900">Carteira de clientes atribuída</h2>
                  </div>
                  <Badge variant="outline">{workbench.assignedClients.length} clientes</Badge>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {workbench.assignedClients.map((client) =>
                    isClientOffice ? (
                      <div key={client.id} className="rounded-md border border-border p-3 text-sm">
                        <span className="block font-medium text-stone-900">{client.name}</span>
                        <span className="text-stone-500">{client.householdName ?? "Sem grupo familiar"}</span>
                      </div>
                    ) : (
                      <Link
                        key={client.id}
                        href={`/dashboard/clients/${client.id}`}
                        className="rounded-md border border-border p-3 text-sm hover:border-moss"
                      >
                        <span className="block font-medium text-stone-900">{client.name}</span>
                        <span className="text-stone-500">{client.householdName ?? "Sem grupo familiar"}</span>
                      </Link>
                    )
                  )}
                </div>
              </Card>

              <Card>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase text-moss">Atenção operacional</p>
                    <h2 className="text-xl font-semibold text-stone-900">Portfólios pedindo atenção</h2>
                  </div>
                  <Badge variant="outline">{workbench.portfoliosNeedingAttention.length} portfólios</Badge>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {workbench.portfoliosNeedingAttention.length === 0 ? (
                    <Alert variant="info">Sem portfólios degradados neste escritório.</Alert>
                  ) : (
                    workbench.portfoliosNeedingAttention.map((portfolio) =>
                      isClientOffice ? (
                        <div key={portfolio.id} className="rounded-md border border-border p-3 text-sm">
                          <span className="block font-medium text-stone-900">{portfolio.name}</span>
                          <span className="text-stone-500">
                            {labelPortfolioStatus(portfolio.status)} · {labelPortfolioFreshness(portfolio.freshness)}
                          </span>
                        </div>
                      ) : (
                        <Link
                          key={portfolio.id}
                          href={`/dashboard/portfolios/${portfolio.id}`}
                          className="rounded-md border border-border p-3 text-sm hover:border-moss"
                        >
                          <span className="block font-medium text-stone-900">{portfolio.name}</span>
                          <span className="text-stone-500">
                            {labelPortfolioStatus(portfolio.status)} · {labelPortfolioFreshness(portfolio.freshness)}
                          </span>
                        </Link>
                      )
                    )
                  )}
                </div>
              </Card>
            </div>

            {!isClientOffice ? (
              <Card>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase text-moss">Novo acompanhamento</p>
                  <h2 className="text-xl font-semibold text-stone-900">Criar item</h2>
                </div>
                <form className="mt-5 space-y-4" onSubmit={handleCreateReviewItem}>
                  <div>
                    <Label htmlFor="reviewTitle">Título</Label>
                    <Input
                      id="reviewTitle"
                      className="mt-2"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="resourceType">Recurso</Label>
                    <Select
                      id="resourceType"
                      className="mt-2"
                      value={resourceType}
                      onChange={(event) =>
                        handleResourceTypeChange(event.target.value as ReviewResourceType)
                      }
                    >
                      <option value="client">{labelResourceType("client")}</option>
                      <option value="portfolio">{labelResourceType("portfolio")}</option>
                      <option value="analytics">{labelResourceType("analytics")}</option>
                      <option value="report">{labelResourceType("report")}</option>
                      <option value="alert">{labelResourceType("alert")}</option>
                      <option value="notification">{labelResourceType("notification")}</option>
                    </Select>
                  </div>
                  {resourceType === "client" && workbench.assignedClients.length > 0 ? (
                    <div>
                      <Label htmlFor="resourceId">Cliente</Label>
                      <Select
                        id="resourceId"
                        className="mt-2"
                        value={resourceId}
                        onChange={(event) => {
                          setResourceId(event.target.value);
                          setClientId(event.target.value);
                        }}
                        required
                      >
                        {workbench.assignedClients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                  ) : resourceType === "portfolio" && workbench.portfoliosNeedingAttention.length > 0 ? (
                    <div>
                      <Label htmlFor="resourceId">Portfólio</Label>
                      <Select
                        id="resourceId"
                        className="mt-2"
                        value={resourceId}
                        onChange={(event) => {
                          const selectedPortfolio = workbench.portfoliosNeedingAttention.find(
                            (portfolio) => portfolio.id === event.target.value
                          );
                          setResourceId(event.target.value);
                          setClientId(selectedPortfolio?.clientId ?? "");
                        }}
                        required
                      >
                        {workbench.portfoliosNeedingAttention.map((portfolio) => (
                          <option key={portfolio.id} value={portfolio.id}>
                            {portfolio.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="resourceId">Referência do recurso</Label>
                      <Input
                        id="resourceId"
                        className="mt-2"
                        value={resourceId}
                        onChange={(event) => setResourceId(event.target.value)}
                        placeholder="Informe a referência quando necessário"
                        required
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="clientId">Cliente vinculado</Label>
                    <Select
                      id="clientId"
                      className="mt-2"
                      value={clientId}
                      onChange={(event) => setClientId(event.target.value)}
                    >
                      <option value="">Sem cliente vinculado</option>
                      {workbench.assignedClients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="severity">Severidade</Label>
                    <Select
                      id="severity"
                      className="mt-2"
                      value={severity}
                      onChange={(event) => setSeverity(event.target.value as ReviewItemSeverity)}
                    >
                      <option value="low">{labelAlertSeverity("low")}</option>
                      <option value="medium">{labelAlertSeverity("medium")}</option>
                      <option value="high">{labelAlertSeverity("high")}</option>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="dueDate">Prazo</Label>
                    <Input
                      id="dueDate"
                      className="mt-2"
                      type="date"
                      value={dueDate}
                      onChange={(event) => setDueDate(event.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="reviewNotes">Notas</Label>
                    <Textarea
                      id="reviewNotes"
                      className="mt-2"
                      rows={4}
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={saving || !title.trim() || !resourceId.trim()}>
                    {saving ? "Criando..." : "Criar item"}
                  </Button>
                </form>
              </Card>
            ) : null}
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

function resourceLink(item: ReviewItem, workbench: StaffWorkbench, readOnly = false) {
  const clientReferenceId = item.clientId ?? (item.resourceType === "client" ? item.resourceId : undefined);
  const portfolioReferenceId =
    item.portfolioId ?? (item.resourceType === "portfolio" ? item.resourceId : undefined);
  const label = formatWorkbenchResource(item, workbench);

  if (readOnly) {
    return label;
  }

  if (clientReferenceId) {
    return (
      <Link href={`/dashboard/clients/${clientReferenceId}`} className="font-medium text-moss">
        {label}
      </Link>
    );
  }
  if (portfolioReferenceId) {
    return (
      <Link href={`/dashboard/portfolios/${portfolioReferenceId}`} className="font-medium text-moss">
        {label}
      </Link>
    );
  }
  return label;
}

function formatWorkbenchResource(item: ReviewItem, workbench: StaffWorkbench) {
  const clientReferenceId = item.clientId ?? (item.resourceType === "client" ? item.resourceId : undefined);
  const portfolioReferenceId =
    item.portfolioId ?? (item.resourceType === "portfolio" ? item.resourceId : undefined);
  const clientName = workbench.assignedClients.find((client) => client.id === clientReferenceId)?.name;
  const portfolioName = workbench.portfoliosNeedingAttention.find(
    (portfolio) => portfolio.id === portfolioReferenceId
  )?.name;
  const displayName = clientName ?? portfolioName;

  return displayName
    ? formatResourceReference(item.resourceType, undefined, displayName)
    : labelResourceType(item.resourceType);
}
