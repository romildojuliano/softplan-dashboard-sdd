# Source dashboard topology

Authoritative source: `/home/prof/dev/softplan-clone/dashboard_compras_softplan_jan_jul_2026.html` (standalone `pt-BR` document). Captures: `docs/design-references/source-desktop.png` (1440×900 viewport) and `source-mobile.png` (390×900 viewport), both full-page Chromium screenshots after load. The embedded DATA source is extracted without transformation to `src/data/dashboard-data.json`.

## Shared shell

- Sticky top bar with title/period and USD conversion pill (`R$ 5,20`), current-selection CSV export, horizontally scrollable tab strip.
- Global filters: creation month chips; company chips; nature chips (all, negotiable, records, saving); buyer select; category select; free-text search; clear filters action.
- Main panel shows exactly one selected view; KPI strip/note followed by cards with charts and/or tables; footer explains period, row scope, and field dates.
- Source CSS breakpoint at 700px changes cards to one column, narrows horizontal padding and chart heights; tab and chip strips can overflow horizontally.
- Header is `position: sticky; top: 0; z-index: 40`; table headings independently sticky within tables.

## Tabs and content inventory

IDs below are source `TABS` IDs; each maps to view section `v-<ID>`. There are **11 tabs, 63 cards, 52 canvases/charts, and 20 table containers** in the complete document.

| ID | Portuguese label | View contents |
| `geral` | Visão geral | 5 KPI; 5 charts: monthly spend/saving, spend by company, monthly order volume, top categories, currency. |
| `reg` | Registros | KPIs and 3 cards: 2 charts and supplier table by record reason. |
| `saving` | Savings | KPIs; monthly, buyer/category, discount-distribution, coverage charts; negotiation tables and avoidance summary. |
| `roi` | ROI do time | KPIs/note; team-return, cost composition, unit cost, monthly and cumulative return charts; calculation and operational-cost tables. |
| `req` | Requisições | KPIs/note; system/urgency local filters; monthly, unique-vs-line, buyer, company, urgency, and person charts; buyer table and paged/exportable request detail. |
| `comp` | Compradores | KPIs; performance table; workload, spend/saving, cycle-time charts. |
| `prot` | Notas fiscais | KPIs/note; origin filter; protocol volume, company, origin, payment, country, owner, supplier, rhythm/out-of-hours charts; paged/exportable protocol detail. |
| `cat` | Categorias | KPIs; spend and monthly category charts; category table. |
| `forn` | Fornecedores · Curva ABC | KPIs/note; Pareto, ABC concentration and saving charts; supplier ranking table. |
| `rac` | Racionalização | KPIs/note; ABC paradox, class-C action plan, umbrella-contract, fragmentation, order-value charts; tables for plans, fragmentation, duplicate vendors, invoice load. |
| `base` | Base de dados | KPIs; sortable/paged order table and CSV. |

The 20 table mount points (excluding tab strip `tabs`) are `tReg`, `tSavTop`, `tCA`, `tRoi`, `tRoiOp`, `tQComp`, `tOfensores`, `tReq`, `tComp`, `tFora`, `tProt`, `tCat`, `tForn`, `tParadoxo`, `tPlano`, `tGuarda`, `tFrag`, `tDup`, `tNF`, `tBase`; some are conditional/summary.

## Data orientation

`DATA.meta` contains dimension labels and other source metadata; `DATA.rows` is the order-line dataset, `DATA.requisicoes` normalized unique requests, and `DATA.protocolos` invoice protocol records. Source encodes records as compact positional arrays; indices and derived calculation rules are defined in the source HTML scripts. Preserve source values and ordering; do not infer replacements for sentinel/estimated values. June order rows have item-level detail while other months may have one consolidated row per OC, as the source note explains.
