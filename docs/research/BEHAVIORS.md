# Source dashboard behaviors

Authority: standalone source HTML listed in `PAGE_TOPOLOGY.md`. All behavior below comes from the source DOM, event handlers, and calculations; clone must preserve it rather than approximating it.

## Navigation and global filtering

- `TABS` lists 11 IDs in documented order. Click selects that view, updates tab/view classes, resets base-table page to first, rerenders and scrolls to page top. Selection is in-memory, not URL routing.
- Month and company chips are independent multi-select sets. Nature is a single-select among all, negotiable (`r[R] < 0`), record (`r[R] >= 0`), and saving (`r[S] > 0`). Buyer/category selects are single-select.
- Search waits 220 ms, trims and lowercases text. Orders search supplier, description, or OC number; protocols search supplier, payment method, or country; requests search description, request number, or requester. Common month/company/buyer filters apply to each data family; category and nature apply to orders. Protocol origin (national/exterior) and request system/urgency are additional family-specific filters.
- Clear filters resets all global and local filter values, clears selections and search, restores default chips, resets pagination and rerenders.
- Order status counts distinguish records vs negotiable orders. Source notes distinguish unique-OC volume counts from line-based financial totals.

## Sorting and paging

- Click sortable table headings to sort ascending/descending; selecting a different key starts descending. Sort applies to complete filtered collection before slicing, not just visible rows. Base and request table rows show 50 per page. Base sort keys: OC, company, month/date, supplier, category, buyer, final value, saving, saving percentage, currency, nature. Request sort keys: request number, month, company, buyer, system, urgency, description (see `reqSorted`).
- Base, request, and protocol paging controls update their respective page and rerender table; previous is bounded at first, next is disabled at final page. Filtering resets affected page to first; base view also clamps page if selection shrinks.
- Tables with source `onSort` handlers expose sortable column headings; other analysis tables are ranked summaries, not necessarily sortable.

## CSV actions

- Header `btnCsv` and Base tab `btnCsv2` export the entire currently filtered and sorted order selection, not only current page, as semicolon-delimited UTF-8 CSV with BOM; quoted fields escape embedded double quotes. Filename: `ocs_softplan_selecao.csv`.
- Request detail `btnCsvReq` exports filtered unique requests as UTF-8/BOM semicolon CSV, filename `requisicoes_unicas_selecao.csv`.
- Protocol detail `btnCsvProt` exports filtered protocol entries as UTF-8/BOM semicolon CSV, filename `notas_protocoladas_selecao.csv`.
- Export fields and Portuguese values are authored explicitly in each source exporter. Retain column order, labels, encoding, delimiter, quoting, scope and filenames.

## Charts, external dependencies, and responsive shell

- Chart.js 4.4.1 loads from jsDelivr CDN. Captures were made with network access and all 52 canvas elements rendered; no browser errors observed. Font Sora is requested from Google Fonts; the capture environment's font/network success was not independently verified.
- Charts rerender from filtered data on navigation/filter changes; source documents visual metadata, explanatory notes, labels, currency conversion (`US$1 = R$5,20`) and caveats.
- Header remains sticky at the viewport top. Table headers also stick while their table scrolls. On narrow screens, charts/cards stack and tab/filter controls may horizontally overflow by design.
