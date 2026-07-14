import { ReactNode } from "react";
import { LogoutButton } from "../../features/auth/LogoutButton";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Risk Calculator</p>
          <h1>Portfolio analytics</h1>
        </div>
        <LogoutButton />
      </header>
      {children}
    </main>
  );
}
