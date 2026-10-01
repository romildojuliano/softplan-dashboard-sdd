# Requests view

Source: `dashboard_compras_softplan_jan_jul_2026.html`, markup lines 462–572; `passaReq` lines 915–926; `reqSorted`, `viewReq`, and `exportCsvReq` lines 1354–1632. Implemented by `RequestsView` with `DashboardViewProps`.

## Structure

Five KPIs: unique requests (detailed versus estimated), per-month mean, per-buyer mean and maximum, item lines per detailed request, and urgent share among requests reporting urgency. Source note explains unique-request counting, corrupted 1DOC company fields, and estimated requests. Cards appear in source order: stacked Oracle/1DOC requests by month; unique requests versus item lines with total and distortion summary; buyer load; company split; stacked buyer load by month; sortable buyer performance; monthly requests versus distinct purchase orders; urgency percentages by system and monthly urgency; separate Oracle creators and 1DOC approvers, recurrence, top-40 full ranking and interpretive note; total volume by person; detailed request table and CSV.

## Data and states

`filtered.requisicoes` already applies month, company, buyer, urgency, system and top search (`description`, request number, requester). Local chips update `filters.system` (`null`, `0`, `1`) and `filters.urgency` (`null`, `1`, `0`) with `setFilters`, resetting zero-based `pageReq` to zero. Purchase-order comparison uses `filtered.rows`, counting distinct PO numbers by month. Month-chart axes retain all months, including months with zero matching requests.

Estimated rows have tuple index 9 (`REQUEST_INDEX.estimated`) equal to `1`: count toward request and buyer totals, contribute one row to old-method month comparisons, show `Estimada` instead of request number and blank item count in CSV, and do not contribute to detailed item-line totals, company/urgency/offender metrics when fields are absent. Company count excludes negative company indexes. Urgency percentages divide by records with nonnegative urgency. Creator and approver rankings remain separate per system; recurrence requires at least five requests and at least one urgent request. Source ranked table takes 40 rows, graphs take top 10 per system, top 14 recurrent and top 15 people.

Buyer performance table sorts on every column, without changing chart ranking; request detail sorts all nine columns with source defaults (`Nº req` descending), resetting page on sort. The detail table shows 50 rows per page; pagination adapts from zero-based `filters.pageReq` to one-based `Pagination`, clamping stale pages when selection shrinks. CSV exports **all selected rows in current sort order**, not just visible page: semicolon-separated, UTF-8 BOM, source 11 headers and source filename `requisicoes_unicas_selecao.csv`. Empty selections retain zero-valued KPIs, charts with empty series, an empty table message and disabled pagination. Charts use the existing source palette, grid and tooltip calculations; responsive two-column/subgrid/card classes come from shared CSS.
