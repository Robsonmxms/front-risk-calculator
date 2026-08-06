import { ApiError } from "./api/client";
import type { UserRole, UserStatus } from "../features/auth/types";
import type { ReportPackageStatus } from "../features/delivery/types";
import type {
  AlertSeverity,
  AlertStatus,
  AnalyticsMetricStatus,
  AnalyticsReadStatus,
  NotificationStatus,
  PortfolioFreshness,
  PortfolioStatus,
  PortfolioTransactionType,
  ProcessingState,
  ReportStatus,
  RiskInsightSeverity
} from "../features/portfolio/types";

type BadgeVariant = "default" | "info" | "success" | "warning" | "failure" | "outline";

type LabelMap<T extends string> = Record<T, string>;

const userRoleLabels: LabelMap<UserRole> = {
  admin: "administrador",
  analyst: "analista",
  user: "usuário"
};

const userStatusLabels: LabelMap<UserStatus> = {
  active: "ativo",
  disabled: "desativado"
};

const accountRoleLabels = {
  owner: "titular",
  analyst: "analista",
  viewer: "leitura"
} as const;

const officeRoleLabels = {
  office_admin: "administrador do escritório",
  advisor: "assessor",
  analyst: "analista",
  assistant: "assistente",
  client: "cliente"
} as const;

const portfolioFreshnessLabels: LabelMap<PortfolioFreshness> = {
  fresh: "dados atualizados",
  partial: "fontes parciais",
  stale: "dados desatualizados"
};

const portfolioStatusLabels: LabelMap<PortfolioStatus> = {
  ready: "pronto",
  syncing: "atualizando",
  degraded: "degradado"
};

const processingStateLabels: LabelMap<ProcessingState> = {
  ready: "sem pendência",
  pending: "pendente"
};

const transactionTypeLabels: LabelMap<PortfolioTransactionType> = {
  buy: "compra",
  sell: "venda"
};

const analyticsStatusLabels: LabelMap<AnalyticsReadStatus> = {
  complete: "dados completos",
  partial: "fontes parciais",
  pending: "atualização pendente",
  failed: "dados indisponíveis"
};

const analyticsMetricStatusLabels: LabelMap<AnalyticsMetricStatus> = {
  available: "disponível",
  unavailable: "indisponível"
};

const analyticsMetricKeyLabels = {
  totalReturn: "Retorno total",
  annualizedReturn: "Retorno anualizado",
  maxDrawdown: "Drawdown máximo",
  volatility: "Volatilidade",
  beta: "Beta",
  sharpeRatio: "Índice de Sharpe",
  concentrationHhi: "Concentração HHI",
  sectorExposure: "Exposição setorial",
  assetCorrelation: "Correlação entre ativos"
} as const;

const dataQualitySeverityLabels = {
  info: "informativo",
  warning: "atenção",
  blocking: "bloqueante"
} as const;

const dataQualityIssueCodeLabels: Record<string, string> = {
  "analytics.insufficient_sample": "Amostra insuficiente",
  "analytics.benchmark_unavailable": "Referência de mercado indisponível",
  "analytics.history_unavailable": "Histórico insuficiente",
  "analytics.metric_unavailable": "Métrica indisponível",
  "analytics.quote_unavailable": "Cotação indisponível",
  "market_data.historical_prices_unavailable": "Histórico de preços indisponível",
  "market_data.quote_unavailable": "Cotação indisponível",
  "market_data.stale": "Dados de mercado desatualizados",
  "market_data.usd_conversion_unavailable": "Conversão para USD indisponível"
};

const sectorLabels: Record<string, string> = {
  Benchmark: "Referência",
  "Dividend Equity": "Ações de dividendos",
  Energy: "Energia",
  ETF: "ETF",
  Financials: "Serviços financeiros",
  "Fixed Income": "Renda fixa",
  "Fixed income": "Renda fixa",
  Materials: "Materiais",
  "Não classificado": "Não classificado",
  "Real Estate": "Imobiliário",
  Technology: "Tecnologia"
};

const insightSeverityLabels: LabelMap<RiskInsightSeverity> = {
  info: "informativo",
  watch: "acompanhamento",
  high: "alta atenção"
};

const realtimeStatusLabels = {
  connected: "conectado",
  connecting: "conectando",
  disconnected: "atualização periódica"
} as const;

const reportStatusLabels: LabelMap<ReportStatus> = {
  pending: "aguardando",
  running: "gerando",
  ready: "pronto",
  failed: "falhou"
};

const reportFailureCodeLabels: Record<string, string> = {
  analytics_calculation_failed: "Falha no cálculo das análises.",
  "analytics.calculation_failed": "Falha no cálculo das análises.",
  delivery_timeout: "Tempo limite na entrega.",
  generation_failed: "Falha na geração do relatório.",
  report_generation_failed: "Falha na geração do relatório.",
  storage_unavailable: "Arquivo indisponível no armazenamento."
};

const reportPackageStatusLabels: LabelMap<ReportPackageStatus> = {
  draft: "rascunho",
  pending_approval: "aguardando aprovação",
  approved: "aprovado",
  delivered: "entregue",
  viewed: "visualizado",
  revoked: "revogado"
};

const reportPackageItemStatusLabels = {
  ready: "pronto",
  pending: "pendente",
  unavailable: "indisponível"
} as const;

const reportPackageItemTypeLabels = {
  report: "relatório",
  analytics_snapshot: "retrato de risco",
  portfolio_summary: "resumo do portfólio"
} as const;

const alertSeverityLabels: LabelMap<AlertSeverity> = {
  low: "baixa",
  medium: "média",
  high: "alta"
};

const alertStatusLabels: LabelMap<AlertStatus> = {
  open: "aberto",
  monitoring: "monitorando",
  disabled: "desativado"
};

const notificationStatusLabels: LabelMap<NotificationStatus> = {
  unread: "nova",
  read: "lida"
};

const auditOutcomeLabels = {
  success: "concluído",
  failure: "falhou"
} as const;

const auditSeverityLabels = {
  info: "informativo",
  warning: "atenção",
  critical: "crítico"
} as const;

const resourceTypeLabels = {
  auth: "autenticação",
  office: "escritório",
  permission: "permissão",
  client: "cliente",
  household: "grupo familiar",
  account: "conta",
  portfolio: "portfólio",
  ledger: "movimentações",
  analytics: "análises",
  market_data: "dados de mercado",
  report: "relatório",
  alert: "alerta",
  notification: "notificação",
  delivery: "entrega",
  portal: "portal do cliente",
  review: "revisão"
} as const;

const reviewStatusLabels = {
  open: "aberto",
  in_progress: "em andamento",
  closed: "concluído",
  assigned: "atribuído",
  resolved: "resolvido"
} as const;

const clientStatusLabels = {
  active: "ativo",
  inactive: "inativo",
  archived: "arquivado"
} as const;

const onboardingStatusLabels = {
  invited: "convidado",
  onboarding: "em cadastro",
  complete: "concluído",
  paused: "pausado"
} as const;

const officeStatusLabels = {
  active: "ativo",
  archived: "arquivado",
  disabled: "desativado"
} as const;

const permissionLabels = {
  "client.read": "leitura de clientes",
  "client.manage": "gestão de clientes",
  "ledger.read": "leitura de movimentações",
  "ledger.write": "registro de movimentações",
  "analytics.read": "leitura de análises",
  "analytics.recompute": "recálculo de análises",
  "reports.request": "solicitação de relatórios",
  "reports.approve": "aprovação de relatórios",
  "alerts.manage": "gestão de alertas",
  "notifications.read": "leitura de notificações",
  "office.members.manage": "gestão da equipe",
  "audit.read": "leitura de auditoria"
} as const;

const auditActionLabels: Record<string, string> = {
  "audit.export.requested": "Exportação de auditoria solicitada",
  "client.archived": "Cliente arquivado",
  "client.created": "Cliente criado",
  "client.updated": "Cliente atualizado",
  "delivery.report.failed": "Falha na entrega do relatório",
  "household.created": "Grupo familiar criado",
  "household.updated": "Grupo familiar atualizado",
  "ledger.position_projection.updated": "Projeção de posições atualizada",
  "ledger.snapshot.created": "Histórico de movimentações criado",
  "ledger.transaction.recorded": "Transação registrada",
  "market_data.refresh.failed": "Atualização de dados de mercado falhou",
  "market_data.refresh.requested": "Atualização de dados de mercado solicitada",
  "permission.assignment.created": "Permissão por recurso criada",
  "permission.team.created": "Equipe de assessoria criada",
  "permission.team.updated": "Equipe de assessoria atualizada",
  "portfolio.created": "Portfólio criado",
  "portfolio.updated": "Portfólio atualizado",
  "report_package.approved": "Pacote de relatório aprovado",
  "report_package.created": "Pacote de relatório criado",
  "report_package.delivered": "Pacote de relatório entregue",
  "report_package.revoked": "Pacote de relatório revogado",
  "report_package.viewed": "Pacote de relatório visualizado",
  "review.item.created": "Item de acompanhamento criado",
  "review.item.updated": "Item de acompanhamento atualizado",
  "supervision.review.updated": "Revisão de supervisão atualizada"
};

const apiErrorMessages: Record<string, string> = {
  "account.dashboard_not_found": "Painel da conta não encontrado.",
  "account.not_found": "Conta não encontrada.",
  "alert.not_found": "Alerta não encontrado.",
  "api.request_failed": "Não foi possível concluir a solicitação.",
  "assignment.assignee_required": "Informe o responsável pela permissão.",
  "assignment.not_found": "Permissão por recurso não encontrada.",
  "audit_event.not_found": "Evento de auditoria não encontrado.",
  "analytics.benchmark_unavailable": "Referência de mercado indisponível para a análise.",
  "analytics.calculation_failed": "Não foi possível recalcular as análises.",
  "analytics.fx_rate_unavailable": "Taxa de câmbio indisponível para a análise.",
  "analytics.history_unavailable": "Histórico insuficiente para concluir a análise.",
  "analytics.persistence_failed": "Não foi possível salvar o resultado das análises.",
  "analytics.quote_unavailable": "Cotação indisponível para concluir a análise.",
  "auth.access_token_expired": "Sessão expirada. Entre novamente.",
  "auth.access_token_invalid": "Sessão inválida. Entre novamente.",
  "auth.account_access_denied": "Este recurso não está disponível para o seu perfil.",
  "auth.actor_not_found": "Sessão inválida. Entre novamente.",
  "auth.forbidden": "Este recurso não está disponível para o seu perfil.",
  "auth.invalid_credentials": "Credenciais inválidas.",
  "auth.notification_access_denied": "Notificação indisponível para esta sessão.",
  "auth.office_access_denied": "Este escritório não está disponível para o seu perfil.",
  "auth.office_admin_required": "Esta ação exige administração do escritório.",
  "auth.permission_denied": "Seu perfil não possui permissão para esta ação.",
  "auth.refresh_expired": "Sessão expirada. Entre novamente.",
  "auth.refresh_invalid": "Sessão inválida. Entre novamente.",
  "auth.refresh_reused": "Sessão expirada. Entre novamente.",
  "auth.refresh_revoked": "Sessão expirada. Entre novamente.",
  "auth.required": "Entre para acessar este recurso.",
  "auth.session_expired": "Sessão expirada. Entre novamente.",
  "client.not_found": "Cliente não encontrado.",
  "household.not_found": "Grupo familiar não encontrado.",
  "internal.unexpected_error": "Não foi possível concluir a solicitação.",
  "market_data.asset_not_found": "Ativo não encontrado nos dados de mercado.",
  "market_data.currency_pair_not_supported": "Par de moedas não suportado.",
  "market_data.currency_pair_unavailable": "Par de moedas indisponível no momento.",
  "market_data.currency_rate_unavailable": "Taxa de câmbio indisponível no momento.",
  "market_data.historical_prices_unavailable": "Histórico de preços indisponível no momento.",
  "market_data.invalid_currency_conversion": "Revise os dados da conversão de moeda.",
  "market_data.invalid_query": "Informe ao menos três caracteres para buscar ativos.",
  "market_data.invalid_trade_price_request": "Revise os dados para calcular o preço da operação.",
  "market_data.provider_error": "Dados de mercado indisponíveis no momento.",
  "market_data.provider_http_error": "Provedor de dados de mercado indisponível no momento.",
  "market_data.provider_unavailable": "Dados de mercado indisponíveis no momento.",
  "market_data.quote_unavailable": "Cotação indisponível no momento.",
  "market_data.symbol_not_supported": "Ativo não suportado pelo provedor.",
  "market_data.trade_price_not_found": "Preço não disponível para a data informada.",
  "market_data.trade_price_unavailable": "Preço da operação indisponível no momento.",
  "market_data.yahoo_chart_unavailable": "Histórico do provedor indisponível no momento.",
  "notification.not_found": "Notificação indisponível para esta sessão.",
  "office.not_found": "Escritório não encontrado.",
  "portfolio.idempotency_key_payload_mismatch":
    "Esta chave de idempotência já foi usada com outro conteúdo.",
  "portfolio.negative_position": "A operação deixaria a posição negativa.",
  "portfolio.not_found": "Portfólio não encontrado.",
  "report.file_unavailable": "Arquivo do relatório indisponível.",
  "report.generation_failed": "Não foi possível gerar o relatório.",
  "report.not_found": "Relatório não encontrado.",
  "report.not_ready": "Relatório ainda não está pronto.",
  "report_package.items_not_ready": "O pacote possui itens que ainda não estão prontos.",
  "report_package.items_required": "Inclua ao menos um item no pacote.",
  "report_package.locked": "Este pacote não pode ser alterado neste status.",
  "report_package.not_approvable": "Este pacote ainda não pode ser aprovado.",
  "report_package.not_approved": "Aprove o pacote antes da entrega.",
  "report_package.not_found": "Pacote de relatório não encontrado.",
  "request.invalid_account_id": "Identificador da conta inválido.",
  "request.invalid_asset_id": "Identificador do ativo inválido.",
  "request.invalid_assignment_id": "Identificador da permissão inválido.",
  "request.invalid_audit_event_id": "Identificador do evento de auditoria inválido.",
  "request.invalid_client_id": "Identificador do cliente inválido.",
  "request.invalid_household_id": "Identificador do grupo familiar inválido.",
  "request.invalid_office_id": "Identificador do escritório inválido.",
  "request.invalid_param": "Parâmetro inválido.",
  "request.invalid_portfolio_id": "Identificador do portfólio inválido.",
  "request.invalid_review_id": "Identificador da revisão inválido.",
  "request.invalid_review_item_id": "Identificador do item de acompanhamento inválido.",
  "request.invalid_team_id": "Identificador do time inválido.",
  "request.validation_failed": "Revise os campos destacados.",
  "realtime.portfolio_scope_required":
    "Selecione um portfólio para abrir a atualização em tempo real.",
  "review_item.not_found": "Item de acompanhamento não encontrado.",
  "supervision_review.not_found": "Revisão de supervisão não encontrada.",
  "team.not_found": "Equipe não encontrada."
};

const portfolioWarningMessages: Record<string, string> = {
  "Analytics recomputation pending after the latest ledger change.":
    "O recálculo das análises está pendente após a última movimentação registrada.",
  "Analytics recomputation pending after the latest market data update.":
    "O recálculo das análises está pendente após a atualização dos dados de mercado.",
  "Market data refresh pending for affected assets.":
    "A atualização dos dados de mercado está pendente para os ativos afetados."
};

export function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(value);
}

export function formatDecimal(value: number, maximumFractionDigits = 8) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits
  }).format(value);
}

export function formatPercentage(value: number, fractionDigits = 2) {
  return `${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }).format(value)}%`;
}

export function formatInputDecimal(value: number, maximumFractionDigits = 8) {
  return Number(value.toFixed(maximumFractionDigits)).toString();
}

export function formatDate(value: string) {
  const calendarDate = parseCalendarDate(value);
  if (calendarDate) {
    return `${padDatePart(calendarDate.day)}/${padDatePart(calendarDate.month)}/${calendarDate.year}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return "data inválida";
  }

  const instant = new Date(value);
  if (Number.isNaN(instant.getTime())) {
    return "data inválida";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeZone: "America/Fortaleza"
  }).format(instant);
}

export function formatDateTime(value: string) {
  const instant = new Date(value);
  if (Number.isNaN(instant.getTime())) {
    return "data e hora inválidas";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Fortaleza",
    hour12: false
  }).format(instant);
}

export function formatDateInputValue(value: Date = new Date()): string {
  return [
    value.getFullYear().toString().padStart(4, "0"),
    padDatePart(value.getMonth() + 1),
    padDatePart(value.getDate())
  ].join("-");
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return apiErrorMessages[error.code] ?? fallback;
  }

  return fallback;
}

export function formatPortfolioWarning(message: string) {
  const directMatch = portfolioWarningMessages[message];
  if (directMatch) {
    return directMatch;
  }

  const marketDataFailure = message.match(
    /^Market data refresh failed \((.+)\); last known good data was preserved\.$/
  );
  if (marketDataFailure) {
    return `A atualização dos dados de mercado falhou (${formatFailureReason(marketDataFailure[1])}); os últimos dados válidos foram preservados.`;
  }

  const analyticsFailure = message.match(
    /^Analytics recomputation failed \((.+)\); last successful snapshot remains available\.$/
  );
  if (analyticsFailure) {
    return `O recálculo das análises falhou (${formatFailureReason(analyticsFailure[1])}); o último retrato de risco bem-sucedido permanece disponível.`;
  }

  return hasUntranslatedEnglish(message)
    ? "Aviso operacional registrado pela plataforma."
    : message;
}

export function labelUserRole(value: UserRole | string) {
  return labelFromMap(userRoleLabels, value);
}

export function labelUserStatus(value: UserStatus | string) {
  return labelFromMap(userStatusLabels, value);
}

export function labelAccountRole(value: string) {
  return labelFromMap(accountRoleLabels, value);
}

export function labelOfficeRole(value: string) {
  return labelFromMap(officeRoleLabels, value);
}

export function labelPortfolioFreshness(value: PortfolioFreshness | string) {
  return labelFromMap(portfolioFreshnessLabels, value);
}

export function labelPortfolioStatus(value: PortfolioStatus | string) {
  return labelFromMap(portfolioStatusLabels, value);
}

export function labelProcessingState(value: ProcessingState | string) {
  return labelFromMap(processingStateLabels, value);
}

export function labelTransactionType(value: PortfolioTransactionType | string) {
  return labelFromMap(transactionTypeLabels, value);
}

export function labelAnalyticsStatus(value: AnalyticsReadStatus | string) {
  return labelFromMap(analyticsStatusLabels, value);
}

export function labelAnalyticsMetricStatus(value: AnalyticsMetricStatus | string) {
  return labelFromMap(analyticsMetricStatusLabels, value);
}

export function labelAnalyticsMetricKey(value: string) {
  return labelFromMap(analyticsMetricKeyLabels, value);
}

export function labelDataQualitySeverity(value: string) {
  return labelFromMap(dataQualitySeverityLabels, value);
}

export function labelDataQualityIssueCode(value: string) {
  return dataQualityIssueCodeLabels[value] ?? "Qualidade de dados pendente";
}

export function labelSector(value: string) {
  return sectorLabels[value] ?? value;
}

export function labelInsightSeverity(value: RiskInsightSeverity | string) {
  return labelFromMap(insightSeverityLabels, value);
}

export function labelRealtimeStatus(value: string) {
  return labelFromMap(realtimeStatusLabels, value);
}

export function labelReportStatus(value: ReportStatus | string) {
  return labelFromMap(reportStatusLabels, value);
}

export function labelReportFailureCode(value: string) {
  return reportFailureCodeLabels[value] ?? "Falha operacional registrada.";
}

export function labelReportPackageStatus(value: ReportPackageStatus | string) {
  return labelFromMap(reportPackageStatusLabels, value);
}

export function labelReportPackageItemStatus(value: string) {
  return labelFromMap(reportPackageItemStatusLabels, value);
}

export function labelReportPackageItemType(value: string) {
  return labelFromMap(reportPackageItemTypeLabels, value);
}

export function labelAlertSeverity(value: AlertSeverity | string) {
  return labelFromMap(alertSeverityLabels, value);
}

export function labelAlertStatus(value: AlertStatus | string) {
  return labelFromMap(alertStatusLabels, value);
}

export function labelNotificationStatus(value: NotificationStatus | string) {
  return labelFromMap(notificationStatusLabels, value);
}

export function labelNotificationSeverity(value: string) {
  return value === "info" ? "informativo" : labelAlertSeverity(value);
}

export function labelAuditOutcome(value: string) {
  return labelFromMap(auditOutcomeLabels, value);
}

export function labelAuditSeverity(value: string) {
  return labelFromMap(auditSeverityLabels, value);
}

export function labelResourceType(value: string) {
  return resourceTypeLabels[value as keyof typeof resourceTypeLabels] ?? "recurso";
}

export function labelReviewStatus(value: string) {
  return labelFromMap(reviewStatusLabels, value);
}

export function labelClientStatus(value: string) {
  return labelFromMap(clientStatusLabels, value);
}

export function labelOnboardingStatus(value: string) {
  return labelFromMap(onboardingStatusLabels, value);
}

export function labelOfficeStatus(value: string) {
  return labelFromMap(officeStatusLabels, value);
}

export function labelPermission(value: string) {
  return labelFromMap(permissionLabels, value);
}

export function labelAuditAction(value: string) {
  return auditActionLabels[value] ?? "Evento auditável registrado";
}

export function formatResourceReference(
  resourceType: string,
  resourceId?: string,
  displayName?: string
) {
  const resourceLabel = labelResourceType(resourceType);
  const reference = displayName ?? resourceId;

  return reference ? `${resourceLabel}: ${reference}` : resourceLabel;
}

export function portfolioFreshnessVariant(value: PortfolioFreshness | string): BadgeVariant {
  switch (value) {
    case "fresh":
      return "success";
    case "partial":
      return "warning";
    default:
      return "failure";
  }
}

export function portfolioStatusVariant(value: PortfolioStatus | string): BadgeVariant {
  switch (value) {
    case "ready":
      return "success";
    case "syncing":
      return "warning";
    default:
      return "failure";
  }
}

export function processingStateVariant(value: ProcessingState | string): BadgeVariant {
  return value === "pending" ? "warning" : "success";
}

export function analyticsStatusVariant(value: AnalyticsReadStatus | string): BadgeVariant {
  switch (value) {
    case "complete":
      return "success";
    case "partial":
    case "pending":
      return "warning";
    default:
      return "failure";
  }
}

export function dataQualitySeverityVariant(value: string): BadgeVariant {
  switch (value) {
    case "blocking":
      return "failure";
    case "warning":
      return "warning";
    default:
      return "info";
  }
}

export function insightSeverityVariant(value: RiskInsightSeverity | string): BadgeVariant {
  switch (value) {
    case "info":
      return "info";
    case "watch":
      return "warning";
    default:
      return "failure";
  }
}

export function realtimeStatusVariant(value: string): BadgeVariant {
  switch (value) {
    case "connected":
      return "success";
    case "connecting":
      return "warning";
    default:
      return "outline";
  }
}

export function reportStatusVariant(value: ReportStatus | string): BadgeVariant {
  switch (value) {
    case "ready":
      return "success";
    case "pending":
    case "running":
      return "warning";
    default:
      return "failure";
  }
}

export function reportPackageStatusVariant(value: ReportPackageStatus | string): BadgeVariant {
  switch (value) {
    case "delivered":
    case "viewed":
      return "success";
    case "approved":
      return "info";
    case "pending_approval":
      return "warning";
    case "revoked":
      return "failure";
    default:
      return "outline";
  }
}

export function alertSeverityVariant(value: AlertSeverity | string): BadgeVariant {
  switch (value) {
    case "low":
      return "info";
    case "medium":
      return "warning";
    default:
      return "failure";
  }
}

export function alertStatusVariant(value: AlertStatus | string): BadgeVariant {
  switch (value) {
    case "monitoring":
      return "info";
    case "open":
      return "warning";
    default:
      return "failure";
  }
}

export function notificationSeverityVariant(value: string): BadgeVariant {
  switch (value) {
    case "info":
    case "low":
      return "info";
    case "medium":
      return "warning";
    default:
      return "failure";
  }
}

export function auditOutcomeVariant(value: string): BadgeVariant {
  return value === "failure" ? "failure" : "outline";
}

export function auditSeverityVariant(value: string): BadgeVariant {
  switch (value) {
    case "critical":
      return "failure";
    case "warning":
      return "warning";
    default:
      return "outline";
  }
}

export function clientStatusVariant(value: string): BadgeVariant {
  return value === "archived" ? "outline" : value === "inactive" ? "warning" : "default";
}

export function officeStatusVariant(value: string): BadgeVariant {
  return value === "active" ? "success" : value === "archived" ? "outline" : "warning";
}

function labelFromMap<T extends Record<string, string>>(map: T, value: string) {
  return map[value as keyof T] ?? humanizeIdentifier(value);
}

function parseCalendarDate(
  value: string
): { year: number; month: number; day: number } | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return undefined;
  }

  const [, yearValue, monthValue, dayValue] = match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return undefined;
  }

  return { year, month, day };
}

function padDatePart(value: number): string {
  return value.toString().padStart(2, "0");
}

function humanizeIdentifier(value: string) {
  if (!value) {
    return "não informado";
  }

  return value
    .replace(/[_:.-]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function formatFailureReason(value: string) {
  const sentence = reportFailureCodeLabels[value];
  if (sentence) {
    return sentence.replace(/\.$/, "").toLowerCase();
  }

  return looksTechnical(value) || hasUntranslatedEnglish(value)
    ? "motivo técnico registrado"
    : value;
}

function looksTechnical(value: string) {
  return /^[a-z]+[a-z0-9]*[_:.][a-z0-9_.:-]+$/i.test(value);
}

function hasUntranslatedEnglish(value: string) {
  return /\b(analytics|ledger|market data|snapshot|provider|failed|pending|portfolio|quote|refresh|unavailable|warning|stale)\b/i.test(
    value
  );
}
