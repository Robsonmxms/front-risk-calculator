"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  TextInput,
  Textarea
} from "flowbite-react";
import { ProtectedRoute } from "../../../../../features/auth/ProtectedRoute";
import { useAuth } from "../../../../../features/auth/AuthProvider";
import { LogoutButton } from "../../../../../features/auth/LogoutButton";
import {
  createPortfolioTransaction,
  getPortfolio,
  listPortfolioPositions,
  listPortfolioSnapshots,
  listPortfolioTransactions
} from "../../../../../features/portfolio/portfolioApi";
import {
  PortfolioDetail,
  PortfolioPosition,
  PortfolioSnapshot,
  PortfolioTransaction
} from "../../../../../features/portfolio/types";
import { ApiError } from "../../../../../lib/api/client";

interface TransactionFormState {
  assetSymbol: string;
  assetName: string;
  tradeDate: string;
  type: "buy" | "sell";
  quantity: string;
  unitPrice: string;
  currency: string;
  notes: string;
}

export default function PortfolioDetailPage() {
  const { actor } = useAuth();
  const routeParams = useParams<{ portfolioId: string }>();
  const portfolioId = routeParams.portfolioId;
  const [portfolio, setPortfolio] = useState<PortfolioDetail | null>(null);
  const [positions, setPositions] = useState<PortfolioPosition[]>([]);
  const [transactions, setTransactions] = useState<PortfolioTransaction[]>([]);
  const [snapshots, setSnapshots] = useState<PortfolioSnapshot[]>([]);
  const [selectedAsOf, setSelectedAsOf] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<TransactionFormState>({
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
      listPortfolioSnapshots(portfolioId)
    ])
      .then(([portfolioData, positionsData, transactionsData, snapshotsData]) => {
        if (!isActive) {
          return;
        }

        setPortfolio(portfolioData);
        setPositions(positionsData.positions);
        setTransactions(transactionsData.transactions);
        setSnapshots(snapshotsData.snapshots);
      })
      .catch((requestError: unknown) => {
        if (isActive) {
          setError(getMessage(requestError, "Nao foi possivel carregar o detalhe do portfolio."));
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!portfolioId) {
      return;
    }

    setSubmitError(null);
    setFormErrors({});
    setIsSubmitting(true);

    try {
      await createPortfolioTransaction(portfolioId, {
        assetSymbol: form.assetSymbol,
        assetName: form.assetName,
        tradeDate: form.tradeDate,
        type: form.type,
        quantity: Number(form.quantity),
        unitPrice: Number(form.unitPrice),
        currency: form.currency,
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
      setForm({
        assetSymbol: "",
        assetName: "",
        tradeDate: new Date().toISOString().slice(0, 10),
        type: "buy",
        quantity: "",
        unitPrice: "",
        currency: portfolioData.baseCurrency,
        notes: ""
      });
    } catch (requestError) {
      setFormErrors(getFieldErrors(requestError));
      setSubmitError(getMessage(requestError, "Nao foi possivel registrar a transacao."));
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
              <span className="block text-lg font-semibold text-stone-900">Portfolio ledger</span>
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

        <Button as={Link} href="/dashboard" color="light" className="w-fit">
          Voltar para portfolios
        </Button>

        {isLoading ? (
          <Alert color="info">Montando portfolio, posicoes, transacoes e snapshots.</Alert>
        ) : error || !portfolio ? (
          <Alert color="failure">{error ?? "Portfolio nao encontrado."}</Alert>
        ) : (
          <>
            {portfolio.warnings.length > 0 ? (
              <Alert color={portfolio.freshness === "partial" ? "warning" : "failure"}>
                {portfolio.warnings[0]}
              </Alert>
            ) : null}

            <Card className="border-gray-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase text-teal-700">
                    Portfolio detail
                  </p>
                  <h1 className="text-3xl font-semibold text-stone-900">{portfolio.name}</h1>
                  <p className="text-stone-600">
                    {portfolio.accountName} · papel {portfolio.membershipRole}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge color={badgeColorForFreshness(portfolio.freshness)}>{portfolio.freshness}</Badge>
                  <Badge color={badgeColorForStatus(portfolio.status)}>{portfolio.status}</Badge>
                </div>
              </div>
            </Card>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Card>
                <span className="text-xs font-semibold uppercase text-stone-500">
                  Posicoes
                </span>
                <strong className="text-3xl text-stone-900">{portfolio.holdingsCount}</strong>
                <p className="text-sm text-stone-600">ativas nesta view</p>
              </Card>
              <Card>
                <span className="text-xs font-semibold uppercase text-stone-500">
                  Transacoes
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
                <p className="text-sm text-stone-600">base historica agregada</p>
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

            <section className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
              <Card className="border-gray-200 bg-white shadow-sm">
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-stone-900">Registrar transacao</h2>
                  <p className="text-sm text-stone-600">Somente compra e venda nesta primeira versao do ledger.</p>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <Label htmlFor="type">Tipo</Label>
                    <Select
                      id="type"
                      className="mt-2"
                      color={formErrors.type ? "failure" : "gray"}
                      value={form.type}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          type: event.target.value as "buy" | "sell"
                        }))
                      }
                    >
                      <option value="buy">Compra</option>
                      <option value="sell">Venda</option>
                    </Select>
                    {formErrors.type ? (
                      <p className="mt-1 text-sm text-red-600">{formErrors.type}</p>
                    ) : null}
                  </div>

                  <div>
                    <Label htmlFor="assetSymbol">Codigo</Label>
                    <TextInput
                      id="assetSymbol"
                      className="mt-2"
                      color={formErrors.assetSymbol ? "failure" : "gray"}
                      value={form.assetSymbol}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          assetSymbol: event.target.value.toUpperCase()
                        }))
                      }
                      required
                    />
                    {formErrors.assetSymbol ? (
                      <p className="mt-1 text-sm text-red-600">{formErrors.assetSymbol}</p>
                    ) : null}
                  </div>

                  <div>
                    <Label htmlFor="assetName">Ativo</Label>
                    <TextInput
                      id="assetName"
                      className="mt-2"
                      color={formErrors.assetName ? "failure" : "gray"}
                      value={form.assetName}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, assetName: event.target.value }))
                      }
                      required
                    />
                    {formErrors.assetName ? (
                      <p className="mt-1 text-sm text-red-600">{formErrors.assetName}</p>
                    ) : null}
                  </div>

                  <div>
                    <Label htmlFor="tradeDate">Data</Label>
                    <TextInput
                      id="tradeDate"
                      className="mt-2"
                      color={formErrors.tradeDate ? "failure" : "gray"}
                      type="date"
                      value={form.tradeDate}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, tradeDate: event.target.value }))
                      }
                      required
                    />
                    {formErrors.tradeDate ? (
                      <p className="mt-1 text-sm text-red-600">{formErrors.tradeDate}</p>
                    ) : null}
                  </div>

                  <div>
                    <Label htmlFor="quantity">Quantidade</Label>
                    <TextInput
                      id="quantity"
                      className="mt-2"
                      color={formErrors.quantity ? "failure" : "gray"}
                      type="number"
                      min="0.00000001"
                      step="0.00000001"
                      value={form.quantity}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, quantity: event.target.value }))
                      }
                      required
                    />
                    {formErrors.quantity ? (
                      <p className="mt-1 text-sm text-red-600">{formErrors.quantity}</p>
                    ) : null}
                  </div>

                  <div>
                    <Label htmlFor="unitPrice">Preco unitario</Label>
                    <TextInput
                      id="unitPrice"
                      className="mt-2"
                      color={formErrors.unitPrice ? "failure" : "gray"}
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={form.unitPrice}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, unitPrice: event.target.value }))
                      }
                      required
                    />
                    {formErrors.unitPrice ? (
                      <p className="mt-1 text-sm text-red-600">{formErrors.unitPrice}</p>
                    ) : null}
                  </div>

                  <div>
                    <Label htmlFor="currency">Moeda</Label>
                    <TextInput
                      id="currency"
                      className="mt-2"
                      color={formErrors.currency ? "failure" : "gray"}
                      value={form.currency}
                      maxLength={3}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          currency: event.target.value.toUpperCase()
                        }))
                      }
                      required
                    />
                    {formErrors.currency ? (
                      <p className="mt-1 text-sm text-red-600">{formErrors.currency}</p>
                    ) : null}
                  </div>

                  <div>
                    <Label htmlFor="notes">Notas</Label>
                    <Textarea
                      id="notes"
                      className="mt-2"
                      color={formErrors.notes ? "failure" : "gray"}
                      rows={3}
                      value={form.notes}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, notes: event.target.value }))
                      }
                    />
                    {formErrors.notes ? (
                      <p className="mt-1 text-sm text-red-600">{formErrors.notes}</p>
                    ) : null}
                  </div>

                  {submitError ? <Alert color="failure">{submitError}</Alert> : null}

                  <Button color="teal" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Registrando..." : "Registrar transacao"}
                  </Button>
                </form>
              </Card>

              <div className="grid gap-4">
                <Card className="border-gray-200 bg-white shadow-sm">
                  <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-stone-900">Posicoes</h2>
                      <p className="text-sm text-stone-600">Reconstrucao atual ou por data do ledger.</p>
                    </div>
                    <div className="w-full md:max-w-52">
                      <Label htmlFor="asOf">Data base</Label>
                      <TextInput
                        id="asOf"
                        className="mt-2"
                        type="date"
                        value={selectedAsOf}
                        onChange={(event) => setSelectedAsOf(event.target.value)}
                      />
                    </div>
                  </div>

                  {positions.length === 0 ? (
                    <Alert color="warning">
                      Ainda nao existem ativos abertos para a data selecionada.
                    </Alert>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table hoverable>
                        <TableHead>
                          <TableHeadCell>Codigo</TableHeadCell>
                          <TableHeadCell>Ativo</TableHeadCell>
                          <TableHeadCell>Quantidade</TableHeadCell>
                          <TableHeadCell>Custo medio</TableHeadCell>
                          <TableHeadCell>Custo total</TableHeadCell>
                          <TableHeadCell>Ultima operacao</TableHeadCell>
                        </TableHead>
                        <TableBody className="divide-y">
                          {positions.map((position) => (
                            <TableRow key={position.assetSymbol} className="bg-white">
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
                  <Card className="border-gray-200 bg-white shadow-sm">
                    <div>
                      <h2 className="text-xl font-semibold text-stone-900">Transacoes</h2>
                      <p className="text-sm text-stone-600">Historico append-friendly do portfolio.</p>
                    </div>

                    {transactions.length === 0 ? (
                      <Alert color="warning">
                        Registre a primeira operacao para iniciar as projecoes.
                      </Alert>
                    ) : (
                      <div className="divide-y divide-gray-200 rounded-lg border border-gray-200">
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

                  <Card className="border-gray-200 bg-white shadow-sm">
                    <div>
                      <h2 className="text-xl font-semibold text-stone-900">Snapshots</h2>
                      <p className="text-sm text-stone-600">Estados historicos reconstruidos por data.</p>
                    </div>

                    {snapshots.length === 0 ? (
                      <Alert color="warning">
                        Snapshots serao gerados conforme o ledger evoluir.
                      </Alert>
                    ) : (
                      <div className="divide-y divide-gray-200 rounded-lg border border-gray-200">
                        {snapshots.map((snapshot) => (
                          <div key={snapshot.id} className="flex items-start justify-between gap-3 p-4">
                            <div>
                              <strong className="text-stone-900">{snapshot.asOfDate}</strong>
                              <p className="text-sm text-stone-600">
                                {snapshot.positions.length} posicoes · {snapshot.transactionCount} transacoes
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
