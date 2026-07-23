"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
import { useAuth } from "../../../../features/auth/AuthProvider";
import { LogoutButton } from "../../../../features/auth/LogoutButton";
import { ProtectedRoute } from "../../../../features/auth/ProtectedRoute";
import {
  listAuditEvents,
  listSupervisionReviews,
  requestAuditExport,
  updateSupervisionReview
} from "../../../../features/compliance/complianceApi";
import {
  AuditEvent,
  AuditEventFilters,
  AuditOutcome,
  AuditResourceType,
  AuditSeverity,
  SupervisionReview
} from "../../../../features/compliance/types";
import {
  auditOutcomeVariant,
  auditSeverityVariant,
  formatDateTime,
  formatResourceReference,
  getApiErrorMessage,
  labelAuditAction,
  labelAuditOutcome,
  labelAuditSeverity,
  labelOnboardingStatus,
  labelOfficeRole,
  labelReportPackageStatus,
  labelResourceType,
  labelReviewStatus,
  labelTransactionType
} from "../../../../lib/presentation";

const SEVERITIES: Array<AuditSeverity | ""> = ["", "info", "warning", "critical"];
const OUTCOMES: Array<AuditOutcome | ""> = ["", "success", "failure"];
const RESOURCE_TYPES: Array<AuditResourceType | ""> = [
  "",
  "auth",
  "office",
  "permission",
  "client",
  "portfolio",
  "ledger",
  "analytics",
  "market_data",
  "report",
  "delivery",
  "portal",
  "review"
];

export default function CompliancePage() {
  const { actor, activeOffice } = useAuth();
  const officeId = activeOffice?.officeId;
  const canReadAudit = actor?.role === "admin" || activeOffice?.role === "office_admin";
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [reviews, setReviews] = useState<SupervisionReview[]>([]);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState<AuditSeverity | "">("");
  const [outcomeFilter, setOutcomeFilter] = useState<AuditOutcome | "">("");
  const [resourceTypeFilter, setResourceTypeFilter] = useState<AuditResourceType | "">("");
  const [clientFilter, setClientFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const filters = useMemo<AuditEventFilters>(
    () => ({
      action: actionFilter || undefined,
      severity: severityFilter,
      outcome: outcomeFilter,
      resourceType: resourceTypeFilter,
      clientId: clientFilter || undefined,
      page: 1,
      pageSize: 25
    }),
    [actionFilter, clientFilter, outcomeFilter, resourceTypeFilter, severityFilter]
  );
  const auditEventsById = useMemo(
    () => new Map(auditEvents.map((event) => [event.id, event])),
    [auditEvents]
  );

  useEffect(() => {
    if (!officeId || !canReadAudit) {
      setAuditEvents([]);
      setReviews([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    let isActive = true;
    setLoading(true);
    setError(null);

    Promise.all([
      listAuditEvents(officeId, filters),
      listSupervisionReviews(officeId, { status: "open" })
    ])
      .then(([auditPage, reviewPage]) => {
        if (!isActive) {
          return;
        }
        setAuditEvents(auditPage.auditEvents);
        setTotal(auditPage.total);
        setReviews(reviewPage.supervisionReviews);
      })
      .catch((caught) => {
        if (isActive) {
          setError(getApiErrorMessage(caught, "Não foi possível carregar conformidade."));
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
  }, [canReadAudit, filters, officeId]);

  async function handleExport(format: "csv" | "json") {
    if (!officeId) {
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const exportJob = await requestAuditExport(officeId, { format, filters });
      setNotice(
        `Exportação ${exportJob.format.toUpperCase()} pronta com ${exportJob.eventCount} ${
          exportJob.eventCount === 1 ? "evento" : "eventos"
        }.`
      );
    } catch (caught) {
      setError(getApiErrorMessage(caught, "Não foi possível solicitar a exportação."));
    } finally {
      setSaving(false);
    }
  }

  async function handleResolveReview(review: SupervisionReview) {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await updateSupervisionReview(review.id, {
        status: "resolved",
        resolutionComment: "Revisado no painel de conformidade."
      });
      setReviews((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)));
      setNotice("Revisão de supervisão resolvida.");
    } catch (caught) {
      setError(getApiErrorMessage(caught, "Não foi possível atualizar a revisão."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProtectedRoute roles={["admin", "analyst", "user"]}>
      <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-5 lg:px-6">
        <AppHeader
          title="Conformidade"
          active="compliance"
          showAdmin={actor?.role === "admin"}
          actions={
            <>
              {activeOffice ? <Badge variant="outline">{labelOfficeRole(activeOffice.role)}</Badge> : null}
              <LogoutButton />
            </>
          }
        />

        {!officeId ? (
          <Alert variant="warning">Selecione um escritório para abrir conformidade.</Alert>
        ) : !canReadAudit ? (
          <Alert variant="failure">Acesso de auditoria indisponível para este perfil.</Alert>
        ) : loading ? (
          <Alert variant="info">Carregando trilha de auditoria.</Alert>
        ) : error ? (
          <Alert variant="failure">{error}</Alert>
        ) : (
          <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="grid gap-4">
              <section className="grid gap-4 md:grid-cols-4">
                <MetricCard label="Eventos" value={total} />
                <MetricCard
                  label="Falhas"
                  value={auditEvents.filter((event) => event.outcome === "failure").length}
                />
                <MetricCard
                  label="Críticos"
                  value={auditEvents.filter((event) => event.severity === "critical").length}
                />
                <MetricCard
                  label="Supervisão"
                  value={reviews.filter((review) => review.status !== "resolved").length}
                />
              </section>

              {notice ? <Alert variant="info">{notice}</Alert> : null}

              <Card>
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_repeat(4,minmax(140px,1fr))]">
                  <div>
                    <Label htmlFor="auditAction">Ação</Label>
                    <Input
                      id="auditAction"
	                      className="mt-2"
	                      value={actionFilter}
	                      onChange={(event) => setActionFilter(event.target.value)}
	                      placeholder="Buscar por ação"
                    />
                  </div>
                  <div>
                    <Label htmlFor="auditSeverity">Severidade</Label>
                    <Select
                      id="auditSeverity"
                      className="mt-2"
                      value={severityFilter}
                      onChange={(event) => setSeverityFilter(event.target.value as AuditSeverity | "")}
                    >
                      {SEVERITIES.map((entry) => (
                        <option key={entry || "all"} value={entry}>
                          {entry ? labelAuditSeverity(entry) : "todas"}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="auditOutcome">Resultado</Label>
                    <Select
                      id="auditOutcome"
                      className="mt-2"
                      value={outcomeFilter}
                      onChange={(event) => setOutcomeFilter(event.target.value as AuditOutcome | "")}
                    >
                      {OUTCOMES.map((entry) => (
                        <option key={entry || "all"} value={entry}>
                          {entry ? labelAuditOutcome(entry) : "todos"}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="auditResourceType">Recurso</Label>
                    <Select
                      id="auditResourceType"
                      className="mt-2"
                      value={resourceTypeFilter}
                      onChange={(event) =>
                        setResourceTypeFilter(event.target.value as AuditResourceType | "")
                      }
                    >
                      {RESOURCE_TYPES.map((entry) => (
                        <option key={entry || "all"} value={entry}>
                          {entry ? labelResourceType(entry) : "todos"}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="auditClient">Cliente</Label>
                    <Input
                      id="auditClient"
                      className="mt-2"
                      value={clientFilter}
                      onChange={(event) => setClientFilter(event.target.value)}
                      placeholder="Filtrar por cliente"
                    />
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="outline" disabled={saving} onClick={() => handleExport("csv")}>
                    Exportar CSV
                  </Button>
                  <Button variant="outline" disabled={saving} onClick={() => handleExport("json")}>
                    Exportar JSON
                  </Button>
                </div>
              </Card>

              <Card>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase text-moss">Trilha de auditoria</p>
                    <h1 className="text-2xl font-semibold text-stone-900">Eventos auditáveis</h1>
                  </div>
                  <Badge variant="outline">{total} eventos</Badge>
                </div>

                {auditEvents.length === 0 ? (
                  <Alert variant="info" className="mt-5">Nenhum evento neste filtro.</Alert>
                ) : (
                  <div className="mt-5 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ação</TableHead>
                          <TableHead>Recurso</TableHead>
                          <TableHead>Ator</TableHead>
                          <TableHead>Resultado</TableHead>
                          <TableHead>Metadados</TableHead>
                          <TableHead>Data</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditEvents.map((event) => (
                          <TableRow key={event.id}>
                            <TableCell className="font-medium text-stone-900">
                              {labelAuditAction(event.action)}
                            </TableCell>
                            <TableCell>{resourceLink(event)}</TableCell>
                            <TableCell>{event.actorName ?? event.actorId ?? "sistema"}</TableCell>
                            <TableCell>
                              <Badge variant={auditOutcomeVariant(event.outcome)}>
                                {labelAuditOutcome(event.outcome)}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[260px] text-xs text-stone-600">
                              {metadataSummary(event)}
                            </TableCell>
                            <TableCell>{formatDate(event.createdAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </Card>
            </div>

            <Card>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-moss">Supervisão</p>
                  <h2 className="text-xl font-semibold text-stone-900">Fila de revisão</h2>
                </div>
                <Badge variant="outline">{reviews.length}</Badge>
              </div>

              <div className="mt-5 grid gap-3">
                {reviews.length === 0 ? (
                  <Alert variant="info">Sem revisões abertas.</Alert>
                ) : (
                  reviews.map((review) => {
                    const auditEvent = auditEventsById.get(review.auditEventId);

                    return (
                      <div key={review.id} className="rounded-md border border-border p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-stone-900">
                              {auditEvent ? labelAuditAction(auditEvent.action) : "Evento de auditoria"}
                            </p>
                            <p className="text-sm text-stone-500">
	                              {auditEvent
	                                ? `${formatAuditResourceReference(auditEvent)} · `
	                                : ""}
                              {labelAuditSeverity(review.severity)} · {labelReviewStatus(review.status)}
                            </p>
                          </div>
                          <Badge variant={auditSeverityVariant(review.severity)}>
                            {labelAuditSeverity(review.severity)}
                          </Badge>
                        </div>
                        <Button
                          className="mt-3 w-full"
                          variant="secondary"
                          disabled={saving || review.status === "resolved"}
                          onClick={() => handleResolveReview(review)}
                        >
                          Resolver revisão
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
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

function resourceLink(event: AuditEvent) {
  if (event.clientId) {
    return (
      <Link href={`/dashboard/clients/${event.clientId}`} className="font-medium text-moss">
        {formatAuditResourceReference(event)}
      </Link>
    );
  }
  if (event.portfolioId) {
    return (
      <Link href={`/dashboard/portfolios/${event.portfolioId}`} className="font-medium text-moss">
        {formatAuditResourceReference(event)}
      </Link>
    );
  }
  return formatAuditResourceReference(event);
}

function metadataSummary(event: AuditEvent) {
  const entries = Object.entries(event.metadata).slice(0, 3);
  if (entries.length === 0) {
    return "Sem metadados";
  }
  return entries
    .map(([key, value]) => `${metadataKeyLabel(key)}: ${metadataValueLabel(event, key, value)}`)
    .join(" · ");
}

function formatDate(value: string) {
  return formatDateTime(value);
}

function metadataKeyLabel(key: string) {
  const labels: Record<string, string> = {
    assetSymbol: "ativo",
    channel: "canal",
    failureCode: "falha",
    householdId: "grupo familiar",
    itemCount: "itens",
    onboardingStatus: "cadastro",
    permissionCount: "permissões",
    previousStatus: "status anterior",
    resourceId: "recurso",
    resourceType: "tipo de recurso",
    status: "status",
    transactionType: "tipo"
  };

  return labels[key] ?? "campo";
}

function metadataValueLabel(event: AuditEvent, key: string, value: unknown) {
  if (value === null || value === undefined) {
    return "não informado";
  }
  if (typeof value === "boolean") {
    return value ? "sim" : "não";
  }
  if (typeof value === "number") {
    return String(value);
  }
  if (typeof value !== "string") {
    return String(value);
  }

  if (key === "resourceType") {
    return labelResourceType(value);
  }
  if (key === "resourceId") {
    const metadataResourceType =
      typeof event.metadata.resourceType === "string" ? event.metadata.resourceType : event.resourceType;
    return formatResourceReference(metadataResourceType, undefined, businessResourceName(value, event));
  }
  if (key === "householdId") {
    return businessResourceName(value, event);
  }
  if (key === "failureCode") {
    return failureCodeLabel(value);
  }
  if (key === "channel") {
    return channelLabel(value);
  }
  if (key === "onboardingStatus") {
    return labelOnboardingStatus(value);
  }
  if (key === "transactionType") {
    return labelTransactionType(value);
  }
  if (key === "status" || key === "previousStatus") {
    return labelReportPackageStatus(value);
  }

  return businessResourceName(value, event);
}

function formatAuditResourceReference(event: AuditEvent) {
  return formatResourceReference(event.resourceType, undefined, auditResourceDisplayName(event));
}

function auditResourceDisplayName(event: AuditEvent) {
  const knownName = businessResourceName(event.resourceId, event);
  if (knownName !== "referência interna") {
    return knownName;
  }

  if (event.resourceType === "delivery") {
    return event.action.startsWith("report_package.") ? "Pacote de relatório" : "Entrega de relatório";
  }
  if (event.resourceType === "ledger") {
    const assetSymbol = event.metadata.assetSymbol;
    return typeof assetSymbol === "string" ? `Movimentação de ${assetSymbol}` : "Movimentação registrada";
  }
  if (event.resourceType === "permission") {
    return "Permissão do cliente";
  }
  if (event.resourceType === "client") {
    return "Cliente acompanhado";
  }

  return labelResourceType(event.resourceType);
}

function businessResourceName(value: string, event: AuditEvent) {
  const knownNames: Record<string, string> = {
    asn_core_client_main: "Permissão para Marina Silva",
    client_founder: "Alice Fundadora",
    client_main: "Marina Silva",
    client_spouse: "Renato Silva",
    hh_main_silva: "Família Silva",
    pltxn_001: "Movimentação de MSFT",
    prt_main: "Carteira Crescimento",
    rpkg_delivered_main: "Pacote mensal de risco",
    rpt_001: "Relatório mensal de risco"
  };
  const knownName = knownNames[value];
  if (knownName) {
    return knownName;
  }

  if (!looksTechnical(value)) {
    return value;
  }

  if (event.resourceType === "delivery") {
    return event.action.startsWith("report_package.") ? "Pacote de relatório" : "Entrega de relatório";
  }
  if (event.resourceType === "ledger") {
    const assetSymbol = event.metadata.assetSymbol;
    return typeof assetSymbol === "string" ? `Movimentação de ${assetSymbol}` : "Movimentação registrada";
  }

  return "referência interna";
}

function failureCodeLabel(value: string) {
  const labels: Record<string, string> = {
    delivery_timeout: "tempo limite na entrega"
  };

  return labels[value] ?? businessResourceName(value, emptyAuditEvent);
}

function channelLabel(value: string) {
  const labels: Record<string, string> = {
    email: "e-mail",
    portal: "portal"
  };

  return labels[value] ?? businessResourceName(value, emptyAuditEvent);
}

function looksTechnical(value: string) {
  return /^[a-z]+[a-z0-9]*[_:.][a-z0-9_.:-]+$/i.test(value);
}

const emptyAuditEvent: AuditEvent = {
  id: "",
  officeId: "",
  action: "",
  resourceType: "review",
  resourceId: "",
  outcome: "success",
  severity: "info",
  reviewRequired: false,
  metadata: {},
  createdAt: ""
};
