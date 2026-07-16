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
import { ApiError } from "../../../../lib/api/client";

const SEVERITIES: Array<ReviewItemSeverity | ""> = ["", "low", "medium", "high"];
const STATUSES: Array<ReviewItemStatus | ""> = ["", "open", "in_progress", "closed"];

export default function WorkbenchPage() {
  const { actor, activeOffice } = useAuth();
  const officeId = activeOffice?.officeId;
  const [workbench, setWorkbench] = useState<StaffWorkbench | null>(null);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [severityFilter, setSeverityFilter] = useState<ReviewItemSeverity | "">("");
  const [statusFilter, setStatusFilter] = useState<ReviewItemStatus | "">("open");
  const [title, setTitle] = useState("");
  const [resourceType, setResourceType] = useState<ReviewResourceType>("client");
  const [resourceId, setResourceId] = useState("client_main");
  const [clientId, setClientId] = useState("client_main");
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
          setError(getMessage(caught, "Não foi possível carregar o workbench."));
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
      setNotice("Review item criado.");
    } catch (caught) {
      setError(getMessage(caught, "Não foi possível criar o review item."));
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
      setNotice("Review item atualizado.");
    } catch (caught) {
      setError(getMessage(caught, "Não foi possível atualizar o review item."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProtectedRoute roles={["admin", "analyst", "user"]}>
      <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-5 lg:px-6">
        <AppHeader
          title="Staff workbench"
          active="workbench"
          showAdmin={actor?.role === "admin"}
          actions={
            <>
              {activeOffice ? <Badge variant="outline">{activeOffice.role}</Badge> : null}
              <LogoutButton />
            </>
          }
        />

        {!officeId ? (
          <Alert variant="warning">Selecione um office para abrir o workbench.</Alert>
        ) : loading ? (
          <Alert variant="info">Carregando workbench.</Alert>
        ) : error ? (
          <Alert variant="failure">{error}</Alert>
        ) : !workbench ? (
          <Alert variant="warning">Workbench indisponível.</Alert>
        ) : (
          <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="grid gap-4">
              <section className="grid gap-4 md:grid-cols-4">
                <MetricCard label="Clientes" value={workbench.counts.assignedClients} />
                <MetricCard label="Atenção" value={workbench.counts.portfoliosNeedingAttention} />
                <MetricCard label="Reviews" value={workbench.counts.openReviewItems} />
                <MetricCard label="Alta severidade" value={workbench.counts.highSeverityReviewItems} />
              </section>

              {notice ? <Alert variant="info">{notice}</Alert> : null}

              <Card>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase text-moss">Review queue</p>
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
                          {entry || "severidade"}
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
                          {entry || "status"}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                {reviewItems.length === 0 ? (
                  <Alert variant="info" className="mt-5">Nenhum review item neste filtro.</Alert>
                ) : (
                  <div className="mt-5 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Título</TableHead>
                          <TableHead>Recurso</TableHead>
                          <TableHead>Severidade</TableHead>
                          <TableHead>Due</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reviewItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium text-stone-900">{item.title}</TableCell>
                            <TableCell>{resourceLink(item)}</TableCell>
                            <TableCell>{item.severity}</TableCell>
                            <TableCell>{item.dueDate ?? "Sem due date"}</TableCell>
                            <TableCell>
                              <Select
                                aria-label={`Status ${item.title}`}
                                value={item.status}
                                disabled={saving}
                                onChange={(event) =>
                                  handleStatusChange(item, event.target.value as ReviewItemStatus)
                                }
                              >
                                <option value="open">open</option>
                                <option value="in_progress">in_progress</option>
                                <option value="closed">closed</option>
                              </Select>
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
                    <h2 className="text-xl font-semibold text-stone-900">Client book atribuído</h2>
                  </div>
                  <Badge variant="outline">{workbench.assignedClients.length} clientes</Badge>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {workbench.assignedClients.map((client) => (
                    <Link
                      key={client.id}
                      href={`/dashboard/clients/${client.id}`}
                      className="rounded-md border border-border p-3 text-sm hover:border-moss"
                    >
                      <span className="block font-medium text-stone-900">{client.name}</span>
                      <span className="text-stone-500">{client.householdName ?? "Sem household"}</span>
                    </Link>
                  ))}
                </div>
              </Card>

              <Card>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase text-moss">Exceptions</p>
                    <h2 className="text-xl font-semibold text-stone-900">Portfolios pedindo atenção</h2>
                  </div>
                  <Badge variant="outline">{workbench.portfoliosNeedingAttention.length} portfolios</Badge>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {workbench.portfoliosNeedingAttention.length === 0 ? (
                    <Alert variant="info">Sem portfolios degradados neste office.</Alert>
                  ) : (
                    workbench.portfoliosNeedingAttention.map((portfolio) => (
                      <Link
                        key={portfolio.id}
                        href={`/dashboard/portfolios/${portfolio.id}`}
                        className="rounded-md border border-border p-3 text-sm hover:border-moss"
                      >
                        <span className="block font-medium text-stone-900">{portfolio.name}</span>
                        <span className="text-stone-500">
                          {portfolio.status} · {portfolio.freshness}
                        </span>
                      </Link>
                    ))
                  )}
                </div>
              </Card>
            </div>

            <Card>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-moss">Novo review</p>
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
                    onChange={(event) => setResourceType(event.target.value as ReviewResourceType)}
                  >
                    <option value="client">client</option>
                    <option value="portfolio">portfolio</option>
                    <option value="analytics">analytics</option>
                    <option value="report">report</option>
                    <option value="alert">alert</option>
                    <option value="notification">notification</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="resourceId">ID do recurso</Label>
                  <Input
                    id="resourceId"
                    className="mt-2"
                    value={resourceId}
                    onChange={(event) => setResourceId(event.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="clientId">Cliente vinculado</Label>
                  <Input
                    id="clientId"
                    className="mt-2"
                    value={clientId}
                    onChange={(event) => setClientId(event.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="severity">Severidade</Label>
                  <Select
                    id="severity"
                    className="mt-2"
                    value={severity}
                    onChange={(event) => setSeverity(event.target.value as ReviewItemSeverity)}
                  >
                    <option value="low">low</option>
                    <option value="medium">medium</option>
                    <option value="high">high</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dueDate">Due date</Label>
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
                  {saving ? "Criando..." : "Criar review item"}
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

function resourceLink(item: ReviewItem) {
  if (item.clientId) {
    return (
      <Link href={`/dashboard/clients/${item.clientId}`} className="font-medium text-moss">
        {item.resourceType}:{item.resourceId}
      </Link>
    );
  }
  if (item.portfolioId) {
    return (
      <Link href={`/dashboard/portfolios/${item.portfolioId}`} className="font-medium text-moss">
        {item.resourceType}:{item.resourceId}
      </Link>
    );
  }
  return `${item.resourceType}:${item.resourceId}`;
}

function getMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.message;
  }
  return fallback;
}
