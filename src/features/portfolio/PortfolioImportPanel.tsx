"use client";

import Link from "next/link";
import {
  ChangeEvent,
  DragEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { Alert } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/form";
import { Select } from "../../components/ui/select";
import { getApiErrorMessage } from "../../lib/presentation";
import {
  createPortfolioImport,
  downloadPortfolioImportErrorReport,
  downloadPortfolioImportTemplate,
  listPortfolioImports
} from "./portfolioApi";
import { PortfolioImportJob } from "./types";

interface PortfolioImportAccount {
  accountId: string;
  accountName: string;
  role: string;
}

export function PortfolioImportPanel({
  accounts,
  onPortfolioCreated
}: {
  accounts: PortfolioImportAccount[];
  onPortfolioCreated?: () => void;
}) {
  const [accountId, setAccountId] = useState(accounts[0]?.accountId ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [imports, setImports] = useState<PortfolioImportJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const submitLockRef = useRef(false);
  const idempotencyKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!accounts.some((account) => account.accountId === accountId)) {
      setAccountId(accounts[0]?.accountId ?? "");
    }
  }, [accountId, accounts]);

  const loadImports = useCallback(
    async (silent = false) => {
      if (!accountId) {
        setImports([]);
        return;
      }
      if (!silent) setIsLoading(true);
      try {
        const response = await listPortfolioImports(accountId);
        setImports((current) => {
          const completedBefore = new Set(
            current.filter((job) => job.status === "succeeded").map((job) => job.id)
          );
          if (
            response.data.imports.some(
              (job) => job.status === "succeeded" && !completedBefore.has(job.id)
            )
          ) {
            onPortfolioCreated?.();
          }
          return response.data.imports;
        });
        setError(null);
      } catch (requestError) {
        if (!silent) {
          setError(getApiErrorMessage(requestError, "Não foi possível carregar as importações."));
        }
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [accountId, onPortfolioCreated]
  );

  useEffect(() => {
    void loadImports();
  }, [loadImports]);

  const hasActiveImport = useMemo(() => imports.some((job) => !isTerminal(job.status)), [imports]);

  useEffect(() => {
    if (!hasActiveImport) return;
    const interval = window.setInterval(() => void loadImports(true), 1500);
    return () => window.clearInterval(interval);
  }, [hasActiveImport, loadImports]);

  useEffect(() => {
    const refresh = () => void loadImports(true);
    window.addEventListener("portfolio_import.updated", refresh);
    window.addEventListener("portfolio_import.succeeded", refresh);
    window.addEventListener("portfolio_import.failed", refresh);
    return () => {
      window.removeEventListener("portfolio_import.updated", refresh);
      window.removeEventListener("portfolio_import.succeeded", refresh);
      window.removeEventListener("portfolio_import.failed", refresh);
    };
  }, [loadImports]);

  async function handleTemplateDownload() {
    setIsDownloadingTemplate(true);
    setError(null);
    try {
      const download = await downloadPortfolioImportTemplate();
      saveBlob(download.blob, download.filename ?? "modelo-importacao-portfolio-v1.xlsx");
      setStatusMessage("Modelo baixado. Preencha as abas Portfólio e Transações.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Não foi possível baixar o modelo."));
    } finally {
      setIsDownloadingTemplate(false);
    }
  }

  function selectFile(selected: File | null) {
    idempotencyKeyRef.current = null;
    setStatusMessage(null);
    setError(null);
    if (!selected) {
      setFile(null);
      return;
    }
    if (!selected.name.toLowerCase().endsWith(".xlsx")) {
      setFile(null);
      setError("Selecione uma planilha no formato XLSX.");
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setFile(null);
      setError("A planilha deve ter no máximo 10 MiB.");
      return;
    }
    setFile(selected);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    selectFile(event.target.files?.[0] ?? null);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    selectFile(event.dataTransfer.files?.[0] ?? null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accountId || !file || submitLockRef.current) return;
    submitLockRef.current = true;
    setIsSubmitting(true);
    setError(null);
    setStatusMessage("Enviando planilha com segurança...");
    try {
      const idempotencyKey = idempotencyKeyRef.current ?? crypto.randomUUID();
      idempotencyKeyRef.current = idempotencyKey;
      const response = await createPortfolioImport({
        accountId,
        file,
        idempotencyKey
      });
      setImports((current) => [
        response.data,
        ...current.filter((job) => job.id !== response.data.id)
      ]);
      setFile(null);
      idempotencyKeyRef.current = null;
      setStatusMessage("Upload concluído. A validação continua em segundo plano.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Não foi possível iniciar a importação."));
      setStatusMessage(null);
    } finally {
      submitLockRef.current = false;
      setIsSubmitting(false);
    }
  }

  async function handleErrorDownload(job: PortfolioImportJob) {
    try {
      const download = await downloadPortfolioImportErrorReport(job.id);
      saveBlob(download.blob, download.filename ?? `erros-importacao-${job.id}.xlsx`);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Não foi possível baixar a planilha de erros."));
    }
  }

  return (
    <Card>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-5">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">
              Entrada em lote
            </p>
            <h2 className="text-2xl font-semibold text-stone-900">Importar planilha</h2>
            <p className="text-sm leading-6 text-stone-600">
              Crie um portfólio e seu histórico inicial sem bloquear esta página. Se qualquer linha
              estiver inválida, nenhum portfólio será criado.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-muted/35 p-4">
            <p className="font-medium text-stone-900">Comece pelo modelo oficial</p>
            <p className="mt-1 text-sm text-stone-600">
              Preencha as abas Portfólio e Transações. O modelo aceita até 10.000 transações.
            </p>
            <Button
              type="button"
              variant="secondary"
              className="mt-3"
              disabled={isDownloadingTemplate}
              onClick={() => void handleTemplateDownload()}
            >
              {isDownloadingTemplate ? "Baixando..." : "Baixar modelo XLSX"}
            </Button>
          </div>

          {accounts.length === 0 ? (
            <Alert variant="info">Sua sessão não possui conta disponível para importação.</Alert>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <Label htmlFor="portfolio-import-account">Conta de destino</Label>
                <Select
                  id="portfolio-import-account"
                  className="mt-2"
                  value={accountId}
                  onChange={(event) => setAccountId(event.target.value)}
                >
                  {accounts.map((account) => (
                    <option key={account.accountId} value={account.accountId}>
                      {account.accountName}
                    </option>
                  ))}
                </Select>
              </div>

              <div
                className="rounded-xl border border-dashed border-stone-300 bg-white p-4 transition-colors focus-within:border-moss focus-within:ring-2 focus-within:ring-moss/20"
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDrop}
              >
                <Label htmlFor="portfolio-import-file">Planilha XLSX</Label>
                <Input
                  id="portfolio-import-file"
                  className="mt-2"
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleFileChange}
                />
                <p className="mt-2 break-all text-xs text-stone-500">
                  {file
                    ? `${file.name} · ${formatFileSize(file.size)}`
                    : "Selecione ou arraste o arquivo preenchido. Limite de 10 MiB."}
                </p>
              </div>

              {error ? <Alert variant="failure">{error}</Alert> : null}
              {statusMessage ? (
                <Alert variant="info">
                  <span aria-live="polite">{statusMessage}</span>
                </Alert>
              ) : null}

              <Button type="submit" disabled={!file || !accountId || isSubmitting}>
                {isSubmitting ? "Enviando..." : "Iniciar importação"}
              </Button>
            </form>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-stone-900">Importações recentes</h3>
              <p className="text-sm text-stone-600">
                O andamento permanece disponível após atualizar a página.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              onClick={() => void loadImports()}
              disabled={isLoading}
            >
              {isLoading ? "Atualizando..." : "Atualizar"}
            </Button>
          </div>

          {isLoading && imports.length === 0 ? (
            <Alert variant="info">Carregando histórico de importações...</Alert>
          ) : imports.length === 0 ? (
            <div className="rounded-xl border border-border bg-muted/25 p-5 text-sm text-stone-600">
              Nenhuma importação foi iniciada para esta conta.
            </div>
          ) : (
            <div className="space-y-3">
              {imports.map((job) => (
                <ImportJobCard key={job.id} job={job} onErrorDownload={handleErrorDownload} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function ImportJobCard({
  job,
  onErrorDownload
}: {
  job: PortfolioImportJob;
  onErrorDownload: (job: PortfolioImportJob) => Promise<void>;
}) {
  const status = importStatus(job);
  return (
    <article className="rounded-xl border border-border bg-white p-4" aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-stone-900" title={job.originalFileName}>
            {job.originalFileName}
          </p>
          <p className="mt-1 text-xs text-stone-500">
            Atualizado em {formatDateTime(job.updatedAt)}
          </p>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      {!isTerminal(job.status) ? (
        <div className="mt-4">
          <div className="mb-1 flex justify-between gap-3 text-xs text-stone-600">
            <span>{status.description}</span>
            <span>
              {job.progress.totalRows === null ? "Preparando" : `${job.progress.percent}%`}
            </span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-stone-200"
            role="progressbar"
            aria-label={`Progresso da importação de ${job.originalFileName}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={job.progress.totalRows === null ? undefined : job.progress.percent}
          >
            <div
              className="h-full rounded-full bg-moss transition-[width]"
              style={{ width: `${job.progress.totalRows === null ? 12 : job.progress.percent}%` }}
            />
          </div>
        </div>
      ) : null}

      {job.status === "failed" ? (
        <div className="mt-4 space-y-3">
          <Alert variant="failure">{job.failure?.message ?? "Nenhum portfólio foi criado."}</Alert>
          {job.failure?.errors.slice(0, 3).map((entry) => (
            <p
              key={`${entry.rowNumber}-${entry.field}-${entry.code}`}
              className="text-sm text-stone-600"
            >
              {entry.rowNumber ? `Linha ${entry.rowNumber}, ` : ""}
              {entry.field}: {entry.message}
            </p>
          ))}
          {job.errorReportAvailable ? (
            <Button type="button" variant="secondary" onClick={() => void onErrorDownload(job)}>
              Baixar planilha de erros
            </Button>
          ) : null}
        </div>
      ) : null}

      {job.status === "succeeded" && job.portfolioId ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-950">
          <span>Portfólio e histórico criados. As análises podem continuar atualizando.</span>
          <Link
            className="font-semibold underline underline-offset-4"
            href={`/dashboard/portfolios/${job.portfolioId}`}
          >
            Abrir portfólio
          </Link>
        </div>
      ) : null}
    </article>
  );
}

function importStatus(job: PortfolioImportJob): {
  label: string;
  description: string;
  variant: "default" | "info" | "success" | "failure" | "warning";
} {
  switch (job.status) {
    case "queued":
      return {
        label: "Na fila",
        description: "Aguardando início da validação",
        variant: "default"
      };
    case "validating":
      return {
        label: "Validando planilha",
        description: "Conferindo estrutura e histórico",
        variant: "info"
      };
    case "committing":
      return {
        label: "Criando portfólio",
        description: "Gravando o histórico de forma atômica",
        variant: "warning"
      };
    case "succeeded":
      return { label: "Concluído", description: "Portfólio criado", variant: "success" };
    case "failed":
      return { label: "Falhou", description: "Nenhum portfólio foi criado", variant: "failure" };
  }
}

function isTerminal(status: PortfolioImportJob["status"]): boolean {
  return status === "succeeded" || status === "failed";
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function formatFileSize(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KiB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MiB`;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Fortaleza"
  }).format(new Date(value));
}
