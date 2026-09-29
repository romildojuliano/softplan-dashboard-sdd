# Softplan Purchasing Dashboard Clone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the complete January–July 2026 Softplan purchasing dashboard as a native Next.js/React application with behavior and visuals matching the local source document.

**Architecture:** A client-side `Dashboard` owns global filter and navigation state. Typed data and pure calculation modules feed shared presentation primitives and 11 isolated view components. Chart.js instances live behind one lifecycle-safe wrapper.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, Chart.js 4.4.1, Node.js 24 built-in test runner, browser automation.

**Spec:** `docs/superpowers/specs/2026-09-28-softplan-dashboard-clone-design.md`

## Global Constraints

- Preserve all 11 tabs, source data, calculations, Portuguese copy, CSV exports, sorting and pagination.
- Preserve Sora, `#181A27` background, `#2B2F47` panels, `#5C5CFF` accent and asymmetric radii.
- No `iframe`, backend, authentication, invented values or approximate chart content.
- Validate 1440 px, 768 px and 390 px; page-level horizontal overflow is forbidden.
- Every builder runs `npm run typecheck`; integration owner alone runs full build/check after merges.
- Source authority: `../dashboard_compras_softplan_jan_jul_2026.html`.

---

### Task 1: Extract auditable source artifacts and dataset

**Files:**

- Create: `scripts/extract-dashboard-source.mjs`
- Create: `src/data/dashboard-data.json`
- Create: `docs/research/PAGE_TOPOLOGY.md`
- Create: `docs/research/BEHAVIORS.md`
- Create: `docs/research/components/dashboard-foundation.spec.md`
- Create: `docs/design-references/source-desktop.png`
- Create: `docs/design-references/source-mobile.png`

**Interfaces:**

- Consumes: standalone source file.
- Produces: exact parsed `DATA` JSON and auditable topology/behavior records used by every later task.

- [x] **Step 1: Write extraction script**

Read source path from the first CLI argument (default to `../dashboard_compras_softplan_jan_jul_2026.html`), match `const DATA = (\{.*\});` between first data `<script>` tags, parse JSON, and write pretty JSON to `src/data/dashboard-data.json`. Fail when source, assignment or JSON is invalid.

- [x] **Step 2: Run extraction**

Run: `node scripts/extract-dashboard-source.mjs "<source-html-path>"`

Expected: dataset file parses and contains `meta`, `rows`, `requisicoes` and `protocolos`.

- [x] **Step 3: Capture source evidence**

At 1440×900 and 390×900, save full-page screenshots. Record all 11 tab IDs, card/chart/table counts, sticky header, filter behavior, sorting, pagination and CSV actions in topology/behavior docs.

- [x] **Step 4: Verify extraction determinism**

Run script twice and compare checksum before/after.

Expected: identical SHA-256.

- [x] **Step 5: Commit**

```bash
git add scripts/extract-dashboard-source.mjs src/data/dashboard-data.json docs/research docs/design-references
git commit -m "chore(clone): extract dashboard source artifacts"
```

### Task 2: Establish visual foundation and local Chart.js

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/app/layout.tsx:1-33`
- Replace: `src/app/globals.css:1-130`
- Create: `src/components/dashboard/Mosaic.tsx`
- Create: `docs/research/components/dashboard-shell.spec.md`

- Modify: `.superpowers/sdd/2026-09-28-softplan-dashboard-clone/task-1-report.md`
- Modify: `docs/research/BEHAVIORS.md`
- Modify: `docs/research/components/dashboard-foundation.spec.md`
- Modify: `docs/superpowers/specs/2026-09-28-softplan-dashboard-clone-design.md`

**Interfaces:**

- Consumes: source CSS tokens and global computed styles.
- Produces: Sora font variable, global dashboard token classes, local `chart.js` dependency and decorative `Mosaic`.

- [x] **Step 1: Install exact chart dependency**

Run: `npm install chart.js@4.4.1`

Expected: dependency appears under `dependencies`; no CDN remains necessary.

- [x] **Step 2: Replace layout metadata and font**

Use `Sora` from `next/font/google` with weights `200`, `300`, `400`, `500`, `600`, `700`, `latin` subset and `--font-sora`. Set `lang="pt-BR"`, title `Dashboard de Compras · Softplan · Jan–Jul 2026`, and matching description.

- [x] **Step 3: Port visual tokens and global element rules**

Copy exact source tokens, base body rules, buttons, tabs, filters, cards, tables, charts, notes, footer, reduced-motion and breakpoints. Scope selectors under `.dashboard` except `html`, `body`, selection and reset rules.

Mobile correction: `.cards-2` must not keep source `minmax(420px, 1fr)` at 390px; constrain the track to the viewport to prevent page-level overflow.

- [x] **Step 4: Implement mosaic SVG**

Render the ten source paths with identical viewBox, stroke colors, dimensions and `preserveAspectRatio="none"`.

- [x] **Step 5: Typecheck**

Run: `npm run typecheck`

Expected: exit 0.

- [x] **Step 6: Commit**

```bash
git add package.json package-lock.json src/app/layout.tsx src/app/globals.css src/components/dashboard/Mosaic.tsx docs/research/components/dashboard-shell.spec.md docs/research/BEHAVIORS.md docs/research/components/dashboard-foundation.spec.md docs/superpowers/specs/2026-09-28-softplan-dashboard-clone-design.md docs/superpowers/plans/2026-09-28-softplan-dashboard-clone.md .superpowers/sdd/2026-09-28-softplan-dashboard-clone/task-1-report.md
git commit -m "feat(dashboard): establish Softplan visual foundation"
```

### Task 3: Port typed data model, filtering and calculations

**Files:**

- Create: `src/types/dashboard.ts`
- Create: `src/types/dashboard-data-json.d.ts`
- Create: `src/lib/dashboard-calculations.ts`
- Create: `src/data/dashboard-data.ts`
- Create: `src/lib/dashboard-calculations.test.ts`
- Modify: `package.json` for the data import and test script
- Modify: `tsconfig.json` for native TypeScript test imports

**Interfaces:**

- Produces: typed `DASHBOARD_DATA`, dashboard row/filter/result types, `DEFAULT_FILTERS`, filtering, totals, month grouping, median, supplier ABC/profile/action calculations, and `brl`, `brlCompact`, `percent`, `hours` formatters.

- [x] **Step 1: Define tuple and state types**

Represent source tuple indices with named constants and readonly tuple types. `DashboardFilters` contains `months`, `companies`, `nature`, `buyer`, `category`, `query`, `origin`, `urgency`, `system`, and three page indexes.

- [x] **Step 2: Write failing default-total test**

Using typed `DASHBOARD_DATA` (from the extracted JSON) and default filters, assert:

```ts
assert.equal(totals.orders, 2267);
assert.equal(Math.round(totals.spend / 100_000), 573);
assert.equal(Math.round(totals.negotiable / 100_000), 412);
assert.equal(Math.round(totals.saving / 100_000), 40);
assert.equal(totals.negotiatedOrders, 474);
```

Also assert month/company/nature/query filtering excludes nonmatching OC, request and protocol rows.

- [x] **Step 3: Run test and observe failure**

Run: `node --test src/lib/dashboard-calculations.test.ts`

Expected: failure because calculation module is absent.

- [x] **Step 4: Port pure source calculations**

Move filtering, totals, grouping, median, ABC, supplier profile and bucket assignment into pure functions. No DOM or Chart.js imports.

- [x] **Step 5: Run focused checks**

Run: `npm test && npm run typecheck`

Expected: both exit 0.

- [x] **Step 6: Add test script and commit**

Set `"test": "node --test src/lib/dashboard-calculations.test.ts"`.

```bash
git add package.json tsconfig.json src/data/dashboard-data.ts src/types/dashboard.ts src/types/dashboard-data-json.d.ts src/lib/dashboard-calculations.ts src/lib/dashboard-calculations.test.ts
git commit -m "feat(dashboard): port typed purchasing calculations"
```

### Task 4: Build shared dashboard primitives

**Files:**

- Create: `src/components/dashboard/ChartCanvas.tsx`
- Create: `src/components/dashboard/KpiCard.tsx`
- Create: `src/components/dashboard/DashboardCard.tsx`
- Create: `src/components/dashboard/DataTable.tsx`
- Create: `src/components/dashboard/FilterChips.tsx`
- Create: `src/components/dashboard/Pagination.tsx`
- Create: `src/components/dashboard/Note.tsx`
- Create: `src/components/dashboard/Badge.tsx`
- Create: `src/components/dashboard/CsvButton.tsx`
- Create: `src/lib/csv.ts`
- Create: `docs/research/components/dashboard-primitives.spec.md`
- Modify: `package.json`
- Create: `src/lib/csv.test.ts`

**Interfaces:**

- `ChartCanvas({ config, className })` owns a `Chart` instance and destroys it before replacement/unmount.
- `DataTable<T>({ columns, rows, sort, onSort, emptyMessage })` renders semantic table and sortable headers.
- `downloadCsv(filename, headers, rows)` emits UTF-8 BOM, semicolon separators and quoted values.

- [x] **Step 1: Implement lifecycle-safe chart wrapper**

Register Chart.js controllers/elements/plugins once. Apply source defaults and `totalPilha` plugin. Keep canvas inside `.chart`; cleanup calls `destroy()`.

- [x] **Step 2: Implement presentation primitives**

Match source DOM hierarchy and class names. Keep components stateless except chart instance lifecycle.

- [x] **Step 3: Implement CSV serializer**

Escape embedded quotes by doubling; quote every field; use CRLF; create Blob URL; click temporary anchor; revoke URL.

- [x] **Step 4: Test CSV and typecheck**

Extend the `test` script to run both `src/lib/dashboard-calculations.test.ts` and `src/lib/csv.test.ts`.

Run: `npm run test && npm run typecheck`

Expected: both exit 0; CSV test covers semicolons, quotes, CRLF and UTF-8 BOM; no `any`, `@ts-ignore` or disabled lint rules.

- [x] **Step 5: Commit**

```bash
git add package.json src/components/dashboard src/lib/csv.ts src/lib/csv.test.ts docs/research/components/dashboard-primitives.spec.md
git commit -m "feat(dashboard): add shared charts tables and controls"
```

### Task 5: Build shell, tabs and global filters

**Files:**

- Create: `src/components/dashboard/Dashboard.tsx`
- Create: `src/components/dashboard/DashboardHeader.tsx`
- Create: `src/components/dashboard/DashboardTabs.tsx`
- Create: `src/components/dashboard/DashboardFilters.tsx`
- Create: `src/components/dashboard/DashboardFooter.tsx`

**Interfaces:**

- `Dashboard` passes filtered purchase/request/protocol arrays, full data, filters and local setters to active view.
- View contract: `{ data, filtered, filters, setFilters }` with typed subsets.

- [ ] **Step 1: Implement reducer/state transitions**

Port tab change, month/company toggles, nature selection, buyer/category selects, 220 ms search debounce, reset and scope-label rules. Reset relevant page indexes when filters change.

- [ ] **Step 2: Implement header/tabs/filters/footer**

Use exact source labels, ordering, ARIA roles, sticky behavior and footer methodology text.

- [ ] **Step 3: Add temporary active-view boundary**

Render a typed `children`/view registry slot without placeholder UI. Initial active tab is `geral`; tab change scrolls smoothly to top.

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/Dashboard*.tsx
git commit -m "feat(dashboard): add navigation and global filters"
```

### Task 6: Build Overview and Records views

**Files:**

- Create: `src/components/dashboard/views/OverviewView.tsx`
- Create: `src/components/dashboard/views/RecordsView.tsx`
- Create: `docs/research/components/overview-view.spec.md`
- Create: `docs/research/components/records-view.spec.md`

**Interfaces:**

- Both consume shared view contract from Task 5 and primitives from Task 4.

- [ ] **Step 1: Extract exact computed styles and content**

Capture default, hover and mobile states for both source tabs. Record five overview charts and two records charts plus table.

- [ ] **Step 2: Implement Overview**

Port five KPIs, methodology note, monthly stacked spend/saving chart, company doughnut, monthly order volume, category top ten and currency chart.

- [ ] **Step 3: Implement Records**

Port four KPIs, explanatory note, reason chart, negotiable-vs-record monthly chart and supplier table.

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/views/OverviewView.tsx src/components/dashboard/views/RecordsView.tsx docs/research/components/overview-view.spec.md docs/research/components/records-view.spec.md
git commit -m "feat(dashboard): add overview and records views"
```

### Task 7: Build Savings and ROI views

**Files:**

- Create: `src/components/dashboard/views/SavingsView.tsx`
- Create: `src/components/dashboard/views/RoiView.tsx`
- Create: `docs/research/components/savings-view.spec.md`
- Create: `docs/research/components/roi-view.spec.md`

- [ ] **Step 1: Extract every chart/table/state**

Record seven Savings cards, seven ROI cards, all cost-avoidance cards, badges, tables, top-border emphasis and source chart configs.

- [ ] **Step 2: Implement Savings**

Port monthly saving, buyer/category saving, negotiations table, discount distribution, negotiation coverage and cost-avoidance section.

- [ ] **Step 3: Implement ROI**

Port fixed full-period cost calculations, return/cost comparison, cost composition, unit cost, monthly coverage, cumulative return and two audit tables.

- [ ] **Step 4: Typecheck and commit**

Run: `npm run typecheck`

```bash
git add src/components/dashboard/views/SavingsView.tsx src/components/dashboard/views/RoiView.tsx docs/research/components/savings-view.spec.md docs/research/components/roi-view.spec.md
git commit -m "feat(dashboard): add savings and ROI views"
```

### Task 8: Build Requests view

**Files:**

- Create: `src/components/dashboard/views/RequestsView.tsx`
- Create: `docs/research/components/requests-view.spec.md`

- [ ] **Step 1: Extract all request states**

Capture system and urgency filter combinations, sortable buyer table, 50-row pagination, CSV, 12 chart canvases and all responsive subgrids.

- [ ] **Step 2: Implement metrics and charts**

Port unique requests by month, method distortion, buyer/company load, monthly buyer load, request-vs-PO, urgency split, offender rankings, recurrence and person volume.

- [ ] **Step 3: Implement detail table and local controls**

Preserve sort keys/directions, page reset rules, disabled pager state and CSV columns.

- [ ] **Step 4: Typecheck and commit**

Run: `npm run typecheck`

```bash
git add src/components/dashboard/views/RequestsView.tsx docs/research/components/requests-view.spec.md
git commit -m "feat(dashboard): add requests analytics view"
```

### Task 9: Build Buyers view

**Files:**

- Create: `src/components/dashboard/views/BuyersView.tsx`
- Create: `docs/research/components/buyers-view.spec.md`

- [ ] **Step 1: Extract table and chart configs**

Record four KPIs, sortable performance table and three charts at desktop/mobile.

- [ ] **Step 2: Implement view**

Port performance, monthly workload, spend/saving and approval-to-PO cycle distribution.

- [ ] **Step 3: Typecheck and commit**

Run: `npm run typecheck`

```bash
git add src/components/dashboard/views/BuyersView.tsx docs/research/components/buyers-view.spec.md
git commit -m "feat(dashboard): add buyers performance view"
```

### Task 10: Build Invoices view

**Files:**

- Create: `src/components/dashboard/views/InvoicesView.tsx`
- Create: `docs/research/components/invoices-view.spec.md`

- [ ] **Step 1: Extract invoice states**

Capture origin filters, six KPIs, 12 charts, outside-hours badge/table, sortable 50-row detail table, pagination and CSV.

- [ ] **Step 2: Implement charts and local origin filter**

Port monthly protocols, company/origin/payment/country distributions, responsible load, suppliers, weekday/hour rhythm and outside-hours analyses.

- [ ] **Step 3: Implement detail tables and export**

Preserve date/time ordering, commercial-window definition, extreme records and page controls.

- [ ] **Step 4: Typecheck and commit**

Run: `npm run typecheck`

```bash
git add src/components/dashboard/views/InvoicesView.tsx docs/research/components/invoices-view.spec.md
git commit -m "feat(dashboard): add invoice protocol view"
```

### Task 11: Build Categories and Suppliers views

**Files:**

- Create: `src/components/dashboard/views/CategoriesView.tsx`
- Create: `src/components/dashboard/views/SuppliersView.tsx`
- Create: `docs/research/components/categories-view.spec.md`
- Create: `docs/research/components/suppliers-view.spec.md`

- [ ] **Step 1: Extract exact charts and tables**

Capture category spend/month charts, detail table, supplier Pareto/ABC/saving charts and ranking table.

- [ ] **Step 2: Implement Categories**

Port four KPIs, all-category chart, top-six monthly evolution and detail table.

- [ ] **Step 3: Implement Suppliers**

Port four KPIs, ABC methodology note, top-25 Pareto, class concentration, top saving and ranking.

- [ ] **Step 4: Typecheck and commit**

Run: `npm run typecheck`

```bash
git add src/components/dashboard/views/CategoriesView.tsx src/components/dashboard/views/SuppliersView.tsx docs/research/components/categories-view.spec.md docs/research/components/suppliers-view.spec.md
git commit -m "feat(dashboard): add category and supplier views"
```

### Task 12: Build Rationalization and Database views

**Files:**

- Create: `src/components/dashboard/views/RationalizationView.tsx`
- Create: `src/components/dashboard/views/DatabaseView.tsx`
- Create: `docs/research/components/rationalization-view.spec.md`
- Create: `docs/research/components/database-view.spec.md`

- [ ] **Step 1: Extract exact action buckets and base states**

Record eight rationalization cards, six tables, three charts, action-bucket rules, duplicate records and base table sorting/pagination/CSV.

- [ ] **Step 2: Implement Rationalization**

Port ABC paradox, mutually exclusive action plan, umbrella candidates, fragmentation, value bands, duplicates and disproportionate invoice load.

- [ ] **Step 3: Implement Database**

Port four KPIs, sortable 50-row purchase table, pager and CSV export.

- [ ] **Step 4: Typecheck and commit**

Run: `npm run typecheck`

```bash
git add src/components/dashboard/views/RationalizationView.tsx src/components/dashboard/views/DatabaseView.tsx docs/research/components/rationalization-view.spec.md docs/research/components/database-view.spec.md
git commit -m "feat(dashboard): add rationalization and database views"
```

### Task 13: Assemble route and run behavioral/visual QA

**Files:**

- Replace: `src/app/page.tsx:1-9`
- Modify: `src/components/dashboard/Dashboard.tsx`
- Create: `scripts/smoke-dashboard.mjs`
- Create: `.impeccable/review/desktop.png`
- Create: `.impeccable/review/mobile.png`
- Modify: `README.md`

**Interfaces:**

- Route `/` renders `Dashboard` and imports all views through a typed registry.

- [ ] **Step 1: Wire all views**

Map tab IDs `geral`, `reg`, `saving`, `roi`, `req`, `comp`, `prot`, `cat`, `forn`, `rac`, `base` to components. Remove scaffold placeholder completely.

- [ ] **Step 2: Write browser smoke script**

Against local production server, assert every tab activates matching panel; default KPI texts include `R$ 57,3 mi`, `R$ 41,2 mi`, `R$ 4,0 mi`, `R$ 25 mil`, `474`; month/company/nature filters change scope; reset restores `Jan–Jul`; sortable header changes direction; each pager changes page; CSV buttons trigger downloads.

- [ ] **Step 3: Run repository checks**

Run: `npm run test && npm run check`

Expected: all tests, lint, typecheck and production build exit 0.

- [ ] **Step 4: Run production smoke**

Start `npm start` from successful build, run `node scripts/smoke-dashboard.mjs`, observe all assertions pass.

- [ ] **Step 5: Capture and compare first QA round**

Capture source and clone at 1440×900, 768×900 and 390×900 from document top after charts settle. Compare section-by-section, update specs if extraction was wrong, then batch-fix layout/content/state drift.

- [ ] **Step 6: Confirm second QA round**

Recapture all three viewport sizes once. Confirm no page-level horizontal overflow, all 11 tabs and key interactions work.

- [ ] **Step 7: Run mechanical detector once**

```bash
/home/prof/.omp/agent/skills/impeccable/scripts/impeccable detect --json src/app/page.tsx src/app/layout.tsx src/app/globals.css src/components/dashboard
```

Fix mechanical findings; do not rerun detector.

- [ ] **Step 8: Update README and commit**

Document `npm run dev`, `npm run check`, dashboard scope and source provenance.

```bash
git add src scripts README.md .impeccable/review docs/research docs/design-references package.json package-lock.json
git commit -m "feat(dashboard): deliver complete Softplan clone"
```
