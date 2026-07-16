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
          setError(getMessage(requestError, "Não foi possível carregar os portfolios."));
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
      setSubmitError(getMessage(requestError, "Não foi possível criar o portfolio."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ProtectedRoute roles={DASHBOARD_ROLES}>
      <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-5 lg:px-6">
        <AppHeader
          title="Portfolio analytics"
          active="dashboard"
          showAdmin={actor?.role === "admin"}
          actions={<LogoutButton />}
        />

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_320px_360px]">
          <Card>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-moss">
                  Portfolio ledger
                </p>
                <h1 className="text-3xl font-semibold text-stone-900">{actor?.name}</h1>
                <p className="text-stone-600">
                  {actor?.email} · papel {actor?.role}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-muted/40 p-4">
                  <span className="text-xs font-semibold uppercase text-stone-500">
                    Portfolios
                  </span>
                  <strong className="text-3xl text-stone-900">{portfolios.length}</strong>
                  <p className="text-sm text-stone-600">visíveis nesta sessão</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/40 p-4">
                  <span className="text-xs font-semibold uppercase text-stone-500">
                    Contas
                  </span>
                  <strong className="text-3xl text-stone-900">{memberships.length}</strong>
                  <p className="text-sm text-stone-600">habilitadas para leitura</p>
                </div>
              </div>
            </div>
          </Card>

          <CurrencyConverterCard />

          <Card>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-stone-900">Criar portfolio</h2>
              <p className="text-sm text-stone-600">
                Novos portfolios entram com ledger vazio e snapshots prontos.
              </p>
            </div>

            {memberships.length === 0 ? (
              <Alert variant="info">
                A sessão atual não possui memberships para provisionar um portfolio.
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
                        {membership.accountName} · {membership.role}
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
                  {isSubmitting ? "Criando..." : "Criar portfolio"}
                </Button>
              </form>
            )}
          </Card>
        </section>

        {isLoading ? (
          <Alert variant="info">Buscando ledger, estados de analytics e histórico de transações.</Alert>
        ) : error ? (
          <Alert variant="failure">{error}</Alert>
        ) : portfolios.length === 0 ? (
          <Alert variant="warning">
            Crie o primeiro portfolio para iniciar o ledger e as projeções de posições.
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
                        {portfolio.accountName} · papel {portfolio.membershipRole}
                      </p>
                    </div>
                    <Badge variant={badgeColorForFreshness(portfolio.freshness)}>{portfolio.freshness}</Badge>
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
                        Ultimo trade
                      </dt>
                      <dd className="mt-1 text-stone-900">{portfolio.lastTransactionDate ?? "sem trades"}</dd>
                    </div>
                  </dl>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={badgeColorForStatus(portfolio.status)}>{portfolio.status}</Badge>
                    <Badge variant={portfolio.analyticsState === "pending" ? "warning" : "success"}>
                      analytics {portfolio.analyticsState}
                    </Badge>
                    <Badge variant={portfolio.marketDataState === "pending" ? "warning" : "success"}>
                      market data {portfolio.marketDataState}
                    </Badge>
                  </div>

                  <LinkButton href={`/dashboard/portfolios/${portfolio.id}`} className="w-fit">
                    Abrir portfolio
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
          setError(getMessage(requestError, "Não foi possível converter a moeda."));
        });
    }, 250);

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, [amount, targetCurrency]);

  return (
    <Card>
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase text-moss">Dólar agora</p>
        <h2 className="text-xl font-semibold text-stone-900">
          {conversion
            ? formatCurrency(conversion.convertedAmount, conversion.to)
            : formatCurrency(0, targetCurrency)}
        </h2>
        <p className="text-sm text-stone-600">
          {status === "loading"
            ? "Atualizando..."
            : conversion
              ? `${formatCurrency(conversion.amount, "USD")} via ${conversion.providerName}`
              : "USD"}
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
        <p className="text-xs text-stone-500">
          Cotação {new Date(conversion.asOf).toLocaleString("pt-BR")}
        </p>
      ) : null}
      {status === "error" ? <Alert variant="failure">{error}</Alert> : null}
    </Card>
  );
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(value);
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

function badgeColorForFreshness(freshness: PortfolioListItem["freshness"]) {
  switch (freshness) {
    case "fresh":
      return "success";
    case "partial":
      return "warning";
    default:
      return "failure";
  }
}

function badgeColorForStatus(status: PortfolioListItem["status"]) {
  switch (status) {
    case "ready":
      return "success";
    case "syncing":
      return "warning";
    default:
      return "failure";
  }
}
