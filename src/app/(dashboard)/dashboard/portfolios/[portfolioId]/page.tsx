"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppHeader } from "../../../../../components/layout/AppHeader";
import { Alert } from "../../../../../components/ui/alert";
import { Badge } from "../../../../../components/ui/badge";
import { Button, LinkButton } from "../../../../../components/ui/button";
import { Card } from "../../../../../components/ui/card";
import { FieldError, Label } from "../../../../../components/ui/form";
import { Input } from "../../../../../components/ui/input";
import { Select } from "../../../../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../../components/ui/table";
import { Textarea } from "../../../../../components/ui/textarea";
import { ProtectedRoute } from "../../../../../features/auth/ProtectedRoute";
import { useAuth } from "../../../../../features/auth/AuthProvider";
import { LogoutButton } from "../../../../../features/auth/LogoutButton";
import {
  createPortfolioAlert,
  createPortfolioTransaction,
  downloadPortfolioReport,
  getTradePrice,
  getPortfolioAnalytics,
  getPortfolio,
  listNotifications,
  listPortfolioAlerts,
  listMarketExchanges,
  listPortfolioPositions,
  listPortfolioReports,
  listPortfolioSnapshots,
  listPortfolioTransactions,
  markNotificationRead,
  requestPortfolioAnalyticsRecompute,
  requestPortfolioReport,
  searchMarketAssets
} from "../../../../../features/portfolio/portfolioApi";
import {
  AlertSeverity,
  AnalyticsMetric,
  MarketAsset,
  MarketExchange,
  NotificationRecord,
  PortfolioAlert,
  PortfolioAnalyticsReadModel,
  PortfolioAnalyticsSnapshot,
  PortfolioDetail,
  PortfolioPosition,
  PortfolioReport,
  PortfolioSnapshot,
  PortfolioTransaction,
  RealtimeMessage,
  ReportFormat,
  TradePriceQuote
} from "../../../../../features/portfolio/types";
import { ApiError } from "../../../../../lib/api/client";
import {
  connectRealtime,
  RealtimeConnectionStatus
} from "../../../../../lib/realtime/client";

interface TransactionFormState {
  exchangeCode: string;
  assetSymbol: string;
  assetName: string;
  tradeDate: string;
  type: "buy" | "sell";
  quantity: string;
  unitPrice: string;
  currency: string;
  notes: string;
}

type AssetSearchStatus = "idle" | "loading" | "success" | "empty" | "error";
type TradePriceStatus = "idle" | "loading" | "success" | "error";

export default function PortfolioDetailPage() {
  const { actor } = useAuth();
  const routeParams = useParams<{ portfolioId: string }>();
  const portfolioId = routeParams.portfolioId;
  const [portfolio, setPortfolio] = useState<PortfolioDetail | null>(null);
  const [positions, setPositions] = useState<PortfolioPosition[]>([]);
  const [transactions, setTransactions] = useState<PortfolioTransaction[]>([]);
  const [snapshots, setSnapshots] = useState<PortfolioSnapshot[]>([]);
  const [analytics, setAnalytics] = useState<PortfolioAnalyticsReadModel | null>(null);
  const [reports, setReports] = useState<PortfolioReport[]>([]);
  const [alerts, setAlerts] = useState<PortfolioAlert[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [selectedAsOf, setSelectedAsOf] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  const [isRecomputing, setIsRecomputing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRequestingReport, setIsRequestingReport] = useState(false);
  const [isCreatingAlert, setIsCreatingAlert] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [alertsError, setAlertsError] = useState<string | null>(null);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [recomputeNotice, setRecomputeNotice] = useState<string | null>(null);
  const [submissionNotice, setSubmissionNotice] = useState<string | null>(null);
  const [reportNotice, setReportNotice] = useState<string | null>(null);
  const [alertNotice, setAlertNotice] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeConnectionStatus>("disconnected");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [reportFormat, setReportFormat] = useState<ReportFormat>("pdf");
  const [alertTitle, setAlertTitle] = useState("Analytics atualizou métricas monitoradas");
  const [alertSeverity, setAlertSeverity] = useState<AlertSeverity>("medium");
  const [assetSearchStatus, setAssetSearchStatus] = useState<AssetSearchStatus>("idle");
  const [assetSearchResults, setAssetSearchResults] = useState<MarketAsset[]>([]);
  const [assetSearchMessage, setAssetSearchMessage] = useState<string | null>(null);
  const [marketExchanges, setMarketExchanges] = useState<MarketExchange[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [tradePriceStatus, setTradePriceStatus] = useState<TradePriceStatus>("idle");
  const [tradePrice, setTradePrice] = useState<TradePriceQuote | null>(null);
  const [tradePriceError, setTradePriceError] = useState<string | null>(null);
  const [form, setForm] = useState<TransactionFormState>({
    exchangeCode: "NASDAQ",
    assetSymbol: "",
    assetName: "",
    tradeDate: new Date().toISOString().slice(0, 10),
    type: "buy",
    quantity: "",
    unitPrice: "",
    currency: "USD",
    notes: ""
  });

  useEffect(() => {
    let isActive = true;

    listMarketExchanges()
      .then((response) => {
        if (!isActive) {
          return;
        }

        setMarketExchanges(response.exchanges);
        setForm((current) => ({
          ...current,
          exchangeCode:
            response.exchanges.some((exchange) => exchange.code === current.exchangeCode)
              ? current.exchangeCode
              : response.exchanges[0]?.code ?? current.exchangeCode
        }));
      })
      .catch(() => undefined);

    return () => {
      isActive = false;
    };
  }, []);

  const reloadAnalytics = useCallback(async () => {
    if (!portfolioId) {
      return;
    }

    setIsAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const response = await getPortfolioAnalytics(portfolioId);
      setAnalytics(response.data);
    } catch (requestError) {
      setAnalyticsError(getMessage(requestError, "Não foi possível carregar analytics."));
    } finally {
      setIsAnalyticsLoading(false);
    }
  }, [portfolioId]);

  const reloadReports = useCallback(async () => {
    if (!portfolioId) {
      return;
    }

    setReportsError(null);
    try {
      const response = await listPortfolioReports(portfolioId);
      setReports(response.reports);
    } catch (requestError) {
      setReportsError(getMessage(requestError, "Não foi possível carregar relatórios."));
    }
  }, [portfolioId]);

  const reloadAlerts = useCallback(async () => {
    if (!portfolioId) {
      return;
    }

    setAlertsError(null);
    try {
      const response = await listPortfolioAlerts(portfolioId);
      setAlerts(response.alerts);
    } catch (requestError) {
      setAlertsError(getMessage(requestError, "Não foi possível carregar alertas."));
    }
  }, [portfolioId]);

  const reloadNotifications = useCallback(async () => {
    setNotificationsError(null);
    try {
      const response = await listNotifications();
      setNotifications(response.notifications);
    } catch (requestError) {
      setNotificationsError(getMessage(requestError, "Não foi possível carregar notificações."));
    }
  }, []);

  useEffect(() => {
    if (!portfolioId) {
      return;
    }

    let isActive = true;
    setIsLoading(true);
    setError(null);

    Promise.all([
      getPortfolio(portfolioId),
      listPortfolioPositions(portfolioId),
      listPortfolioTransactions(portfolioId),
      listPortfolioSnapshots(portfolioId),
      getPortfolioAnalytics(portfolioId),
      listPortfolioReports(portfolioId),
      listPortfolioAlerts(portfolioId),
      listNotifications()
    ])
      .then(([
        portfolioData,
        positionsData,
        transactionsData,
        snapshotsData,
        analyticsData,
        reportsData,
        alertsData,
        notificationsData
      ]) => {
        if (!isActive) {
          return;
        }

        setPortfolio(portfolioData);
        setPositions(positionsData.positions);
        setTransactions(transactionsData.transactions);
        setSnapshots(snapshotsData.snapshots);
        setAnalytics(analyticsData.data);
        setReports(reportsData.reports);
        setAlerts(alertsData.alerts);
        setNotifications(notificationsData.notifications);
      })
      .catch((requestError: unknown) => {
        if (isActive) {
          setError(getMessage(requestError, "Não foi possível carregar o detalhe do portfolio."));
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [portfolioId]);

  useEffect(() => {
    if (!portfolioId || !actor) {
      return;
    }

    const connection = connectRealtime({
      portfolioId,
      onStatus: setRealtimeStatus,
      onMessage: (message: RealtimeMessage) => {
        if (message.portfolioId && message.portfolioId !== portfolioId) {
          return;
        }

        if (message.type === "analytics.updated" || message.type === "analytics.failed") {
          void reloadAnalytics();
        }
        if (message.type === "report.generated" || message.type === "report.failed") {
          void reloadReports();
        }
        if (message.type === "notification.sent") {
          void reloadNotifications();
        }
        if (message.type === "market_data.updated" || message.type === "portfolio.updated") {
          void getPortfolio(portfolioId).then(setPortfolio).catch(() => undefined);
        }
      },
      onError: () => setRealtimeStatus("disconnected")
    });

    return () => {
      connection.close();
    };
  }, [actor, portfolioId, reloadAnalytics, reloadNotifications, reloadReports]);

  useEffect(() => {
    if (!portfolioId) {
      return;
    }

    const hasPendingReports = reports.some(
      (report) => report.status === "pending" || report.status === "running"
    );
    const shouldPoll =
      realtimeStatus !== "connected" ||
      hasPendingReports ||
      analytics?.status === "pending";

    if (!shouldPoll) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void reloadReports();
      void reloadNotifications();
      void reloadAnalytics();
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [
    analytics?.status,
    portfolioId,
    realtimeStatus,
    reloadAnalytics,
    reloadNotifications,
    reloadReports,
    reports
  ]);

  useEffect(() => {
    function handleAnalyticsUpdated(event: Event) {
      const detail = (event as CustomEvent<{ portfolioId?: string }>).detail;
      if (!detail?.portfolioId || detail.portfolioId === portfolioId) {
        void reloadAnalytics();
      }
    }

    window.addEventListener("analytics.updated", handleAnalyticsUpdated);
    return () => {
      window.removeEventListener("analytics.updated", handleAnalyticsUpdated);
    };
  }, [portfolioId, reloadAnalytics]);

  useEffect(() => {
    if (!portfolioId) {
      return;
    }

    let isActive = true;

    listPortfolioPositions(portfolioId, selectedAsOf || undefined)
      .then((response) => {
        if (isActive) {
          setPositions(response.positions);
        }
      })
      .catch(() => undefined);

    return () => {
      isActive = false;
    };
  }, [portfolioId, selectedAsOf]);

  useEffect(() => {
    const query = form.assetSymbol.trim();
    if (query.length < 2) {
      setAssetSearchStatus("idle");
      setAssetSearchResults([]);
      setAssetSearchMessage(null);
      return;
    }

    let isActive = true;
    setAssetSearchStatus("loading");
    setAssetSearchMessage(null);

    const timeoutId = window.setTimeout(() => {
      searchMarketAssets(query, form.exchangeCode || undefined)
        .then((response) => {
          if (!isActive) {
            return;
          }

          setAssetSearchResults(response.data.assets);
          setAssetSearchStatus(response.data.assets.length > 0 ? "success" : "empty");
          setAssetSearchMessage(
            response.meta?.providerStatus === "degraded"
              ? "Provider indisponível; exibindo dados conhecidos pelo backend."
              : null
          );
        })
        .catch((requestError: unknown) => {
          if (!isActive) {
            return;
          }

          setAssetSearchResults([]);
          setAssetSearchStatus("error");
          setAssetSearchMessage(
            getMessage(requestError, "Provider indisponível. Informe o ativo manualmente.")
          );
        });
    }, 250);

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, [form.assetSymbol, form.exchangeCode]);

  useEffect(() => {
    const quantity = Number(form.quantity);
    if (
      !selectedAssetId ||
      !form.tradeDate ||
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      setTradePrice(null);
      setTradePriceStatus("idle");
      setTradePriceError(null);
      return;
    }

    let isActive = true;
    setTradePriceStatus("loading");
    setTradePriceError(null);

    const timeoutId = window.setTimeout(() => {
      getTradePrice(selectedAssetId, { tradeDate: form.tradeDate, quantity })
        .then((response) => {
          if (!isActive) {
            return;
          }

          const calculatedPrice = response.data.tradePrice;
          setTradePrice(calculatedPrice);
          setTradePriceStatus("success");
          setFormErrors((current) => {
            const remainingErrors = { ...current };
            delete remainingErrors.unitPrice;
            return remainingErrors;
          });
          setForm((current) => ({
            ...current,
            unitPrice: String(calculatedPrice.unitPrice),
            currency: calculatedPrice.currency
          }));
        })
        .catch((requestError: unknown) => {
          if (!isActive) {
            return;
          }

          setTradePrice(null);
          setTradePriceStatus("error");
          setTradePriceError(
            getMessage(requestError, "Não foi possível calcular o preço pelo Yahoo.")
          );
        });
    }, 250);

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, [form.quantity, form.tradeDate, selectedAssetId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!portfolioId) {
      return;
    }

    setSubmitError(null);
    setSubmissionNotice(null);
    setFormErrors({});

    if (!selectedAssetId) {
      setFormErrors({
        assetSymbol: "Selecione um ativo retornado pelo Yahoo antes de registrar."
      });
      setSubmitError("Selecione um ativo retornado pelo Yahoo antes de registrar.");
      return;
    }

    const quantity = Number(form.quantity);
    const hasCurrentTradePrice =
      tradePriceStatus === "success" &&
      tradePrice?.assetId === selectedAssetId &&
      tradePrice.tradeDate === form.tradeDate &&
      tradePrice.quantity === quantity;

    if (!hasCurrentTradePrice || !tradePrice) {
      setFormErrors({
        unitPrice: "Aguarde o cálculo do preço pelo Yahoo."
      });
      setSubmitError("Aguarde o cálculo do preço pelo Yahoo antes de registrar.");
      return;
    }

    setIsSubmitting(true);

    try {
      await createPortfolioTransaction(portfolioId, {
        assetSymbol: form.assetSymbol,
        assetName: form.assetName,
        tradeDate: form.tradeDate,
        type: form.type,
        quantity,
        unitPrice: tradePrice.unitPrice,
        currency: tradePrice.currency,
        notes: form.notes
      });

      const [portfolioData, positionsData, transactionsData, snapshotsData] = await Promise.all([
        getPortfolio(portfolioId),
        listPortfolioPositions(portfolioId, selectedAsOf || undefined),
        listPortfolioTransactions(portfolioId),
        listPortfolioSnapshots(portfolioId)
      ]);
      setPortfolio(portfolioData);
      setPositions(positionsData.positions);
      setTransactions(transactionsData.transactions);
      setSnapshots(snapshotsData.snapshots);
      setSubmissionNotice(
        portfolioData.marketDataState === "pending"
          ? "Transacao registrada. O backend enfileirou o enriquecimento de market data para este ativo."
          : null
      );
      await reloadAnalytics();
      setForm({
        exchangeCode: "NASDAQ",
        assetSymbol: "",
        assetName: "",
        tradeDate: new Date().toISOString().slice(0, 10),
        type: "buy",
        quantity: "",
        unitPrice: "",
        currency: portfolioData.baseCurrency,
        notes: ""
      });
      setSelectedAssetId(null);
      setTradePrice(null);
      setTradePriceStatus("idle");
      setTradePriceError(null);
    } catch (requestError) {
      setFormErrors(getFieldErrors(requestError));
      setSubmitError(getMessage(requestError, "Não foi possível registrar a transação."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRecomputeAnalytics() {
    if (!portfolioId) {
      return;
    }

    setIsRecomputing(true);
    setAnalyticsError(null);
    setRecomputeNotice(null);
    try {
      await requestPortfolioAnalyticsRecompute(portfolioId);
      setRecomputeNotice("Recalculo de analytics enfileirado pelo backend.");
      await reloadAnalytics();
    } catch (requestError) {
      setAnalyticsError(getMessage(requestError, "Não foi possível solicitar recálculo."));
    } finally {
      setIsRecomputing(false);
    }
  }

  async function handleRequestReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await enqueueReport(reportFormat);
  }

  async function handleRetryReport(format: ReportFormat) {
    await enqueueReport(format);
  }

  async function enqueueReport(format: ReportFormat) {
    if (!portfolioId) {
      return;
    }

    setIsRequestingReport(true);
    setReportsError(null);
    setReportNotice(null);
    try {
      await requestPortfolioReport(portfolioId, format);
      setReportNotice("Relatório enfileirado. O status será atualizado pelo stream ou polling.");
      await reloadReports();
    } catch (requestError) {
      setReportsError(getMessage(requestError, "Não foi possível solicitar relatório."));
    } finally {
      setIsRequestingReport(false);
    }
  }

  async function handleDownloadReport(report: PortfolioReport) {
    setReportsError(null);
    try {
      const { blob, filename } = await downloadPortfolioReport(report.id);
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = filename ?? `${report.id}.${report.format}`;
      anchor.click();
      URL.revokeObjectURL(objectUrl);
    } catch (requestError) {
      setReportsError(getMessage(requestError, "Não foi possível baixar o relatório."));
    }
  }

  async function handleCreateAlert(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!portfolioId) {
      return;
    }

    setIsCreatingAlert(true);
    setAlertsError(null);
    setAlertNotice(null);
    try {
      await createPortfolioAlert(portfolioId, {
        title: alertTitle,
        severity: alertSeverity,
        condition: { eventType: "analytics.updated" }
      });
      setAlertNotice("Alerta criado para novas atualizações de analytics.");
      setAlertTitle("Analytics atualizou métricas monitoradas");
      setAlertSeverity("medium");
      await reloadAlerts();
    } catch (requestError) {
      setAlertsError(getMessage(requestError, "Não foi possível criar o alerta."));
    } finally {
      setIsCreatingAlert(false);
    }
  }

  async function handleMarkNotificationRead(notification: NotificationRecord) {
    setNotificationsError(null);
    try {
      await markNotificationRead(notification.id);
      await reloadNotifications();
    } catch (requestError) {
      const message =
        requestError instanceof ApiError && [403, 404].includes(requestError.status)
          ? "Notificação indisponível para esta sessão."
          : getMessage(requestError, "Não foi possível atualizar a notificação.");
      setNotificationsError(message);
    }
  }

  return (
    <ProtectedRoute roles={["admin", "analyst", "user"]}>
      <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-5 lg:px-6">
        <AppHeader
          title="Portfolio ledger"
          active="dashboard"
          showAdmin={actor?.role === "admin"}
          actions={<LogoutButton />}
        />

        <LinkButton href="/dashboard" variant="outline" className="w-fit">
          Voltar para portfolios
        </LinkButton>

        {isLoading ? (
          <Alert variant="info">Montando portfolio, posições, transações e snapshots.</Alert>
        ) : error || !portfolio ? (
          <Alert variant="failure">{error ?? "Portfolio não encontrado."}</Alert>
        ) : (
          <>
            {portfolio.warnings.length > 0 ? (
              <Alert variant={portfolio.freshness === "partial" ? "warning" : "failure"}>
                <div className="space-y-1">
                  {portfolio.warnings.map((warning) => (
                    <p key={warning}>{warning}</p>
                  ))}
                </div>
              </Alert>
            ) : null}
            {submissionNotice ? <Alert variant="warning">{submissionNotice}</Alert> : null}

            <Card>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase text-moss">
                    Portfolio detail
                  </p>
                  <h1 className="text-3xl font-semibold text-stone-900">{portfolio.name}</h1>
                  <p className="text-stone-600">
                    {portfolio.accountName} · papel {portfolio.membershipRole}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={badgeColorForFreshness(portfolio.freshness)}>{portfolio.freshness}</Badge>
                  <Badge variant={badgeColorForStatus(portfolio.status)}>{portfolio.status}</Badge>
                </div>
              </div>
            </Card>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Card>
                <span className="text-xs font-semibold uppercase text-stone-500">
                  Posições
                </span>
                <strong className="text-3xl text-stone-900">{portfolio.holdingsCount}</strong>
                <p className="text-sm text-stone-600">ativas nesta view</p>
              </Card>
              <Card>
                <span className="text-xs font-semibold uppercase text-stone-500">
                  Transações
                </span>
                <strong className="text-3xl text-stone-900">{portfolio.transactionCount}</strong>
                <p className="text-sm text-stone-600">registradas no ledger</p>
              </Card>
              <Card>
                <span className="text-xs font-semibold uppercase text-stone-500">
                  Custo
                </span>
                <strong className="text-3xl text-stone-900">
                  {formatCurrency(portfolio.totalCostBasis, portfolio.baseCurrency)}
                </strong>
                <p className="text-sm text-stone-600">base histórica agregada</p>
              </Card>
              <Card>
                <span className="text-xs font-semibold uppercase text-stone-500">
                  Estado
                </span>
                <strong className="text-lg text-stone-900">
                  {portfolio.analyticsState}/{portfolio.marketDataState}
                </strong>
                <p className="text-sm text-stone-600">analytics e market data</p>
              </Card>
            </section>

            <AnalyticsDashboard
              analytics={analytics}
              error={analyticsError}
              isLoading={isAnalyticsLoading}
              isRecomputing={isRecomputing}
              recomputeNotice={recomputeNotice}
              onRecompute={handleRecomputeAnalytics}
            />

            <ReportsAlertsNotificationsPanel
              reports={reports}
              alerts={alerts}
              notifications={notifications.filter(
                (notification) => !notification.portfolioId || notification.portfolioId === portfolioId
              )}
              reportFormat={reportFormat}
              alertTitle={alertTitle}
              alertSeverity={alertSeverity}
              realtimeStatus={realtimeStatus}
              isRequestingReport={isRequestingReport}
              isCreatingAlert={isCreatingAlert}
              reportsError={reportsError}
              alertsError={alertsError}
              notificationsError={notificationsError}
              reportNotice={reportNotice}
              alertNotice={alertNotice}
              onReportFormatChange={setReportFormat}
              onAlertTitleChange={setAlertTitle}
              onAlertSeverityChange={setAlertSeverity}
              onRequestReport={handleRequestReport}
              onRetryReport={handleRetryReport}
              onDownloadReport={handleDownloadReport}
              onCreateAlert={handleCreateAlert}
              onMarkNotificationRead={handleMarkNotificationRead}
            />

            <section className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
              <Card>
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-stone-900">Registrar transação</h2>
                  <p className="text-sm text-stone-600">Somente compra e venda nesta primeira versão do ledger.</p>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <Label htmlFor="type">Tipo</Label>
                    <Select
                      id="type"
                      className="mt-2"
                      value={form.type}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          type: event.target.value as "buy" | "sell"
                        }))
                      }
                      aria-invalid={Boolean(formErrors.type)}
                    >
                      <option value="buy">Compra</option>
                      <option value="sell">Venda</option>
                    </Select>
                    <FieldError>{formErrors.type}</FieldError>
                  </div>

                  <div>
                    <Label htmlFor="exchangeCode">Bolsa</Label>
                    <Select
                      id="exchangeCode"
                      className="mt-2"
                      value={form.exchangeCode}
                      onChange={(event) => {
                        const exchange = marketExchanges.find(
                          (entry) => entry.code === event.target.value
                        );
                        setSelectedAssetId(null);
                        setTradePrice(null);
                        setTradePriceStatus("idle");
                        setTradePriceError(null);
                        setForm((current) => ({
                          ...current,
                          exchangeCode: event.target.value,
                          assetSymbol: "",
                          assetName: "",
                          unitPrice: "",
                          currency: exchange?.currency ?? current.currency
                        }));
                      }}
                    >
                      {marketExchanges.map((exchange) => (
                        <option key={exchange.code} value={exchange.code}>
                          {exchange.code} · {exchange.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="assetSymbol">Código ou ativo</Label>
                    <Input
                      id="assetSymbol"
                      className="mt-2"
                      value={form.assetSymbol}
                      onChange={(event) =>
                        {
                          setSelectedAssetId(null);
                          setTradePrice(null);
                          setTradePriceStatus("idle");
                          setTradePriceError(null);
                          setForm((current) => ({
                            ...current,
                            assetSymbol: event.target.value,
                            assetName: "",
                            unitPrice: ""
                          }));
                        }
                      }
                      placeholder="Ex.: MSFT, Petrobras, PETR4"
                      required
                      aria-invalid={Boolean(formErrors.assetSymbol)}
                    />
                    <FieldError>{formErrors.assetSymbol}</FieldError>
                    <AssetSearchState
                      status={assetSearchStatus}
                      results={assetSearchResults}
                      message={assetSearchMessage}
                      selectedExchange={marketExchanges.find(
                        (exchange) => exchange.code === form.exchangeCode
                      )}
                      onSelect={(asset) =>
                        {
                          setSelectedAssetId(asset.id);
                          setTradePrice(null);
                          setTradePriceStatus("idle");
                          setTradePriceError(null);
                          setForm((current) => ({
                            ...current,
                            assetSymbol: asset.symbol,
                            assetName: asset.name,
                            currency: asset.latestQuote?.currency ?? asset.currency,
                            unitPrice: ""
                          }));
                        }
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="assetName">Ativo</Label>
                    <Input
                      id="assetName"
                      className="mt-2"
                      value={form.assetName}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, assetName: event.target.value }))
                      }
                      required
                      aria-invalid={Boolean(formErrors.assetName)}
                    />
                    <FieldError>{formErrors.assetName}</FieldError>
                  </div>

                  <div>
                    <Label htmlFor="tradeDate">Data</Label>
                    <Input
                      id="tradeDate"
                      className="mt-2"
                      type="date"
                      value={form.tradeDate}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, tradeDate: event.target.value }))
                      }
                      required
                      aria-invalid={Boolean(formErrors.tradeDate)}
                    />
                    <FieldError>{formErrors.tradeDate}</FieldError>
                  </div>

                  <div>
                    <Label htmlFor="quantity">Quantidade</Label>
                    <Input
                      id="quantity"
                      className="mt-2"
                      type="number"
                      min="0.00000001"
                      step="0.00000001"
                      value={form.quantity}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, quantity: event.target.value }))
                      }
                      required
                      aria-invalid={Boolean(formErrors.quantity)}
                    />
                    <FieldError>{formErrors.quantity}</FieldError>
                  </div>

                  <div>
                    <Label htmlFor="unitPrice">Preço unitário</Label>
                    <Input
                      id="unitPrice"
                      className="mt-2"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={form.unitPrice}
                      readOnly
                      required
                      aria-invalid={Boolean(formErrors.unitPrice || tradePriceStatus === "error")}
                    />
                    <FieldError>{formErrors.unitPrice}</FieldError>
                    <TradePriceState
                      status={tradePriceStatus}
                      tradePrice={tradePrice}
                      error={tradePriceError}
                    />
                  </div>

                  <div>
                    <Label htmlFor="currency">Moeda</Label>
                    <Input
                      id="currency"
                      className="mt-2"
                      value={form.currency}
                      readOnly
                      required
                      aria-invalid={Boolean(formErrors.currency)}
                    />
                    <FieldError>{formErrors.currency}</FieldError>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notas</Label>
                    <Textarea
                      id="notes"
                      className="mt-2"
                      rows={3}
                      value={form.notes}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, notes: event.target.value }))
                      }
                      aria-invalid={Boolean(formErrors.notes)}
                    />
                    <FieldError>{formErrors.notes}</FieldError>
                  </div>

                  {submitError ? <Alert variant="failure">{submitError}</Alert> : null}

                  <Button
                    type="submit"
                    disabled={isSubmitting || tradePriceStatus === "loading"}
                  >
                    {isSubmitting ? "Registrando..." : "Registrar transação"}
                  </Button>
                </form>
              </Card>

              <div className="grid gap-4">
                <Card>
                  <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-stone-900">Posições</h2>
                      <p className="text-sm text-stone-600">Reconstrução atual ou por data do ledger.</p>
                    </div>
                    <div className="w-full md:max-w-52">
                      <Label htmlFor="asOf">Data base</Label>
                      <Input
                        id="asOf"
                        className="mt-2"
                        type="date"
                        value={selectedAsOf}
                        onChange={(event) => setSelectedAsOf(event.target.value)}
                      />
                    </div>
                  </div>

                  {positions.length === 0 ? (
                    <Alert variant="warning">
                      Ainda não existem ativos abertos para a data selecionada.
                    </Alert>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead>Ativo</TableHead>
                            <TableHead>Quantidade</TableHead>
                            <TableHead>Custo médio</TableHead>
                            <TableHead>Custo total</TableHead>
                            <TableHead>Última operação</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {positions.map((position) => (
                            <TableRow key={position.assetSymbol}>
                              <TableCell className="font-medium text-stone-900">
                                {position.assetSymbol}
                              </TableCell>
                              <TableCell>{position.assetName}</TableCell>
                              <TableCell>{position.quantity}</TableCell>
                              <TableCell>
                                {formatCurrency(position.averageCost, position.currency)}
                              </TableCell>
                              <TableCell>
                                {formatCurrency(position.totalCostBasis, position.currency)}
                              </TableCell>
                              <TableCell>{position.lastTransactionDate}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </Card>

                <section className="grid gap-4 lg:grid-cols-2">
                  <Card>
                    <div>
                      <h2 className="text-xl font-semibold text-stone-900">Transações</h2>
                      <p className="text-sm text-stone-600">Histórico append-friendly do portfolio.</p>
                    </div>

                    {transactions.length === 0 ? (
                      <Alert variant="warning">
                        Registre a primeira operação para iniciar as projeções.
                      </Alert>
                    ) : (
                      <div className="divide-y divide-border rounded-lg border border-border">
                        {transactions.map((transaction) => (
                          <div key={transaction.id} className="flex items-start justify-between gap-3 p-4">
                            <div>
                              <strong className="text-stone-900">
                                {transaction.type} {transaction.assetSymbol}
                              </strong>
                              <p className="text-sm text-stone-600">
                                {transaction.assetName} · {transaction.tradeDate}
                              </p>
                              {transaction.notes ? (
                                <p className="mt-1 text-sm text-stone-500">{transaction.notes}</p>
                              ) : null}
                            </div>
                            <div className="text-right text-sm text-stone-700">
                              <div>{transaction.quantity}</div>
                              <div>{formatCurrency(transaction.totalAmount, transaction.currency)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>

                  <Card>
                    <div>
                      <h2 className="text-xl font-semibold text-stone-900">Snapshots</h2>
                      <p className="text-sm text-stone-600">Estados históricos reconstruídos por data.</p>
                    </div>

                    {snapshots.length === 0 ? (
                      <Alert variant="warning">
                        Snapshots serão gerados conforme o ledger evoluir.
                      </Alert>
                    ) : (
                      <div className="divide-y divide-border rounded-lg border border-border">
                        {snapshots.map((snapshot) => (
                          <div key={snapshot.id} className="flex items-start justify-between gap-3 p-4">
                            <div>
                              <strong className="text-stone-900">{snapshot.asOfDate}</strong>
                              <p className="text-sm text-stone-600">
                                {snapshot.positions.length} posições · {snapshot.transactionCount} transações
                              </p>
                            </div>
                            <div className="text-right text-sm text-stone-700">
                              {formatCurrency(snapshot.totalCostBasis, portfolio.baseCurrency)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </section>
              </div>
            </section>
          </>
        )}
      </main>
    </ProtectedRoute>
  );
}

function ReportsAlertsNotificationsPanel({
  reports,
  alerts,
  notifications,
  reportFormat,
  alertTitle,
  alertSeverity,
  realtimeStatus,
  isRequestingReport,
  isCreatingAlert,
  reportsError,
  alertsError,
  notificationsError,
  reportNotice,
  alertNotice,
  onReportFormatChange,
  onAlertTitleChange,
  onAlertSeverityChange,
  onRequestReport,
  onRetryReport,
  onDownloadReport,
  onCreateAlert,
  onMarkNotificationRead
}: {
  reports: PortfolioReport[];
  alerts: PortfolioAlert[];
  notifications: NotificationRecord[];
  reportFormat: ReportFormat;
  alertTitle: string;
  alertSeverity: AlertSeverity;
  realtimeStatus: RealtimeConnectionStatus;
  isRequestingReport: boolean;
  isCreatingAlert: boolean;
  reportsError: string | null;
  alertsError: string | null;
  notificationsError: string | null;
  reportNotice: string | null;
  alertNotice: string | null;
  onReportFormatChange: (format: ReportFormat) => void;
  onAlertTitleChange: (title: string) => void;
  onAlertSeverityChange: (severity: AlertSeverity) => void;
  onRequestReport: (event: FormEvent<HTMLFormElement>) => void;
  onRetryReport: (format: ReportFormat) => void;
  onDownloadReport: (report: PortfolioReport) => void;
  onCreateAlert: (event: FormEvent<HTMLFormElement>) => void;
  onMarkNotificationRead: (notification: NotificationRecord) => void;
}) {
  const unreadCount = notifications.filter((notification) => notification.status === "unread").length;

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-stone-900">Relatórios</h2>
              <p className="text-sm text-stone-600">Arquivos gerados no backend.</p>
            </div>
            <Badge variant={badgeColorForRealtime(realtimeStatus)}>{realtimeStatus}</Badge>
          </div>

          <form className="grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={onRequestReport}>
            <div>
              <Label htmlFor="reportFormat">Formato</Label>
              <Select
                id="reportFormat"
                className="mt-2"
                value={reportFormat}
                onChange={(event) => onReportFormatChange(event.target.value as ReportFormat)}
              >
                <option value="pdf">PDF</option>
                <option value="csv">CSV</option>
              </Select>
            </div>
            <Button type="submit" className="self-end" disabled={isRequestingReport}>
              {isRequestingReport ? "Enfileirando..." : "Solicitar"}
            </Button>
          </form>

          {reportsError ? <Alert variant="failure">{reportsError}</Alert> : null}
          {reportNotice ? <Alert variant="info">{reportNotice}</Alert> : null}

          {reports.length === 0 ? (
            <Alert variant="warning">Nenhum relatório solicitado para este portfolio.</Alert>
          ) : (
            <div className="divide-y divide-border rounded-lg border border-border">
              {reports.map((report) => (
                <div key={report.id} className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-sm uppercase text-stone-900">{report.format}</strong>
                      <Badge variant={badgeColorForReport(report.status)}>{report.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-stone-600">
                      {report.completedAt
                        ? `Concluído em ${formatDateTime(report.completedAt)}`
                        : `Solicitado em ${formatDateTime(report.createdAt)}`}
                    </p>
                    {report.failureCode ? (
                      <p className="mt-1 text-sm text-red-600">{report.failureCode}</p>
                    ) : null}
                  </div>
                  {report.status === "failed" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isRequestingReport}
                      onClick={() => onRetryReport(report.format)}
                    >
                      Reenfileirar
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={report.status !== "ready"}
                      onClick={() => onDownloadReport(report)}
                    >
                      Baixar
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div>
            <h2 className="text-xl font-semibold text-stone-900">Alertas</h2>
            <p className="text-sm text-stone-600">Condições operacionais monitoradas.</p>
          </div>

          <form className="space-y-3" onSubmit={onCreateAlert}>
            <div>
              <Label htmlFor="alertTitle">Título</Label>
              <Input
                id="alertTitle"
                className="mt-2"
                value={alertTitle}
                onChange={(event) => onAlertTitleChange(event.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="alertSeverity">Severidade</Label>
              <Select
                id="alertSeverity"
                className="mt-2"
                value={alertSeverity}
                onChange={(event) => onAlertSeverityChange(event.target.value as AlertSeverity)}
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
              </Select>
            </div>
            <Button type="submit" disabled={isCreatingAlert}>
              {isCreatingAlert ? "Criando..." : "Criar alerta"}
            </Button>
          </form>

          {alertsError ? <Alert variant="failure">{alertsError}</Alert> : null}
          {alertNotice ? <Alert variant="info">{alertNotice}</Alert> : null}

          {alerts.length === 0 ? (
            <Alert variant="warning">Nenhum alerta configurado.</Alert>
          ) : (
            <div className="divide-y divide-border rounded-lg border border-border">
              {alerts.map((alert) => (
                <div key={alert.id} className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={badgeColorForAlertSeverity(alert.severity)}>
                      {alert.severity}
                    </Badge>
                    <Badge variant={badgeColorForAlertStatus(alert.status)}>{alert.status}</Badge>
                  </div>
                  <strong className="mt-2 block text-stone-900">{alert.title}</strong>
                  <p className="mt-1 text-sm text-stone-600">
                    {formatAlertCondition(alert.condition)}
                  </p>
                  {alert.lastTriggeredAt ? (
                    <p className="mt-1 text-xs text-stone-500">
                      Último disparo {formatDateTime(alert.lastTriggeredAt)}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-stone-900">Notificações</h2>
            <p className="text-sm text-stone-600">Eventos persistidos pelo backend.</p>
          </div>
          <Badge variant={unreadCount > 0 ? "warning" : "success"}>{unreadCount} novas</Badge>
        </div>

        {notificationsError ? <Alert variant="failure">{notificationsError}</Alert> : null}

        {notifications.length === 0 ? (
          <Alert variant="info">Sem notificações para este portfolio.</Alert>
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border">
            {notifications.slice(0, 8).map((notification) => (
              <div key={notification.id} className="space-y-2 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={badgeColorForNotification(notification.severity)}>
                    {notification.severity}
                  </Badge>
                  <Badge variant={notification.status === "unread" ? "warning" : "success"}>
                    {notification.status}
                  </Badge>
                </div>
                <strong className="block text-sm text-stone-900">{notification.title}</strong>
                <p className="text-sm text-stone-600">{notification.body}</p>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-stone-500">
                    {formatDateTime(notification.createdAt)}
                  </span>
                  {notification.status === "unread" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onMarkNotificationRead(notification)}
                    >
                      Marcar lida
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </section>
  );
}

function AnalyticsDashboard({
  analytics,
  error,
  isLoading,
  isRecomputing,
  recomputeNotice,
  onRecompute
}: {
  analytics: PortfolioAnalyticsReadModel | null;
  error: string | null;
  isLoading: boolean;
  isRecomputing: boolean;
  recomputeNotice: string | null;
  onRecompute: () => void;
}) {
  const snapshot = analytics?.snapshot ?? analytics?.lastSuccessfulSnapshot ?? null;
  const isShowingLastSuccessful = analytics?.status === "failed" && Boolean(snapshot);

  return (
    <section className="grid gap-4">
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase text-moss">Analytics</p>
            <h2 className="text-2xl font-semibold text-stone-900">Risk engine</h2>
            <p className="text-sm text-stone-600">
              {snapshot
                ? `Snapshot ${snapshot.asOfDate} · ${formatDateTime(snapshot.generatedAt)}`
                : "Snapshot pendente"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={badgeColorForAnalyticsStatus(analytics?.status ?? "pending")}>
              {analytics?.status ?? "pending"}
            </Badge>
            <Badge variant="info">USD</Badge>
            <Button onClick={onRecompute} disabled={isRecomputing}>
              {isRecomputing ? "Enfileirando..." : "Recalcular"}
            </Button>
          </div>
        </div>
      </Card>

      {error ? <Alert variant="failure">{error}</Alert> : null}
      {recomputeNotice ? <Alert variant="info">{recomputeNotice}</Alert> : null}
      {isLoading && !snapshot ? <Alert variant="info">Carregando analytics.</Alert> : null}
      {isShowingLastSuccessful ? (
        <Alert variant="warning">
          O último snapshot bem-sucedido continua visível após a falha mais recente.
        </Alert>
      ) : null}
      {snapshot?.status === "partial" ? (
        <Alert variant="warning">
          Snapshot parcial com {snapshot.dataQuality.unavailableMetricCount} métricas indisponíveis.
        </Alert>
      ) : null}
      {!snapshot && !isLoading ? (
        <Alert variant="warning">Analytics ainda não possui snapshot calculado.</Alert>
      ) : null}

      {snapshot ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
            {metricOrder.map((key) => (
              <MetricCard key={key} metric={snapshot.metrics[key]} />
            ))}
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <BarPanel
              title="Alocação"
              emptyLabel="Sem alocação calculada."
              rows={snapshot.allocation.map((point) => ({
                label: point.symbol,
                detail: formatCurrency(point.marketValueUsd, "USD"),
                percent: point.weightPercent
              }))}
            />
            <BarPanel
              title="Setores"
              emptyLabel="Sem exposicao setorial calculada."
              rows={snapshot.sectorExposure.map((point) => ({
                label: point.sector,
                detail: formatCurrency(point.marketValueUsd, "USD"),
                percent: point.weightPercent
              }))}
            />
          </section>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <PerformancePanel snapshot={snapshot} />
            <InsightPanel snapshot={snapshot} />
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <DrawdownPanel snapshot={snapshot} />
            <CorrelationPanel snapshot={snapshot} />
          </section>

          {snapshot.dataQuality.issues.length > 0 ? (
            <Card>
              <h3 className="text-lg font-semibold text-stone-900">Qualidade dos dados</h3>
              <div className="divide-y divide-border rounded-lg border border-border">
                {snapshot.dataQuality.issues.slice(0, 6).map((issue, index) => (
                  <div key={`${issue.code}-${index}`} className="p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={issue.severity === "blocking" ? "failure" : "warning"}>
                        {issue.severity}
                      </Badge>
                      <strong className="text-sm text-stone-900">{issue.code}</strong>
                    </div>
                    <p className="mt-1 text-sm text-stone-600">{issue.message}</p>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

const metricOrder: Array<AnalyticsMetric["key"]> = [
  "totalReturn",
  "annualizedReturn",
  "maxDrawdown",
  "volatility",
  "beta",
  "sharpeRatio",
  "concentrationHhi",
  "sectorExposure",
  "assetCorrelation"
];

function MetricCard({ metric }: { metric: AnalyticsMetric }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-semibold uppercase text-stone-500">{metric.label}</span>
        <Badge variant={metric.status === "available" ? "success" : "warning"}>
          {metric.status}
        </Badge>
      </div>
      <strong className="text-2xl text-stone-900">{formatMetricValue(metric)}</strong>
      {metric.reason ? <p className="text-sm text-stone-600">{metric.reason}</p> : null}
    </Card>
  );
}

function BarPanel({
  title,
  rows,
  emptyLabel
}: {
  title: string;
  rows: Array<{ label: string; detail: string; percent: number }>;
  emptyLabel: string;
}) {
  return (
    <Card>
      <h3 className="text-lg font-semibold text-stone-900">{title}</h3>
      {rows.length === 0 ? (
        <Alert variant="warning">{emptyLabel}</Alert>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.label} className="space-y-1">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-stone-900">{row.label}</span>
                <span className="text-stone-600">
                  {row.percent.toFixed(1)}% · {row.detail}
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full bg-moss"
                  style={{ width: `${barWidth(row.percent)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function PerformancePanel({ snapshot }: { snapshot: PortfolioAnalyticsSnapshot }) {
  const latest = snapshot.performance[snapshot.performance.length - 1];

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-stone-900">Performance</h3>
        {latest ? (
          <span className="text-sm font-medium text-stone-700">
            {formatCurrency(latest.value, "USD")}
          </span>
        ) : null}
      </div>
      {snapshot.performance.length === 0 ? (
        <Alert variant="warning">Sem série histórica calculada.</Alert>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {snapshot.performance.slice(-6).map((point) => (
            <div key={point.date} className="rounded-lg border border-border p-3">
              <span className="text-xs font-semibold uppercase text-stone-500">
                {point.date}
              </span>
              <div className="mt-1 font-semibold text-stone-900">
                {formatCurrency(point.value, "USD")}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function DrawdownPanel({ snapshot }: { snapshot: PortfolioAnalyticsSnapshot }) {
  return (
    <Card>
      <h3 className="text-lg font-semibold text-stone-900">Drawdown</h3>
      {snapshot.drawdown.length === 0 ? (
        <Alert variant="warning">Sem drawdown calculado.</Alert>
      ) : (
        <div className="space-y-3">
          {snapshot.drawdown.slice(-6).map((point) => (
            <div key={point.date} className="space-y-1">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-stone-900">{point.date}</span>
                <span className="text-stone-600">{point.drawdownPercent.toFixed(2)}%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full bg-rose-500"
                  style={{ width: `${barWidth(Math.abs(point.drawdownPercent))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function CorrelationPanel({ snapshot }: { snapshot: PortfolioAnalyticsSnapshot }) {
  return (
    <Card>
      <h3 className="text-lg font-semibold text-stone-900">Correlação</h3>
      {snapshot.correlation.length === 0 ? (
        <Alert variant="warning">Sem pares suficientes para correlação.</Alert>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Par</TableHead>
                <TableHead>Coeficiente</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {snapshot.correlation.map((cell) => (
                <TableRow key={`${cell.leftSymbol}-${cell.rightSymbol}`}>
                  <TableCell className="font-medium text-stone-900">
                    {cell.leftSymbol}/{cell.rightSymbol}
                  </TableCell>
                  <TableCell>{cell.correlation.toFixed(3)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}

function InsightPanel({ snapshot }: { snapshot: PortfolioAnalyticsSnapshot }) {
  return (
    <Card>
      <h3 className="text-lg font-semibold text-stone-900">Insights explicativos</h3>
      {snapshot.insights.length === 0 ? (
        <Alert variant="info">Nenhum insight gerado para este snapshot.</Alert>
      ) : (
        <div className="space-y-3">
          {snapshot.insights.map((insight) => (
            <div key={insight.id} className="rounded-lg border border-border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={badgeColorForInsight(insight.severity)}>{insight.severity}</Badge>
                <strong className="text-sm text-stone-900">{insight.title}</strong>
              </div>
              <p className="mt-2 text-sm text-stone-600">{insight.explanation}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function AssetSearchState({
  status,
  results,
  message,
  selectedExchange,
  onSelect
}: {
  status: AssetSearchStatus;
  results: MarketAsset[];
  message: string | null;
  selectedExchange?: MarketExchange;
  onSelect: (asset: MarketAsset) => void;
}) {
  if (status === "idle") {
    return null;
  }

  if (status === "loading") {
    return (
      <p className="mt-2 text-sm text-stone-600" role="status">
        Consultando Yahoo para {selectedExchange?.code ?? "a bolsa selecionada"}...
      </p>
    );
  }

  if (status === "error") {
    return (
      <Alert variant="failure" className="mt-3">
        {message ?? "Provider indisponível. Informe o ativo manualmente."}
      </Alert>
    );
  }

  if (status === "empty") {
    return (
      <Alert variant="warning" className="mt-3">
        Nenhum ativo encontrado no Yahoo para a bolsa selecionada.
      </Alert>
    );
  }

  return (
    <div className="mt-3 space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
      {message ? <p className="px-2 text-sm text-amber-700">{message}</p> : null}
      {results.map((asset) => (
        <button
          key={asset.id}
          type="button"
          className="flex w-full items-start justify-between gap-3 rounded-md px-3 py-2 text-left hover:bg-white focus:outline-none focus:ring-2 focus:ring-moss/25"
          onClick={() => onSelect(asset)}
        >
          <span>
            <span className="block font-semibold text-stone-900">{asset.symbol}</span>
            <span className="block text-sm text-stone-600">{asset.name}</span>
            {asset.latestQuote ? (
              <span className="block text-xs text-stone-500">
                Cotação {formatCurrency(asset.latestQuote.price, asset.latestQuote.currency)}
              </span>
            ) : null}
          </span>
          <span className="shrink-0 text-xs font-semibold uppercase text-stone-500">
            {asset.exchange ?? selectedExchange?.code ?? asset.region ?? "mercado"} ·{" "}
            {asset.currency}
          </span>
        </button>
      ))}
    </div>
  );
}

function TradePriceState({
  status,
  tradePrice,
  error
}: {
  status: TradePriceStatus;
  tradePrice: TradePriceQuote | null;
  error: string | null;
}) {
  if (status === "idle") {
    return null;
  }

  if (status === "loading") {
    return (
      <p className="mt-2 text-sm text-stone-600" role="status">
        Calculando preço pelo Yahoo...
      </p>
    );
  }

  if (status === "error") {
    return <p className="mt-2 text-sm text-red-600">{error}</p>;
  }

  if (!tradePrice) {
    return null;
  }

  return (
    <p className="mt-2 text-sm text-stone-600">
      Total calculado {formatCurrency(tradePrice.totalAmount, tradePrice.currency)} ·{" "}
      {formatPriceSource(tradePrice.priceSource)} · {formatDateTime(tradePrice.asOf)}
    </p>
  );
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(value);
}

function formatPriceSource(source: TradePriceQuote["priceSource"]) {
  return source === "latest_quote" ? "cotação atual" : "fechamento histórico";
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR");
}

function formatMetricValue(metric: AnalyticsMetric) {
  if (metric.status === "unavailable" || metric.value === undefined) {
    return "Indisponível";
  }

  switch (metric.unit) {
    case "percent":
      return `${(metric.value * 100).toFixed(2)}%`;
    case "currency":
      return formatCurrency(metric.value, "USD");
    case "score":
      return metric.value.toFixed(3);
    default:
      return metric.value.toFixed(3);
  }
}

function barWidth(percent: number) {
  return Math.max(2, Math.min(100, percent));
}

function getMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.message;
  }

  return fallback;
}

interface ValidationDetails {
  fields?: Array<{
    path?: string;
    message?: string;
  }>;
}

function getFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || !error.details) {
    return {};
  }

  const details = error.details as ValidationDetails;
  return (details.fields ?? []).reduce<Record<string, string>>((fields, detail) => {
    if (detail.path && detail.message) {
      fields[detail.path] = detail.message;
    }

    return fields;
  }, {});
}

function badgeColorForFreshness(freshness: PortfolioDetail["freshness"]) {
  switch (freshness) {
    case "fresh":
      return "success";
    case "partial":
      return "warning";
    default:
      return "failure";
  }
}

function badgeColorForStatus(status: PortfolioDetail["status"]) {
  switch (status) {
    case "ready":
      return "success";
    case "syncing":
      return "warning";
    default:
      return "failure";
  }
}

function badgeColorForAnalyticsStatus(status: PortfolioAnalyticsReadModel["status"]) {
  switch (status) {
    case "complete":
      return "success";
    case "partial":
    case "pending":
      return "warning";
    default:
      return "failure";
  }
}

function badgeColorForInsight(severity: "info" | "watch" | "high") {
  switch (severity) {
    case "info":
      return "info";
    case "watch":
      return "warning";
    default:
      return "failure";
  }
}

function badgeColorForRealtime(status: RealtimeConnectionStatus) {
  switch (status) {
    case "connected":
      return "success";
    case "connecting":
      return "warning";
    default:
      return "failure";
  }
}

function badgeColorForReport(status: PortfolioReport["status"]) {
  switch (status) {
    case "ready":
      return "success";
    case "pending":
    case "running":
      return "warning";
    default:
      return "failure";
  }
}

function badgeColorForAlertSeverity(severity: AlertSeverity) {
  switch (severity) {
    case "low":
      return "info";
    case "medium":
      return "warning";
    default:
      return "failure";
  }
}

function badgeColorForAlertStatus(status: PortfolioAlert["status"]) {
  switch (status) {
    case "monitoring":
      return "info";
    case "open":
      return "warning";
    default:
      return "failure";
  }
}

function badgeColorForNotification(severity: NotificationRecord["severity"]) {
  switch (severity) {
    case "info":
    case "low":
      return "info";
    case "medium":
      return "warning";
    default:
      return "failure";
  }
}

function formatAlertCondition(condition: PortfolioAlert["condition"]) {
  if (condition.eventType === "metric_threshold") {
    const operator = condition.operator === "lte" ? "menor ou igual" : "maior ou igual";
    return `${condition.metricKey} ${operator} ${condition.threshold}`;
  }

  switch (condition.eventType) {
    case "analytics.updated":
      return "Dispara quando analytics é atualizado.";
    case "market_data.updated":
      return "Dispara quando market data é atualizado.";
    default:
      return "Dispara quando relatório é gerado.";
  }
}
