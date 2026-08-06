# Atomic Design And Duplication Inventory

The frontend presentation source is enforced as `atoms -> molecules -> organisms -> templates`.
Features own state, API orchestration, authentication decisions, and route containers; presentation
components receive typed props, callbacks, and slots. `components.json` routes shadcn primitives to
`components/atoms`.

## Source-Backed Duplication Decisions

| Repeated structure | Previous sources | Decision and canonical target |
| --- | --- | --- |
| shadcn/Radix primitives | `components/ui/*` and every product route | Reclassified as atoms under `components/atoms/*`; behavior and variants preserved. |
| authenticated application header | protected route implementations plus the former `components/layout/AppHeader.tsx` | Session/RBAC mapping moved to the auth feature container; feature-neutral rendering lives in `components/organisms/AppHeader.tsx`. |
| section navigation | portfolio, workbench, diagnostics, office operations | One organism at `components/organisms/PageSectionNavigation.tsx`. |
| KPI/metric cards | office operations, compliance, diagnostics, workbench, delivery and client portal | One variant-driven molecule at `components/molecules/MetricCard.tsx`. The analytics-metric card remains feature-specific because it carries metric status, calculation version, sample evidence, and unavailable-reason semantics. |
| chart shell | diagnostics and workbench | One organism at `components/organisms/ChartShell.tsx` with an explicit heading-level variant. |
| chart empty states | diagnostics, workbench and portfolio analytics | One organism at `components/organisms/ChartEmptyState.tsx` with plain/info/warning semantic variants. |
| data-quality badge | compliance and report delivery | One molecule at `components/molecules/DataQualityBadge.tsx`. |
| shared risk charts | route-local and `components/charts/risk-charts.tsx` consumers | Consolidated under `components/organisms/risk-charts.tsx`; providers and feature state remain outside. |
| protected page shell | repeated header/navigation/content grids | Slot-based `components/templates/ProtectedPageTemplate.tsx`; authentication remains in feature containers. Existing feature layouts may adopt the slot incrementally without duplicating route-level components. |
| large route component catalogs | dashboard, portfolio detail, diagnostics, workbench, compliance, delivery, office operations/settings, clients and admin | Moved to named feature containers. App Router `page.tsx` files are now route bindings only. |
| filters, tables, forms and responsive panels | feature-specific routes | Shared visual primitives remain canonical atoms; domain field sets and column semantics stay in feature containers because their validation, labels, accessible descriptions and actions materially differ. |

## Public Contracts

Feature-neutral API contracts used by transport, realtime, presentation, or multiple features live in
`src/lib/contracts`. Cross-feature imports go through `features/<feature>/index.ts`; private files are
not importable by another feature. The automated architecture check covers relative paths, `@/*`
aliases, barrels, type-only imports, exports, dynamic imports, CommonJS imports, upward Atomic Design
imports, route-local named components, and production cycles.

The current `/admin` feature container remains a read-only roster. Root feature
`2 - hierarchical-user-management` is active but not implemented; its future role-specific routes,
forms, and responsive rosters must reuse these boundaries rather than introduce route-local or
cross-feature component copies.
