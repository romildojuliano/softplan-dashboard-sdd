# Notas fiscais protocoladas — InvoicesView

Fonte: `dashboard_compras_softplan_jan_jul_2026.html`, estrutura 595–692; regras `janela` 830–841, `protSorted` 1635–1645, `viewProt` 1646–1766, `renderFora` 1767–1832 e `exportCsvProt` 1834–1846.

## Estrutura

- Seis KPIs: notas e média por mês com movimento, notas por dia com movimento, fornecedores e média de notas, exterior com participação e países distintos, maior carga individual, notas fora do horário com participação.
- Nota metodológica: mede contagem e ritmo, não valores monetários. Alerta condicional quando método de pagamento nacional aparece em fornecedor estrangeiro; país do fornecedor determina origem.
- Grade `cards-2`: gráfico mensal combinado notas/OCs distintas; roscas por empresa e origem; barras horizontais por método, país estrangeiro (10 maiores), fornecedor (15 maiores); barras empilhadas por responsável/mês; subgrade de dias e horas; subgrade fora do expediente com quatro janelas, responsáveis, evolução mensal e tabela dos 12 registros mais extremos; tabela de protocolos, CSV e paginação.
- Os 12 gráficos preservam séries, ordem, paleta, eixos, legendas, tooltips e classes `span-2`, `tall`, `subgrid`. Os cálculos usam `filtered.protocolos`; OCs emitidas no mesmo mês usam ordens únicas de `filtered.rows`.

## Estados e controles

- Filtros compartilhados de meses, empresas, comprador e busca livre vêm de `filtered`; busca cobre fornecedor, método e país. Chip local Origem usa `filters.origin` (`todos`, `br`, `ext`) e zera `pageProt`.
- Ordenação local inicia em data/hora descendente. Clicar mesma coluna inverte direção; coluna nova usa ascendente, exceto Data e Hora, que iniciam descendentes. Ordena Data, Hora, Empresa, Fornecedor, País, Método e Protocolado por. Qualquer ordenação zera `pageProt`.
- `filters.pageProt` usa índice zero; `Pagination` recebe página um-baseada. Tabela mostra 50 registros por página, limites e contagem, inclusive seleção vazia; página acima do máximo é limitada na renderização. CSV exporta **todos** os protocolos filtrados na ordem atual, não só página visível; cabeçalho, nome de arquivo e aspas/UTF-8 preservados.
- Janela operacional: fim de semana sempre tem precedência. Em dia útil, antes de 08:00 é fora; 08:00 até 18:00 inclusive é comercial; depois de 18:00 é fora. Badge fica neutro abaixo de 10% ou sem registros. Registros extremos seguem peso original: horários após 08:00 e fins de semana vêm antes de madrugadas, ordenados pelo minuto do dia; madrugada pesa negativamente.
- Dado ausente de responsável (`-1`) não aparece nas agregações por pessoa e é exibido como `—` na tabela; exportação deixa célula vazia.
