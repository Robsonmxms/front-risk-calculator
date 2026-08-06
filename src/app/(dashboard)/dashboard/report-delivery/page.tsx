"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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
  TableRow,
  TableViewport
} from "../../../../components/ui/table";
import { Textarea } from "../../../../components/ui/textarea";
import { useAuth } from "../../../../features/auth/AuthProvider";
import { LogoutButton } from "../../../../features/auth/LogoutButton";
import { ProtectedRoute } from "../../../../features/auth/ProtectedRoute";
import { getClient, listClients } from "../../../../features/client/clientApi";
import { ClientSummary } from "../../../../features/client/types";
import {
  chartPalette,
  ThemedHorizontalBarChart,
  ThemedInlineBarChart,
  ThemedStackedBarChart
} from "../../../../components/charts/risk-charts";
import {
  approveReportPackage,
  createReportPackage,
  deliverReportPackage,
  getDeliveryCharts,
  listClientReportPackages,
  revokeReportPackage
} from "../../../../features/delivery/deliveryApi";
import {
  DeliveryChartBundle,
  DeliveryChartRange,
  DeliveryChartsMeta,
  DeliveryStatusFilter,
  ReportPackage,
  ReportPackageStatus
} from "../../../../features/delivery/types";
import { PortfolioListItem } from "../../../../features/portfolio/types";
import {
  formatDateTime,
  getApiErrorMessage,
  labelOfficeRole,
  labelReportPackageStatus,
  reportPackageStatusVariant
} from "../../../../lib/presentation";

const STATUSES: Array<ReportPackageStatus | ""> = [
  "",
  "draft",
  "pending_approval",
  "approved",
  "delivered",
  "viewed",
  "revoked"
];
const CHART_RANGES: Array<{ value: DeliveryChartRange; label: string }> = [
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
  { value: "ytd", label: "Ano atual" },
  { value: "1y", label: "1 ano" },
  { value: "all", label: "Tudo" }
];
const DELIVERY_STATUSES: Array<{ value: DeliveryStatusFilter | ""; label: string }> = [
  { value: "", label: "Todos" },
  { value: "pending_approval", label: "Aguardando aprovação" },
  { value: "delivered", label: "Entregue" },
  { value: "viewed", label: "Visto" },
  { value: "failed", label: "Falha de relatório" },
  { value: "failure", label: "Falha de entrega" },
  { value: "unread", label: "Notificação nova" },
  { value: "read", label: "Notificação lida" }
];

export default function ReportDeliveryPage() {
  const { actor, activeOffice } = useAuth();
  const officeId = activeOffice?.officeId;
  const canUseDelivery = Boolean(activeOffice && activeOffice.role !== "client");
  const canApprove = actor?.role === "admin" || activeOffice?.role === "office_admin";
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [availablePortfolios, setAvailablePortfolios] = useState<PortfolioListItem[]>([]);
  const [packages, setPackages] = useState<ReportPackage[]>([]);
  const [statusFilter, setStatusFilter] = useState<ReportPackageStatus | "">("");
  const [chartRange, setChartRange] = useState<DeliveryChartRange>("30d");
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState<DeliveryStatusFilter | "">("");
  const [channelFilter, setChannelFilter] = useState("");
  const [charts, setCharts] = useState<DeliveryChartBundle | null>(null);
  const [chartsMeta, setChartsMeta] = useState<DeliveryChartsMeta | null>(null);
  const [chartsError, setChartsError] = useState<string | null>(null);
  const [title, setTitle] = useState("Pacote de revisão do cliente");
  const [summaryNotes, setSummaryNotes] = useState(
    "Resumo preparado para consulta do cliente no portal."
  );
  const [internalNotes, setInternalNotes] = useState("");
  const [portfolioId, setPortfolioId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId),
    [clients, selectedClientId]
  );
  const selectedPortfolio = useMemo(
    () => availablePortfolios.find((portfolio) => portfolio.id === portfolioId),
    [availablePortfolios, portfolioId]
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
  }, [canUseDelivery, officeId]);

  useEffect(() => {
    if (!selectedClientId || !canUseDelivery) {
      setPackages([]);
      setAvailablePortfolios([]);
      setPortfolioId("");
      return;
    }

    let isActive = true;
    setError(null);
    Promise.all([
      listClientReportPackages(selectedClientId, { status: statusFilter }),
      getClient(selectedClientId)
    ])
      .then(([packageData, clientDetail]) => {
        if (isActive) {
          setPackages(packageData.reportPackages);
          setAvailablePortfolios(clientDetail.portfolios);
          setPortfolioId((current) =>
            clientDetail.portfolios.some((portfolio) => portfolio.id === current)
              ? current
              : (clientDetail.portfolios[0]?.id ?? "")
          );
        }
      })
      .catch((caught) => {
        if (isActive) {
          setError(getApiErrorMessage(caught, "Não foi possível carregar pacotes."));
        }
      });

    return () => {
      isActive = false;
    };
  }, [canUseDelivery, selectedClientId, statusFilter]);

  useEffect(() => {
    if (!officeId || !canUseDelivery) {
      setCharts(null);
      setChartsMeta(null);
      setChartsError(null);
      return;
    }

    let isActive = true;
    setChartsError(null);
    getDeliveryCharts(officeId, {
      range: chartRange,
      packageStatus: statusFilter,
      deliveryStatus: deliveryStatusFilter,
      channel: channelFilter.trim() || undefined
    })
      .then((response) => {
        if (!isActive) {
          return;
        }
        setCharts(response.data);
        setChartsMeta(response.meta ?? null);
      })
      .catch((caught) => {
        if (isActive) {
          setChartsError(
            getApiErrorMessage(caught, "Não foi possível carregar os gráficos de entrega.")
          );
        }
      });

    return () => {
      isActive = false;
    };
  }, [canUseDelivery, channelFilter, chartRange, deliveryStatusFilter, officeId, statusFilter]);

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
            title: `Resumo do portfólio ${selectedPortfolio?.name ?? "selecionado"}`,
            portfolioId,
            status: "ready"
          }
        ]
      });
      setPackages((current) => [created, ...current]);
      setNotice("Pacote enviado para aprovação.");
      setInternalNotes("");
    } catch (caught) {
      setError(getApiErrorMessage(caught, "Não foi possível criar o pacote."));
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
      setPackages((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)));
      setNotice(`Pacote ${labelReportPackageStatus(updated.status)}.`);
    } catch (caught) {
      setError(getApiErrorMessage(caught, "Não foi possível atualizar o pacote."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProtectedRoute roles={["admin", "analyst", "user"]}>
      <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-5 lg:px-6">
        <AppHeader
          title="Entrega de relatórios"
          active="reportDelivery"
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
            Selecione um escritório para abrir a entrega de relatórios.
          </Alert>
        ) : !canUseDelivery ? (
          <Alert variant="failure">Entrega de relatórios indisponível para este perfil.</Alert>
        ) : loading ? (
          <Alert variant="info">Carregando entrega de relatórios.</Alert>
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
                  value={
                    packages.filter((entry) => ["delivered", "viewed"].includes(entry.status))
                      .length
                  }
                />
              </section>

              {error ? <Alert variant="failure">{error}</Alert> : null}
              {notice ? <Alert variant="success">{notice}</Alert> : null}
              {chartsError ? <Alert variant="failure">{chartsError}</Alert> : null}

              <Card>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <Label htmlFor="deliveryChartRange">Período</Label>
                    <Select
                      id="deliveryChartRange"
                      className="mt-2"
                      value={chartRange}
                      onChange={(event) => setChartRange(event.target.value as DeliveryChartRange)}
                    >
                      {CHART_RANGES.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="deliveryChartStatus">Status operacional</Label>
                    <Select
                      id="deliveryChartStatus"
                      className="mt-2"
                      value={deliveryStatusFilter}
                      onChange={(event) =>
                        setDeliveryStatusFilter(event.target.value as DeliveryStatusFilter | "")
                      }
                    >
                      {DELIVERY_STATUSES.map((status) => (
                        <option key={status.value || "all"} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="deliveryChannel">Canal</Label>
                    <Input
                      id="deliveryChannel"
                      className="mt-2"
                      value={channelFilter}
                      onChange={(event) => setChannelFilter(event.target.value)}
                      placeholder="portal, e-mail"
                    />
                  </div>
                  <div>
                    <Label htmlFor="packageStatus">Status do pacote</Label>
                    <Select
                      id="packageStatus"
                      className="mt-2"
                      value={statusFilter}
                      onChange={(event) =>
                        setStatusFilter(event.target.value as ReportPackageStatus | "")
                      }
                    >
                      {STATUSES.map((status) => (
                        <option key={status || "all"} value={status}>
                          {status ? labelReportPackageStatus(status) : "todos"}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
              </Card>

              {charts ? <DeliveryChartsPanel charts={charts} meta={chartsMeta} /> : null}

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
                  <div className="rounded-md border border-border px-3 py-2">
                    <span className="text-xs font-semibold uppercase text-stone-500">Escopo</span>
                    <strong className="block text-2xl text-stone-900">
                      {charts?.dataQuality.sourceCounts.clients ?? clients.length}
                    </strong>
                    <span className="text-xs text-stone-500">clientes autorizados</span>
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
                  <Alert variant="info" className="mt-5">
                    Nenhum pacote neste filtro.
                  </Alert>
                ) : (
                  <TableViewport className="mt-5" label="Pacotes de relatório do cliente">
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
                            <TableCell>{formatDateTime(reportPackage.updatedAt)}</TableCell>
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
                                {canApprove &&
                                !["revoked", "draft"].includes(reportPackage.status) ? (
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
                  </TableViewport>
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
                  <Label htmlFor="portfolioId">Portfólio</Label>
                  {availablePortfolios.length > 0 ? (
                    <Select
                      id="portfolioId"
                      className="mt-2"
                      value={portfolioId}
                      onChange={(event) => setPortfolioId(event.target.value)}
                      required
                    >
                      {availablePortfolios.map((portfolio) => (
                        <option key={portfolio.id} value={portfolio.id}>
                          {portfolio.name}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Alert variant="info" className="mt-2">
                      Cliente sem portfólios disponíveis para entrega.
                    </Alert>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={saving || !selectedClientId || !portfolioId || !title.trim()}
                >
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

function DeliveryChartsPanel({
  charts,
  meta
}: {
  charts: DeliveryChartBundle;
  meta: DeliveryChartsMeta | null;
}) {
  const lifecycleData = charts.charts.reportLifecycleFunnel.map((point) => ({
    name: labelReportPackageStatus(point.status),
    value: point.count,
    detail: `${point.clientIds.length} clientes`
  }));
  const outcomeData = charts.charts.deliveryOutcomeTimeline.map((point) => ({
    name: formatChartDate(point.date),
    total: point.total,
    delivered: point.delivered,
    viewed: point.viewed,
    failed: point.failed,
    revoked: point.revoked
  }));
  const failureData = charts.charts.failureReasonBreakdown.map((point) => ({
    name: failureCodeLabel(point.failureCode),
    value: point.count,
    detail: point.channel ? channelLabel(point.channel) : "canal não informado"
  }));
  const notificationData = charts.charts.notificationReadStatus.map((point) => ({
    name: point.status === "read" ? "Lidas" : "Novas",
    value: point.count,
    detail: `${point.notificationIds.length} notificações`
  }));
  const maxReadiness = Math.max(
    1,
    ...charts.charts.clientPackageReadiness.map(
      (point) =>
        point.readyCount + point.pendingCount + point.failedItemCount + point.staleNotificationCount
    )
  );

  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-moss">Ciclo de vida</p>
            <h2 className="text-xl font-semibold text-stone-900">Pacotes por status</h2>
          </div>
          <DataQualityBadge status={charts.dataQuality.status} />
        </div>
        <div className="mt-4">
          <ThemedHorizontalBarChart
            data={lifecycleData}
            ariaLabel="Pacotes de relatório por status"
            color={chartPalette.moss}
          />
        </div>
      </Card>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-moss">Entregas</p>
            <h2 className="text-xl font-semibold text-stone-900">Resultado por período</h2>
          </div>
          {meta ? <Badge variant="outline">{formatDateTime(meta.generatedAt)}</Badge> : null}
        </div>
        <div className="mt-4">
          <ThemedStackedBarChart
            data={outcomeData}
            ariaLabel="Resultado de entrega por período"
            bars={[
              { key: "delivered", label: "Entregue", color: chartPalette.emerald },
              { key: "viewed", label: "Visto", color: chartPalette.blue },
              { key: "failed", label: "Falha", color: chartPalette.rose },
              { key: "revoked", label: "Revogado", color: chartPalette.slate }
            ]}
          />
        </div>
      </Card>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-moss">Falhas</p>
            <h2 className="text-xl font-semibold text-stone-900">Motivos de falha</h2>
          </div>
          <Badge variant="outline">{charts.dataQuality.sourceCounts.deliveryAuditEvents}</Badge>
        </div>
        <div className="mt-4">
          <ThemedHorizontalBarChart
            data={failureData}
            ariaLabel="Motivos de falha de entrega"
            color={chartPalette.rose}
          />
        </div>
      </Card>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-moss">Notificações</p>
            <h2 className="text-xl font-semibold text-stone-900">Leitura pelo cliente</h2>
          </div>
          <Badge variant="outline">{charts.dataQuality.sourceCounts.notifications}</Badge>
        </div>
        <div className="mt-4">
          <ThemedHorizontalBarChart
            data={notificationData}
            ariaLabel="Status de leitura das notificações"
            color={chartPalette.blue}
          />
        </div>
      </Card>

      <Card className="xl:col-span-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-moss">Prontidão</p>
            <h2 className="text-xl font-semibold text-stone-900">Pacotes por cliente</h2>
          </div>
          <Badge variant="outline">{charts.charts.clientPackageReadiness.length} clientes</Badge>
        </div>
        {charts.charts.clientPackageReadiness.length === 0 ? (
          <Alert variant="info" className="mt-4">
            Sem pacotes no escopo selecionado.
          </Alert>
        ) : (
          <TableViewport className="mt-5" label="Prontidão dos pacotes por cliente">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Status recente</TableHead>
                  <TableHead>Prontos</TableHead>
                  <TableHead>Pendentes</TableHead>
                  <TableHead>Falhas</TableHead>
                  <TableHead>Notificações novas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {charts.charts.clientPackageReadiness.map((point) => (
                  <TableRow key={point.clientId}>
                    <TableCell className="font-medium text-stone-900">{point.clientName}</TableCell>
                    <TableCell>
                      {point.latestPackageStatus
                        ? statusBadge(point.latestPackageStatus)
                        : "sem pacote"}
                    </TableCell>
                    <TableCell>
                      <ThemedInlineBarChart
                        value={point.readyCount}
                        max={maxReadiness}
                        ariaLabel={`Pacotes prontos de ${point.clientName}`}
                        color={chartPalette.emerald}
                      />
                    </TableCell>
                    <TableCell>{point.pendingCount}</TableCell>
                    <TableCell>{point.failedItemCount}</TableCell>
                    <TableCell>{point.staleNotificationCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableViewport>
        )}
      </Card>

      {charts.dataQuality.issues.length > 0 ? (
        <Alert variant="warning" className="xl:col-span-2">
          {charts.dataQuality.issues[0].message}
        </Alert>
      ) : null}
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="grid gap-2">
      <span className="block text-xs font-semibold uppercase leading-tight text-stone-500">
        {label}
      </span>
      <strong className="block text-3xl leading-none text-stone-900">{value}</strong>
    </Card>
  );
}

function statusBadge(status: ReportPackageStatus) {
  return (
    <Badge variant={reportPackageStatusVariant(status)}>{labelReportPackageStatus(status)}</Badge>
  );
}

function DataQualityBadge({ status }: { status: DeliveryChartBundle["dataQuality"]["status"] }) {
  const labels = {
    complete: "completo",
    partial: "parcial",
    empty: "sem dados"
  };
  return <Badge variant={status === "partial" ? "warning" : "outline"}>{labels[status]}</Badge>;
}

function formatChartDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit"
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function failureCodeLabel(value: string) {
  const labels: Record<string, string> = {
    delivery_timeout: "tempo limite",
    unclassified_failure: "não classificada"
  };

  return labels[value] ?? value.replace(/[_-]/g, " ");
}

function channelLabel(value: string) {
  const labels: Record<string, string> = {
    email: "e-mail",
    portal: "portal"
  };

  return labels[value] ?? value;
}
