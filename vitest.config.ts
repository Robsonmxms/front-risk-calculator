import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      exclude: [
        ".next/**",
        "next-env.d.ts",
        "tests/**",
        "src/app/layout.tsx",
        "src/app/page.tsx"
      ],
      include: [
        "src/components/layout/AppHeader.tsx",
        "src/features/**/*Api.ts",
        "src/features/auth/sessionStore.ts",
        "src/lib/api/client.ts"
      ],
      provider: "v8",
      reporter: ["text", "json-summary"],
      thresholds: {
        branches: 80,
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
    setupFiles: ["tests/setup.ts"],
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"]
  }
});
