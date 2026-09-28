## Target

Substituição do placeholder em `src/app/page.tsx` pelo clone completo; atualização de `src/app/layout.tsx` e `src/app/globals.css`; novos módulos de dashboard.

## Dependents (1)

- `src/app/layout.tsx`: carrega `globals.css` e envolve a única rota atual.

## Affected Stories

- Nenhum plano de release ou story existente encontrado.

## Test Coverage

- Nenhum teste permanente existente cobre a rota `/`.
- Verificação atual: `npm run check` e smoke browser das 11 abas em 1440 px, 768 px e 390 px.
- Gap: sem regressão visual automatizada; comparação manual por screenshots será usada nesta entrega.

## Risk: Medium

Rota única e scaffold mínimo reduzem fan-in, mas volume funcional é alto: 11 abas, 52 gráficos, filtros compartilhados, tabelas, paginação e CSV.

## Recommended action

Proceder com port incremental: fundação e dados primeiro, componentes compartilhados depois, visões por aba e montagem final; build e smoke após integração.
