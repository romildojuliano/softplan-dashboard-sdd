# Clone do Dashboard de Compras Softplan — Design

## Objetivo

Portar `../dashboard_compras_softplan_jan_jul_2026.html` para o scaffold Next.js como implementação React nativa, preservando integralmente aparência, conteúdo, dados, cálculos e interações.

## Escopo confirmado

- Todas as 11 abas.
- Dataset completo da fonte.
- Todos os 52 gráficos, 63 cards e 5 blocos KPI observados no DOM da fonte (contagens por `canvas`, `.card` e `.kpi`, respectivamente).
- Filtros globais e locais.
- Tabelas, ordenação, paginação e exportações CSV.
- Estados hover, focus, disabled, active e sticky.
- Layouts em 1440 px, 768 px e 390 px.

Fora do escopo: backend, autenticação, banco de dados, atualização em tempo real, mudanças de marca ou conteúdo.

## Abordagem escolhida

Port React nativo. Não usar `iframe`, documento legado incorporado ou conteúdo aproximado.

A fonte permanece autoridade de produto, dados, cálculo e visual. Extração transforma seu HTML/CSS/JavaScript em módulos React e TypeScript sem alterar resultados.

## Arquitetura

### Página e shell

`src/app/page.tsx` monta um único componente cliente `Dashboard`. `Dashboard` controla aba ativa, filtros globais e recálculo das visões.

Componentes estruturais:

- `DashboardHeader`: marca, escopo e exportação.
- `DashboardTabs`: navegação horizontal das 11 visões.
- `DashboardFilters`: meses, empresas, natureza, comprador, categoria, busca e reset.
- `DashboardFooter`: fontes e notas metodológicas.

### Primitivos compartilhados

- `KpiCard`
- `DashboardCard`
- `ChartCanvas`
- `DataTable`
- `FilterChips`
- `Pagination`
- `Note`
- `Badge`

Primitivos recebem conteúdo e configuração; não duplicam regras de negócio.

### Visões

Uma unidade por aba:

1. `OverviewView`
2. `RecordsView`
3. `SavingsView`
4. `RoiView`
5. `RequestsView`
6. `BuyersView`
7. `InvoicesView`
8. `CategoriesView`
9. `SuppliersView`
10. `RationalizationView`
11. `DatabaseView`

Cada visão contém apenas composição e estados locais. Filtros globais ficam no shell.

### Dados e cálculos

- `src/data/dashboard-data.ts`: dataset transcrito sem alteração semântica.
- `src/lib/dashboard-calculations.ts`: filtros, agrupamentos, ABC, savings, ROI, requisições, protocolos e racionalização.
- `src/lib/csv.ts`: serialização e download CSV.
- `src/types/dashboard.ts`: registros, filtros, agregados e configurações de tabela/gráfico.

Cálculos serão portados da fonte, não rederivados por aproximação. Valores exibidos devem coincidir com a fonte para a seleção padrão.

### Gráficos

Usar `chart.js` localmente. `ChartCanvas` cria e destrói instâncias no ciclo React, evitando canvas reutilizado e vazamentos. Configurações, plugins, escalas, rótulos, tooltips e cores vêm da fonte.

## Design visual

- Fonte Sora, pesos 200–700.
- Fundo `#181A27`; painéis `#2B2F47`; roxo `#5C5CFF`.
- Tokens e raios assimétricos copiados para `globals.css`.
- Largura máxima 1560 px.
- Topbar sticky com blur e borda inferior.
- Tabs horizontais roláveis.
- Cards responsivos com quebra em 980 px e subgrids em 820 px.
- Ajustes móveis em 640 px.

Sem nova direção visual. Fonte existente é autoridade.

## Comportamento

- Abas: clique alterna visão ativa; conteúdo mantém filtros globais.
- Filtros: mudança recalcula KPIs, gráficos e tabelas aplicáveis.
- Chips: estado ativo visual e semântico.
- Ordenação: clique em cabeçalhos sortable alterna direção.
- Paginação: anterior/próxima atualizam página e disabled state.
- CSV: exporta seleção corrente com dados correspondentes.
- Topbar: sticky durante scroll.
- Hover/focus/reduced-motion: regras originais preservadas.

## Responsividade

- 1440 px: cards em duas colunas quando aplicável; KPIs auto-fit.
- 768 px: spans duplos colapsam; filtros quebram em múltiplas linhas.
- 390 px: padding reduzido, cards empilhados, tabs roláveis, tabelas com overflow horizontal.
- Qualquer overflow horizontal deve estar restrito a tabs/tabelas; página não pode exceder viewport.

## Extração e rastreabilidade

Antes de cada grupo de componentes:

- registrar topologia em `docs/research/PAGE_TOPOLOGY.md`;
- registrar estados em `docs/research/BEHAVIORS.md`;
- criar specs em `docs/research/components/` com estilos computados, conteúdo, estados e responsividade;
- salvar referências desktop/mobile em `docs/design-references/`.

Como o alvo é arquivo local sem imagens ou vídeos de conteúdo, ativos globais se limitam à fonte e ao SVG decorativo inline. Chart.js será dependência, não CDN.

## Verificação

1. `npm run check`.
2. Smoke browser da seleção padrão e das 11 abas.
3. Exercitar filtros globais, filtros locais, ordenação, paginação e CSV.
4. Capturar clone em 1440 px e 390 px.
5. Comparar com fonte por seção; corrigir divergências em um lote.
6. Confirmar novamente desktop e mobile.
7. Rodar detector Impeccable uma vez nos alvos alterados.

## Riscos e controles

- Divergência de cálculo: comparar KPIs padrão e estados filtrados com a fonte.
- Instâncias Chart.js órfãs: cleanup obrigatório em `useEffect`.
- Arquivo cliente excessivo: separar dados, cálculos, primitivas e visões; sem abstrações além desses limites reais.
- Drift visual: computed styles e screenshots são autoridade, não classes Tailwind estimadas.
- Regressão móvel: validar overflow e wrapping nos três viewports.
