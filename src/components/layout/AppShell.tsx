"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "../../features/auth/AuthProvider";
import { LogoutButton } from "../../features/auth/LogoutButton";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { actor } = useAuth();

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Risk Calculator</p>
          <h1>Portfolio analytics</h1>
        </div>
        <div className="topbar__actions">
          <nav className="topbar__nav" aria-label="Principal">
            <Link
              href="/dashboard"
              className={pathname === "/dashboard" ? "nav-link nav-link--active" : "nav-link"}
            >
              Dashboard
            </Link>
            {actor?.role === "admin" ? (
              <Link
                href="/admin"
                className={pathname === "/admin" ? "nav-link nav-link--active" : "nav-link"}
              >
                Admin
              </Link>
            ) : null}
          </nav>
          <LogoutButton />
        </div>
      </header>
      {children}
    </main>
  );
}
