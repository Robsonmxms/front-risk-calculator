import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { PageSectionNavigation } from "../../src/components/layout/PageSectionNavigation";
import { Table, TableViewport } from "../../src/components/ui/table";

describe("responsive UI primitives", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/dashboard");
  });

  it("exposes wide tables as named keyboard-scrollable regions", () => {
    render(
      <TableViewport label="Posições do portfólio">
        <Table>
          <tbody>
            <tr>
              <td>Ativo</td>
            </tr>
          </tbody>
        </Table>
      </TableViewport>
    );

    const region = screen.getByRole("region", { name: "Posições do portfólio" });
    expect(region).toHaveAttribute("tabindex", "0");
    expect(
      screen.getByText("Deslize horizontalmente para consultar todas as colunas.")
    ).toBeVisible();
  });

  it("keeps dense page sections reachable and identifies the selected anchor", () => {
    render(
      <PageSectionNavigation
        links={[
          { href: "#resumo", label: "Resumo" },
          { href: "#graficos", label: "Gráficos" }
        ]}
      />
    );

    const summaryLink = screen.getByRole("link", { name: "Resumo" });
    const chartsLink = screen.getByRole("link", { name: "Gráficos" });
    expect(summaryLink).toHaveAttribute("aria-current", "location");

    fireEvent.click(chartsLink);

    expect(chartsLink).toHaveAttribute("aria-current", "location");
    expect(summaryLink).not.toHaveAttribute("aria-current");
  });
});
