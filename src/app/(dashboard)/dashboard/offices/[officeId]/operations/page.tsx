"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AppHeader } from "../../../../../../components/layout/AppHeader";
import { PageSectionNavigation } from "../../../../../../components/layout/PageSectionNavigation";
import { Alert } from "../../../../../../components/ui/alert";
import { Badge } from "../../../../../../components/ui/badge";
import { LinkButton } from "../../../../../../components/ui/button";
import { Card } from "../../../../../../components/ui/card";
import { Label } from "../../../../../../components/ui/form";
import { Input } from "../../../../../../components/ui/input";
import { Select } from "../../../../../../components/ui/select";
import { Skeleton } from "../../../../../../components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableViewport
} from "../../../../../../components/ui/table";
import {
  chartPalette,
  ThemedHeatmapChart,
  ThemedHorizontalBarChart,
  ThemedLineChart,
  ThemedStackedBarChart
} from "../../../../../../components/charts/risk-charts";
import { LogoutButton } from "../../../../../../features/auth/LogoutButton";
import { ProtectedRoute } from "../../../../../../features/auth/ProtectedRoute";
import { useAuth } from "../../../../../../features/auth/AuthProvider";
import {
  getOfficeAdminCharts,
  getPlatformAdminCharts
} from "../../../../../../features/office/operationalChartsApi";
import {
  OfficeAdminChartBundle,
  OfficeAdminChartFilters,
  OfficeAdminChartRange,
  OfficeAdminDataQualityStatus,
  OperationalChartsMeta,
  PlatformAdminChartBundle
} from "../../../../../../features/office/operationalChartTypes";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatDecimal,
  getApiErrorMessage,
  labelOfficeRole
} from "../../../../../../lib/presentation";

const RANGE_OPTIONS: Array<{ value: OfficeAdminChartRange; label: string }> = [
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
  { value: "ytd", label: "Ano atual" },
  { value: "1y", label: "1 ano" },
  { value: "all", label: "Tudo" }
];

const WORKFLOW_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "active", label: "Ativo" },
  { value: "onboarding", label: "Em cadastro" },
  { value: "complete", label: "Concluído" },
  { value: "pending_approval", label: "Aguardando aprovação" },
  { value: "failed", label: "Falhou" },
  { value: "open", label: "Aberto" },
  { value: "read", label: "Lido" },
  { value: "unread", label: "Novo" }
];

const SEVERITY_OPTIONS = [
  { value: "", label: "Todas" },
  { value: "low", label: "Baixa" },
  { value: "medium", label: "Média" },
  { value: "high", label: "Alta" },
  { value: "info", label: "Informativo" },
  { value: "warning", label: "Atenção" },
  { value: "critical", label: "Crítico" }
];

export default function OfficeOperationsPage() {
  const { actor, activeOffice } = useAuth();
  const params = useParams<{ officeId: string }>();
  const officeId = params.officeId;
  const [range, setRange] = useState<OfficeAdminChartRange>("30d");
  const [role, setRole] = useState("");
  const [workflowStatus, setWorkflowStatus] = useState("");
  const [provider, setProvider] = useState("");
  const [severity, setSeverity] = useState("");
  const [officeCharts, setOfficeCharts] = useState<OfficeAdminChartBundle | null>(null);
  const [officeMeta, setOfficeMeta] = useState<OperationalChartsMeta | null>(null);
  const [platformCharts, setPlatformCharts] = useState<PlatformAdminChartBundle | null>(null);
  const [platformMeta, setPlatformMeta] = useState<OperationalChartsMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [platformError, setPlatformError] = useState<string | null>(null);

  const isGlobalAdmin = actor?.role === "admin";
  const isOfficeAdmin = activeOffice?.officeId === officeId && activeOffice.role === "office_admin";
  const canOpenOfficeCharts = Boolean(isGlobalAdmin || isOfficeAdmin);
  const filters = useMemo<OfficeAdminChartFilters>(
    () => ({
      range,
      role: role ? (role as OfficeAdminChartFilters["role"]) : undefined,
      workflowStatus: workflowStatus || undefined,
      provider: provider.trim() || undefined,
      severity: severity ? (severity as OfficeAdminChartFilters["severity"]) : undefined
    }),
    [provider, range, role, severity, workflowStatus]
  );

  useEffect(() => {
    let isActive = true;
    if (!canOpenOfficeCharts) {
      setLoading(false);
      setOfficeCharts(null);
      setPlatformCharts(null);
      return;
    }

    setLoading(true);
    setError(null);
    getOfficeAdminCharts(officeId, filters)
      .then((response) => {
        if (!isActive) {
          return;
        }
        setOfficeCharts(response.data);
        setOfficeMeta(response.meta ?? null);
      })
      .catch((caught: unknown) => {
        if (isActive) {
          setError(
            getApiErrorMessage(caught, "Não foi possível carregar os gráficos operacionais.")
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
  }, [canOpenOfficeCharts, filters, officeId]);

  useEffect(() => {
    let isActive = true;
    if (!isGlobalAdmin) {
      setPlatformCharts(null);
      setPlatformMeta(null);
      setPlatformError(null);
      return;
    }

    setPlatformError(null);
    getPlatformAdminCharts(filters)
      .then((response) => {
        if (!isActive) {
          return;
        }
        setPlatformCharts(response.data);
        setPlatformMeta(response.meta ?? null);
      })
      .catch((caught: unknown) => {
        if (isActive) {
          setPlatformError(getApiErrorMessage(caught, "Não foi possível carregar a visão global."));
        }
      });

    return () => {
      isActive = false;
    };
  }, [filters, isGlobalAdmin]);

  return (
    <ProtectedRoute roles={["admin", "analyst", "user"]}>
      <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-5 lg:px-6">
        <AppHeader
          title="Operação do escritório"
          active="office"
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

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-moss">Inteligência operacional</p>
            <h1 className="text-2xl font-semibold text-stone-900">Indicadores administrativos</h1>
          </div>
          <LinkButton href={`/dashboard/offices/${officeId}/settings`} variant="outline">
            Configurações
          </LinkButton>
        </div>

        {!canOpenOfficeCharts ? (
          <Alert variant="warning">
            Operação disponível apenas para administração do escritório.
          </Alert>
        ) : (
          <>
            <PageSectionNavigation
              label="Seções da operação do escritório"
              links={
                isGlobalAdmin
                  ? [
                      { href: "#operacao-filtros", label: "Filtros" },
                      { href: "#operacao-escritorio", label: "Escritório" },
                      { href: "#operacao-plataforma", label: "Plataforma" }
                    ]
                  : [
                      { href: "#operacao-filtros", label: "Filtros" },
                      { href: "#operacao-escritorio", label: "Escritório" }
                    ]
              }
            />
            <OperationalFilters
              range={range}
              role={role}
              workflowStatus={workflowStatus}
              provider={provider}
              severity={severity}
              onRangeChange={setRange}
              onRoleChange={setRole}
              onWorkflowStatusChange={setWorkflowStatus}
              onProviderChange={setProvider}
              onSeverityChange={setSeverity}
            />

            {loading ? (
              <LoadingGrid />
            ) : error ? (
              <Alert variant="failure">{error}</Alert>
            ) : officeCharts ? (
              <OfficeChartsView charts={officeCharts} meta={officeMeta} />
            ) : (
              <Alert variant="info">Nenhum dado operacional retornado para este escritório.</Alert>
            )}

            {isGlobalAdmin ? (
              platformError ? (
                <Alert variant="failure">{platformError}</Alert>
              ) : platformCharts ? (
                <PlatformChartsView charts={platformCharts} meta={platformMeta} />
              ) : null
            ) : null}
          </>
        )}
      </main>
    </ProtectedRoute>
  );
}

function OperationalFilters({
  range,
  role,
  workflowStatus,
  provider,
  severity,
  onRangeChange,
  onRoleChange,
  onWorkflowStatusChange,
  onProviderChange,
  onSeverityChange
}: {
  range: OfficeAdminChartRange;
  role: string;
  workflowStatus: string;
  provider: string;
  severity: string;
  onRangeChange: (value: OfficeAdminChartRange) => void;
  onRoleChange: (value: string) => void;
  onWorkflowStatusChange: (value: string) => void;
  onProviderChange: (value: string) => void;
  onSeverityChange: (value: string) => void;
}) {
  return (
    <Card id="operacao-filtros" className="scroll-mt-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div>
          <Label htmlFor="operationRange">Período</Label>
          <Select
            id="operationRange"
            className="mt-2"
            value={range}
            onChange={(event) => onRangeChange(event.target.value as OfficeAdminChartRange)}
          >
            {RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="operationRole">Papel</Label>
          <Select
            id="operationRole"
            className="mt-2"
            value={role}
            onChange={(event) => onRoleChange(event.target.value)}
          >
            <option value="">Todos</option>
            <option value="office_admin">Administrador</option>
            <option value="advisor">Assessor</option>
            <option value="analyst">Analista</option>
            <option value="assistant">Assistente</option>
            <option value="client">Cliente</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="operationWorkflow">Status</Label>
          <Select
            id="operationWorkflow"
            className="mt-2"
            value={workflowStatus}
            onChange={(event) => onWorkflowStatusChange(event.target.value)}
          >
            {WORKFLOW_OPTIONS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="operationProvider">Provedor</Label>
          <Input
            id="operationProvider"
            className="mt-2"
            value={provider}
            onChange={(event) => onProviderChange(event.target.value)}
            placeholder="yahoo-finance"
          />
        </div>
        <div>
          <Label htmlFor="operationSeverity">Severidade</Label>
          <Select
            id="operationSeverity"
            className="mt-2"
            value={severity}
            onChange={(event) => onSeverityChange(event.target.value)}
          >
            {SEVERITY_OPTIONS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </Card>
  );
}

function OfficeChartsView({
  charts,
  meta
}: {
  charts: OfficeAdminChartBundle;
  meta: OperationalChartsMeta | null;
}) {
  const counts = charts.dataQuality.sourceCounts;
  const latestGrowth = charts.charts.clientGrowth[charts.charts.clientGrowth.length - 1];

  return (
    <section id="operacao-escritorio" className="scroll-mt-4 grid gap-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Clientes"
          value={counts.clients}
          detail={`${counts.households} grupos`}
        />
        <MetricCard
          label="Contas"
          value={counts.accounts}
          detail={`${counts.portfolios} portfólios`}
        />
        <MetricCard
          label="Equipe"
          value={counts.staff}
          detail={`${counts.assignments} permissões`}
        />
        <MetricCard
          label="Relatórios"
          value={counts.reports + counts.reportPackages}
          detail={`${counts.reportPackages} pacotes`}
        />
        <MetricCard
          label="Alertas"
          value={counts.alerts + counts.notifications}
          detail={`${counts.notifications} notificações`}
        />
      </div>

      <QualityPanel
        status={charts.dataQuality.status}
        issues={charts.dataQuality.issues}
        meta={meta}
      />

      {charts.dataQuality.status === "empty" ? (
        <Alert variant="info">Ainda não há dados operacionais para o filtro aplicado.</Alert>
      ) : (
        <section className="grid gap-4 xl:grid-cols-2">
          <ChartPanel
            title="Crescimento"
            aside={latestGrowth ? `${latestGrowth.clients} clientes` : undefined}
          >
            <ThemedLineChart
              ariaLabel="Evolução de clientes do escritório"
              data={charts.charts.clientGrowth.map((point) => ({
                name: formatDate(point.date),
                value: point.clients,
                detail: `${point.households} grupos · ${point.portfolios} portfólios`
              }))}
            />
          </ChartPanel>

          <ChartPanel title="Onboarding">
            <ThemedHorizontalBarChart
              ariaLabel="Funil de onboarding de clientes"
              data={charts.charts.onboardingFunnel.map((point) => ({
                name: labelOnboardingStatus(point.status),
                value: point.count,
                fill: colorForIndex(point.status.length)
              }))}
              color={chartPalette.moss}
            />
          </ChartPanel>

          <ChartPanel title="Equipe">
            <ThemedHorizontalBarChart
              ariaLabel="Distribuição de papéis da equipe"
              data={charts.charts.staffRoleDistribution.map((point) => ({
                name: labelOfficeRole(point.role),
                value: point.count
              }))}
              color={chartPalette.graphite}
            />
          </ChartPanel>

          <ChartPanel title="Carga por responsável">
            <ThemedHorizontalBarChart
              ariaLabel="Carga de permissões e atribuições"
              data={charts.charts.assignmentLoad.map((point) => ({
                name: point.assigneeName,
                value: point.totalAssignments,
                detail: `${point.clientCount} clientes · ${point.portfolioCount} portfólios`
              }))}
              color={chartPalette.amber}
            />
          </ChartPanel>

          <ChartPanel title="Cobertura de portfólios">
            <ThemedHorizontalBarChart
              ariaLabel="Cobertura de portfólios por estado"
              data={charts.charts.portfolioCoverage.map((point) => ({
                name: `${labelWorkflowStatus(point.status)} · ${labelFreshness(point.freshness)}`,
                value: point.count,
                detail: formatCurrency(point.totalCostBasis, "USD")
              }))}
              color={chartPalette.emerald}
            />
          </ChartPanel>

          <ChartPanel title="Cobertura de ativos">
            <ThemedHorizontalBarChart
              ariaLabel="Cobertura de ativos por custo"
              data={charts.charts.assetCoverage.slice(0, 8).map((point) => ({
                name: point.assetSymbol,
                value: point.totalCostBasis,
                detail: `${point.portfolioCount} portfólios · ${formatDecimal(point.totalQuantity, 2)} unidades`
              }))}
              color={chartPalette.blue}
              valueFormatter={(value) => formatCurrency(value, "USD")}
            />
          </ChartPanel>

          <ChartPanel title="Dados de mercado">
            <ProviderTable rows={charts.charts.marketDataFreshness} />
          </ChartPanel>

          <ChartPanel title="Fila de análises">
            <ThemedHorizontalBarChart
              ariaLabel="Saúde da fila de análises"
              data={charts.charts.analyticsQueueHealth.map((point) => ({
                name: labelWorkflowStatus(point.status),
                value: point.count,
                detail: point.latestUpdatedAt ? formatDateTime(point.latestUpdatedAt) : undefined
              }))}
              color={chartPalette.violet}
            />
          </ChartPanel>

          <ChartPanel title="Relatórios">
            <ThemedHorizontalBarChart
              ariaLabel="Vazão de relatórios e pacotes"
              data={charts.charts.reportThroughput.map((point) => ({
                name: labelWorkflowStatus(point.status),
                value: point.count,
                detail: point.latestUpdatedAt ? formatDateTime(point.latestUpdatedAt) : undefined
              }))}
              color={chartPalette.moss}
            />
          </ChartPanel>

          <ChartPanel title="Falhas de relatório">
            <FailureTable rows={charts.charts.reportFailures} />
          </ChartPanel>

          <ChartPanel title="Alertas e notificações">
            <ThemedStackedBarChart
              ariaLabel="Volume de alertas e notificações por severidade"
              data={charts.charts.alertNotificationVolume.map((point) => ({
                name: formatDate(point.date),
                total: point.total,
                low: point.low,
                medium: point.medium,
                high: point.high,
                info: point.info
              }))}
              bars={[
                { key: "info", label: "informativo", color: chartPalette.slate },
                { key: "low", label: "baixa", color: chartPalette.emerald },
                { key: "medium", label: "média", color: chartPalette.amber },
                { key: "high", label: "alta", color: chartPalette.rose }
              ]}
            />
          </ChartPanel>

          <ChartPanel title="Permissões">
            <ThemedStackedBarChart
              ariaLabel="Atividade de permissões"
              data={charts.charts.permissionActivity.map((point) => ({
                name: formatDate(point.date),
                total: point.total,
                created: point.created,
                revoked: point.revoked,
                roleChanges: point.roleChanges
              }))}
              bars={[
                { key: "created", label: "criadas", color: chartPalette.emerald },
                { key: "revoked", label: "revogadas", color: chartPalette.rose },
                { key: "roleChanges", label: "papéis", color: chartPalette.blue }
              ]}
            />
          </ChartPanel>
        </section>
      )}
    </section>
  );
}

function PlatformChartsView({
  charts,
  meta
}: {
  charts: PlatformAdminChartBundle;
  meta: OperationalChartsMeta | null;
}) {
  return (
    <section id="operacao-plataforma" className="scroll-mt-4 grid gap-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-moss">Administração global</p>
          <h2 className="text-xl font-semibold text-stone-900">Plataforma</h2>
        </div>
        {meta ? (
          <Badge variant="outline">Gerado em {formatDateTime(meta.generatedAt)}</Badge>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Escritórios" value={charts.dataQuality.sourceCounts.offices} />
        <MetricCard label="Clientes" value={charts.dataQuality.sourceCounts.clients} />
        <MetricCard label="Portfólios" value={charts.dataQuality.sourceCounts.portfolios} />
        <MetricCard
          label="Jobs"
          value={
            charts.dataQuality.sourceCounts.analyticsJobs +
            charts.dataQuality.sourceCounts.marketDataJobs
          }
        />
      </div>

      <section className="grid gap-4 xl:grid-cols-2">
        <ChartPanel title="Volume global">
          <ThemedHorizontalBarChart
            ariaLabel="Volume global da plataforma"
            data={charts.charts.officeVolume.map((point) => ({
              name: labelPlatformBucket(point.bucket),
              value: point.count
            }))}
            color={chartPalette.graphite}
          />
        </ChartPanel>

        <ChartPanel title="Status dos escritórios">
          <ThemedHorizontalBarChart
            ariaLabel="Distribuição global de escritórios por status"
            data={charts.charts.officeStatusDistribution.map((point) => ({
              name: labelWorkflowStatus(point.status),
              value: point.count
            }))}
            color={chartPalette.moss}
          />
        </ChartPanel>

        <ChartPanel title="Freshness por tenant">
          <ThemedHeatmapChart
            ariaLabel="Freshness de tenants e portfólios"
            data={charts.charts.tenantDataFreshness.map((point) => ({
              x: "portfólios",
              y: labelFreshness(point.freshness),
              value: point.portfolioCount,
              detail: `${point.officeCount} escritórios`
            }))}
            valueLabel="portfólios"
            valueFormatter={(value) => formatDecimal(value, 0)}
          />
        </ChartPanel>

        <ChartPanel title="Jobs">
          <ThemedHorizontalBarChart
            ariaLabel="Saúde global de jobs"
            data={charts.charts.jobHealth.map((point) => ({
              name: `${labelJobKind(point.kind)} · ${labelWorkflowStatus(point.status)}`,
              value: point.count
            }))}
            color={chartPalette.violet}
          />
        </ChartPanel>
      </section>
    </section>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: number; detail?: string }) {
  return (
    <Card>
      <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-stone-900">{formatDecimal(value, 0)}</p>
      {detail ? <p className="mt-1 text-sm text-stone-600">{detail}</p> : null}
    </Card>
  );
}

function QualityPanel({
  status,
  issues,
  meta
}: {
  status: OfficeAdminDataQualityStatus;
  issues: OfficeAdminChartBundle["dataQuality"]["issues"];
  meta: OperationalChartsMeta | null;
}) {
  return (
    <Alert variant={qualityAlertVariant(status)}>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={qualityBadgeVariant(status)}>{labelQualityStatus(status)}</Badge>
          {meta ? <span>Gerado em {formatDateTime(meta.generatedAt)}</span> : null}
        </div>
        {issues.length > 0 ? (
          <ul className="grid gap-1 text-sm">
            {issues.slice(0, 3).map((issue) => (
              <li key={issue.code}>
                {labelIssueSeverity(issue.severity)}: {labelIssueCode(issue.code)}
              </li>
            ))}
          </ul>
        ) : (
          <span>Fontes operacionais disponíveis para os filtros atuais.</span>
        )}
      </div>
    </Alert>
  );
}

function ChartPanel({
  title,
  aside,
  children
}: {
  title: string;
  aside?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <div className="mb-4 flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-stone-900">{title}</h3>
        {aside ? <Badge variant="outline">{aside}</Badge> : null}
      </div>
      {children}
    </Card>
  );
}

function ProviderTable({
  rows
}: {
  rows: OfficeAdminChartBundle["charts"]["marketDataFreshness"];
}) {
  if (rows.length === 0) {
    return <Alert variant="info">Sem leitura de provedor para os ativos filtrados.</Alert>;
  }

  return (
    <TableViewport label="Estado dos provedores de dados de mercado">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Provedor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Falhas</TableHead>
            <TableHead>Latência</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.providerName}>
              <TableCell className="font-medium text-stone-900">{row.providerName}</TableCell>
              <TableCell>{labelProviderStatus(row.status)}</TableCell>
              <TableCell>{row.errorCount + row.failedJobCount}</TableCell>
              <TableCell>{formatDecimal(row.averageLatencyMs, 0)} ms</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableViewport>
  );
}

function FailureTable({ rows }: { rows: OfficeAdminChartBundle["charts"]["reportFailures"] }) {
  if (rows.length === 0) {
    return <Alert variant="info">Sem falhas de relatório para o período.</Alert>;
  }

  return (
    <TableViewport label="Falhas de relatórios">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Motivo</TableHead>
            <TableHead>Ocorrências</TableHead>
            <TableHead>Última falha</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.failureCode}>
              <TableCell className="font-medium text-stone-900">
                {labelFailureCode(row.failureCode)}
              </TableCell>
              <TableCell>{row.count}</TableCell>
              <TableCell>
                {row.latestFailedAt ? formatDateTime(row.latestFailedAt) : "sem data"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableViewport>
  );
}

function LoadingGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton key={index} className="h-44" />
      ))}
    </div>
  );
}

function qualityAlertVariant(
  status: OfficeAdminDataQualityStatus
): "default" | "info" | "warning" | "failure" | "success" {
  if (status === "stale") {
    return "warning";
  }
  if (status === "partial") {
    return "info";
  }
  if (status === "empty") {
    return "default";
  }
  return "success";
}

function qualityBadgeVariant(
  status: OfficeAdminDataQualityStatus
): "default" | "info" | "success" | "warning" | "failure" | "outline" {
  return status === "empty" ? "outline" : qualityAlertVariant(status);
}

function labelQualityStatus(status: OfficeAdminDataQualityStatus) {
  const labels: Record<OfficeAdminDataQualityStatus, string> = {
    complete: "completo",
    partial: "parcial",
    stale: "defasado",
    empty: "sem dados"
  };
  return labels[status];
}

function labelIssueSeverity(severity: string) {
  const labels: Record<string, string> = {
    info: "informativo",
    warning: "atenção",
    blocking: "bloqueante"
  };
  return labels[severity] ?? "qualidade";
}

function labelIssueCode(code: string) {
  const labels: Record<string, string> = {
    "office_charts.audit_events_truncated": "Auditoria agregada parcialmente",
    "office_charts.analytics_snapshot_missing": "Retrato de risco ausente",
    "office_charts.provider_status_failed": "Status do provedor indisponível",
    "office_charts.provider_status_unavailable": "Provedor sem status operacional"
  };
  return labels[code] ?? "Qualidade operacional pendente";
}

function labelOnboardingStatus(status: string) {
  const labels: Record<string, string> = {
    invited: "convidado",
    onboarding: "em cadastro",
    complete: "concluído",
    paused: "pausado"
  };
  return labels[status] ?? status;
}

function labelFreshness(value: string) {
  const labels: Record<string, string> = {
    fresh: "atualizado",
    partial: "parcial",
    stale: "defasado"
  };
  return labels[value] ?? value;
}

function labelWorkflowStatus(value: string) {
  const labels: Record<string, string> = {
    active: "ativo",
    inactive: "inativo",
    archived: "arquivado",
    invited: "convidado",
    onboarding: "em cadastro",
    complete: "concluído",
    paused: "pausado",
    draft: "rascunho",
    pending_approval: "aguardando aprovação",
    approved: "aprovado",
    delivered: "entregue",
    viewed: "visualizado",
    revoked: "revogado",
    pending: "aguardando",
    running: "processando",
    ready: "pronto",
    failed: "falhou",
    queued: "em fila",
    succeeded: "concluído",
    missing: "sem processamento",
    open: "aberto",
    monitoring: "monitorando",
    disabled: "desativado",
    read: "lido",
    unread: "novo"
  };
  return labels[value] ?? value;
}

function labelProviderStatus(value: string) {
  const labels: Record<string, string> = {
    available: "disponível",
    degraded: "degradado",
    unavailable: "indisponível",
    unconfigured: "sem configuração"
  };
  return labels[value] ?? value;
}

function labelFailureCode(value: string) {
  const labels: Record<string, string> = {
    delivery_timeout: "Tempo limite na entrega",
    generation_failed: "Falha na geração",
    report_generation_failed: "Falha na geração",
    storage_unavailable: "Arquivo indisponível",
    unknown_failure: "Falha registrada"
  };
  return labels[value] ?? "Falha operacional";
}

function labelPlatformBucket(value: string) {
  const labels: Record<string, string> = {
    offices: "escritórios",
    clients: "clientes",
    households: "grupos",
    accounts: "contas",
    portfolios: "portfólios",
    staff: "equipe"
  };
  return labels[value] ?? value;
}

function labelJobKind(value: string) {
  const labels: Record<string, string> = {
    analytics: "análises",
    market_data: "dados",
    report: "relatórios"
  };
  return labels[value] ?? value;
}

function colorForIndex(index: number) {
  const colors = [chartPalette.moss, chartPalette.blue, chartPalette.amber, chartPalette.rose];
  return colors[index % colors.length];
}
