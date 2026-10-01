# Compradores

Source: `dashboard_compras_softplan_jan_jul_2026.html` lines 573–594 and 1891–1956. All metrics use globally filtered purchase lines. Four KPIs: active buyers and distinct OCs; mean OCs per buyer and maximum; highest saving with buyer short name and saving/negotiable rate; median nonnegative approval hours across lines. Missing dates display `—` and are excluded from median.

Full-width performance table includes buyer, distinct OCs, lines, spend with proportional bar, negotiable amount, saving, saving rate, mean spend per OC and median approval duration. Every header sorts; spend descending initially, new numeric fields descending, buyer name ascending, repeated click reverses direction. Empty selection shows standard filtered-empty message.

Two half-width charts: monthly stacked distinct OCs per buyer, ordered by buyer spend; stacked negotiable/record spend per buyer with saving rate on right percentage axis. Final full-width chart bins approval durations into less than 1 h, 1–4 h, 4–24 h, 1–3 days, over 3 days; tooltip percentage denominator includes only rows with a nonnegative duration. Hint adds excluded-line count when present. Charts and table recompute on global filters. KPI grid and two-column card grid collapse via shared responsive CSS.

Verify: filter to one buyer and one month; compare distinct OC total with workload bar, sort OCs ascending/descending, confirm missing approval lines excluded from chart denominator.
