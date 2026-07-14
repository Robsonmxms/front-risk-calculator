# AGENTS.md

Guidance for AI agents working in the frontend project.

## Frontend Role

`front-risk-calculator` is the Next.js user interface for the Investment Portfolio Analytics
Platform. Today it presents auth, protected routes, dashboard/account access visibility, admin
user listing, and session-expired or unauthorized states.

Portfolio management, reports, alerts, richer analytics dashboards, and realtime remain planned
macro-spec scope and are not implemented yet.

Specs are not local to this project. Before implementation, read the relevant root macro spec in
`../.specs/features/<feature>/`.

## Current Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 App Router |
| Language | TypeScript |
| UI | React 19 |
| State/session | React context plus browser storage |
| Forms | Local React form state |
| Styling | App-level global CSS |
| Tests | Vitest, Testing Library, jsdom |

## Frontend Rules

- Do not create `front-risk-calculator/.specs/`.
- The backend API is the source of truth.
- Do not call market data providers from the browser, server components, or Next route handlers.
- Do not implement analytics formulas except presentational formatting.
- Do not enforce security only in UI; backend RBAC is authoritative.
- Do not store refresh tokens in `localStorage`.
- Keep `accessToken` and actor in `sessionStorage`; keep refresh token out of browser storage.
- Prefer generated API types once the backend OpenAPI contract exists.
- Show loading, unauthorized, session-expired, and error states where the current flow needs them.
- Avoid investment-advice language.

## Source Layout

```text
front-risk-calculator/
  src/
    app/
      (auth)/
      (dashboard)/
    components/
      layout/
    features/
      auth/
    lib/
      api/
  tests/
    unit/
```

## Design Direction

- The first authenticated screen should be a useful app screen, not a landing page.
- Keep layouts analytical, professional, and usable for repeated work.
- Reflect backend session state clearly: authenticated, guest, expired, unauthorized.
