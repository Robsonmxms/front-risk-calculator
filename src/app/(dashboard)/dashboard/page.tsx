"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Label,
  Navbar,
  NavbarBrand,
  NavbarCollapse,
  NavbarLink,
  Select,
  TextInput,
  Textarea
} from "flowbite-react";
import { ProtectedRoute } from "../../../features/auth/ProtectedRoute";
import { useAuth } from "../../../features/auth/AuthProvider";
import { LogoutButton } from "../../../features/auth/LogoutButton";
import { createPortfolio, listPortfolios } from "../../../features/portfolio/portfolioApi";
import { PortfolioListItem } from "../../../features/portfolio/types";
import { ApiError } from "../../../lib/api/client";

interface CreatePortfolioFormState {
  accountId: string;
  name: string;
  description: string;
  baseCurrency: string;
}

export default function DashboardPage() {
  const { actor } = useAuth();
  const [portfolios, setPortfolios] = useState<PortfolioListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const memberships = actor?.accountMemberships ?? [];
  const [form, setForm] = useState<CreatePortfolioFormState>({
    accountId: memberships[0]?.accountId ?? "",
    name: "",
    description: "",
    baseCurrency: "USD"
  });

  useEffect(() => {
    setForm((current) => ({
      ...current,
      accountId: current.accountId || memberships[0]?.accountId || ""
    }));
  }, [memberships]);

  useEffect(() => {
    let isActive = true;

    listPortfolios()
      .then((data) => {
        if (isActive) {
          setPortfolios(data.portfolios);
        }
      })
      .catch((requestError: unknown) => {
        if (isActive) {
          setError(getMessage(requestError, "Nao foi possivel carregar os portfolios."));
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
  }, []);

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
      setSubmitError(getMessage(requestError, "Nao foi possivel criar o portfolio."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ProtectedRoute roles={["admin", "analyst", "user"]}>
      <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-5 lg:px-6">
        <Navbar fluid rounded className="border border-gray-200 bg-white/95 shadow-sm">
          <NavbarBrand as={Link} href="/dashboard">
            <div>
              <span className="block text-xs font-semibold uppercase text-teal-700">
                Risk Calculator
              </span>
              <span className="block text-lg font-semibold text-stone-900">Portfolio analytics</span>
            </div>
          </NavbarBrand>
          <div className="flex items-center gap-3">
            <NavbarCollapse className="hidden md:flex">
              <NavbarLink as={Link} href="/dashboard" active>
                Dashboard
              </NavbarLink>
              {actor?.role === "admin" ? (
                <NavbarLink as={Link} href="/admin">
                  Admin
                </NavbarLink>
              ) : null}
            </NavbarCollapse>
            <LogoutButton />
          </div>
        </Navbar>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,360px)]">
          <Card className="border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase text-teal-700">
                  Portfolio ledger
                </p>
                <h1 className="text-3xl font-semibold text-stone-900">{actor?.name}</h1>
                <p className="text-stone-600">
                  {actor?.email} · papel {actor?.role}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <span className="text-xs font-semibold uppercase text-stone-500">
                    Portfolios
                  </span>
                  <strong className="text-3xl text-stone-900">{portfolios.length}</strong>
                  <p className="text-sm text-stone-600">visiveis nesta sessao</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <span className="text-xs font-semibold uppercase text-stone-500">
                    Contas
                  </span>
                  <strong className="text-3xl text-stone-900">{memberships.length}</strong>
                  <p className="text-sm text-stone-600">habilitadas para leitura</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-gray-200 bg-white shadow-sm">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-stone-900">Criar portfolio</h2>
              <p className="text-sm text-stone-600">
                Novos portfolios entram com ledger vazio e snapshots prontos.
              </p>
            </div>

            {memberships.length === 0 ? (
              <Alert color="info">
                A sessao atual nao possui memberships para provisionar um portfolio.
              </Alert>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <Label htmlFor="accountId">Conta</Label>
                  <Select
                    id="accountId"
                    className="mt-2"
                    color={formErrors.accountId ? "failure" : "gray"}
                    value={form.accountId}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, accountId: event.target.value }))
                    }
                  >
                    {memberships.map((membership) => (
                      <option key={membership.accountId} value={membership.accountId}>
                        {membership.accountName} · {membership.role}
                      </option>
                    ))}
                  </Select>
                  {formErrors.accountId ? (
                    <p className="mt-1 text-sm text-red-600">{formErrors.accountId}</p>
                  ) : null}
                </div>

                <div>
                  <Label htmlFor="name">Nome</Label>
                  <TextInput
                    id="name"
                    className="mt-2"
                    color={formErrors.name ? "failure" : "gray"}
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, name: event.target.value }))
                    }
                    placeholder="Ex.: Dividendos Brasil"
                    required
                  />
                  {formErrors.name ? (
                    <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                  ) : null}
                </div>

                <div>
                  <Label htmlFor="description">Descricao</Label>
                  <Textarea
                    id="description"
                    className="mt-2"
                    color={formErrors.description ? "failure" : "gray"}
                    rows={4}
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, description: event.target.value }))
                    }
                    placeholder="Mandato, horizonte e observacoes operacionais."
                  />
                  {formErrors.description ? (
                    <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>
                  ) : null}
                </div>

                <div>
                  <Label htmlFor="baseCurrency">Moeda base</Label>
                  <TextInput
                    id="baseCurrency"
                    className="mt-2"
                    color={formErrors.baseCurrency ? "failure" : "gray"}
                    value={form.baseCurrency}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        baseCurrency: event.target.value.toUpperCase()
                      }))
                    }
                    maxLength={3}
                    required
                  />
                  {formErrors.baseCurrency ? (
                    <p className="mt-1 text-sm text-red-600">{formErrors.baseCurrency}</p>
                  ) : null}
                </div>

                {submitError ? <Alert color="failure">{submitError}</Alert> : null}

                <Button color="teal" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Criando..." : "Criar portfolio"}
                </Button>
              </form>
            )}
          </Card>
        </section>

        {isLoading ? (
          <Alert color="info">Buscando ledger, estados de analytics e historico de transacoes.</Alert>
        ) : error ? (
          <Alert color="failure">{error}</Alert>
        ) : portfolios.length === 0 ? (
          <Alert color="warning">
            Crie o primeiro portfolio para iniciar o ledger e as projecoes de positions.
          </Alert>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {portfolios.map((portfolio) => (
              <Card
                key={portfolio.id}
                className="border-gray-200 bg-white shadow-sm transition-transform hover:-translate-y-1"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold text-stone-900">{portfolio.name}</h2>
                      <p className="text-sm text-stone-600">
                        {portfolio.accountName} · papel {portfolio.membershipRole}
                      </p>
                    </div>
                    <Badge color={badgeColorForFreshness(portfolio.freshness)}>{portfolio.freshness}</Badge>
                  </div>

                  {portfolio.description ? (
                    <p className="text-sm text-stone-600">{portfolio.description}</p>
                  ) : null}

                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-xs font-semibold uppercase text-stone-500">
                        Posicoes
                      </dt>
                      <dd className="mt-1 text-stone-900">{portfolio.holdingsCount}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase text-stone-500">
                        Transacoes
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
                    <Badge color={badgeColorForStatus(portfolio.status)}>{portfolio.status}</Badge>
                    <Badge color={portfolio.analyticsState === "pending" ? "warning" : "success"}>
                      analytics {portfolio.analyticsState}
                    </Badge>
                    <Badge color={portfolio.marketDataState === "pending" ? "warning" : "success"}>
                      market data {portfolio.marketDataState}
                    </Badge>
                  </div>

                  <Button as={Link} href={`/dashboard/portfolios/${portfolio.id}`} color="teal">
                    Abrir portfolio
                  </Button>
                </div>
              </Card>
            ))}
          </section>
        )}
      </main>
    </ProtectedRoute>
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
