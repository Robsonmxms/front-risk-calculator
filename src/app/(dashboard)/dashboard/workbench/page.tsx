"use client";

import Link from "next/link";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { AppHeader } from "../../../../components/layout/AppHeader";
import { PageSectionNavigation } from "../../../../components/layout/PageSectionNavigation";
import { Alert } from "../../../../components/ui/alert";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Card } from "../../../../components/ui/card";
import {
  chartPalette,
  ThemedHeatmapChart,
  ThemedHorizontalBarChart,
  ThemedLineChart,
  ThemedScatterChart,
  ThemedStackedBarChart
} from "../../../../components/charts/risk-charts";
import { Label } from "../../../../components/ui/form";
import { Input } from "../../../../components/ui/input";
import { Select } from "../../../../components/ui/select";
import { Textarea } from "../../../../components/ui/textarea";
import { useAuth } from "../../../../features/auth/AuthProvider";
import { LogoutButton } from "../../../../features/auth/LogoutButton";
import { ProtectedRoute } from "../../../../features/auth/ProtectedRoute";
import {
  createReviewItem,
  getAdvisorCharts,
  getWorkbench,
  listReviewItems,
  updateReviewItem
} from "../../../../features/workbench/workbenchApi";
import {
  AdvisorChartBundle,
  AdvisorChartRange,
  AdvisorFreshness,
  AdvisorRiskBand,
  ReviewItem,
  ReviewItemSeverity,
  ReviewItemStatus,
  ReviewResourceType,
  StaffWorkbench
} from "../../../../features/workbench/types";
import {
  formatCurrency,
  formatDate,
  formatDecimal,
  formatResourceReference,
  getApiErrorMessage,
  labelDataQualityIssueCode,
  labelAlertSeverity,
  labelOfficeRole,
  labelPortfolioFreshness,
  labelPortfolioStatus,
  labelReportPackageStatus,
  labelResourceType,
  labelReviewStatus,
  labelSector
} from "../../../../lib/presentation";

const SEVERITIES: Array<ReviewItemSeverity | ""> = ["", "low", "medium", "high"];
const STATUSES: Array<ReviewItemStatus | ""> = ["", "open", "in_progress", "closed"];
const CHART_RANGES: AdvisorChartRange[] = ["30d", "90d", "ytd", "1y", "all"];
const CHART_RISK_BANDS: Array<AdvisorRiskBand | ""> = ["", "low", "watch", "high"];
const CHART_FRESHNESS: Array<AdvisorFreshness | ""> = ["", "fresh", "partial", "stale"];

export default function WorkbenchPage() {
  const { actor, activeOffice } = useAuth();
  const officeId = activeOffice?.officeId;
  const isClientOffice = activeOffice?.role === "client";
  const [workbench, setWorkbench] = useState<StaffWorkbench | null>(null);
  const [advisorCharts, setAdvisorCharts] = useState<AdvisorChartBundle | null>(null);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [severityFilter, setSeverityFilter] = useState<ReviewItemSeverity | "">("");
  const [statusFilter, setStatusFilter] = useState<ReviewItemStatus | "">("open");
  const [chartRange, setChartRange] = useState<AdvisorChartRange>("90d");
  const [chartRiskBand, setChartRiskBand] = useState<AdvisorRiskBand | "">("");
  const [chartFreshness, setChartFreshness] = useState<AdvisorFreshness | "">("");
  const [selectedAdvisorUserId, setSelectedAdvisorUserId] = useState("");
  const [title, setTitle] = useState("");
  const [resourceType, setResourceType] = useState<ReviewResourceType>("client");
  const [resourceId, setResourceId] = useState("");
  const [clientId, setClientId] = useState("");
  const [severity, setSeverity] = useState<ReviewItemSeverity>("medium");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartError, setChartError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const advisorOptions = useMemo(() => {
    const options = new Map<string, string>();
    for (const client of workbench?.assignedClients ?? []) {
      if (client.advisorUserId) {
        options.set(client.advisorUserId, client.advisorName ?? client.advisorUserId);
      }
    }
    return Array.from(options.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [workbench]);

  useEffect(() => {
    if (!officeId || isClientOffice) {
      setWorkbench(null);
      setAdvisorCharts(null);
      setReviewItems([]);
      setLoading(false);
      setChartLoading(false);
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
          setError(
            getApiErrorMessage(caught, "Não foi possível carregar a mesa de acompanhamento.")
          );
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
  }, [isClientOffice, officeId, severityFilter, statusFilter]);

  useEffect(() => {
    if (!workbench || activeOffice?.role !== "office_admin" || selectedAdvisorUserId) {
      return;
    }

    setSelectedAdvisorUserId(advisorOptions[0]?.id ?? "");
  }, [activeOffice?.role, advisorOptions, selectedAdvisorUserId, workbench]);

  useEffect(() => {
    if (!officeId || isClientOffice) {
      setAdvisorCharts(null);
      setChartLoading(false);
      return;
    }

    let isActive = true;
    setChartLoading(true);
    setChartError(null);

    getAdvisorCharts(officeId, {
      advisorUserId:
        activeOffice?.role === "office_admin" ? selectedAdvisorUserId || undefined : undefined,
      range: chartRange,
      riskBand: chartRiskBand,
      freshness: chartFreshness
    })
      .then((data) => {
        if (isActive) {
          setAdvisorCharts(data);
        }
      })
      .catch((caught) => {
        if (isActive) {
          setChartError(
            getApiErrorMessage(caught, "Não foi possível carregar os gráficos da carteira.")
          );
        }
      })
      .finally(() => {
        if (isActive) {
          setChartLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [
    activeOffice?.role,
    chartFreshness,
    chartRange,
    chartRiskBand,
    isClientOffice,
    officeId,
    selectedAdvisorUserId
  ]);

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
        dueDate: dueDate || undefined,
        notes: notes || undefined
      });
      setReviewItems((current) => [item, ...current]);
      setTitle("");
      setDueDate("");
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
              {activeOffice ? (
                <Badge variant="outline">{labelOfficeRole(activeOffice.role)}</Badge>
              ) : null}
              <LogoutButton />
            </>
          }
        />

        {!officeId ? (
          <Alert variant="warning">
            Selecione um escritório para abrir a mesa de acompanhamento.
          </Alert>
        ) : isClientOffice ? (
          <section className="grid gap-4">
            <Alert variant="warning">
              Esta área é restrita à equipe. Os pacotes disponíveis para cliente ficam no portal.
            </Alert>
            <Link
              href="/dashboard/client-portal"
              className="w-fit rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-muted"
            >
              Abrir portal do cliente
            </Link>
          </section>
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
            <PageSectionNavigation
              className="xl:col-span-2"
              label="Seções da mesa de acompanhamento"
              links={[
                { href: "#workbench-resumo", label: "Resumo" },
                { href: "#workbench-graficos", label: "Gráficos" },
                { href: "#workbench-fila", label: "Fila" },
                { href: "#workbench-clientes", label: "Clientes" },
                { href: "#workbench-atencao", label: "Atenção" },
                { href: "#workbench-criar", label: "Criar item" }
              ]}
            />
            <div className="grid gap-4">
              <section id="workbench-resumo" className="scroll-mt-4 grid gap-4 md:grid-cols-4">
                <MetricCard label="Clientes" value={workbench.counts.assignedClients} />
                <MetricCard label="Atenção" value={workbench.counts.portfoliosNeedingAttention} />
                <MetricCard label="Em aberto" value={workbench.counts.openReviewItems} />
                <MetricCard label="Alta atenção" value={workbench.counts.highSeverityReviewItems} />
              </section>

              {notice ? <Alert variant="info">{notice}</Alert> : null}

              <AdvisorChartsDashboard
                charts={advisorCharts}
                loading={chartLoading}
                error={chartError}
                range={chartRange}
                riskBand={chartRiskBand}
                freshness={chartFreshness}
                advisorUserId={selectedAdvisorUserId}
                advisorOptions={advisorOptions}
                canSelectAdvisor={activeOffice?.role === "office_admin"}
                onRangeChange={setChartRange}
                onRiskBandChange={setChartRiskBand}
                onFreshnessChange={setChartFreshness}
                onAdvisorChange={setSelectedAdvisorUserId}
              />

              <Card id="workbench-fila" className="scroll-mt-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase text-moss">
                      Fila de acompanhamento
                    </p>
                    <h1 className="text-2xl font-semibold text-stone-900">
                      Itens de acompanhamento
                    </h1>
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
                      onChange={(event) =>
                        setStatusFilter(event.target.value as ReviewItemStatus | "")
                      }
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
                  <Alert variant="info" className="mt-5">
                    Nenhum item de acompanhamento neste filtro.
                  </Alert>
                ) : (
                  <div className="mt-5 divide-y divide-border rounded-lg border border-border">
                    <div className="hidden grid-cols-[minmax(180px,1.4fr)_minmax(160px,1fr)_120px_120px_minmax(150px,.9fr)] gap-3 bg-muted/40 px-3 py-2 text-xs font-semibold uppercase text-stone-500 md:grid">
                      <span>Título</span>
                      <span>Recurso</span>
                      <span>Severidade</span>
                      <span>Prazo</span>
                      <span>Status</span>
                    </div>
                    {reviewItems.map((item) => (
                      <div
                        key={item.id}
                        className="grid gap-3 p-3 text-sm md:grid-cols-[minmax(180px,1.4fr)_minmax(160px,1fr)_120px_120px_minmax(150px,.9fr)] md:items-center"
                      >
                        <div>
                          <span className="block text-xs font-semibold uppercase text-stone-500 md:hidden">
                            Título
                          </span>
                          <strong className="font-medium text-stone-900">{item.title}</strong>
                        </div>
                        <div>
                          <span className="block text-xs font-semibold uppercase text-stone-500 md:hidden">
                            Recurso
                          </span>
                          {resourceLink(item, workbench, isClientOffice)}
                        </div>
                        <div>
                          <span className="block text-xs font-semibold uppercase text-stone-500 md:hidden">
                            Severidade
                          </span>
                          {labelAlertSeverity(item.severity)}
                        </div>
                        <div>
                          <span className="block text-xs font-semibold uppercase text-stone-500 md:hidden">
                            Prazo
                          </span>
                          {item.dueDate ? formatDate(item.dueDate) : "Sem prazo"}
                        </div>
                        <div>
                          <span className="block text-xs font-semibold uppercase text-stone-500 md:hidden">
                            Status
                          </span>
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
                              <option value="in_progress">
                                {labelReviewStatus("in_progress")}
                              </option>
                              <option value="closed">{labelReviewStatus("closed")}</option>
                            </Select>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card id="workbench-clientes" className="scroll-mt-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase text-moss">Clientes</p>
                    <h2 className="text-xl font-semibold text-stone-900">
                      Carteira de clientes atribuída
                    </h2>
                  </div>
                  <Badge variant="outline">{workbench.assignedClients.length} clientes</Badge>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {workbench.assignedClients.map((client) =>
                    isClientOffice ? (
                      <div key={client.id} className="rounded-md border border-border p-3 text-sm">
                        <span className="block font-medium text-stone-900">{client.name}</span>
                        <span className="text-stone-500">
                          {client.householdName ?? "Sem grupo familiar"}
                        </span>
                      </div>
                    ) : (
                      <Link
                        key={client.id}
                        href={`/dashboard/clients/${client.id}`}
                        className="rounded-md border border-border p-3 text-sm hover:border-moss"
                      >
                        <span className="block font-medium text-stone-900">{client.name}</span>
                        <span className="text-stone-500">
                          {client.householdName ?? "Sem grupo familiar"}
                        </span>
                      </Link>
                    )
                  )}
                </div>
              </Card>

              <Card id="workbench-atencao" className="scroll-mt-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase text-moss">Atenção operacional</p>
                    <h2 className="text-xl font-semibold text-stone-900">
                      Portfólios pedindo atenção
                    </h2>
                  </div>
                  <Badge variant="outline">
                    {workbench.portfoliosNeedingAttention.length} portfólios
                  </Badge>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {workbench.portfoliosNeedingAttention.length === 0 ? (
                    <Alert variant="info">Sem portfólios degradados neste escritório.</Alert>
                  ) : (
                    workbench.portfoliosNeedingAttention.map((portfolio) =>
                      isClientOffice ? (
                        <div
                          key={portfolio.id}
                          className="rounded-md border border-border p-3 text-sm"
                        >
                          <span className="block font-medium text-stone-900">{portfolio.name}</span>
                          <span className="text-stone-500">
                            {labelPortfolioStatus(portfolio.status)} ·{" "}
                            {labelPortfolioFreshness(portfolio.freshness)}
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
                            {labelPortfolioStatus(portfolio.status)} ·{" "}
                            {labelPortfolioFreshness(portfolio.freshness)}
                          </span>
                        </Link>
                      )
                    )
                  )}
                </div>
              </Card>
            </div>

            {!isClientOffice ? (
              <Card id="workbench-criar" className="scroll-mt-4">
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
                  ) : resourceType === "portfolio" &&
                    workbench.portfoliosNeedingAttention.length > 0 ? (
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

function MetricCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Card className="grid h-full gap-1">
      <span className="text-xs font-semibold uppercase leading-tight text-stone-500">{label}</span>
      <strong className="block break-words text-2xl leading-tight text-stone-900">{value}</strong>
    </Card>
  );
}

function AdvisorChartsDashboard({
  charts,
  loading,
  error,
  range,
  riskBand,
  freshness,
  advisorUserId,
  advisorOptions,
  canSelectAdvisor,
  onRangeChange,
  onRiskBandChange,
  onFreshnessChange,
  onAdvisorChange
}: {
  charts: AdvisorChartBundle | null;
  loading: boolean;
  error: string | null;
  range: AdvisorChartRange;
  riskBand: AdvisorRiskBand | "";
  freshness: AdvisorFreshness | "";
  advisorUserId: string;
  advisorOptions: Array<{ id: string; name: string }>;
  canSelectAdvisor: boolean;
  onRangeChange: (value: AdvisorChartRange) => void;
  onRiskBandChange: (value: AdvisorRiskBand | "") => void;
  onFreshnessChange: (value: AdvisorFreshness | "") => void;
  onAdvisorChange: (value: string) => void;
}) {
  return (
    <section
      id="workbench-graficos"
      className="scroll-mt-4 grid gap-4"
      aria-label="Gráficos da carteira do assessor"
    >
      <Card>
        <div className="grid gap-5">
          <div>
            <p className="text-xs font-semibold uppercase text-moss">Carteira do assessor</p>
            <h2 className="text-xl font-semibold text-stone-900">
              Monitoramento do livro de clientes
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {canSelectAdvisor ? (
              <Select
                aria-label="Selecionar assessor"
                value={advisorUserId}
                onChange={(event) => onAdvisorChange(event.target.value)}
              >
                <option value="">Minha visão</option>
                {advisorOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </Select>
            ) : null}
            <Select
              aria-label="Período dos gráficos"
              value={range}
              onChange={(event) => onRangeChange(event.target.value as AdvisorChartRange)}
            >
              {CHART_RANGES.map((entry) => (
                <option key={entry} value={entry}>
                  {labelAdvisorRange(entry)}
                </option>
              ))}
            </Select>
            <Select
              aria-label="Filtrar faixa de risco"
              value={riskBand}
              onChange={(event) => onRiskBandChange(event.target.value as AdvisorRiskBand | "")}
            >
              {CHART_RISK_BANDS.map((entry) => (
                <option key={entry || "all"} value={entry}>
                  {entry ? labelRiskBand(entry) : "todas as faixas"}
                </option>
              ))}
            </Select>
            <Select
              aria-label="Filtrar frescor dos dados"
              value={freshness}
              onChange={(event) => onFreshnessChange(event.target.value as AdvisorFreshness | "")}
            >
              {CHART_FRESHNESS.map((entry) => (
                <option key={entry || "all"} value={entry}>
                  {entry ? labelPortfolioFreshness(entry) : "todos os dados"}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {loading ? (
        <Alert variant="info">Carregando gráficos da carteira.</Alert>
      ) : error ? (
        <Alert variant="failure">{error}</Alert>
      ) : !charts ? (
        <Alert variant="warning">Gráficos da carteira indisponíveis.</Alert>
      ) : charts.dataQuality.status === "empty" ? (
        <Alert variant="info">Nenhum cliente atribuído para os filtros selecionados.</Alert>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-4">
            <MetricCard
              label="Valor acompanhado"
              value={formatCurrency(totalBookValue(charts), "USD")}
            />
            <MetricCard label="Portfólios" value={charts.dataQuality.sourceCounts.portfolios} />
            <MetricCard label="Alertas" value={charts.dataQuality.sourceCounts.alerts} />
            <MetricCard label="Pacotes" value={charts.dataQuality.sourceCounts.reportPackages} />
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <ChartShell
              eyebrow="Evolução"
              title="Valor do livro"
              aside={
                <Badge variant={qualityVariant(charts.dataQuality.status)}>
                  {labelAdvisorQualityStatus(charts.dataQuality.status)}
                </Badge>
              }
            >
              <LineChart points={charts.charts.bookValueTrend} />
            </ChartShell>

            <ChartShell eyebrow="Risco e retorno" title="Dispersão por portfólio">
              <ScatterChart points={charts.charts.riskReturnScatter} />
            </ChartShell>

            <ChartShell eyebrow="Exposição" title="Alocação agregada">
              <AllocationBars points={charts.charts.allocationBreakdown} />
            </ChartShell>

            <ChartShell eyebrow="Setores" title="Mapa por cliente">
              <SectorHeatmap cells={charts.charts.sectorExposureHeatmap} />
            </ChartShell>

            <ChartShell eyebrow="Alertas" title="Severidade no período">
              <SeverityTimeline points={charts.charts.alertSeverityTimeline} />
            </ChartShell>

            <ChartShell eyebrow="Entregas" title="Pipeline de pacotes">
              <ReportPipeline points={charts.charts.reportPipeline} />
            </ChartShell>

            <ChartShell eyebrow="Acompanhamento" title="Envelhecimento da fila">
              <WorkbenchAging points={charts.charts.workbenchAging} />
            </ChartShell>

            <ChartShell eyebrow="Dados" title="Backlog de atualização">
              <StaleBacklog items={charts.charts.staleDataBacklog} />
            </ChartShell>
          </section>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <ChartShell eyebrow="Prioridade" title="Clientes que pedem atenção">
              <NeedsAttentionTable items={charts.rankings.needsAttention} />
            </ChartShell>
            <ChartShell eyebrow="Qualidade" title="Fontes e pendências">
              <DataQualityPanel charts={charts} />
            </ChartShell>
          </section>
        </>
      )}
    </section>
  );
}

function ChartShell({
  eyebrow,
  title,
  aside,
  children
}: {
  eyebrow: string;
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-moss">{eyebrow}</p>
          <h3 className="text-lg font-semibold text-stone-900">{title}</h3>
        </div>
        {aside}
      </div>
      <div className="mt-5 min-h-[220px]">{children}</div>
    </Card>
  );
}

function LineChart({ points }: { points: AdvisorChartBundle["charts"]["bookValueTrend"] }) {
  if (points.length === 0) {
    return <EmptyChartState>Nenhum histórico disponível.</EmptyChartState>;
  }

  return (
    <div className="grid gap-3">
      <ThemedLineChart
        ariaLabel="Valor do livro no período"
        color={chartPalette.moss}
        valueFormatter={(value) => formatCurrency(value, "USD")}
        data={points.map((point) => ({
          name: formatDate(point.date),
          value: point.value,
          detail: `${point.clientCount} clientes · ${point.portfolioCount} portfólios`
        }))}
      />
      <div className="flex flex-wrap justify-between gap-2 text-xs text-stone-500">
        <span>{formatDate(points[0].date)}</span>
        <span className="font-medium text-stone-700">
          {formatCurrency(points[points.length - 1].value, "USD")}
        </span>
        <span>{formatDate(points[points.length - 1].date)}</span>
      </div>
    </div>
  );
}

function ScatterChart({ points }: { points: AdvisorChartBundle["charts"]["riskReturnScatter"] }) {
  return (
    <div className="grid gap-3">
      <ThemedScatterChart
        ariaLabel="Risco e retorno por portfólio"
        xLabel="volatilidade"
        yLabel="retorno"
        xFormatter={formatPercent}
        yFormatter={formatPercent}
        data={points.map((point) => ({
          name: point.portfolioName,
          x: point.volatilityPercent ?? 0,
          y: point.annualizedReturnPercent ?? 0,
          z: point.value,
          fill: riskColor(point.riskBand),
          detail: `${labelRiskBand(point.riskBand)} · ${labelPortfolioFreshness(point.freshness)}`
        }))}
      />
      <div className="grid gap-2 text-xs text-stone-600 sm:grid-cols-2">
        {points.slice(0, 4).map((point) => (
          <Link
            key={point.portfolioId}
            href={`/dashboard/portfolios/${point.portfolioId}`}
            className="rounded-md border border-border px-2 py-1 hover:border-moss"
          >
            {point.portfolioName} · {labelRiskBand(point.riskBand)}
          </Link>
        ))}
      </div>
    </div>
  );
}

function AllocationBars({
  points
}: {
  points: AdvisorChartBundle["charts"]["allocationBreakdown"];
}) {
  return (
    <ThemedHorizontalBarChart
      ariaLabel="Alocação agregada"
      color={chartPalette.moss}
      valueFormatter={formatPercent}
      data={points.slice(0, 8).map((point) => ({
        name: point.label,
        value: point.weightPercent,
        detail: formatCurrency(point.marketValueUsd, "USD")
      }))}
    />
  );
}

function SectorHeatmap({
  cells
}: {
  cells: AdvisorChartBundle["charts"]["sectorExposureHeatmap"];
}) {
  return (
    <ThemedHeatmapChart
      ariaLabel="Mapa setorial por cliente"
      data={cells.slice(0, 14).map((cell) => ({
        x: labelSector(cell.sector),
        y: cell.clientName,
        value: cell.weightPercent,
        fill: heatColor(cell.weightPercent),
        detail: formatCurrency(cell.marketValueUsd, "USD")
      }))}
    />
  );
}

function SeverityTimeline({
  points
}: {
  points: AdvisorChartBundle["charts"]["alertSeverityTimeline"];
}) {
  if (points.length === 0) {
    return <EmptyChartState>Nenhum alerta no período.</EmptyChartState>;
  }

  return (
    <ThemedStackedBarChart
      ariaLabel="Severidade de alertas no período"
      data={points.map((point) => ({
        name: formatDate(point.date),
        total: point.total,
        low: point.low,
        medium: point.medium,
        high: point.high
      }))}
      bars={[
        { key: "low", label: "baixa", color: chartPalette.emerald },
        { key: "medium", label: "média", color: chartPalette.amber },
        { key: "high", label: "alta", color: chartPalette.rose }
      ]}
    />
  );
}

function ReportPipeline({ points }: { points: AdvisorChartBundle["charts"]["reportPipeline"] }) {
  if (points.length === 0) {
    return <EmptyChartState>Nenhum pacote no período.</EmptyChartState>;
  }

  return (
    <ThemedHorizontalBarChart
      ariaLabel="Pipeline de pacotes"
      color={chartPalette.graphite}
      data={points.map((point) => ({
        name: labelReportPackageStatus(point.status),
        value: point.count,
        detail: `${point.clientCount} clientes${point.staleCount > 0 ? ` · ${point.staleCount} atrasados` : ""}`
      }))}
    />
  );
}

function WorkbenchAging({ points }: { points: AdvisorChartBundle["charts"]["workbenchAging"] }) {
  const visible = points.filter((point) => point.total > 0);
  if (visible.length === 0) {
    return <EmptyChartState>Nenhum item aberto na fila.</EmptyChartState>;
  }

  return (
    <ThemedStackedBarChart
      ariaLabel="Envelhecimento da fila de acompanhamento"
      data={visible.map((point) => ({
        name: labelAgingBucket(point.bucket),
        total: point.total,
        low: point.low,
        medium: point.medium,
        high: point.high
      }))}
      bars={[
        { key: "low", label: "baixa", color: chartPalette.emerald },
        { key: "medium", label: "média", color: chartPalette.amber },
        { key: "high", label: "alta", color: chartPalette.rose }
      ]}
    />
  );
}

function StaleBacklog({ items }: { items: AdvisorChartBundle["charts"]["staleDataBacklog"] }) {
  if (items.length === 0) {
    return <EmptyChartState>Nenhum backlog de atualização.</EmptyChartState>;
  }

  return (
    <div className="grid gap-3">
      {items.slice(0, 6).map((item) => (
        <Link
          key={item.portfolioId}
          href={`/dashboard/portfolios/${item.portfolioId}`}
          className="rounded-md border border-border p-3 text-sm hover:border-moss"
        >
          <span className="block font-medium text-stone-900">{item.portfolioName}</span>
          <span className="block text-stone-500">
            {item.clientName ?? "Cliente vinculado"} · {labelPortfolioFreshness(item.freshness)}
          </span>
          <span className="block text-xs text-stone-500">{item.reason}</span>
        </Link>
      ))}
    </div>
  );
}

function NeedsAttentionTable({
  items
}: {
  items: AdvisorChartBundle["rankings"]["needsAttention"];
}) {
  if (items.length === 0) {
    return <EmptyChartState>Nenhum cliente priorizado nos filtros.</EmptyChartState>;
  }

  return (
    <div className="divide-y divide-border rounded-lg border border-border">
      <div className="hidden grid-cols-[minmax(180px,1.2fr)_100px_150px_minmax(180px,1fr)_minmax(130px,.8fr)] gap-3 bg-muted/40 px-3 py-2 text-xs font-semibold uppercase text-stone-500 md:grid">
        <span>Cliente</span>
        <span>Faixa</span>
        <span>Dados</span>
        <span>Motivos</span>
        <span className="text-right">Valor</span>
      </div>
      {items.slice(0, 8).map((item) => (
        <div
          key={item.clientId}
          className="grid gap-3 p-3 text-sm md:grid-cols-[minmax(180px,1.2fr)_100px_150px_minmax(180px,1fr)_minmax(130px,.8fr)] md:items-start"
        >
          <div>
            <span className="block text-xs font-semibold uppercase text-stone-500 md:hidden">
              Cliente
            </span>
            <Link href={`/dashboard/clients/${item.clientId}`} className="font-medium text-moss">
              {item.rank}. {item.clientName}
            </Link>
          </div>
          <div>
            <span className="block text-xs font-semibold uppercase text-stone-500 md:hidden">
              Faixa
            </span>
            {labelRiskBand(item.riskBand)}
          </div>
          <div>
            <span className="block text-xs font-semibold uppercase text-stone-500 md:hidden">
              Dados
            </span>
            {labelPortfolioFreshness(item.freshness)}
          </div>
          <div>
            <span className="block text-xs font-semibold uppercase text-stone-500 md:hidden">
              Motivos
            </span>
            <span className="text-xs text-stone-500">{item.reasons.join(", ")}</span>
          </div>
          <div className="font-medium text-stone-900 md:text-right">
            <span className="block text-xs font-semibold uppercase text-stone-500 md:hidden">
              Valor
            </span>
            {formatCurrency(item.value, "USD")}
          </div>
        </div>
      ))}
    </div>
  );
}

function DataQualityPanel({ charts }: { charts: AdvisorChartBundle }) {
  return (
    <div className="grid gap-3 text-sm">
      <Badge variant={qualityVariant(charts.dataQuality.status)} className="w-fit">
        {labelAdvisorQualityStatus(charts.dataQuality.status)}
      </Badge>
      <div className="grid grid-cols-2 gap-2 text-xs text-stone-600">
        <span>Clientes: {charts.dataQuality.sourceCounts.clients}</span>
        <span>Grupos: {charts.dataQuality.sourceCounts.households}</span>
        <span>Portfólios: {charts.dataQuality.sourceCounts.portfolios}</span>
        <span>Retratos analíticos: {charts.dataQuality.sourceCounts.analyticsSnapshots}</span>
      </div>
      {charts.dataQuality.issues.length === 0 ? (
        <Alert variant="success">Fontes carregadas para os filtros atuais.</Alert>
      ) : (
        <div className="grid gap-2">
          {charts.dataQuality.issues.slice(0, 4).map((issue) => (
            <Alert
              key={`${issue.code}-${issue.message}`}
              variant={issue.severity === "blocking" ? "failure" : "warning"}
            >
              {labelDataQualityIssueCode(issue.code)}
            </Alert>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyChartState({ children }: { children: ReactNode }) {
  return (
    <Alert variant="info" className="flex min-h-40 items-center bg-blue-50/70">
      <div className="space-y-1">
        <p className="font-semibold text-blue-950">Dados insuficientes</p>
        <p>{children}</p>
      </div>
    </Alert>
  );
}

function totalBookValue(charts: AdvisorChartBundle) {
  const latestTrend = charts.charts.bookValueTrend[charts.charts.bookValueTrend.length - 1]?.value;
  if (latestTrend !== undefined) {
    return latestTrend;
  }
  return charts.rankings.needsAttention.reduce((sum, item) => sum + item.value, 0);
}

function labelAdvisorRange(value: AdvisorChartRange) {
  const labels: Record<AdvisorChartRange, string> = {
    "30d": "30 dias",
    "90d": "90 dias",
    ytd: "ano atual",
    "1y": "1 ano",
    all: "todo histórico"
  };
  return labels[value];
}

function labelRiskBand(value: AdvisorRiskBand) {
  const labels: Record<AdvisorRiskBand, string> = {
    low: "baixa",
    watch: "observação",
    high: "alta"
  };
  return labels[value];
}

function labelAdvisorQualityStatus(value: AdvisorChartBundle["dataQuality"]["status"]) {
  const labels: Record<AdvisorChartBundle["dataQuality"]["status"], string> = {
    fresh: "fontes atualizadas",
    partial: "fontes parciais",
    stale: "dados desatualizados",
    empty: "sem clientes"
  };
  return labels[value];
}

function qualityVariant(value: AdvisorChartBundle["dataQuality"]["status"]) {
  if (value === "fresh") {
    return "success" as const;
  }
  if (value === "partial") {
    return "warning" as const;
  }
  if (value === "stale") {
    return "failure" as const;
  }
  return "outline" as const;
}

function riskColor(value: AdvisorRiskBand) {
  if (value === "high") {
    return chartPalette.rose;
  }
  if (value === "watch") {
    return chartPalette.amber;
  }
  return chartPalette.emerald;
}

function formatPercent(value: number | undefined) {
  return value === undefined ? "sem dado" : `${formatDecimal(value, 2)}%`;
}

function heatColor(weightPercent: number) {
  const opacity = Math.min(Math.max(weightPercent / 100, 0.08), 0.72);
  return `rgba(14, 91, 80, ${opacity})`;
}

function labelAgingBucket(value: AdvisorChartBundle["charts"]["workbenchAging"][number]["bucket"]) {
  const labels: Record<AdvisorChartBundle["charts"]["workbenchAging"][number]["bucket"], string> = {
    overdue: "vencidos",
    due_7d: "até 7 dias",
    due_30d: "até 30 dias",
    no_due_date: "sem prazo"
  };
  return labels[value];
}

function resourceLink(item: ReviewItem, workbench: StaffWorkbench, readOnly = false) {
  const clientReferenceId =
    item.clientId ?? (item.resourceType === "client" ? item.resourceId : undefined);
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
      <Link
        href={`/dashboard/portfolios/${portfolioReferenceId}`}
        className="font-medium text-moss"
      >
        {label}
      </Link>
    );
  }
  return label;
}

function formatWorkbenchResource(item: ReviewItem, workbench: StaffWorkbench) {
  const clientReferenceId =
    item.clientId ?? (item.resourceType === "client" ? item.resourceId : undefined);
  const portfolioReferenceId =
    item.portfolioId ?? (item.resourceType === "portfolio" ? item.resourceId : undefined);
  const clientName = workbench.assignedClients.find(
    (client) => client.id === clientReferenceId
  )?.name;
  const portfolioName = workbench.portfoliosNeedingAttention.find(
    (portfolio) => portfolio.id === portfolioReferenceId
  )?.name;
  const displayName = clientName ?? portfolioName;

  return displayName
    ? formatResourceReference(item.resourceType, undefined, displayName)
    : labelResourceType(item.resourceType);
}
