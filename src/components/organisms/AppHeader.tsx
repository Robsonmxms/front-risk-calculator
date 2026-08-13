"use client";

import Link from "next/link";
import { ReactNode, useState } from "react";
import { cn } from "../../lib/utils";

export interface AppHeaderNavigationItem {
  href: string;
  label: string;
  active: boolean;
}

export interface AppHeaderOfficeOption {
  id: string;
  name: string;
}

export function AppHeader({
  title,
  navigationItems,
  officeOptions,
  selectedOfficeId,
  selectedOfficeName,
  onSelectOffice,
  actions
}: {
  title: string;
  navigationItems: AppHeaderNavigationItem[];
  officeOptions: AppHeaderOfficeOption[];
  selectedOfficeId?: string;
  selectedOfficeName?: string;
  onSelectOffice?: (officeId: string) => void;
  actions?: ReactNode;
}) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const activeNavLabel = navigationItems.find((item) => item.active)?.label ?? "Menu";

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
            {navigationItems.map((item) => (
              <HeaderLink key={item.href} {...item} />
            ))}
          </nav>
          {officeOptions.length > 1 ? (
            <select
              aria-label="Selecionar escritório"
              name="selectedOfficeId"
              className="h-9 max-w-full rounded-md border border-border bg-background px-3 text-sm text-foreground shadow-sm"
              value={selectedOfficeId ?? ""}
              onChange={(event) => onSelectOffice?.(event.target.value)}
            >
              {officeOptions.map((office) => (
                <option key={office.id} value={office.id}>
                  {office.name}
                </option>
              ))}
            </select>
          ) : selectedOfficeName ? (
            <span className="max-w-full break-words rounded-md border border-border bg-muted px-3 py-2 text-sm font-medium leading-tight text-foreground">
              {selectedOfficeName}
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
          {navigationItems.map((item) => (
            <HeaderLink
              key={item.href}
              {...item}
              className="min-h-11 justify-start px-3"
              onNavigate={() => setIsMobileNavOpen(false)}
            />
          ))}
        </nav>
      ) : null}
    </header>
  );
}

function HeaderLink({
  href,
  active,
  label,
  className,
  onNavigate
}: AppHeaderNavigationItem & { className?: string; onNavigate?: () => void }) {
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
      {label}
    </Link>
  );
}
