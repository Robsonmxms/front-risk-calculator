import Link from "next/link";
import { ReactNode } from "react";
import { cn } from "../../lib/utils";

type ActiveRoute = "dashboard" | "admin";

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
          </nav>
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
