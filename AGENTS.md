# AGENTS.md

Guidance for AI agents working in the frontend project.

## Frontend Role

`front-risk-calculator` is the Next.js user interface for the Investment Portfolio Analytics
Platform. Today it presents auth, protected routes, dashboard/account access visibility, admin
user listing, portfolio dashboard/detail flows, market-data-assisted transaction entry, analytics
views, report requests, alert setup, notifications, realtime refresh, and session-expired or
unauthorized states.

Production-grade report templates, external object storage, and hardened realtime operations remain
planned macro-spec scope.

Specs are not local to this project. Before implementation, read the relevant root macro spec in
`../.specs/features/<feature>/`.

## Current Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 App Router |
| Language | TypeScript |
| UI | React 19 |
| Component system | shadcn/ui component registry, built over Radix UI primitives and Tailwind CSS |
| State/session | React context plus browser storage |
| Forms | Local React form state |
| Styling | Tailwind CSS utilities; no handcrafted pure CSS for product UI |
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
- Use `shadcn/ui` as the chosen component system for new or touched UI surfaces. It is the best fit
  for this product because it provides quiet, refined defaults while keeping the component source in
  the project, so the UI can be tuned for affluent investors, analysts, and administrators without
  fighting a generic theme.
- The component system must remain free and open-source for commercial project use. Use the
  MIT-licensed `shadcn/ui` and Radix UI primitives only; do not add paid, Pro, subscription,
  marketplace, or trial-gated component libraries, themes, blocks, templates, or add-ons.
- Prefer `shadcn/ui` and Radix-based primitives for buttons, fields, inputs, selects, checkboxes,
  radio groups, dialogs, sheets, dropdown menus, tabs, breadcrumbs, sidebars, alerts, tables,
  data-table patterns, charts, cards, skeletons, empty states, tooltips, pagination, and command
  palettes.
- Style product UI with Tailwind utilities, component variants, and shared design tokens. Do not add
  handcrafted CSS modules, page-level CSS, or ad hoc selectors for product screens.
- Keep `globals.css` limited to Tailwind directives, Tailwind layers, `shadcn/ui` design tokens, and
  framework-level entrypoints.
- Treat existing non-`shadcn/ui` component usage as legacy unless a macro spec explicitly keeps it
  in scope; new implementation should not expand that surface.
- Do not introduce another React component library unless a root macro spec documents a concrete
  component gap, the target user impact, and why `shadcn/ui` plus Radix primitives cannot cover it
  cleanly.

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
      portfolio/
    lib/
      api/
  tests/
    unit/
```

## Design Direction

- The first authenticated screen should be a useful app screen, not a landing page.
- Keep layouts analytical, professional, and usable for repeated work.
- Reflect backend session state clearly: authenticated, guest, expired, unauthorized.
