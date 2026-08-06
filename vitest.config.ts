import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      exclude: [".next/**", "next-env.d.ts", "tests/**", "src/app/layout.tsx", "src/app/page.tsx"],
      include: [
        "src/components/layout/AppHeader.tsx",
        "src/components/charts/risk-charts.tsx",
        "src/features/**/*Api.ts",
        "src/features/auth/sessionStore.ts",
        "src/lib/api/config.ts",
        "src/lib/api/client.ts",
        "src/lib/presentation.ts",
        "src/lib/realtime/client.ts"
      ],
      provider: "v8",
      reporter: ["text", "json-summary"],
      thresholds: {
        branches: 60,
        functions: 80,
        lines: 80,
        statements: 80
      }
    },
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        url: "http://localhost"
      }
    },
    globals: true,
    maxWorkers: 1,
    testTimeout: 20_000,
    setupFiles: ["tests/setup.ts"],
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"]
  }
});
