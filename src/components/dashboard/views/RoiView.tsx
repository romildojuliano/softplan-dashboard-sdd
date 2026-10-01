'use client';

import type { ChartConfiguration } from 'chart.js';
import { ChartCanvas } from '../ChartCanvas';
import { DashboardCard } from '../DashboardCard';
import { DataTable, type DataTableColumn } from '../DataTable';
import { KpiCard } from '../KpiCard';
import { Note } from '../Note';
import { brl, brlCompact, groupByMonth, percent, profileSuppliers, supplierActionBucket } from '../../../lib/dashboard-calculations';
import { PURCHASE_INDEX as I, type DashboardViewProps } from '../../../types/dashboard';

const purple = '#5C5CFF';
const purple400 = '#8B8BFF';
const purple200 = '#B9B9FF';
const gray = '#9196AD';
const light = '#DCDEEA';
const colors = ['#5C5CFF', '#7373FF', '#8B8BFF', '#A2A2FF', '#B9B9FF', '#CACAF5', '#B4B9CE', '#9196AD', '#7F8499', '#6E7391', '#5D627E', '#4E536C', '#43475C', '#383C4E', '#2E3240'];
const number0 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const number1 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const number2 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const gridY = { grid: { color: 'rgba(145,150,173,.11)', drawTicks: false }, border: { display: false }, ticks: { padding: 6 } };
const gridX = { grid: { display: false }, border: { color: 'rgba(145,150,173,.20)' }, ticks: { padding: 4 } };
const moneyAxis = { ...gridY, ticks: { ...gridY.ticks, callback: (value: string | number) => brlCompact(Number(value)) } };

type AuditRow = { item: string; value: string; origin: string };
type OperationalRow = { indicator: string; value: string; reading: string };
const auditColumns: DataTableColumn<AuditRow>[] = [
  { header: 'Item', align: 'left', render: row => <strong>{row.item}</strong> },
  { header: 'Valor', render: row => <strong className="num">{row.value}</strong> },
  { header: 'Origem', align: 'left', className: 'desc', render: row => row.origin },
];
const operationalColumns: DataTableColumn<OperationalRow>[] = [
  { header: 'Indicador', align: 'left', render: row => <strong>{row.indicator}</strong> },
  { header: 'Valor', render: row => <strong className="num">{row.value}</strong> },
  { header: 'Leitura', align: 'left', className: 'desc', render: row => row.reading },
];

export function RoiView({ data, filtered }: DashboardViewProps) {
  const { meta, rows, requisicoes, protocolos } = data;
  const team = meta.custoTime;
  if (!team) return <div className="empty">Custo do time não informado. Preencha custo_time.json para habilitar esta aba.</div>;

  // Period ROI stays unfiltered; operational opportunity follows the rationalization selection.
  const cost = team.total;
  const monthsCount = team.meses || meta.meses.length;
  const monthlyCost = cost / monthsCount;
  const saving = rows.reduce((sum, row) => sum + row[I.saving], 0);
  const avoidanceItems = meta.costAvoidance ?? [];
  const avoidance = avoidanceItems.reduce((sum, item) => sum + item.valor, 0);
  const returnValue = saving + avoidance;
  const net = returnValue - cost;
  const multiplier = cost ? returnValue / cost : 0;
  const roi = cost ? net / cost : 0;
  const spend = rows.reduce((sum, row) => sum + row[I.spend], 0);
  const orders = meta.nOCs;
  const requestCount = requisicoes.length;
  const invoiceCount = protocolos.length;
  const transactionCount = orders + requestCount + invoiceCount;
  const monthly = groupByMonth(rows, meta.meses);
  const accounts = [...team.contas].filter(item => item.valor > 0).sort((a, b) => b.valor - a.valor);
  const peopleCost = team.contas.find(item => item.conta === 'Gente')?.valor ?? 0;
  const unitCosts = [
    { label: 'Por requisição', value: requestCount ? cost / requestCount : 0, count: requestCount },
    { label: 'Por ordem de compra', value: orders ? cost / orders : 0, count: orders },
    { label: 'Por nota protocolada', value: invoiceCount ? cost / invoiceCount : 0, count: invoiceCount },
    { label: 'Por documento (soma)', value: transactionCount ? cost / transactionCount : 0, count: transactionCount },
  ];
  const accumulatedSaving: number[] = [];
  let savingAccumulated = 0;
  for (const item of monthly) {
    savingAccumulated += item.saving;
    accumulatedSaving.push(savingAccumulated);
  }
  const accumulatedCost = monthly.map((_, index) => monthlyCost * (index + 1));
  const costPerOrder = orders ? cost / orders : 0;
  const { suppliers } = profileSuppliers(filtered.rows, filtered.protocolos, meta.categorias);
  const avoidableOrders = suppliers.filter(item => item.classification === 'C').reduce((sum, item) => sum + supplierActionBucket(item).avoidableOrders, 0);
  const addressableCost = avoidableOrders * costPerOrder;
  const addressableMonths = monthlyCost ? addressableCost / monthlyCost : 0;

  const returnChart: ChartConfiguration<'bar'> = {
    type: 'bar', data: { labels: ['Custo do time', 'Saving nas ordens', 'Cost avoidance'], datasets: [{ label: 'R$', data: [cost, saving, avoidance], backgroundColor: ['#464C6B', purple, purple400], borderRadius: { topLeft: 10, topRight: 0 }, maxBarThickness: 88 }] },
    options: { scales: { x: gridX, y: { ...moneyAxis, grace: '12%' } }, plugins: { legend: { display: false }, totalPilha: { ativo: false }, tooltip: { callbacks: { label: context => ` ${brl(context.parsed.y)}`, afterLabel: context => `${percent(context.dataIndex ? (returnValue ? context.parsed.y / returnValue : 0) : cost / returnValue)} do retorno` } } } },
  };
  const costChart: ChartConfiguration<'bar'> = {
    type: 'bar', data: { labels: accounts.map(item => item.conta), datasets: [{ label: 'Realizado', data: accounts.map(item => item.valor), backgroundColor: accounts.map((_, index) => colors[index]), borderRadius: { topRight: 6, bottomRight: 0 } }] },
    options: { indexAxis: 'y', scales: { x: { ...moneyAxis, grid: { color: 'rgba(145,150,173,.11)' } }, y: { ...gridX, ticks: { font: { size: 10.5 } } } }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: context => ` ${brl(context.parsed.x)}`, afterLabel: context => `${percent(cost ? accounts[context.dataIndex].valor / cost : 0)} do custo` } } } },
  };
  const unitsChart: ChartConfiguration<'bar'> = {
    type: 'bar', data: { labels: unitCosts.map(item => item.label), datasets: [{ label: 'Custo unitário', data: unitCosts.map(item => item.value), backgroundColor: unitCosts.map((_, index) => index === 3 ? purple : gray), borderRadius: { topRight: 6, bottomRight: 0 } }] },
    options: { indexAxis: 'y', scales: { x: { ...moneyAxis, grid: { color: 'rgba(145,150,173,.11)' } }, y: { ...gridX, ticks: { font: { size: 10.5 } } } }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: context => ` ${brl(context.parsed.x)} por documento`, afterLabel: context => `${number0.format(unitCosts[context.dataIndex].count)} documentos no período` } } } },
  };
  const monthlyChart: ChartConfiguration<'bar' | 'line'> = {
    type: 'bar', data: { labels: [...meta.meses], datasets: [
      { type: 'bar', label: 'Saving do mês', data: monthly.map(item => item.saving), backgroundColor: purple, borderRadius: { topLeft: 8, topRight: 0 }, maxBarThickness: 50, order: 3 },
      { type: 'line', label: 'Custo mensal do time', data: meta.meses.map(() => monthlyCost), borderColor: light, backgroundColor: light, borderDash: [6, 4], pointRadius: 0, borderWidth: 2, order: 2 },
      { type: 'line', label: 'Vezes que cobriu o custo', data: monthly.map(item => monthlyCost ? item.saving / monthlyCost : 0), yAxisID: 'y1', borderColor: purple200, backgroundColor: purple200, tension: .3, pointRadius: 3.5, borderWidth: 2, order: 1 },
    ] }, options: { scales: { x: gridX, y: moneyAxis, y1: { ...gridY, position: 'right', grid: { display: false }, ticks: { callback: value => `${number1.format(Number(value))}x` } } }, plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: context => context.dataset.yAxisID === 'y1' ? ` Cobriu ${number2.format(context.parsed.y)}x o custo do mês` : ` ${context.dataset.label}: ${brl(context.parsed.y)}` } } } },
  };
  const accumulatedChart: ChartConfiguration<'line'> = {
    type: 'line', data: { labels: [...meta.meses], datasets: [
      { label: 'Saving acumulado', data: accumulatedSaving, borderColor: purple, backgroundColor: 'rgba(92,92,255,.14)', fill: true, tension: .3, pointRadius: 3.5, borderWidth: 2.5 },
      { label: 'Custo acumulado', data: accumulatedCost, borderColor: light, backgroundColor: 'transparent', borderDash: [6, 4], tension: .2, pointRadius: 0, borderWidth: 2 },
    ] }, options: { scales: { x: gridX, y: moneyAxis }, plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: context => ` ${context.dataset.label}: ${brl(context.parsed.y)}`, afterBody: contexts => { const index = contexts[0].dataIndex; return accumulatedCost[index] ? `Cobertura: ${number2.format(accumulatedSaving[index] / accumulatedCost[index])}x o custo acumulado` : ''; } } } } },
  };
  const auditRows: AuditRow[] = [
    { item: 'Custo total do time', value: brl(cost), origin: `${team.fonte || 'Realizado por conta contábil'} · ${team.periodo || ''}` },
    { item: 'Custo com pessoas', value: brl(peopleCost), origin: `Conta Gente · ${percent(peopleCost ? peopleCost / cost : 0)} do custo total` },
    { item: 'Custo mensal médio', value: brl(monthlyCost), origin: `Custo total ÷ ${number0.format(monthsCount)} meses` },
    { item: 'Saving nas ordens', value: brl(saving), origin: 'Soma da coluna de saving das ordens de compra, rastreável linha a linha' },
    { item: 'Cost avoidance', value: brl(avoidance), origin: `${number0.format(avoidanceItems.length)} iniciativas curadas manualmente pelo time · despesa que não chegou a existir` },
    { item: 'Retorno total', value: brl(returnValue), origin: 'Saving + avoidance' },
    { item: 'Ganho líquido', value: brl(net), origin: 'Retorno − custo' },
    { item: 'ROI', value: `${number1.format(roi * 100)}%`, origin: '(Retorno − custo) ÷ custo' },
    { item: 'Multiplicador', value: `${number2.format(multiplier)}x`, origin: 'Retorno ÷ custo · quanto cada R$ 1 de custo devolveu' },
    { item: 'Multiplicador só com saving', value: `${number2.format(cost ? saving / cost : 0)}x`, origin: 'Saving ÷ custo · versão conservadora, sem o avoidance estimado' },
    { item: 'Custo sobre spend gerido', value: percent(spend ? cost / spend : 0), origin: `Custo ÷ ${brl(spend)} de spend no período` },
  ];
  const operationalRows: OperationalRow[] = [
    { indicator: 'Custo por ordem de compra', value: brl(costPerOrder), reading: `Custo do time ÷ ${number0.format(orders)} ordens emitidas. É um custo médio de processamento, não o custo real de cada ordem.` },
    { indicator: 'Ordens evitáveis na curva C', value: number0.format(avoidableOrders), reading: 'Identificadas na aba de Racionalização, por contrato guarda-chuva, consolidação ou catálogo.' },
    { indicator: 'Custo operacional endereçável', value: brl(addressableCost), reading: 'Ordens evitáveis × custo médio por ordem. Não é economia de caixa: é capacidade do time que volta a ficar disponível.' },
    { indicator: 'Equivalente em meses de time', value: `${number1.format(addressableMonths)} mês`, reading: 'Quanto do custo mensal da operação está sendo consumido por transações que não precisariam existir.' },
  ];

  return <>
    <div className="grid kpis">
      <KpiCard label="Custo do time" value={brlCompact(cost)} description={<em>{brlCompact(monthlyCost)} por mês · {percent(spend ? cost / spend : 0)} do spend gerido</em>} accent="var(--c60)" />
      <KpiCard label="Retorno gerado" value={brlCompact(returnValue)} description={<em>saving {brlCompact(saving)} + avoidance {brlCompact(avoidance)}</em>} accent="var(--c40)" />
      <KpiCard label="Ganho líquido" value={brlCompact(net)} description={<em>retorno menos o custo da operação</em>} accent="var(--roxo-400)" />
      <KpiCard label="ROI" value={`${number0.format(roi * 100)}%`} description={<em>cada R$ 1 investido devolveu {number2.format(multiplier)}</em>} accent="var(--roxo)" />
      <KpiCard label="Só com saving" value={`${number2.format(cost ? saving / cost : 0)}x`} description={<em>desconsiderando o avoidance, que é estimado</em>} accent="var(--c60)" />
    </div>
    <Note><b>Como esta conta é feita.</b> O custo é o realizado do centro de custo de Compras em {team.periodo || 'todo o período'} — <b>{brl(cost)}</b>, sendo {percent(cost ? peopleCost / cost : 0)} em pessoas. O retorno soma o <b>saving registrado nas ordens</b> ({brl(saving)}, rastreável linha a linha) com o <b>cost avoidance</b> ({brl(avoidance)}, curado por iniciativa). Os três valores são totais do período, então <b>esta aba não acompanha os filtros do topo</b> — filtrar um mês mudaria o saving mas não o custo nem o avoidance, e o ROI ficaria inconsistente.</Note>
    <div className="grid cards-2">
      <DashboardCard className="span-2" title="Retorno sobre o custo do time" hint="O que a operação custou contra o que ela devolveu, na mesma janela">
        <ChartCanvas config={returnChart} className="tall" />
        <div className="ca-sum"><span>Custo: <b className="num">{brl(cost)}</b></span><span>Retorno: <b className="num">{brl(returnValue)}</b></span><span>Ganho líquido: <b className="num">{brl(net)}</b></span><span>Multiplicador: <b className="num">{number2.format(multiplier)}x</b></span></div>
      </DashboardCard>
      <DashboardCard title="Composição do custo" hint="Realizado por conta contábil no centro de custo de Compras"><ChartCanvas config={costChart} className="tall" /></DashboardCard>
      <DashboardCard title="Custo por transação" hint="Custo do time dividido pelo volume de documentos processados no período"><ChartCanvas config={unitsChart} className="tall" /></DashboardCard>
      <DashboardCard className="span-2" title="O time se paga todo mês?" hint="Barras: saving capturado no mês, sem contar avoidance. Linha tracejada: custo mensal do time. A linha roxa mostra quantas vezes o saving do mês cobriu o custo."><ChartCanvas config={monthlyChart} className="tall" /></DashboardCard>
      <DashboardCard className="span-2" title="Retorno acumulado x custo acumulado" hint="Ponto de equilíbrio ao longo do período · considera apenas o saving das ordens, que tem data"><ChartCanvas config={accumulatedChart} className="tall" /></DashboardCard>
      <DashboardCard className="span-2" title="Memória de cálculo" hint="Cada número com sua origem, para a conta poder ser auditada"><DataTable className="auto" columns={auditColumns} rows={auditRows} emptyMessage="Nenhuma ordem atende aos filtros selecionados." /></DashboardCard>
      <DashboardCard className="span-2" title="Custo operacional endereçável" hint="Cruzando o custo por ordem com as ordens evitáveis identificadas na aba de Racionalização">
        <DataTable className="auto" columns={operationalColumns} rows={operationalRows} emptyMessage="Nenhuma ordem atende aos filtros selecionados." />
        <div style={{ margin: '16px 0 0' }}><Note><b>Cuidado com esta leitura.</b> {brl(addressableCost)} não é dinheiro que entra no caixa se as ordens deixarem de ser abertas — o custo do time é fixo no curto prazo. O que esse número mede é <b>capacidade</b>: equivale a {number1.format(addressableMonths)} mês de operação hoje gasto em transações de baixo valor, que poderia ser redirecionado para negociar a curva A, onde estão 80% do spend.</Note></div>
      </DashboardCard>
    </div>
  </>;
}
