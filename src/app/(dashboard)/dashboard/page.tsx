"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "../../../components/layout/AppShell";
import { StatePanel } from "../../../components/status/StatePanel";
import { ProtectedRoute } from "../../../features/auth/ProtectedRoute";
import { useAuth } from "../../../features/auth/AuthProvider";
import { getPortfolioDashboard, listPortfolios } from "../../../features/portfolio/portfolioApi";
import {
  AllocationSlice,
  PerformancePoint,
  PortfolioDashboard,
  PortfolioListItem
} from "../../../features/portfolio/types";
import { ApiError } from "../../../lib/api/client";

export default function DashboardPage() {
  const { actor } = useAuth();
  const [portfolios, setPortfolios] = useState<PortfolioListItem[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<PortfolioDashboard | null>(null);
  const [isListLoading, setIsListLoading] = useState(true);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    listPortfolios()
      .then((data) => {
        if (!isActive) {
          return;
        }

        setPortfolios(data.portfolios);
        setSelectedAccountId((current) => current ?? data.portfolios[0]?.accountId ?? null);
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        setListError(getMessage(error, "Nao foi possivel carregar os portfolios."));
      })
      .finally(() => {
        if (isActive) {
          setIsListLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedAccountId) {
      setDashboard(null);
      return;
    }

    let isActive = true;
    setIsDashboardLoading(true);
    setDashboardError(null);

    getPortfolioDashboard(selectedAccountId)
      .then((response) => {
        if (isActive) {
          setDashboard(response.data);
        }
      })
      .catch((error: unknown) => {
        if (isActive) {
          setDashboard(null);
          setDashboardError(getMessage(error, "Nao foi possivel carregar o detalhe."));
        }
      })
      .finally(() => {
        if (isActive) {
          setIsDashboardLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [selectedAccountId]);

  return (
    <ProtectedRoute roles={["admin", "analyst", "user"]}>
      <AppShell>
        <section className="hero-panel">
          <div>
            <p className="eyebrow">Workspace autenticado</p>
            <h2>{actor?.name}</h2>
            <p className="muted">
              {actor?.email} · papel {actor?.role}
            </p>
          </div>
          <div className="hero-panel__stats">
            <MetricCard
              label="Portfolios"
              value={String(portfolios.length)}
              description="visiveis nesta sessao"
            />
            <MetricCard
              label="Autorizacoes"
              value={String(actor?.accountMemberships.length ?? 0)}
              description="mapeadas pelo backend"
            />
          </div>
        </section>

        {isListLoading ? (
          <StatePanel
            tone="loading"
            title="Carregando workspaces"
            description="Buscando portfolios e estados de analytics vinculados a esta sessao."
          />
        ) : listError ? (
          <StatePanel
            tone="error"
            title="Falha ao carregar portfolios"
            description={listError}
          />
        ) : portfolios.length === 0 ? (
          <StatePanel
            tone="empty"
            title="Nenhum portfolio vinculado"
            description="Esta sessao nao recebeu memberships de portfolio. Use a area administrativa para revisar acessos ou provisionar uma conta."
            action={
              actor?.role === "admin" ? (
                <Link href="/admin" className="button button--primary">
                  Abrir admin
                </Link>
              ) : null
            }
          />
        ) : (
          <section className="workspace-grid">
            <aside className="portfolio-list panel">
              <div className="section-heading">
                <div>
                  <h2>Portfolios</h2>
                  <p className="muted">Selecione uma superficie para inspecionar risco e operacao.</p>
                </div>
              </div>
              <div className="portfolio-list__items">
                {portfolios.map((portfolio) => (
                  <button
                    key={portfolio.accountId}
                    type="button"
                    className={
                      portfolio.accountId === selectedAccountId
                        ? "portfolio-card portfolio-card--active"
                        : "portfolio-card"
                    }
                    onClick={() => setSelectedAccountId(portfolio.accountId)}
                  >
                    <div className="portfolio-card__header">
                      <strong>{portfolio.accountName}</strong>
                      <span className={`status-pill status-pill--${portfolio.freshness}`}>
                        {portfolio.freshness}
                      </span>
                    </div>
                    <p className="muted">
                      papel {portfolio.membershipRole} · score {portfolio.riskScore}
                    </p>
                    <dl className="portfolio-card__metrics">
                      <div>
                        <dt>Valor</dt>
                        <dd>{formatCurrency(portfolio.marketValue, portfolio.currency)}</dd>
                      </div>
                      <div>
                        <dt>PnL</dt>
                        <dd>{formatSignedCurrency(portfolio.unrealizedPnl, portfolio.currency)}</dd>
                      </div>
                      <div>
                        <dt>Holdings</dt>
                        <dd>{portfolio.holdingsCount}</dd>
                      </div>
                      <div>
                        <dt>Alertas</dt>
                        <dd>{portfolio.openAlerts}</dd>
                      </div>
                    </dl>
                  </button>
                ))}
              </div>
            </aside>

            <div className="workspace-detail">
              {isDashboardLoading ? (
                <StatePanel
                  tone="loading"
                  title="Carregando detalhe"
                  description="Montando holdings, transacoes, analytics e reports do portfolio selecionado."
                />
              ) : dashboardError ? (
                <StatePanel
                  tone="error"
                  title="Falha ao carregar detalhe"
                  description={dashboardError}
                />
              ) : dashboard ? (
                <PortfolioWorkspace dashboard={dashboard} />
              ) : null}
            </div>
          </section>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}

function PortfolioWorkspace({ dashboard }: { dashboard: PortfolioDashboard }) {
  const tone =
    dashboard.meta.freshness === "partial"
      ? "partial"
      : dashboard.meta.freshness === "stale"
        ? "stale"
        : "neutral";

  return (
    <>
      {tone !== "neutral" ? (
        <StatePanel
          tone={tone}
          title={
            tone === "partial"
              ? "Analytics parcial"
              : "Snapshot defasado"
          }
          description={
            dashboard.meta.warnings[0] ??
            "Este snapshot exige leitura cautelosa antes de qualquer decisao operacional."
          }
        />
      ) : null}

      <section className="detail-header panel">
        <div>
          <p className="eyebrow">Portfolio selecionado</p>
          <h2>{dashboard.accountName}</h2>
          <p className="muted">
            papel {dashboard.membershipRole} · as of {formatDateTime(dashboard.meta.asOf)}
          </p>
        </div>
        <div className="detail-header__badges">
          <span className={`status-pill status-pill--${dashboard.meta.freshness}`}>
            {dashboard.meta.freshness}
          </span>
          <span className={`status-pill status-pill--${dashboard.meta.status}`}>
            {dashboard.meta.status}
          </span>
        </div>
      </section>

      <section className="metrics-grid">
        <MetricCard
          label="Market value"
          value={formatCurrency(dashboard.marketValue, dashboard.currency)}
          description={`cost basis ${formatCurrency(dashboard.costBasis, dashboard.currency)}`}
        />
        <MetricCard
          label="Unrealized PnL"
          value={formatSignedCurrency(dashboard.unrealizedPnl, dashboard.currency)}
          description={`${formatPercent(dashboard.dayChangePercent)} no dia`}
        />
        <MetricCard
          label="Risk score"
          value={String(dashboard.analytics.riskScore)}
          description={`VaR 95 ${formatCurrency(dashboard.analytics.valueAtRisk95, dashboard.currency)}`}
        />
        <MetricCard
          label="Diversification"
          value={`${dashboard.analytics.diversificationScore}/100`}
          description={`${dashboard.holdingsCount} holdings observados`}
        />
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Risk context</h2>
            <p className="muted">
              Insights explicativos. Nenhum texto abaixo constitui recomendacao de investimento.
            </p>
          </div>
        </div>
        <div className="insight-grid">
          {dashboard.insights.map((insight) => (
            <article key={insight} className="insight-card">
              <p>{insight}</p>
            </article>
          ))}
          {dashboard.meta.warnings.map((warning) => (
            <article key={warning} className="insight-card insight-card--warning">
              <p>{warning}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="charts-grid">
        <div className="panel">
          <div className="section-heading">
            <div>
              <h2>Allocation</h2>
              <p className="muted">Pesos percentuais por classe.</p>
            </div>
          </div>
          <AllocationChart slices={dashboard.allocation} />
        </div>
        <div className="panel">
          <div className="section-heading">
            <div>
              <h2>Performance</h2>
              <p className="muted">Retorno mensal em % para leitura de tendencia.</p>
            </div>
          </div>
          <PerformanceChart points={dashboard.performance} />
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Analytics metrics</h2>
            <p className="muted">
              Volatilidade {formatPercent(dashboard.analytics.volatilityPercent)} · drawdown{" "}
              {formatPercent(dashboard.analytics.maxDrawdownPercent)}
            </p>
          </div>
        </div>
        <ul className="analytics-notes">
          {dashboard.analytics.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>

      <section className="tables-grid">
        <div className="panel data-section">
          <div className="section-heading">
            <div>
              <h2>Positions</h2>
              <p className="muted">Exposicao atual, pesos, unidades e variacao diaria.</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Nome</th>
                <th>Classe</th>
                <th>Quantidade</th>
                <th>Peso</th>
                <th>Valor</th>
                <th>Dia</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.holdings.map((holding) => (
                <tr key={holding.symbol}>
                  <td>{holding.symbol}</td>
                  <td>{holding.name}</td>
                  <td>{holding.assetClass}</td>
                  <td>{holding.quantity}</td>
                  <td>{formatPercent(holding.weightPercent)}</td>
                  <td>{formatCurrency(holding.marketValue, dashboard.currency)}</td>
                  <td>{formatPercent(holding.dayChangePercent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel data-section">
          <div className="section-heading">
            <div>
              <h2>Transactions</h2>
              <p className="muted">Eventos recentes usados para contextualizar o snapshot.</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Descricao</th>
                <th>Qtd</th>
                <th>Valor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{transaction.tradeDate}</td>
                  <td>{transaction.type}</td>
                  <td>{transaction.description}</td>
                  <td>{transaction.quantity}</td>
                  <td>{formatCurrency(transaction.amount, transaction.currency)}</td>
                  <td>{transaction.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="tables-grid">
        <div className="panel">
          <div className="section-heading">
            <div>
              <h2>Reports</h2>
              <p className="muted">Pontos de entrada para packs e exports ja expostos.</p>
            </div>
          </div>
          <div className="stack-list">
            {dashboard.reports.map((report) => (
              <article key={report.id} className="stack-item">
                <div>
                  <strong>{report.name}</strong>
                  <p className="muted">
                    {report.format.toUpperCase()} · {formatDateTime(report.asOf)}
                  </p>
                </div>
                <span className={`status-pill status-pill--${report.status}`}>
                  {report.status}
                </span>
              </article>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="section-heading">
            <div>
              <h2>Alerts and notifications</h2>
              <p className="muted">Entrada operacional para monitoramento e proximos gatilhos.</p>
            </div>
          </div>
          <div className="stack-list">
            {dashboard.alerts.map((alert) => (
              <article key={alert.id} className="stack-item">
                <div>
                  <strong>{alert.title}</strong>
                  <p className="muted">{alert.status}</p>
                </div>
                <span className={`status-pill status-pill--${alert.severity}`}>
                  {alert.severity}
                </span>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function MetricCard({
  label,
  value,
  description
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <article className="metric-card panel">
      <p className="metric-label">{label}</p>
      <strong>{value}</strong>
      <p className="muted">{description}</p>
    </article>
  );
}

function AllocationChart({ slices }: { slices: AllocationSlice[] }) {
  return (
    <div className="chart-list" role="img" aria-label="Allocation chart with portfolio weights">
      {slices.map((slice) => (
        <div key={slice.label} className="chart-row">
          <div className="chart-row__label">
            <span>{slice.label}</span>
            <span>{formatPercent(slice.weightPercent)}</span>
          </div>
          <div className="chart-row__track">
            <div className="chart-row__fill" style={{ width: `${slice.weightPercent}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function PerformanceChart({ points }: { points: PerformancePoint[] }) {
  const min = Math.min(...points.map((point) => point.returnPercent), 0);
  const max = Math.max(...points.map((point) => point.returnPercent), 0);
  const range = max - min || 1;

  const path = points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * 100;
      const y = 100 - ((point.returnPercent - min) / range) * 100;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <div className="line-chart" role="img" aria-label="Performance chart in percent by month">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d={path} />
      </svg>
      <div className="line-chart__legend">
        {points.map((point) => (
          <span key={point.label}>
            {point.label} {formatPercent(point.returnPercent)}
          </span>
        ))}
      </div>
    </div>
  );
}

function getMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return `${error.message} (${error.code})`;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(value);
}

function formatSignedCurrency(value: number, currency: string): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatCurrency(value, currency)}`;
}

function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}
