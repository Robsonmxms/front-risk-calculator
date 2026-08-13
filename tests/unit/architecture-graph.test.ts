import { describe, expect, it } from "vitest";
import {
  collectModuleSpecifiers,
  findCycles,
  findRouteLocalComponents,
  validateFrontendDependency
} from "../../scripts/architecture-graph.mjs";

describe("frontend architecture graph", () => {
  it("collects every supported TypeScript dependency form", () => {
    expect(
      collectModuleSpecifiers(`
      import value from "./static";
      import type { Contract } from "./type-only";
      export { item } from "./barrel";
      export type { Shape } from "./type-export";
      import("./dynamic");
      require("./commonjs");
    `)
    ).toEqual(["./static", "./type-only", "./barrel", "./type-export", "./dynamic", "./commonjs"]);
  });

  it("rejects upward atomic and private cross-feature dependencies", () => {
    expect(
      validateFrontendDependency("components/atoms/button.tsx", "components/molecules/field.tsx")
    ).toContain("upward");
    expect(
      validateFrontendDependency("features/delivery/view.tsx", "features/client/clientApi.ts")
    ).toContain("index.ts");
    expect(
      validateFrontendDependency("features/delivery/view.tsx", "features/client/index.ts")
    ).toBeUndefined();
  });

  it("detects route-local components and dependency cycles", () => {
    expect(
      findRouteLocalComponents(`export default function Page() {}; function MetricCard() {}`)
    ).toEqual(["MetricCard"]);
    expect(
      findCycles(
        new Map([
          ["a", ["b"]],
          ["b", ["a"]]
        ])
      )
    ).toEqual([["a", "b", "a"]]);
  });
});
