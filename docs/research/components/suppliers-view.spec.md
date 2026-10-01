# Suppliers view

Authority: source HTML lines 711–733 and `abcCalc`/`viewForn` lines 2013–2077. Component: `src/components/dashboard/views/SuppliersView.tsx`.

- Four KPI cards: active suppliers/filtered purchase lines, top-ten spend share, class A count/share, class C count/spend/share. ABC classifications use cumulative **filtered spend**: A at ≤80%, B at ≤95%, C thereafter; the explanatory note compares A against B/C.
- `.grid.cards-2` holds four cards: top-25 mixed bar/line Pareto with cumulative percentage on right axis and supplier/OC/saving tooltip; A/B/C doughnut with class counts and spend percentage; top-eight supplier saving horizontal bars with rate tooltip; top-120 supplier table with rank, ABC class, spend bars, shares, saving and rate.
- Chart colors, titles, hints, displayed formats, tooltip text, `.span-2` and `.tall` match source. Source empty state reads “Nenhuma ordem atende aos filtros selecionados.” Table scrolls within `.tblwrap`. All calculations rerun on global filter changes. No local sorting or pagination.
