# Task 1 report — source artifacts and dataset

## Deliverables

- `scripts/extract-dashboard-source.mjs` extracts the embedded `const DATA` assignment from the supplied HTML path, parses JSON, and writes `src/data/dashboard-data.json` without transformation.
- `src/data/dashboard-data.json` retains source keys `meta`, `rows`, `protocolos`, `requisicoes`: 2,656 rows, 1,175 requests and 2,317 protocols.
- `docs/research/PAGE_TOPOLOGY.md` documents the 11-tab topology, source DOM inventory and data layout.
- `docs/research/BEHAVIORS.md` documents source filters, sorting, pagination, CSV, responsive and chart behavior.
- `docs/research/components/dashboard-foundation.spec.md` records the source-of-truth and preservation requirements.
- `docs/design-references/source-desktop.png` and `source-mobile.png` are genuine full-page Chromium screenshots at CSS viewports 1440×900 and 390×900.

## Evidence

Rendered source URL: `http://127.0.0.1:4173/dashboard_compras_softplan_jan_jul_2026.html`. Selector counts: 11 tabs, 63 `.card` elements, 5 separate `.kpi` blocks, 52 `canvas` elements; no browser errors. Source CSS breakpoints: 980px (`.span-2`), 820px (`.subgrid`), 640px (mobile sizing/padding). Screenshots are device-scale PNGs: desktop 1800×2079, mobile 544×4919. Charts loaded from jsDelivr; Google Fonts load was not independently verified.

Extraction ran twice with the explicit HTML source path; SHA-256 remained `8ea06b902ddf8ebe44c8052cc43a5f7d3bb285c3330490c841593a782b3714cc`. Dataset key/count check passed. Missing-source input failed nonzero and left dataset checksum unchanged. Node version used: `v24.21.0`.

## Commit

`3ceca70 chore(clone): extract dashboard source artifacts`
