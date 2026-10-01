# Savings view specification

## Source and data

Authoritative source: `dashboard_compras_softplan_jan_jul_2026.html` lines 379–423, 1141–1212, and 1848–1889. `SavingsView` consumes filtered purchase rows for saving, buyer/category/month groupings and top negotiations. Cost avoidance uses the full curated `meta.costAvoidance` list, independent of every filter. The summary combines that full avoidance amount with saving in the current selection. Under a month, company, nature, buyer, category or search filter, summary labels saving “(seleção atual)” and explains avoidance does not follow top filters.

## Layout and content

Seven KPI tiles (`.grid.kpis`): Saving total; Base negociada; Desconto médio; Cobertura de negociação; Maior negociação; Cost avoidance; Saving + avoidance. Compact BRL and one-decimal percentages; maximum negotiation includes truncated supplier name, or dash if none. Card grid (`.grid.cards-2`): full-width monthly saving bar/discount-rate line; buyer saving bar/negotiable-rate line; horizontal top-eight category saving bars; full-width top-20 negotiations table; discount distribution across five ranges; three-part negotiated/unregistered spend doughnut; full-width curated avoidance initiatives and summary table. Monthly chart renders all period months even when filtered. Bars and lines retain source palette, axes, tooltip currency/percent detail and 292px/392px chart heights.

Top negotiations table columns: OC, Empresa, Fornecedor, Categoria, Comprador, Mês, Valor final, Saving (proportional inline bar), %. Rows sorted by saving descending; no new user sort or pagination. Empty selection uses source empty-state text. Avoidance initiatives sorted by value descending and numbered; each shows icon, description, BRL amount, percent share, optional tag and detail. Its summary table columns: #, Iniciativa, Frente, Valor evitado (inline bar), % do avoidance. Badge displays full BRL avoidance. Summary shows total avoided, saving in current selection, combined impact and filtering caveat or full-period note.

Cost-avoidance descriptions preserve source `<strong>` emphasis, including `40% para 12,5%`, `Evento de Líderes` and `Fórum de MPs`.

## Responsive and states

Source classes supply automatic KPI wrapping, full-width `.span-2` cards on desktop, collapse to single-column at ≤980px, chart heights 255px/330px at ≤640px, horizontally scrolling tables, and `.ca-grid` auto-fit avoidance tiles. Tooltip details remain available without altering displayed labels. Saving can be zero with filtered rows while curated avoidance remains unchanged; no fabricated savings or missing empty table.
