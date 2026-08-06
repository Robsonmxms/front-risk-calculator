import { describe, expect, it } from "vitest";
import type {
  AccountMemberRole,
  OfficeMembershipRole,
  UserRole,
  UserStatus
} from "../../src/features/auth/types";
import type { ClientOnboardingStatus, ClientStatus } from "../../src/features/client/types";
import type {
  AuditOutcome,
  AuditResourceType,
  AuditSeverity
} from "../../src/features/compliance/types";
import type {
  ReportPackageItemStatus,
  ReportPackageItemType,
  ReportPackageStatus
} from "../../src/features/delivery/types";
import type {
  AlertSeverity,
  AlertStatus,
  AnalyticsMetricKey,
  AnalyticsMetricStatus,
  AnalyticsReadStatus,
  NotificationStatus,
  PortfolioFreshness,
  PortfolioStatus,
  PortfolioTransactionType,
  ProcessingState,
  ReportStatus,
  RiskInsightSeverity
} from "../../src/features/portfolio/types";
import type { ReviewItemStatus, ReviewResourceType } from "../../src/features/workbench/types";
import type { RealtimeConnectionStatus } from "../../src/lib/realtime/client";
import { ApiError } from "../../src/lib/api/client";
import {
  formatDate,
  formatDateInputValue,
  formatDateTime,
  formatPercentage,
  formatPortfolioWarning,
  getApiErrorMessage,
  labelAccountRole,
  labelAlertSeverity,
  labelAlertStatus,
  labelAnalyticsMetricKey,
  labelAnalyticsMetricStatus,
  labelAnalyticsStatus,
  labelAuditAction,
  labelAuditOutcome,
  labelAuditSeverity,
  labelDataQualityIssueCode,
  labelClientStatus,
  labelDataQualitySeverity,
  labelInsightSeverity,
  labelNotificationSeverity,
  labelNotificationStatus,
  labelOfficeRole,
  labelOfficeStatus,
  labelOnboardingStatus,
  labelPortfolioFreshness,
  labelPortfolioStatus,
  labelProcessingState,
  labelRealtimeStatus,
  labelReportFailureCode,
  labelReportPackageItemStatus,
  labelReportPackageItemType,
  labelReportPackageStatus,
  labelReportStatus,
  labelResourceType,
  labelReviewStatus,
  labelSector,
  labelTransactionType,
  labelUserRole,
  labelUserStatus
} from "../../src/lib/presentation";

describe("presentation contract", () => {
  it("renders current backend enum and status values through localized labels", () => {
    expectLocalized(["admin", "analyst", "user"] satisfies UserRole[], labelUserRole);
    expectLocalized(["active", "disabled"] satisfies UserStatus[], labelUserStatus);
    expectLocalized(["owner", "analyst", "viewer"] satisfies AccountMemberRole[], labelAccountRole);
    expectLocalized(
      [
        "office_admin",
        "advisor",
        "analyst",
        "assistant",
        "client"
      ] satisfies OfficeMembershipRole[],
      labelOfficeRole
    );
    expectLocalized(["active", "archived", "disabled"], labelOfficeStatus);
    expectLocalized(
      ["fresh", "partial", "stale"] satisfies PortfolioFreshness[],
      labelPortfolioFreshness
    );
    expectLocalized(
      ["ready", "syncing", "degraded"] satisfies PortfolioStatus[],
      labelPortfolioStatus
    );
    expectLocalized(["ready", "pending"] satisfies ProcessingState[], labelProcessingState);
    expectLocalized(["buy", "sell"] satisfies PortfolioTransactionType[], labelTransactionType);
    expectLocalized(
      ["complete", "partial", "pending", "failed"] satisfies AnalyticsReadStatus[],
      labelAnalyticsStatus
    );
    expectLocalized(
      ["available", "unavailable"] satisfies AnalyticsMetricStatus[],
      labelAnalyticsMetricStatus
    );
    expectLocalized(
      [
        "totalReturn",
        "annualizedReturn",
        "maxDrawdown",
        "volatility",
        "beta",
        "sharpeRatio",
        "concentrationHhi",
        "sectorExposure",
        "assetCorrelation"
      ] satisfies AnalyticsMetricKey[],
      labelAnalyticsMetricKey
    );
    expectLocalized(["info", "warning", "blocking"], labelDataQualitySeverity);
    expect(labelDataQualityIssueCode("market_data.stale")).toBe("Dados de mercado desatualizados");
    expect(labelSector("Technology")).toBe("Tecnologia");
    expectLocalized(
      ["info", "watch", "high"] satisfies RiskInsightSeverity[],
      labelInsightSeverity
    );
    expectLocalized(
      ["connected", "connecting", "disconnected"] satisfies RealtimeConnectionStatus[],
      labelRealtimeStatus
    );
    expectLocalized(
      ["pending", "running", "ready", "failed"] satisfies ReportStatus[],
      labelReportStatus
    );
    expect(labelReportFailureCode("generation_failed")).toBe("Falha na geração do relatório.");
    expectLocalized(
      [
        "draft",
        "pending_approval",
        "approved",
        "delivered",
        "viewed",
        "revoked"
      ] satisfies ReportPackageStatus[],
      labelReportPackageStatus
    );
    expectLocalized(
      ["ready", "pending", "unavailable"] satisfies ReportPackageItemStatus[],
      labelReportPackageItemStatus
    );
    expectLocalized(
      ["report", "analytics_snapshot", "portfolio_summary"] satisfies ReportPackageItemType[],
      labelReportPackageItemType
    );
    expectLocalized(["low", "medium", "high"] satisfies AlertSeverity[], labelAlertSeverity);
    expectLocalized(["open", "monitoring", "disabled"] satisfies AlertStatus[], labelAlertStatus);
    expectLocalized(["unread", "read"] satisfies NotificationStatus[], labelNotificationStatus);
    expectLocalized(["info", "low", "medium", "high"], labelNotificationSeverity);
    expectLocalized(["success", "failure"] satisfies AuditOutcome[], labelAuditOutcome);
    expectLocalized(["info", "warning", "critical"] satisfies AuditSeverity[], labelAuditSeverity);
    expect(labelAuditAction("delivery.report.failed")).toBe("Falha na entrega do relatório");
    expectLocalized(
      [
        "auth",
        "office",
        "permission",
        "client",
        "household",
        "account",
        "portfolio",
        "ledger",
        "analytics",
        "market_data",
        "report",
        "alert",
        "notification",
        "delivery",
        "portal",
        "review"
      ] satisfies AuditResourceType[],
      labelResourceType
    );
    expectLocalized(
      ["open", "in_progress", "closed"] satisfies ReviewItemStatus[],
      labelReviewStatus
    );
    expectLocalized(["assigned", "resolved"], labelReviewStatus);
    expectLocalized(
      [
        "client",
        "portfolio",
        "analytics",
        "report",
        "alert",
        "notification"
      ] satisfies ReviewResourceType[],
      labelResourceType
    );
    expectLocalized(["active", "inactive", "archived"] satisfies ClientStatus[], labelClientStatus);
    expectLocalized(
      ["invited", "onboarding", "complete", "paused"] satisfies ClientOnboardingStatus[],
      labelOnboardingStatus
    );
  });

  it("localizes stable backend error codes instead of showing backend English messages", () => {
    const codes = [
      "auth.forbidden",
      "auth.account_access_denied",
      "auth.permission_denied",
      "auth.refresh_reused",
      "client.not_found",
      "portfolio.not_found",
      "report.not_ready",
      "report_package.items_not_ready",
      "notification.not_found",
      "market_data.provider_unavailable",
      "market_data.trade_price_not_found",
      "analytics.calculation_failed",
      "analytics.history_unavailable",
      "request.validation_failed",
      "realtime.portfolio_scope_required"
    ];

    for (const code of codes) {
      const message = getApiErrorMessage(
        new ApiError(403, code, `Backend English message for ${code}`),
        "fallback"
      );

      expect(message, code).not.toBe("fallback");
      expect(message, code).not.toContain("Backend English message");
    }
  });

  it("uses localized safe fallbacks for unknown technical diagnostics", () => {
    expect(labelDataQualityIssueCode("market_data.provider_failed")).toBe(
      "Qualidade de dados pendente"
    );
    expect(labelReportFailureCode("provider_failed")).toBe("Falha operacional registrada.");
    expect(labelAuditAction("delivery.provider_failed")).toBe("Evento auditável registrado");
    expect(formatPortfolioWarning("Provider failed while refreshing market data.")).toBe(
      "Aviso operacional registrado pela plataforma."
    );
  });

  it("preserves calendar dates and formats instants in the documented Brazilian timezone", () => {
    expect(formatDate("2026-07-15")).toBe("15/07/2026");
    expect(formatDate("2026-02-30")).toBe("data inválida");
    expect(formatDate("not-a-date")).toBe("data inválida");
    expect(formatPercentage(4.69)).toBe("4,69%");
    expect(formatDateTime("2026-07-15T03:00:00.000Z")).toMatch(/^15\/07\/2026,? 00:00$/);
    expect(formatDateTime("not-a-date")).toBe("data e hora inválidas");
    expect(formatDateInputValue(new Date(2026, 6, 15, 23, 30))).toBe("2026-07-15");
  });
});

function expectLocalized<T extends string>(values: readonly T[], label: (value: T) => string) {
  for (const value of values) {
    const rendered = label(value);

    expect(rendered, value).not.toBe(value);
    expect(rendered, value).not.toBe(humanizeIdentifier(value));
  }
}

function humanizeIdentifier(value: string) {
  return value
    .replace(/[_:.-]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}
