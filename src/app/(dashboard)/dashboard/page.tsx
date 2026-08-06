"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppHeader } from "../../../components/layout/AppHeader";
import { Alert } from "../../../components/ui/alert";
import { Badge } from "../../../components/ui/badge";
import { Button, LinkButton } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { FieldError, Label } from "../../../components/ui/form";
import { Input } from "../../../components/ui/input";
import { Select } from "../../../components/ui/select";
import { Skeleton } from "../../../components/ui/skeleton";
import { Textarea } from "../../../components/ui/textarea";
import { ProtectedRoute } from "../../../features/auth/ProtectedRoute";
import { useAuth } from "../../../features/auth/AuthProvider";
import { LogoutButton } from "../../../features/auth/LogoutButton";
import {
  convertCurrency,
  createPortfolio,
  listPortfolios
} from "../../../features/portfolio/portfolioApi";
import {
  CurrencyConversion,
  PortfolioListItem
} from "../../../features/portfolio/types";
import { ApiError } from "../../../lib/api/client";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getApiErrorMessage,
  labelAccountRole,
  labelPortfolioFreshness,
  labelPortfolioStatus,
  labelProcessingState,
  labelUserRole,
  portfolioFreshnessVariant,
  portfolioStatusVariant,
  processingStateVariant
} from "../../../lib/presentation";
import { UserRole } from "../../../features/auth/types";

interface CreatePortfolioFormState {
  accountId: string;
  name: string;
  description: string;
  baseCurrency: string;
}

const DASHBOARD_ROLES: UserRole[] = ["admin", "analyst", "user"];
const COMMON_CURRENCIES = ["USD", "BRL", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "MXN"];

export default function DashboardPage() {
  const { actor, status } = useAuth();
  const [portfolios, setPortfolios] = useState<PortfolioListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const memberships = useMemo(() => actor?.accountMemberships ?? [], [actor]);
  const [form, setForm] = useState<CreatePortfolioFormState>({
    accountId: "",
    name: "",
    description: "",
    baseCurrency: "USD"
  });

  useEffect(() => {
    const firstAccountId = memberships[0]?.accountId ?? "";

    setForm((current) => {
      if (memberships.some((membership) => membership.accountId === current.accountId)) {
        return current;
      }

      if (!firstAccountId && !current.accountId) {
        return current;
      }

      return {
        ...current,
        accountId: firstAccountId
      };
    });
  }, [memberships]);

  useEffect(() => {
    if (status !== "authenticated") {
      setPortfolios([]);
      setError(null);
      setIsLoading(status === "loading");
      return;
    }

    let isActive = true;

    setIsLoading(true);
    setError(null);

    listPortfolios()
      .then((data) => {
        if (isActive) {
          setPortfolios(data.portfolios);
        }
      })
      .catch((requestError: unknown) => {
        if (isActive) {
          setError(getApiErrorMessage(requestError, "Não foi possível carregar os portfólios."));
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
  }, [actor?.id, status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setFormErrors({});
    setIsSubmitting(true);

    try {
      const created = await createPortfolio({
        accountId: form.accountId,
        name: form.name,
        description: form.description,
        baseCurrency: form.baseCurrency
      });
      setPortfolios((current) => [created, ...current]);
      setForm((current) => ({
        ...current,
        name: "",
        description: ""
      }));
    } catch (requestError) {
      setFormErrors(getFieldErrors(requestError));
      setSubmitError(getApiErrorMessage(requestError, "Não foi possível criar o portfólio."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ProtectedRoute roles={DASHBOARD_ROLES}>
      <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-5 lg:px-6">
        <AppHeader
          title="Análises de portfólio"
          active="dashboard"
          showAdmin={actor?.role === "admin"}
          actions={<LogoutButton />}
        />

        <section className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_320px_360px]">
          <Card className="h-fit">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-moss">
                  Portfólios
                </p>
                <h1 className="text-3xl font-semibold text-stone-900">{actor?.name}</h1>
                <p className="text-stone-600">
                  {actor?.email} · perfil {actor ? labelUserRole(actor.role) : "não informado"}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1 rounded-lg border border-border bg-muted/40 p-4">
                  <span className="text-xs font-semibold uppercase text-stone-500">
                    Portfólios
                  </span>
                  <strong className="block text-3xl leading-tight text-stone-900">
                    {portfolios.length}
                  </strong>
                  <p className="text-sm text-stone-600">visíveis nesta sessão</p>
                </div>
                <div className="grid gap-1 rounded-lg border border-border bg-muted/40 p-4">
                  <span className="text-xs font-semibold uppercase text-stone-500">
                    Contas
                  </span>
                  <strong className="block text-3xl leading-tight text-stone-900">
                    {memberships.length}
                  </strong>
                  <p className="text-sm text-stone-600">habilitadas para leitura</p>
                </div>
              </div>
            </div>
          </Card>

          <CurrencyConverterCard />

          <Card className="h-fit">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-stone-900">Criar portfólio</h2>
              <p className="text-sm text-stone-600">
                Novos portfólios entram com histórico vazio e aguardam as primeiras posições.
              </p>
            </div>

            {memberships.length === 0 ? (
              <Alert variant="info">
                Sua sessão não possui conta vinculada para criar portfólios.
              </Alert>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <Label htmlFor="accountId">Conta</Label>
                  <Select
                    id="accountId"
                    className="mt-2"
                    value={form.accountId}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, accountId: event.target.value }))
                    }
                    aria-invalid={Boolean(formErrors.accountId)}
                  >
                    {memberships.map((membership) => (
                      <option key={membership.accountId} value={membership.accountId}>
                        {membership.accountName} · {labelAccountRole(membership.role)}
                      </option>
                    ))}
                  </Select>
                  <FieldError>{formErrors.accountId}</FieldError>
                </div>

                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    autoComplete="off"
                    className="mt-2"
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, name: event.target.value }))
                    }
                    placeholder="Ex.: Dividendos Brasil"
                    required
                    aria-invalid={Boolean(formErrors.name)}
                  />
                  <FieldError>{formErrors.name}</FieldError>
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    autoComplete="off"
                    className="mt-2"
                    rows={4}
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, description: event.target.value }))
                    }
                    placeholder="Mandato, horizonte e observações operacionais."
                    aria-invalid={Boolean(formErrors.description)}
                  />
                  <FieldError>{formErrors.description}</FieldError>
                </div>

                <div>
                  <Label htmlFor="baseCurrency">Moeda base</Label>
                  <Select
                    id="baseCurrency"
                    className="mt-2"
                    value={form.baseCurrency}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        baseCurrency: event.target.value
                      }))
                    }
                    required
                    aria-invalid={Boolean(formErrors.baseCurrency)}
                  >
                    {COMMON_CURRENCIES.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </Select>
                  <FieldError>{formErrors.baseCurrency}</FieldError>
                </div>

                {submitError ? <Alert variant="failure">{submitError}</Alert> : null}

                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Criando..." : "Criar portfólio"}
                </Button>
              </form>
            )}
          </Card>
        </section>

        {isLoading ? (
          <Alert variant="info">Buscando histórico, estados de análise e transações.</Alert>
        ) : error ? (
          <Alert variant="failure">{error}</Alert>
        ) : portfolios.length === 0 ? (
          <Alert variant="warning">
            {memberships.length === 0
              ? "Nenhum portfólio está disponível porque sua sessão não possui contas vinculadas."
              : "Crie o primeiro portfólio para iniciar o histórico e as projeções de posições."}
          </Alert>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {portfolios.map((portfolio) => (
              <Card
                key={portfolio.id}
                className="transition-transform hover:-translate-y-1"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold text-stone-900">{portfolio.name}</h2>
                      <p className="text-sm text-stone-600">
                        {portfolio.accountName} · perfil {labelAccountRole(portfolio.membershipRole)}
                      </p>
                    </div>
                    <Badge variant={portfolioFreshnessVariant(portfolio.freshness)}>
                      {labelPortfolioFreshness(portfolio.freshness)}
                    </Badge>
                  </div>

                  {portfolio.description ? (
                    <p className="text-sm text-stone-600">{portfolio.description}</p>
                  ) : null}

                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-xs font-semibold uppercase text-stone-500">
                        Posições
                      </dt>
                      <dd className="mt-1 text-stone-900">{portfolio.holdingsCount}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase text-stone-500">
                        Transações
                      </dt>
                      <dd className="mt-1 text-stone-900">{portfolio.transactionCount}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase text-stone-500">
                        Custo
                      </dt>
                      <dd className="mt-1 text-stone-900">
                        {formatCurrency(portfolio.totalCostBasis, portfolio.baseCurrency)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase text-stone-500">
                        Última transação
                      </dt>
                      <dd className="mt-1 text-stone-900">
                        {portfolio.lastTransactionDate
                          ? formatDate(portfolio.lastTransactionDate)
                          : "sem transações"}
                      </dd>
                    </div>
                  </dl>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={portfolioStatusVariant(portfolio.status)}>
                      {labelPortfolioStatus(portfolio.status)}
                    </Badge>
                    <Badge variant={processingStateVariant(portfolio.analyticsState)}>
                      análises {labelProcessingState(portfolio.analyticsState)}
                    </Badge>
                    <Badge variant={processingStateVariant(portfolio.marketDataState)}>
                      dados de mercado {labelProcessingState(portfolio.marketDataState)}
                    </Badge>
                  </div>

                  <LinkButton href={`/dashboard/portfolios/${portfolio.id}`} className="w-fit">
                    Abrir portfólio
                  </LinkButton>
                </div>
              </Card>
            ))}
          </section>
        )}
      </main>
    </ProtectedRoute>
  );
}

function CurrencyConverterCard() {
  const [targetCurrency, setTargetCurrency] = useState("BRL");
  const [amount, setAmount] = useState("1");
  const [conversion, setConversion] = useState<CurrencyConversion | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmedAmount = amount.trim();
    if (!targetCurrency || trimmedAmount.length === 0) {
      setConversion(null);
      setStatus("idle");
      setError(null);
      return;
    }

    const numericAmount = Number(trimmedAmount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setConversion(null);
      setStatus("error");
      setError("Informe um valor positivo para converter.");
      return;
    }

    let isActive = true;
    setConversion(null);
    setStatus("loading");
    setError(null);

    const timeoutId = window.setTimeout(() => {
      convertCurrency({ from: "USD", to: targetCurrency, amount: numericAmount })
        .then((response) => {
          if (!isActive) {
            return;
          }

          setConversion(response.data.conversion);
          setStatus("success");
        })
        .catch((requestError: unknown) => {
          if (!isActive) {
            return;
          }

          setConversion(null);
          setStatus("error");
          setError(getApiErrorMessage(requestError, "Não foi possível converter a moeda."));
        });
    }, 250);

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, [amount, targetCurrency]);

  return (
    <Card className="h-fit">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase text-moss">
          {conversion?.sourceType === "live" && conversion.freshness === "fresh"
            ? "Dólar agora"
            : conversion
              ? "Câmbio de referência"
              : "Conversão de moeda"}
        </p>
        <div className="min-h-9" aria-live="polite">
          {status === "loading" ? (
            <Skeleton className="h-8 w-36" aria-label="Carregando cotação" />
          ) : conversion ? (
            <strong className="block text-xl font-semibold text-stone-900">
              {formatCurrency(conversion.convertedAmount, conversion.to)}
            </strong>
          ) : (
            <span className="block text-base font-medium text-stone-500">
              Cotação indisponível
            </span>
          )}
        </div>
        <p className="text-sm text-stone-600">
          {status === "loading"
            ? "Carregando cotação..."
            : status === "error"
              ? "Revise o valor ou tente novamente."
            : conversion
              ? `${formatCurrency(conversion.amount, "USD")} · ${currencyProviderLabel(conversion.providerName)}`
              : "Informe valor e moeda para consultar."}
        </p>
      </div>

      <div className="grid grid-cols-[1fr_110px] gap-3">
        <div>
          <Label htmlFor="usdAmount">USD</Label>
          <Input
            id="usdAmount"
            className="mt-2"
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="targetCurrency">Moeda</Label>
          <Select
            id="targetCurrency"
            className="mt-2"
            value={targetCurrency}
            onChange={(event) => setTargetCurrency(event.target.value)}
          >
            {COMMON_CURRENCIES.filter((currency) => currency !== "USD").map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {conversion ? (
        <div className="space-y-1 text-xs text-stone-500">
          <p>
            Fonte: {currencyProviderLabel(conversion.providerName)} · {currencySourceLabel(conversion)}
          </p>
          <p>Cotação da fonte: {formatDateTime(conversion.asOf)}</p>
          <p>Consulta da plataforma: {formatDateTime(conversion.updatedAt)}</p>
        </div>
      ) : null}
      {status === "error" ? <Alert variant="failure">{error}</Alert> : null}
    </Card>
  );
}

function currencyProviderLabel(providerName: string): string {
  const labels: Record<string, string> = {
    yahoo: "Yahoo Finance",
    "open.er-api": "Open ER API",
    "local-seeded-market-data": "Dados determinísticos de QA"
  };
  return labels[providerName] ?? providerName;
}

function currencySourceLabel(conversion: CurrencyConversion): string {
  if (conversion.sourceType === "deterministic") {
    return "ambiente de QA, sem cotação ao vivo";
  }
  if (conversion.sourceType === "fallback") {
    return "fonte alternativa";
  }
  return conversion.freshness === "fresh"
    ? "fonte principal atualizada"
    : conversion.freshness === "partial"
      ? "cotação com atraso"
      : `cotação desatualizada desde ${formatDate(conversion.asOf)}`;
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
