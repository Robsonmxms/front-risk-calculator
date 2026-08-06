import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MetricCard } from "../../src/components/molecules/MetricCard";
import { DataQualityBadge } from "../../src/components/molecules/DataQualityBadge";
import { ChartShell } from "../../src/components/organisms/ChartShell";
import { ChartEmptyState } from "../../src/components/organisms/ChartEmptyState";
import { AppHeader } from "../../src/components/organisms/AppHeader";
import { ProtectedPageTemplate } from "../../src/components/templates/ProtectedPageTemplate";

describe("Atomic Design presentation components", () => {
  it("renders metric variants and data-quality semantics", () => {
    render(
      <>
        <MetricCard label="Portfólios" value={12} detail="2 pendentes" size="compact" />
        <DataQualityBadge status="partial" />
      </>
    );
    expect(screen.getByText("Portfólios")).toBeInTheDocument();
    expect(screen.getByText("2 pendentes")).toBeInTheDocument();
    expect(screen.getByText("parcial")).toBeInTheDocument();
  });

  it("composes chart and protected-page slots without owning data", () => {
    render(
      <ProtectedPageTemplate header={<span>Cabeçalho</span>} navigation={<span>Seções</span>}>
        <ChartShell eyebrow="Risco" title="Volatilidade" aside={<button>Detalhes</button>}>
          <ChartEmptyState>Sem série disponível.</ChartEmptyState>
        </ChartShell>
      </ProtectedPageTemplate>
    );
    expect(screen.getByRole("heading", { name: "Volatilidade" })).toBeInTheDocument();
    expect(screen.getByText("Sem série disponível.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Detalhes" })).toBeInTheDocument();
  });

  it("exposes labeled navigation and office selection callbacks", () => {
    const onSelectOffice = vi.fn();
    render(
      <AppHeader
        title="Painel"
        navigationItems={[{ href: "/dashboard", label: "Painel", active: true }]}
        officeOptions={[
          { id: "office-1", name: "Fortaleza" },
          { id: "office-2", name: "Recife" }
        ]}
        selectedOfficeId="office-1"
        onSelectOffice={onSelectOffice}
      />
    );
    screen.getByRole("combobox", { name: "Selecionar escritório" }).focus();
    expect(screen.getByRole("navigation", { name: "Navegação principal" })).toBeInTheDocument();
    expect(document.activeElement).toBe(screen.getByRole("combobox"));
  });
});
