"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { AppHeader } from "../../../../components/layout/AppHeader";
import { Alert } from "../../../../components/ui/alert";
import { Badge, BadgeVariant } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Card } from "../../../../components/ui/card";
import {
  chartPalette,
  ThemedHeatmapChart,
  ThemedHorizontalBarChart,
  ThemedInlineBarChart,
  ThemedLineChart,
  ThemedScatterChart
} from "../../../../components/charts/risk-charts";
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
import {
  createAnalystChartJob,
  getAnalystChartJob,
  getAnalystCharts
} from "../../../../features/analytics-diagnostics/analyticsDiagnosticsApi";
import {
  AnalystChartBundle,
  AnalystChartFilters,
  AnalystChartJob,
  AnalystChartJobMeta,
  AnalystChartRange,
  AnalystChartsMeta,
  AnalystDataQualityFilter,
  AnalystMetricDistribution,
  AnalystRollingPoint
} from "../../../../features/analytics-diagnostics/types";
import { useAuth } from "../../../../features/auth/AuthProvider";
import { LogoutButton } from "../../../../features/auth/LogoutButton";
import { ProtectedRoute } from "../../../../features/auth/ProtectedRoute";
import { AnalyticsMetricKey } from "../../../../features/portfolio/types";
import {
  dataQualitySeverityVariant,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatDecimal,
  getApiErrorMessage,
  labelAnalyticsMetricKey,
  labelDataQualityIssueCode,
  labelDataQualitySeverity,
  labelOfficeRole
} from "../../../../lib/presentation";

type DiagnosticsEnvelope = {
  data: AnalystChartBundle;
  meta?: AnalystChartsMeta;
};

type ChartJobEnvelope = {
  data: AnalystChartJob;
  meta?: AnalystChartJobMeta;
};

interface DiagnosticFilterState {
  portfolioIds: string;
  clientId: string;
  householdId: string;
  accountId: string;
  advisorUserId: string;
  teamId: string;
  range: AnalystChartRange;
  metrics: AnalyticsMetricKey[];
  benchmarkSymbol: string;
  dataQuality: AnalystDataQualityFilter | "";
}

const RANGE_OPTIONS: AnalystChartRange[] = ["90d", "ytd", "1y", "3y", "5y", "all"];
const QUALITY_OPTIONS: Array<AnalystDataQualityFilter | ""> = [
  "",
  "complete",
  "partial",
  "stale",
  "failed"
];
const METRIC_OPTIONS: AnalyticsMetricKey[] = [
  "volatility",
  "beta",
  "sharpeRatio",
  "maxDrawdown",
  "concentrationHhi",
  "assetCorrelation"
];
const DEFAULT_FILTERS: DiagnosticFilterState = {
  portfolioIds: "",
  clientId: "",
  householdId: "",
  accountId: "",
  advisorUserId: "",
  teamId: "",
  range: "1y",
  metrics: METRIC_OPTIONS,
  benchmarkSymbol: "SPY",
  dataQuality: ""
};

export default function AnalyticsDiagnosticsPage() {
  const { actor, activeOffice } = useAuth();
  const officeId = activeOffice?.officeId;
  const canOpenDiagnostics = Boolean(
    officeId &&
      (actor?.role === "admin" ||
        actor?.role === "analyst" ||
        activeOffice?.role === "office_admin" ||
        activeOffice?.role === "analyst")
  );
  const [draftFilters, setDraftFilters] = useState<DiagnosticFilterState>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<DiagnosticFilterState>(DEFAULT_FILTERS);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsEnvelope | null>(null);
  const [chartJob, setChartJob] = useState<ChartJobEnvelope | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState("diagnostico-analista-001");
  const [loading, setLoading] = useState(true);
  const [jobLoading, setJobLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);

  const apiFilters = useMemo(() => toApiFilters(appliedFilters), [appliedFilters]);

  useEffect(() => {
    if (!officeId || !canOpenDiagnostics) {
      setDiagnostics(null);
      setLoading(false);
      return;
    }

    let isActive = true;
    setLoading(true);
    setError(null);

    getAnalystCharts(officeId, apiFilters)
      .then((envelope) => {
        if (isActive) {
          setDiagnostics(envelope);
        }
      })
      .catch((caught) => {
        if (isActive) {
          setError(getApiErrorMessage(caught, "Não foi possível carregar os diagnósticos."));
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
  }, [apiFilters, canOpenDiagnostics, officeId]);

  function handleSubmitFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedFilters({ ...draftFilters });
  }

  async function handleCreateJob() {
    if (!officeId || !idempotencyKey.trim()) {
      return;
    }

    setJobLoading(true);
    setJobError(null);
    try {
      const job = await createAnalystChartJob(officeId, apiFilters, idempotencyKey.trim());
      setChartJob(job);
    } catch (caught) {
      setJobError(getApiErrorMessage(caught, "Não foi possível solicitar o diagnóstico assíncrono."));
    } finally {
      setJobLoading(false);
    }
  }

  async function handleRefreshJob() {
    if (!officeId || !chartJob) {
      return;
    }

    setJobLoading(true);
    setJobError(null);
    try {
      const job = await getAnalystChartJob(officeId, chartJob.data.id);
      setChartJob(job);
    } catch (caught) {
      setJobError(getApiErrorMessage(caught, "Não foi possível atualizar o status do job."));
    } finally {
      setJobLoading(false);
    }
  }

  return (
    <ProtectedRoute roles={["admin", "analyst", "user"]}>
      <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-5 lg:px-6">
        <AppHeader
          title="Diagnósticos de risco"
          active="analyticsDiagnostics"
          showAdmin={actor?.role === "admin"}
          actions={
            <>
              {activeOffice ? <Badge variant="outline">{labelOfficeRole(activeOffice.role)}</Badge> : null}
              <LogoutButton />
            </>
          }
        />

        {!officeId ? (
          <Alert variant="warning">Selecione um escritório para abrir os diagnósticos.</Alert>
        ) : !canOpenDiagnostics ? (
          <Alert variant="failure">Seu perfil não possui acesso aos diagnósticos de analista.</Alert>
        ) : (
          <section className="grid gap-4">
            <DiagnosticsFilters
              filters={draftFilters}
              onChange={setDraftFilters}
              onSubmit={handleSubmitFilters}
            />

            <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
              <Card>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase text-moss">Processamento</p>
                    <h2 className="text-xl font-semibold text-stone-900">Job de diagnóstico</h2>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                    <Input
                      aria-label="Chave de idempotência"
                      value={idempotencyKey}
                      onChange={(event) => setIdempotencyKey(event.target.value)}
                    />
                    <Button onClick={handleCreateJob} disabled={jobLoading || !idempotencyKey.trim()}>
                      {jobLoading ? "Solicitando..." : "Solicitar job"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleRefreshJob}
                      disabled={jobLoading || !chartJob}
                    >
                      Atualizar
                    </Button>
                  </div>
                </div>
                {jobError ? <Alert variant="failure" className="mt-4">{jobError}</Alert> : null}
                <JobStatusPanel job={chartJob} loading={jobLoading} />
              </Card>

              <AuditEvidenceCard diagnostics={diagnostics} />
            </section>

            {loading ? (
              <Alert variant="info">Carregando diagnósticos de risco.</Alert>
            ) : error ? (
              <Alert variant="failure">{error}</Alert>
            ) : !diagnostics ? (
              <Alert variant="warning">Diagnósticos indisponíveis.</Alert>
            ) : diagnostics.data.dataQuality.status === "empty" ? (
              <Alert variant="info">Nenhum portfólio encontrado para os filtros aplicados.</Alert>
            ) : (
              <DiagnosticsCharts diagnostics={diagnostics} />
            )}
          </section>
        )}
      </main>
    </ProtectedRoute>
  );
}

function DiagnosticsFilters({
  filters,
  onChange,
  onSubmit
}: {
  filters: DiagnosticFilterState;
  onChange: (filters: DiagnosticFilterState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  function setField<K extends keyof DiagnosticFilterState>(key: K, value: DiagnosticFilterState[K]) {
    onChange({ ...filters, [key]: value });
  }

  function toggleMetric(metric: AnalyticsMetricKey) {
    const nextMetrics = filters.metrics.includes(metric)
      ? filters.metrics.filter((entry) => entry !== metric)
      : [...filters.metrics, metric];
    setField("metrics", nextMetrics.length > 0 ? nextMetrics : [metric]);
  }

  return (
    <Card>
      <form className="grid gap-4" onSubmit={onSubmit}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-moss">Filtros</p>
            <h1 className="text-2xl font-semibold text-stone-900">Workbench de diagnósticos</h1>
          </div>
          <Button type="submit">Aplicar filtros</Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Portfólios" htmlFor="portfolioIds">
            <Input
              id="portfolioIds"
              value={filters.portfolioIds}
              onChange={(event) => setField("portfolioIds", event.target.value)}
              placeholder="IDs separados por vírgula"
            />
          </Field>
          <Field label="Cliente" htmlFor="clientId">
            <Input
              id="clientId"
              value={filters.clientId}
              onChange={(event) => setField("clientId", event.target.value)}
            />
          </Field>
          <Field label="Grupo familiar" htmlFor="householdId">
            <Input
              id="householdId"
              value={filters.householdId}
              onChange={(event) => setField("householdId", event.target.value)}
            />
          </Field>
          <Field label="Conta" htmlFor="accountId">
            <Input
              id="accountId"
              value={filters.accountId}
              onChange={(event) => setField("accountId", event.target.value)}
            />
          </Field>
          <Field label="Assessor" htmlFor="advisorUserId">
            <Input
              id="advisorUserId"
              value={filters.advisorUserId}
              onChange={(event) => setField("advisorUserId", event.target.value)}
            />
          </Field>
          <Field label="Time" htmlFor="teamId">
            <Input
              id="teamId"
              value={filters.teamId}
              onChange={(event) => setField("teamId", event.target.value)}
            />
          </Field>
          <Field label="Período" htmlFor="range">
            <Select
              id="range"
              value={filters.range}
              onChange={(event) => setField("range", event.target.value as AnalystChartRange)}
            >
              {RANGE_OPTIONS.map((range) => (
                <option key={range} value={range}>
                  {labelRange(range)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Qualidade" htmlFor="dataQuality">
            <Select
              id="dataQuality"
              value={filters.dataQuality}
              onChange={(event) =>
                setField("dataQuality", event.target.value as AnalystDataQualityFilter | "")
              }
            >
              {QUALITY_OPTIONS.map((quality) => (
                <option key={quality || "all"} value={quality}>
                  {quality ? labelQualityStatus(quality) : "todas"}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Benchmark" htmlFor="benchmarkSymbol">
            <Input
              id="benchmarkSymbol"
              value={filters.benchmarkSymbol}
              onChange={(event) => setField("benchmarkSymbol", event.target.value)}
            />
          </Field>
        </div>

        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium text-foreground">Métricas</legend>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {METRIC_OPTIONS.map((metric) => (
              <label
                key={metric}
                className="flex min-h-10 items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-stone-700"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-moss"
                  checked={filters.metrics.includes(metric)}
                  onChange={() => toggleMetric(metric)}
                />
                <span>{labelAnalyticsMetricKey(metric)}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </form>
    </Card>
  );
}

function DiagnosticsCharts({ diagnostics }: { diagnostics: DiagnosticsEnvelope }) {
  const { data, meta } = diagnostics;

  return (
    <>
      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Portfólios" value={data.dataQuality.sourceCounts.portfolios} />
        <MetricCard label="Snapshots" value={data.dataQuality.sourceCounts.snapshots} />
        <MetricCard label="Ativos" value={data.dataQuality.sourceCounts.assets} />
        <MetricCard label="Qualidade" value={labelQualityStatus(data.dataQuality.status)} />
      </section>

      {data.dataQuality.status !== "complete" ? (
        <DataQualityIssues bundle={data} />
      ) : null}

      <section className="grid gap-4 xl:grid-cols-2">
        <ChartShell
          eyebrow="Risco e retorno"
          title="Dispersão por portfólio"
          aside={<Badge variant={qualityVariant(data.dataQuality.status)}>{labelQualityStatus(data.dataQuality.status)}</Badge>}
        >
          <RiskReturnScatter points={data.charts.riskReturnScatter} />
        </ChartShell>

        <ChartShell eyebrow="Distribuição" title="Métricas selecionadas">
          <MetricDistributionPanel distributions={data.charts.metricDistributions} />
        </ChartShell>

        <ChartShell eyebrow="Volatilidade" title="Janela móvel">
          <RollingLineChart
            points={data.charts.rollingVolatility}
            valueLabel="volatilidade"
            ariaLabel="Volatilidade móvel por portfólio"
          />
        </ChartShell>

        <ChartShell eyebrow="Correlação" title="Relações móveis">
          <CorrelationLineChart points={data.charts.rollingCorrelation} />
        </ChartShell>

        <ChartShell eyebrow="Setores" title="Mapa de exposição">
          <ExposureHeatmap cells={data.charts.sectorExposureHeatmap} />
        </ChartShell>

        <ChartShell eyebrow="Ativos" title="Mapa de exposição">
          <ExposureHeatmap cells={data.charts.assetExposureHeatmap} />
        </ChartShell>

        <ChartShell eyebrow="Benchmark" title="Sensibilidade">
          <BenchmarkSensitivityChart points={data.charts.benchmarkSensitivity} />
        </ChartShell>

        <ChartShell eyebrow="Contribuição" title="Risco por posição">
          <RiskContributionChart points={data.charts.riskContribution} />
        </ChartShell>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <ChartShell eyebrow="Concentração" title="Ranking de portfólios">
          <ConcentrationRankingTable rows={data.charts.concentrationRanking} />
        </ChartShell>
        <ChartShell eyebrow="Dados" title="Linha do tempo e provedores">
          <DataQualityTimeline points={data.charts.dataQualityTimeline} />
          <div className="mt-5">
            <ProviderFreshnessMatrix cells={data.charts.providerFreshnessMatrix} />
          </div>
        </ChartShell>
      </section>

      {meta ? (
        <p className="text-xs text-stone-500">
          Gerado em {formatDateTime(meta.generatedAt)} com {formatDecimal(meta.calculationDurationMs, 0)} ms.
        </p>
      ) : null}
    </>
  );
}

function Field({
  label,
  htmlFor,
  children
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <span className="text-xs font-semibold uppercase text-stone-500">{label}</span>
      <strong className="text-2xl text-stone-900">{value}</strong>
    </Card>
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
          <h2 className="text-lg font-semibold text-stone-900">{title}</h2>
        </div>
        {aside}
      </div>
      <div className="mt-5 min-h-[220px]">{children}</div>
    </Card>
  );
}

function RiskReturnScatter({ points }: { points: AnalystChartBundle["charts"]["riskReturnScatter"] }) {
  return (
    <div className="grid gap-3">
      <ThemedScatterChart
        ariaLabel="Dispersão de risco e retorno dos portfólios"
        xLabel="volatilidade"
        yLabel="retorno"
        xFormatter={formatOptionalPercent}
        yFormatter={formatOptionalPercent}
        data={points.map((point) => ({
          name: point.portfolioName,
          x: point.volatilityPercent ?? 0,
          y: point.annualizedReturnPercent ?? 0,
          z: point.valueUsd,
          fill: qualityColor(point.dataQualityStatus),
          detail: `${labelQualityStatus(point.dataQualityStatus)} · ${formatCurrency(point.valueUsd, "USD")}`
        }))}
      />
      <div className="grid gap-2 text-xs text-stone-600 sm:grid-cols-2">
        {points.slice(0, 4).map((point) => (
          <div key={point.portfolioId} className="rounded-md border border-border px-2 py-1">
            {point.portfolioName} · {labelQualityStatus(point.dataQualityStatus)}
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricDistributionPanel({ distributions }: { distributions: AnalystMetricDistribution[] }) {
  if (distributions.length === 0) {
    return <EmptyChartState>Nenhuma distribuição calculada.</EmptyChartState>;
  }

  return (
    <div className="grid gap-4">
      {distributions.map((distribution) => {
        const total = distribution.buckets.reduce((sum, bucket) => sum + bucket.count, 0);
        return (
          <div key={distribution.metricKey} className="grid gap-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-stone-900">
                {labelAnalyticsMetricKey(distribution.metricKey)}
              </span>
              <span className="text-stone-500">{total} portfólios</span>
            </div>
            <ThemedHorizontalBarChart
              ariaLabel={`Distribuição de ${labelAnalyticsMetricKey(distribution.metricKey)}`}
              color={chartPalette.graphite}
              height={180}
              data={distribution.buckets.map((bucket) => ({
                name: labelBucket(bucket.label),
                value: bucket.count,
                detail: bucket.unavailableReason
                  ? labelUnavailableReason(bucket.unavailableReason)
                  : `${bucket.portfolioIds.length} portfólios`
              }))}
            />
          </div>
        );
      })}
    </div>
  );
}

function RollingLineChart({
  points,
  valueLabel,
  ariaLabel
}: {
  points: AnalystRollingPoint[];
  valueLabel: string;
  ariaLabel: string;
}) {
  if (points.length === 0) {
    return <EmptyChartState>Nenhuma série móvel disponível.</EmptyChartState>;
  }

  const ordered = [...points].sort((left, right) => left.date.localeCompare(right.date));

  return (
    <div className="grid gap-3">
      <ThemedLineChart
        ariaLabel={ariaLabel}
        color={chartPalette.moss}
        valueFormatter={(value) => `${formatDecimal(value, 2)} ${valueLabel}`}
        data={ordered.map((point) => ({
          name: formatDate(point.date),
          value: point.value,
          detail: point.portfolioName
        }))}
      />
      <div className="flex flex-wrap justify-between gap-2 text-xs text-stone-500">
        <span>{formatDate(ordered[0].date)}</span>
        <span>{ordered.length} pontos</span>
        <span>{formatDate(ordered[ordered.length - 1].date)}</span>
      </div>
    </div>
  );
}

function CorrelationLineChart({ points }: { points: AnalystChartBundle["charts"]["rollingCorrelation"] }) {
  const rollingPoints = points.map((point) => ({
    ...point,
    value: point.correlation,
    sampleSize: 1
  }));

  return (
    <RollingLineChart
      points={rollingPoints}
      valueLabel="correlação"
      ariaLabel="Correlação móvel por par de ativos"
    />
  );
}

function ExposureHeatmap({ cells }: { cells: AnalystChartBundle["charts"]["sectorExposureHeatmap"] }) {
  return (
    <ThemedHeatmapChart
      ariaLabel="Mapa de exposição por portfólio"
      data={cells.slice(0, 16).map((cell) => ({
        x: cell.label,
        y: cell.portfolioName,
        value: cell.weightPercent,
        fill: heatColor(cell.weightPercent),
        detail: formatCurrency(cell.marketValueUsd, "USD")
      }))}
    />
  );
}

function BenchmarkSensitivityChart({
  points
}: {
  points: AnalystChartBundle["charts"]["benchmarkSensitivity"];
}) {
  if (points.length === 0) {
    return <EmptyChartState>Nenhum benchmark selecionado.</EmptyChartState>;
  }

  return (
    <ThemedHorizontalBarChart
      ariaLabel="Sensibilidade a benchmark por portfólio"
      color={chartPalette.moss}
      valueFormatter={(value) => formatDecimal(value, 2)}
      data={points.map((point) => ({
        name: point.portfolioName,
        value: Math.abs(point.sensitivity ?? 0),
        detail: point.unavailableReason
          ? labelUnavailableReason(point.unavailableReason)
          : `${point.benchmarkSymbol} · portfólio ${formatOptionalPercent(point.portfolioReturnPercent)} · benchmark ${formatOptionalPercent(point.benchmarkReturnPercent)}`
      }))}
    />
  );
}

function RiskContributionChart({
  points
}: {
  points: AnalystChartBundle["charts"]["riskContribution"];
}) {
  if (points.length === 0) {
    return <EmptyChartState>Nenhuma contribuição ao risco disponível.</EmptyChartState>;
  }

  return (
    <ThemedHorizontalBarChart
      ariaLabel="Contribuição ao risco por posição"
      color={chartPalette.amber}
      valueFormatter={formatOptionalPercent}
      data={points.slice(0, 10).map((point) => ({
        name: point.label,
        value: Math.abs(point.riskContributionPercent ?? 0),
        detail: point.unavailableReason
          ? labelUnavailableReason(point.unavailableReason)
          : `${point.portfolioName} · peso ${formatOptionalPercent(point.weightPercent)}`
      }))}
    />
  );
}

function ConcentrationRankingTable({
  rows
}: {
  rows: AnalystChartBundle["charts"]["concentrationRanking"];
}) {
  if (rows.length === 0) {
    return <EmptyChartState>Nenhum ranking de concentração disponível.</EmptyChartState>;
  }

  const maxWeight = Math.max(...rows.map((row) => row.topHoldingWeightPercent ?? 0), 1);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Portfólio</TableHead>
            <TableHead>HHI</TableHead>
            <TableHead>Maior posição</TableHead>
            <TableHead>Peso</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.portfolioId}>
              <TableCell>{row.rank}</TableCell>
              <TableCell className="font-medium text-stone-900">{row.portfolioName}</TableCell>
              <TableCell>{row.concentrationHhi === undefined ? "indisponível" : formatDecimal(row.concentrationHhi, 4)}</TableCell>
              <TableCell>{row.topHoldingLabel ?? labelUnavailableReason(row.unavailableReason)}</TableCell>
              <TableCell>
                <div className="grid min-w-28 gap-1">
                  <span>{formatOptionalPercent(row.topHoldingWeightPercent)}</span>
                  <ThemedInlineBarChart
                    ariaLabel={`Peso da maior posição de ${row.portfolioName}`}
                    value={row.topHoldingWeightPercent ?? 0}
                    max={maxWeight}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function DataQualityTimeline({
  points
}: {
  points: AnalystChartBundle["charts"]["dataQualityTimeline"];
}) {
  if (points.length === 0) {
    return <EmptyChartState>Nenhuma pendência de qualidade.</EmptyChartState>;
  }

  return (
    <div className="grid gap-2">
      {points.slice(0, 8).map((point) => (
        <div key={`${point.portfolioId}-${point.date}-${point.issueCode ?? "ok"}`} className="rounded-md border border-border p-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium text-stone-900">{point.portfolioName}</span>
            <Badge variant={qualityVariant(point.status)}>{labelQualityStatus(point.status)}</Badge>
          </div>
          <div className="mt-1 text-xs text-stone-500">
            {formatDate(point.date)}
            {point.issueCode ? ` · ${labelDataQualityIssueCode(point.issueCode)}` : ""}
          </div>
          {point.severity ? (
            <Badge className="mt-2" variant={dataQualitySeverityVariant(point.severity)}>
              {labelDataQualitySeverity(point.severity)}
            </Badge>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function ProviderFreshnessMatrix({
  cells
}: {
  cells: AnalystChartBundle["charts"]["providerFreshnessMatrix"];
}) {
  if (cells.length === 0) {
    return <EmptyChartState>Nenhuma fonte de mercado vinculada.</EmptyChartState>;
  }

  return (
    <div className="grid gap-2">
      {cells.slice(0, 10).map((cell) => (
        <div key={`${cell.portfolioId}-${cell.symbol}`} className="grid grid-cols-[1fr_auto] gap-3 rounded-md border border-border p-3 text-sm">
          <div className="min-w-0">
            <span className="block truncate font-medium text-stone-900">{cell.symbol}</span>
            <span className="block truncate text-xs text-stone-500">
              {cell.providerName ?? "provedor indisponível"} · {cell.portfolioName}
            </span>
          </div>
          <Badge variant={freshnessVariant(cell.freshness)}>{labelFreshness(cell.freshness)}</Badge>
        </div>
      ))}
    </div>
  );
}

function DataQualityIssues({ bundle }: { bundle: AnalystChartBundle }) {
  const unavailable = bundle.dataQuality.unavailableChartKeys;

  return (
    <Alert variant={bundle.dataQuality.status === "failed" ? "failure" : "warning"}>
      <div className="grid gap-2">
        <span className="font-medium">
          Qualidade {labelQualityStatus(bundle.dataQuality.status)}
        </span>
        {bundle.dataQuality.issues.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {bundle.dataQuality.issues.map((issue) => (
              <Badge key={`${issue.code}-${issue.message}`} variant={dataQualitySeverityVariant(issue.severity)}>
                {labelDataQualityIssueCode(issue.code)}
              </Badge>
            ))}
          </div>
        ) : null}
        {unavailable.length > 0 ? (
          <span className="text-xs">
            Seções indisponíveis: {unavailable.map(labelChartKey).join(", ")}.
          </span>
        ) : null}
      </div>
    </Alert>
  );
}

function AuditEvidenceCard({ diagnostics }: { diagnostics: DiagnosticsEnvelope | null }) {
  const meta = diagnostics?.meta;
  const data = diagnostics?.data;

  return (
    <Card>
      <div>
        <p className="text-xs font-semibold uppercase text-moss">Auditoria</p>
        <h2 className="text-xl font-semibold text-stone-900">Fontes do cálculo</h2>
      </div>
      <div className="mt-5 grid gap-3 text-sm">
        <EvidenceRow label="Gerado em" value={meta ? formatDateTime(meta.generatedAt) : "aguardando"} />
        <EvidenceRow label="Snapshots" value={meta?.sourceSnapshotIds.length ?? 0} />
        <EvidenceRow label="Hashes" value={meta?.inputHashes.length ?? 0} />
        <EvidenceRow label="Jobs" value={data?.dataQuality.sourceCounts.analyticsJobs ?? 0} />
      </div>
      {meta?.inputHashes.length ? (
        <div className="mt-4 grid gap-2 text-xs text-stone-500">
          {meta.inputHashes.slice(0, 3).map((hash) => (
            <code key={hash} className="truncate rounded-md bg-muted px-2 py-1">
              {hash}
            </code>
          ))}
        </div>
      ) : null}
    </Card>
  );
}

function JobStatusPanel({ job, loading }: { job: ChartJobEnvelope | null; loading: boolean }) {
  if (!job) {
    return (
      <div className="mt-5 rounded-md border border-border p-4 text-sm text-stone-600">
        Nenhum job solicitado nesta sessão.
      </div>
    );
  }

  const progress = Math.max(0, Math.min(job.data.progressPercent, 100));

  return (
    <div className="mt-5 grid gap-3 rounded-md border border-border p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="block truncate font-medium text-stone-900">{job.data.id}</span>
          <span className="text-xs text-stone-500">
            Correlação {job.meta?.correlationId ?? job.data.correlationId}
          </span>
        </div>
        <Badge variant={jobVariant(job.data.status)}>
          {loading ? "atualizando" : labelJobStatus(job.data.status)}
        </Badge>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div className="h-2 rounded-full bg-moss" style={{ width: `${progress}%` }} />
      </div>
      <div className="grid gap-1 text-xs text-stone-500 sm:grid-cols-3">
        <span>{progress}% concluído</span>
        <span>{job.data.resultMetadata?.chartKeys.length ?? 0} seções</span>
        <span>Expira em {job.data.expiresAt ? formatDate(job.data.expiresAt) : "sem prazo"}</span>
      </div>
      {job.data.errorCode ? (
        <Alert variant="failure">{labelUnavailableReason(job.data.errorCode)}</Alert>
      ) : null}
      {job.data.resultMetadata?.lastSuccessfulResultAt ? (
        <Alert variant="info">
          Último resultado bem-sucedido em {formatDateTime(job.data.resultMetadata.lastSuccessfulResultAt)}.
        </Alert>
      ) : null}
    </div>
  );
}

function EvidenceRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-stone-500">{label}</span>
      <span className="font-medium text-stone-900">{value}</span>
    </div>
  );
}

function EmptyChartState({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[180px] items-center justify-center rounded-md border border-dashed border-border px-4 text-center text-sm text-stone-500">
      {children}
    </div>
  );
}

function toApiFilters(filters: DiagnosticFilterState): AnalystChartFilters {
  return {
    portfolioIds: filters.portfolioIds,
    clientId: filters.clientId,
    householdId: filters.householdId,
    accountId: filters.accountId,
    advisorUserId: filters.advisorUserId,
    teamId: filters.teamId,
    range: filters.range,
    metrics: filters.metrics,
    benchmarkSymbol: filters.benchmarkSymbol,
    dataQuality: filters.dataQuality
  };
}

function labelRange(value: AnalystChartRange) {
  const labels: Record<AnalystChartRange, string> = {
    "90d": "90 dias",
    ytd: "ano corrente",
    "1y": "1 ano",
    "3y": "3 anos",
    "5y": "5 anos",
    all: "todo histórico"
  };
  return labels[value];
}

function labelQualityStatus(value: string) {
  const labels: Record<string, string> = {
    complete: "completa",
    partial: "parcial",
    stale: "desatualizada",
    failed: "falhou",
    empty: "vazia"
  };
  return labels[value] ?? value;
}

function labelJobStatus(value: string) {
  const labels: Record<string, string> = {
    pending: "pendente",
    running: "em execução",
    succeeded: "concluído",
    failed: "falhou",
    expired: "expirado"
  };
  return labels[value] ?? value;
}

function labelFreshness(value: string) {
  const labels: Record<string, string> = {
    fresh: "atualizado",
    partial: "parcial",
    stale: "desatualizado",
    missing: "ausente"
  };
  return labels[value] ?? value;
}

function labelChartKey(value: string) {
  const labels: Record<string, string> = {
    riskReturnScatter: "dispersão",
    metricDistributions: "distribuições",
    rollingVolatility: "volatilidade móvel",
    rollingCorrelation: "correlação móvel",
    sectorExposureHeatmap: "exposição setorial",
    assetExposureHeatmap: "exposição por ativo",
    benchmarkSensitivity: "benchmark",
    riskContribution: "contribuição ao risco",
    concentrationRanking: "concentração",
    dataQualityTimeline: "qualidade",
    providerFreshnessMatrix: "provedores"
  };
  return labels[value] ?? value;
}

function labelBucket(value: string) {
  return value === "indisponivel" ? "indisponível" : value;
}

function labelUnavailableReason(value: string | undefined) {
  if (!value) {
    return "indisponível";
  }
  const labels: Record<string, string> = {
    benchmark_unavailable: "benchmark indisponível",
    benchmark_history_insufficient: "histórico do benchmark insuficiente",
    insufficient_aligned_history: "histórico alinhado insuficiente",
    snapshot_unavailable: "snapshot indisponível",
    volatility_unavailable: "volatilidade indisponível",
    "analytics.snapshot_unavailable": "snapshot indisponível"
  };
  return labels[value] ?? value;
}

function formatOptionalPercent(value: number | undefined) {
  return value === undefined ? "indisponível" : `${formatDecimal(value, 2)}%`;
}

function qualityVariant(value: string): BadgeVariant {
  switch (value) {
    case "complete":
      return "success";
    case "partial":
    case "stale":
      return "warning";
    case "empty":
      return "outline";
    default:
      return "failure";
  }
}

function freshnessVariant(value: string): BadgeVariant {
  switch (value) {
    case "fresh":
      return "success";
    case "partial":
      return "warning";
    case "stale":
      return "failure";
    default:
      return "outline";
  }
}

function jobVariant(value: string): BadgeVariant {
  switch (value) {
    case "succeeded":
      return "success";
    case "pending":
    case "running":
      return "warning";
    case "expired":
      return "outline";
    default:
      return "failure";
  }
}

function qualityColor(value: string) {
  switch (value) {
    case "complete":
      return chartPalette.moss;
    case "partial":
      return chartPalette.amber;
    case "stale":
      return "#ea580c";
    default:
      return chartPalette.rose;
  }
}

function heatColor(weightPercent: number) {
  const intensity = Math.min(Math.max(weightPercent / 100, 0.08), 0.72);
  return `rgba(14, 91, 80, ${intensity})`;
}
