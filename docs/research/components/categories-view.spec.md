# Categorias

Source: `dashboard_compras_softplan_jan_jul_2026.html` lines 693–710 and 1959–2010. All metrics use globally filtered purchase lines. Four KPIs: active categories, largest-spend category with share, top-three spend share, and largest positive-saving category with negotiated saving rate. Long KPI category labels truncate at 18 characters.

Full-width horizontal chart displays every category sorted by spend, stacking negotiable and record amounts; tooltip includes each segment plus category total and share. Full-width monthly stacked chart shows top six categories by filtered spend plus all remaining categories grouped as “Outras”; months retain January–July axis even after filtering. Full-width detail table displays category, lines, proportional spend bar, spend share, negotiable, saving, saving rate and average spend per distinct OC. Each header sorts: spend descending initially, new numeric fields descending, name ascending; repeated click reverses direction. Empty selection shows standard filtered-empty message. Global filters recompute all groupings; no local filter or pagination. KPI grid and card grid collapse via shared responsive CSS.

Verify: filter to one category and month; compare table spend and monthly bar, toggle sorting on category and spend, confirm zero saving displays `—` for saving leader.
