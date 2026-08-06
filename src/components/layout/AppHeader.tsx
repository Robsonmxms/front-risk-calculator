"use client";

import Link from "next/link";
import { ReactNode, useState } from "react";
import { useAuth } from "../../features/auth/AuthProvider";
import { cn } from "../../lib/utils";

type ActiveRoute =
  | "dashboard"
  | "admin"
  | "office"
  | "clients"
  | "workbench"
  | "analyticsDiagnostics"
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
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const isClientOffice = activeOffice?.role === "client";
  const canOpenOfficeSettings =
    actor?.role === "admin" || activeOffice?.role === "office_admin";
  const canOpenCompliance = actor?.role === "admin" || activeOffice?.role === "office_admin";
  const canOpenReportDelivery = Boolean(activeOffice && !isClientOffice);
  const canOpenTeamAreas = Boolean(activeOffice && !isClientOffice);
  const navItems = [
    { href: "/dashboard", active: active === "dashboard", label: "Painel", visible: true },
    { href: "/admin", active: active === "admin", label: "Administração", visible: Boolean(showAdmin) },
    { href: "/dashboard/workbench", active: active === "workbench", label: "Mesa", visible: canOpenTeamAreas },
    {
      href: "/dashboard/analytics-diagnostics",
      active: active === "analyticsDiagnostics",
      label: "Diagnósticos",
      visible: canOpenTeamAreas
    },
    {
      href: "/dashboard/compliance",
      active: active === "compliance",
      label: "Conformidade",
      visible: Boolean(activeOffice && canOpenCompliance)
    },
    {
      href: "/dashboard/report-delivery",
      active: active === "reportDelivery",
      label: "Entregas",
      visible: Boolean(activeOffice && canOpenReportDelivery)
    },
    {
      href: "/dashboard/client-portal",
      active: active === "clientPortal",
      label: "Portal do cliente",
      visible: Boolean(activeOffice)
    },
    {
      href: "/dashboard/clients",
      active: active === "clients",
      label: "Clientes",
      visible: canOpenTeamAreas
    },
    {
      href: activeOffice ? `/dashboard/offices/${activeOffice.officeId}/settings` : "/dashboard",
      active: active === "office",
      label: "Escritório",
      visible: Boolean(activeOffice && canOpenOfficeSettings)
    }
  ].filter((item) => item.visible);
  const activeNavLabel = navItems.find((item) => item.active)?.label ?? "Menu";

  return (
    <header className="rounded-lg border border-border bg-card/95 px-4 py-4 shadow-sm sm:px-5">
      <div className="grid gap-4">
        <div className="flex min-w-0 items-start justify-between gap-4">
          <Link href="/dashboard" className="min-w-0 max-w-2xl">
            <span className="block text-xs font-semibold uppercase tracking-normal text-moss">
              Risk Calculator
            </span>
            <span className="mt-0.5 block text-lg font-semibold leading-tight text-foreground sm:text-xl">
              {title}
            </span>
          </Link>

          <button
            type="button"
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground shadow-sm md:hidden",
              "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss/25"
            )}
            aria-controls="app-header-mobile-nav"
            aria-expanded={isMobileNavOpen}
            onClick={() => setIsMobileNavOpen((current) => !current)}
          >
            <span className="grid h-4 w-4 gap-1" aria-hidden="true">
              <span className="h-0.5 rounded-full bg-current" />
              <span className="h-0.5 rounded-full bg-current" />
              <span className="h-0.5 rounded-full bg-current" />
            </span>
            <span>{activeNavLabel}</span>
          </button>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-3 md:justify-end">
          <nav
            className="order-last hidden w-full flex-wrap items-center gap-1 border-t border-border pt-3 md:flex"
            aria-label="Navegação principal"
          >
            {navItems.map((item) => (
              <HeaderLink key={item.href} href={item.href} active={item.active}>
                {item.label}
              </HeaderLink>
            ))}
          </nav>
          {officeMemberships.length > 1 ? (
            <select
              aria-label="Selecionar escritório"
              name="selectedOfficeId"
              className="h-9 max-w-full rounded-md border border-border bg-background px-3 text-sm text-foreground shadow-sm"
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
            <span className="max-w-full break-words rounded-md border border-border bg-muted px-3 py-2 text-sm font-medium leading-tight text-foreground">
              {activeOffice.officeName}
            </span>
          ) : null}
          {actions}
        </div>
      </div>

      {isMobileNavOpen ? (
        <nav
          id="app-header-mobile-nav"
          className="mt-4 grid gap-1 border-t border-border pt-3 md:hidden"
          aria-label="Navegação principal"
        >
          {navItems.map((item) => (
            <HeaderLink
              key={item.href}
              href={item.href}
              active={item.active}
              className="min-h-11 justify-start px-3"
              onNavigate={() => setIsMobileNavOpen(false)}
            >
              {item.label}
            </HeaderLink>
          ))}
        </nav>
      ) : null}
    </header>
  );
}

function HeaderLink({
  href,
  active,
  className,
  onNavigate,
  children
}: {
  href: string;
  active: boolean;
  className?: string;
  onNavigate?: () => void;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "inline-flex rounded-md px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors sm:px-3",
        "hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss/25",
        active && "bg-muted text-foreground",
        className
      )}
      aria-current={active ? "page" : undefined}
    >
      {children}
    </Link>
  );
}
