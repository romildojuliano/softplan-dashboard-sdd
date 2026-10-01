# ROI view specification

## Source and data

Authoritative source: `dashboard_compras_softplan_jan_jul_2026.html` lines 424–460 and 1215–1352. Cost is `meta.custoTime.total`, period/fonte/contas from that same source. Saving is the sum of all purchase-row saving; avoidance is the sum of all curated initiatives. Full-period requisition and protocol counts and unfiltered monthly groups drive period ROI and transaction costs. **Period ROI does not respond to top filters**: mixing filtered saving with full-period fixed cost or manually curated avoidance would yield inconsistent ROI. Operational opportunity is the exception: supplier profiles use filtered purchases and protocols, matching Racionalização. With missing cost data, display source missing-cost empty state.

## Layout and calculations

Five KPI tiles (`.grid.kpis`): Custo do time (monthly amount and share of period spend); Retorno gerado (saving + avoidance); Ganho líquido; ROI `(retorno − custo) ÷ custo` with return-per-real; Só com saving (saving ÷ cost). Explanatory note states source, period, people-account share, saving/avoidance provenance and filter invariance. Card grid (`.grid.cards-2`): full-width cost/saving/avoidance comparison bars plus four-value summary; cost-account horizontal bars; cost-per-requisition/order/invoice/all-documents horizontal bars; full-width monthly saving bars with dashed monthly cost and coverage multiplier; full-width cumulative saving area with cumulative cost line; 11-row calculation audit; four-row operational-addressability audit plus capacity-not-cash warning.

Monthly cost uses `team.total ÷ team.meses` (fallback full-period month count). Cost per transaction uses counts of all requisitions, distinct purchase orders from metadata and all protocolled invoices. Period ROI percentage rounds to a whole percent on KPI, one decimal in audit; multipliers use two decimals. Monthly return excludes avoidance because initiatives have no date. Curva C avoidable orders sum mutually exclusive rationalization bucket counts across filtered supplier profiles; multiplying by full-period average purchase-order cost estimates redeployable processing capacity, **not cash savings**. Audit rows retain original formula/provenance copy and values.

## Responsive and states

Source classes supply KPI auto-wrap, two-card desktop grid, full-width `.span-2` cards collapsing at ≤980px, responsive chart heights (392px desktop, 330px mobile for `.tall`) and horizontally scrolling audit tables without max-height (`.tblwrap.auto`). All five charts retain source colors, ordered series, tooltip detail, units and bottom legends where shown. Period ROI remains identical after filter changes; operational opportunity follows filtered supplier rationalization. Fev / Poligraph / Só registros yields 5 avoidable orders and R$ 1.289,02 addressable cost, while average order cost stays R$ 257,80.
