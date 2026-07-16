"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { useAuth } from "../../features/auth/AuthProvider";
import { cn } from "../../lib/utils";

type ActiveRoute =
  | "dashboard"
  | "admin"
  | "office"
  | "clients"
  | "workbench"
  | "compliance"
  | "reportDelivery"
  | "clientPortal";

export function AppHeader({
  title,
  active,
  showAdmin,
  actions
}: {
  title: string;
  active: ActiveRoute;
  showAdmin?: boolean;
  actions?: ReactNode;
}) {
  const { actor, activeOffice, officeMemberships, selectOffice } = useAuth();
  const canOpenOfficeSettings =
    actor?.role === "admin" || activeOffice?.role === "office_admin";
  const canOpenCompliance = actor?.role === "admin" || activeOffice?.role === "office_admin";
  const canOpenReportDelivery = Boolean(activeOffice && activeOffice.role !== "client");

  return (
    <header className="rounded-lg border border-border bg-card/95 px-4 py-3 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Link href="/dashboard" className="w-fit">
          <span className="block text-xs font-semibold uppercase tracking-normal text-moss">
            Risk Calculator
          </span>
          <span className="block text-lg font-semibold text-foreground">{title}</span>
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <nav className="flex items-center gap-1" aria-label="Navegacao principal">
            <HeaderLink href="/dashboard" active={active === "dashboard"}>
              Dashboard
            </HeaderLink>
            {showAdmin ? (
              <HeaderLink href="/admin" active={active === "admin"}>
                Admin
              </HeaderLink>
            ) : null}
            {activeOffice ? (
              <HeaderLink href="/dashboard/workbench" active={active === "workbench"}>
                Workbench
              </HeaderLink>
            ) : null}
            {activeOffice && canOpenCompliance ? (
              <HeaderLink href="/dashboard/compliance" active={active === "compliance"}>
                Compliance
              </HeaderLink>
            ) : null}
            {activeOffice && canOpenReportDelivery ? (
              <HeaderLink
                href="/dashboard/report-delivery"
                active={active === "reportDelivery"}
              >
                Delivery
              </HeaderLink>
            ) : null}
            {activeOffice ? (
              <HeaderLink href="/dashboard/client-portal" active={active === "clientPortal"}>
                Portal
              </HeaderLink>
            ) : null}
            {activeOffice ? (
              <HeaderLink href="/dashboard/clients" active={active === "clients"}>
                Clients
              </HeaderLink>
            ) : null}
            {activeOffice && canOpenOfficeSettings ? (
              <HeaderLink
                href={`/dashboard/offices/${activeOffice.officeId}/settings`}
                active={active === "office"}
              >
                Office
              </HeaderLink>
            ) : null}
          </nav>
          {officeMemberships.length > 1 ? (
            <select
              aria-label="Selecionar office"
              className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground shadow-sm"
              value={activeOffice?.officeId ?? ""}
              onChange={(event) => selectOffice(event.target.value)}
            >
              {officeMemberships.map((office) => (
                <option key={office.officeId} value={office.officeId}>
                  {office.officeName}
                </option>
              ))}
            </select>
          ) : activeOffice ? (
            <span className="rounded-md border border-border bg-muted px-3 py-2 text-sm font-medium text-foreground">
              {activeOffice.officeName}
            </span>
          ) : null}
          {actions}
        </div>
      </div>
    </header>
  );
}

function HeaderLink({
  href,
  active,
  children
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors",
        "hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss/25",
        active && "bg-muted text-foreground"
      )}
      aria-current={active ? "page" : undefined}
    >
      {children}
    </Link>
  );
}
