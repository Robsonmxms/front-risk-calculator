# AGENTS.md

Guidance for AI agents working in the frontend project.

## Frontend Role

`font-risk-calculator` is the Next.js user interface for the Investment Portfolio Analytics Platform. It presents
auth, portfolio management, analytics dashboards, reports, alerts, and realtime updates.

Specs are not local to this project. Before implementation, read the relevant root macro spec in
`../.specs/features/<feature>/`.

## Planned Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js App Router |
| Language | TypeScript |
| UI | React |
| Server state | TanStack Query or equivalent |
| Forms | React Hook Form plus schema validation |
| Charts | Recharts, Tremor, Visx, or another documented chart library |
| Styling | Tailwind CSS or a project design system once chosen |
| Tests | Vitest/React Testing Library and Playwright |

## Frontend Rules

- Do not create `font-risk-calculator/.specs/`.
- The backend API is the source of truth.
- Do not call market data providers from the browser, server components, or Next route handlers.
- Do not implement analytics formulas except presentational formatting.
- Do not enforce security only in UI; backend RBAC is authoritative.
- Do not store refresh tokens in `localStorage`.
- Prefer generated API types once the backend OpenAPI contract exists.
- Show loading, empty, unauthorized, partial-data, stale-data, and error states.
- Avoid investment-advice language.

## Expected Source Layout

```text
font-risk-calculator/
  src/
    app/
      (auth)/
      (dashboard)/
    components/
      layout/
      portfolio/
      analytics/
      reports/
      ui/
    features/
      auth/
      portfolios/
      analytics/
      reports/
      alerts/
    lib/
      api/
      auth/
      realtime/
      formatters/
    types/
  tests/
    e2e/
    unit/
```

## Design Direction

- The first authenticated screen should be a useful app screen, not a landing page.
- Use tables for transactions/positions, charts for allocation/performance, and concise text for insights.
- Keep layouts analytical, professional, and usable for repeated work.
- Make async backend processing visible: pending analytics, stale market data, report jobs, and realtime updates.

