# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

[INFERENCE] Equipe de Compras e suas lideranças, usando o dashboard para acompanhar operação, gasto, saving, requisições, notas fiscais, fornecedores e oportunidades de racionalização.

## Product Purpose

Reproduzir integralmente o dashboard de Compras Softplan de janeiro a julho de 2026 em Next.js, mantendo dados, cálculos, textos, interações e apresentação do arquivo-fonte.

Sucesso significa equivalência funcional e visual nas 11 visões, incluindo filtros, gráficos, tabelas, ordenação, paginação e exportações CSV.

## Positioning

Dashboard operacional auditável que relaciona spend, saving, cost avoidance, ROI do time, requisições, protocolos de notas fiscais e racionalização de fornecedores na mesma base.

## Operating Context

Uso em desktop e telas menores. Usuário alterna visões, filtra período e dimensões de compra, investiga gráficos e tabelas e exporta seleções em CSV.

## Capabilities and Constraints

- Interface e conteúdo em português do Brasil.
- 11 abas funcionais.
- Dataset integral e regras de cálculo preservados da fonte local.
- Gráficos renderizados com Chart.js.
- Responsividade equivalente em 1440 px, 768 px e 390 px.
- Sem backend, autenticação ou persistência externa.
- Implementação React nativa; `iframe` fora do escopo.

## Brand Commitments

- Nome “Dashboard de Compras”.
- Identidade Softplan da fonte: Sora, base cinza escura, roxo institucional `#5C5CFF` e cantos diagonais assimétricos.
- Conteúdo, terminologia e tom analítico preservados.

## Evidence on Hand

- Fonte executável: `../dashboard_compras_softplan_jan_jul_2026.html`.
- Dataset, cálculos, conteúdo, estilos e comportamento embutidos na fonte.
- Referência visual verificável via browser local.
- Nenhuma alegação, métrica ou conteúdo deve ser inventado.

## Product Principles

- Fidelidade antes de reinvenção.
- Dados e cálculos devem continuar auditáveis.
- Interação deve preservar modelo original.
- Componentização deve reduzir duplicação sem alterar comportamento.
- Responsividade deve manter acesso a todas as funções.
