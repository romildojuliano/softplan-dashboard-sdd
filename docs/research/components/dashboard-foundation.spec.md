# Dashboard foundation specification

## Source of truth

- Source is `/home/prof/dev/softplan-clone/dashboard_compras_softplan_jan_jul_2026.html`; standalone HTML remains behavioral and visual authority.
- Exact embedded `const DATA` object is checked in at `src/data/dashboard-data.json`. `scripts/extract-dashboard-source.mjs [source-path]` extracts it; no normalization, generated values, or derived fields are added.
- Topology and observable interaction contract: `docs/research/PAGE_TOPOLOGY.md` and `docs/research/BEHAVIORS.md`. Reference images: full-page source captures at 1440×900 and 390×900.

## Data contract

Root object retains source keys and values: `meta`, `rows`, `requisicoes`, `protocolos`, plus all additional source keys. Metadata dimension arrays and compact positional row layouts must be consumed according to index constants/helpers in source HTML; arrays must not be reordered or coerced. Keep negative and sentinel values, duplicate lines, estimated records, and source ordering intact. Financial and count semantics are not interchangeable: monthly/order-volume measures count distinct OCs where defined; spend/saving aggregate lines. Do not “correct” source data or assume all months share one row granularity.

## UI surface contract

Native React implementation must reproduce all 11 source views (`geral`, `reg`, `saving`, `roi`, `req`, `comp`, `prot`, `cat`, `forn`, `rac`, `base`), Portuguese copy, card/chart/table topology, global/local filters, sort semantics, pagination, and all CSV exports. No iframe or backend; all source data/calculation behavior remains client-side. Preserve source conversion and display assumptions, including USD conversion at R$5,20 and source caveats. Responsive targets are 1440×900 and 390×900; top bar is sticky; chart and table content stays reachable on mobile.
- At 390px, source `.cards-2` minimum track makes document width 435px; clone must constrain that track to the viewport and retain scrolling only within tabs/tables.

## Evidence

- `source-desktop.png`: actual source page, 1440×900 viewport, full-page image.
- `source-mobile.png`: actual source page, 390×900 viewport, full-page image.
- Screenshots include the default Visão geral state after load/chart settlement. These are source references, not clone screenshots.
