## Target

Complete Tasks 5–13 of `docs/superpowers/plans/2026-09-28-softplan-dashboard-clone.md`, preserving existing dashboard implementation.

## Dependents

- `src/components/dashboard/Dashboard.tsx`: owns view registry, filters and purchase CSV ordering.
- `src/types/dashboard.ts`: `DashboardViewProps` is consumed by Dashboard and all 11 views.
- Buyers, Categories, Requests and Invoices currently own sort state locally; unmounting an active view loses its sort selection.
- Database already receives persistent sorting from Dashboard; keep its table and both purchase CSV exports aligned.
- Other seven views ignore sorting props and need no behavior change.

## Affected Stories

No release-plan stories exist. Approved implementation tasks 5, 8, 9, 10, 11, 12 and 13 cover state, views and browser acceptance.

## Test Coverage

- `npm test`: calculation/filter boundaries and CSV serialization.
- `scripts/smoke-dashboard.mjs`: all 11 tabs at 1440/768/390, filters, search, sorting, pagination and downloads.
- Added regression: sort each of four affected tables, switch tabs, return, and compare direction and displayed rows; clearing filters must retain direction.
- Before fix, production smoke fails with `comp preserves sort across tabs`: actual `descending`, expected `ascending`.
- Source browser preserves protocol ascending sort after tab round trip; clone resets it to descending.
- Default source/clone browser comparison matches all KPI values, card titles, displayed table rows and 52 chart datasets.

## Risk: High

Shared view contract affects 11 components. Sorting moves to existing Dashboard state; only sortable views consume changed props. LSP reference lookup unavailable (`No language server found for this action`); explicit imports/usages enumerated with grep.

## Recommended action

Keep one active view mounted. Hoist sorting into Dashboard rather than mounting hidden views, adding persistence storage or introducing a new state library. Rebuild and rerun production smoke after changes.

## Filtered ROI opportunity

Source `viewRoi` keeps period costs and return totals fixed but derives avoidable orders from filtered purchase and invoice rows through `perfilFornecedores`. `RoiView` incorrectly used full-period supplier profiles for both calculations.

Scope: `RoiView` supplier-profile inputs only; shared calculations and period ROI remain unchanged. Production regression fails for Fev / Poligraph / Só registros: 785 avoidable orders instead of 5. Retain regression in `scripts/smoke-dashboard.mjs`.
