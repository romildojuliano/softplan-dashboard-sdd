# Dashboard primitives specification

## Authority

Source: `/home/prof/dev/softplan-clone/dashboard_compras_softplan_jan_jul_2026.html`; copied style rules live in `src/app/globals.css`. The source DOM and class names remain authoritative.

## Components

- `KpiCard`: label, value, optional description and accent. Emits `.kpi`, `.k-lab`, `.k-val.num`, and `.k-sub`; accent maps to `--accent`.
- `DashboardCard`: optional title, hint and header action around children. Emits `.card`, `.card-head`, `h3`, and `.hint`; callers may pass layout classes such as `span-2`.
- `ChartCanvas`: takes Chart.js `config` and optional chart class. Canvas stays inside `.chart`; `className="tall"` selects source tall height. Chart instance is destroyed before config replacement and unmount.
- `DataTable<T>`: columns contain optional sort key, header, cell renderer, alignment and cell class. Sort state is `{ key, direction }`; keyed headers call `onSort`, expose `aria-sort`, and support Enter/Space. Empty rows render `.empty` inside `.tblwrap`.
- `FilterChips`: controlled options/value/onChange. Emits `.chips`, `.chip`, `.on`, and optional `.cdot`; selected state is exposed with `aria-pressed`.
- `Pagination`: controlled 1-based page and page count. Emits `.pager`, `.btn`, `.num`; previous/next disable at boundaries.
- `Note`: children inside `.note`.
- `Badge`: children inside `.badge`; `muted` adds source class `.mut`.
- `CsvButton`: invokes `downloadCsv` with filename, headers and rows; default label is `Exportar CSV` and class is `.btn`.

## CSV contract

Every header and cell is quoted; embedded quotes double; fields use semicolons; records use CRLF; output starts with UTF-8 BOM. Download uses `text/csv;charset=utf-8` and removes its temporary anchor after click.

## Visual and responsive behavior

- KPI cards use panel background, source border/radius/padding, 29px value text, and shrink to 24px under 640px.
- Cards use source panel and asymmetric radius; `.card-head` separates title/hint from optional action.
- Charts are 292px high (392px for `.tall`), reduced to 255px/330px under 640px.
- Tables retain sticky headers and horizontal scrolling within `.tblwrap`; `.auto` removes max-height.
- Chips, buttons, notes, badges, focus rings, colors and empty state use existing source-matched styles; no new visual tokens.
- Source Chart.js defaults, visible stacked-bar total labels, tooltip styling and 380ms animation are registered once by `ChartCanvas`.
