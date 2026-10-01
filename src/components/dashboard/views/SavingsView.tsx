'use client';

import type { CSSProperties, ReactNode } from 'react';
import type { ChartConfiguration } from 'chart.js';
import { Badge } from '../Badge';
import { ChartCanvas } from '../ChartCanvas';
import { DashboardCard } from '../DashboardCard';
import { DataTable, type DataTableColumn } from '../DataTable';
import { KpiCard } from '../KpiCard';
import { brl, brlCompact, calculateTotals, groupByMonth, percent } from '../../../lib/dashboard-calculations';
import { PURCHASE_INDEX as I, type DashboardViewProps, type PurchaseRow } from '../../../types/dashboard';

const colors = ['#5C5CFF', '#7373FF', '#8B8BFF', '#A2A2FF', '#B9B9FF', '#CACAF5', '#B4B9CE', '#9196AD'];
const purple = '#5C5CFF';
const light = '#DCDEEA';
const number0 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const number1 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const gridY = { grid: { color: 'rgba(145,150,173,.11)', drawTicks: false }, border: { display: false }, ticks: { padding: 6 } };
const gridX = { grid: { display: false }, border: { color: 'rgba(145,150,173,.20)' }, ticks: { padding: 4 } };
const moneyAxis = { ...gridY, ticks: { ...gridY.ticks, callback: (value: string | number) => brlCompact(Number(value)) } };
const truncate = (value: string, limit: number) => value.length > limit ? `${value.slice(0, limit - 1)}…` : value;
const shortName = (value: string) => { const words = value.split(' '); return words.length > 1 ? `${words[0]} ${words[words.length - 1]}` : value; };

function renderDetail(detail: string): ReactNode {
  return detail.split(/(<strong>.*?<\/strong>)/g).map((part, index) => {
    const match = /^<strong>(.*?)<\/strong>$/.exec(part);
    return match ? <strong key={index}>{match[1]}</strong> : part;
  });
}

function valueBar(value: number, max: number, label: string) {
  return <div className="bar-cell"><div className="fill" style={{ width: `${max > 0 ? Math.max(1.5, value / max * 100) : 0}%` }} /><span className="num">{label}</span></div>;
}

function groupSaving(rows: readonly PurchaseRow[], index: typeof I.buyer | typeof I.category) {
  const groups = new Map<number, { key: number; saving: number; negotiable: number }>();
  for (const row of rows) {
    const key = row[index];
    let group = groups.get(key);
    if (!group) { group = { key, saving: 0, negotiable: 0 }; groups.set(key, group); }
    group.saving += row[I.saving];
    if (row[I.nature] < 0) group.negotiable += row[I.spend];
  }
  return [...groups.values()].sort((a, b) => b.saving - a.saving);
}

export function SavingsView({ data, filtered, filters }: DashboardViewProps) {
  const rows = filtered.rows;
  const meta = data.meta;
  const totals = calculateTotals(rows);
  const months = groupByMonth(rows, meta.meses);
  const coverage = totals.negotiable > 0 ? (totals.negotiableBase - totals.savingBase) / totals.negotiable : 0;
  const largest = rows.reduce<PurchaseRow | null>((top, row) => row[I.saving] > (top?.[I.saving] ?? 0) ? row : top, null);
  const initiatives = [...(meta.costAvoidance ?? [])].sort((a, b) => b.valor - a.valor);
  const avoidance = initiatives.reduce((sum, item) => sum + item.valor, 0);
  const filteredSelection = !!(filters.months.size || filters.companies.size || filters.nature !== 'todos' || filters.buyer !== null || filters.category !== null || filters.query);
  const buyers = groupSaving(rows, I.buyer);
  const categories = groupSaving(rows, I.category).filter(item => item.saving > 0).slice(0, 8);
  const top = rows.filter(row => row[I.saving] > 0).sort((a, b) => b[I.saving] - a[I.saving]).slice(0, 20);
  const maxSaving = top[0]?.[I.saving] ?? 0;
  const bands = [
    { min: 0, max: .05, label: 'até 5%', count: 0, saving: 0 },
    { min: .05, max: .10, label: '5 a 10%', count: 0, saving: 0 },
    { min: .10, max: .20, label: '10 a 20%', count: 0, saving: 0 },
    { min: .20, max: .35, label: '20 a 35%', count: 0, saving: 0 },
    { min: .35, max: 1.01, label: 'acima de 35%', count: 0, saving: 0 },
  ];
  for (const row of rows) {
    if (row[I.saving] <= 0) continue;
    const discount = row[I.saving] / (row[I.saving] + row[I.spend]);
    const band = bands.find(item => discount >= item.min && discount < item.max);
    if (band) { band.count++; band.saving += row[I.saving]; }
  }
  const withoutSaving = Math.max(0, totals.negotiable - (totals.negotiableBase - totals.savingBase));
  const monthlyChart: ChartConfiguration<'bar' | 'line'> = {
    type: 'bar', data: { labels: months.map(item => item.month), datasets: [
      { type: 'bar', label: 'Saving (R$)', data: months.map(item => item.saving), backgroundColor: purple, borderRadius: { topLeft: 8, topRight: 0 }, maxBarThickness: 50, order: 2 },
      { type: 'line', label: 'Desconto sobre a base negociada', data: months.map(item => item.savingRateOnBase * 100), yAxisID: 'y1', borderColor: light, backgroundColor: light, tension: .3, pointRadius: 3.5, borderWidth: 2, order: 1 },
    ] }, options: { scales: { x: gridX, y: moneyAxis, y1: { ...gridY, position: 'right', grid: { display: false }, ticks: { callback: value => `${number0.format(Number(value))}%` }, suggestedMax: 30 } },
      plugins: { tooltip: { callbacks: { label: context => context.dataset.yAxisID === 'y1' ? ` Desconto médio: ${number1.format(context.parsed.y)}%` : ` Saving: ${brl(context.parsed.y)}` } } } },
  };
  const buyersChart: ChartConfiguration<'bar' | 'line'> = {
    type: 'bar', data: { labels: buyers.map(item => shortName(meta.compradores[item.key])), datasets: [
      { type: 'bar', label: 'Saving', data: buyers.map(item => item.saving), backgroundColor: purple, borderRadius: { topLeft: 7, topRight: 0 }, order: 2 },
      { type: 'line', label: 'Taxa de saving', data: buyers.map(item => item.negotiable ? item.saving / item.negotiable * 100 : 0), yAxisID: 'y1', borderColor: light, backgroundColor: light, tension: .25, pointRadius: 3, borderWidth: 2, order: 1 },
    ] }, options: { scales: { x: { ...gridX, ticks: { font: { size: 10 } } }, y: moneyAxis, y1: { ...gridY, position: 'right', grid: { display: false }, ticks: { callback: value => `${number0.format(Number(value))}%` }, suggestedMax: 16 } },
      plugins: { tooltip: { callbacks: { title: contexts => meta.compradores[buyers[contexts[0].dataIndex].key], label: context => context.dataset.yAxisID === 'y1' ? ` Taxa: ${number1.format(context.parsed.y)}% do negociável` : ` Saving: ${brl(context.parsed.y)}` } } } },
  };
  const categoriesChart: ChartConfiguration<'bar'> = {
    type: 'bar', data: { labels: categories.map(item => meta.categorias[item.key]), datasets: [{ label: 'Saving', data: categories.map(item => item.saving), backgroundColor: categories.map((_, index) => colors[index]), borderRadius: { topRight: 6, bottomRight: 0 } }] },
    options: { indexAxis: 'y', scales: { x: { ...moneyAxis, grid: { color: 'rgba(145,150,173,.11)' } }, y: { ...gridX, ticks: { font: { size: 10.5 }, callback(value) { return truncate(this.getLabelForValue(Number(value)), 24); } } } },
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: context => ` ${brl(context.parsed.x)}`, afterLabel: context => `Taxa: ${percent(categories[context.dataIndex].negotiable ? categories[context.dataIndex].saving / categories[context.dataIndex].negotiable : 0)}` } } } },
  };
  const distributionChart: ChartConfiguration<'bar'> = {
    type: 'bar', data: { labels: bands.map(item => item.label), datasets: [{ label: 'Ordens', data: bands.map(item => item.count), backgroundColor: bands.map((_, index) => colors[index]), borderRadius: { topLeft: 8, topRight: 0 }, maxBarThickness: 48 }] },
    options: { scales: { x: gridX, y: gridY }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: context => ` ${number0.format(context.parsed.y)} ordens`, afterLabel: context => `Saving: ${brl(bands[context.dataIndex].saving)}` } } } },
  };
  const coverageChart: ChartConfiguration<'doughnut'> = {
    type: 'doughnut', data: { labels: ['Negociado com saving', 'Sem saving registrado', 'Registros (não endereçável)'], datasets: [{ data: [totals.negotiableBase - totals.savingBase, withoutSaving, totals.records], backgroundColor: [purple, '#464C6B', 'rgba(145,150,173,.28)'], borderColor: '#2B2F47', borderWidth: 2, hoverOffset: 6 }] },
    options: { cutout: '60%', plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: context => ` ${brl(context.parsed)}  (${percent(totals.spend ? context.parsed / totals.spend : 0)} do spend)` } } } },
  };
  const topColumns: DataTableColumn<PurchaseRow>[] = [
    { header: 'OC', align: 'left', render: row => <strong className="num">{row[I.order]}</strong> },
    { header: 'Empresa', align: 'left', render: row => row[I.company] < 0 ? <span className="tag nd">n/d</span> : <span className={`tag ${({ Softplan: 'softplan', Poligraph: 'poligraph', JXS: 'jxs', '1DOC': 'onedoc' } as Record<string, string>)[meta.empresas[row[I.company]]] ?? 'c'}`}>{meta.empresas[row[I.company]]}</span> },
    { header: 'Fornecedor', align: 'left', render: row => truncate(meta.fornecedores[row[I.supplier]], 38) },
    { header: 'Categoria', align: 'left', render: row => <span className="tag c">{truncate(meta.categorias[row[I.category]], 20)}</span> },
    { header: 'Comprador', align: 'left', render: row => shortName(meta.compradores[row[I.buyer]]) },
    { header: 'Mês', render: row => meta.meses[row[I.month] - 1] },
    { header: 'Valor final', render: row => <span className="num">{brl(row[I.spend])}</span> },
    { header: 'Saving', render: row => valueBar(row[I.saving], maxSaving, brl(row[I.saving])) },
    { header: '%', render: row => <strong className="num">{percent(row[I.saving] / (row[I.saving] + row[I.spend]))}</strong> },
  ];
  const avoidanceColumns: DataTableColumn<(typeof initiatives)[number]>[] = [
    { header: '#', align: 'left', render: item => <span className="num" style={{ color: 'var(--txt-3)' }}>{initiatives.indexOf(item) + 1}</span> },
    { header: 'Iniciativa', align: 'left', render: item => <strong>{item.desc}</strong> },
    { header: 'Frente', align: 'left', render: item => <span className="tag c">{item.tag || '—'}</span> },
    { header: 'Valor evitado', render: item => valueBar(item.valor, initiatives[0]?.valor ?? 0, brl(item.valor)) },
    { header: '% do avoidance', render: item => <span className="num">{percent(avoidance ? item.valor / avoidance : 0)}</span> },
  ];

  return <>
    <div className="grid kpis">
      <KpiCard label="Saving total" value={brlCompact(totals.saving)} description={<em>{percent(totals.savingRateOnNegotiable)} sobre o spend negociável</em>} accent="var(--roxo)" />
      <KpiCard label="Base negociada" value={brlCompact(totals.negotiableBase)} description={<em>valor original antes do desconto</em>} accent="var(--c60)" />
      <KpiCard label="Desconto médio" value={percent(totals.averageDiscount)} description={<em>nas {number0.format(totals.negotiatedOrders)} ordens com saving</em>} accent="var(--c40)" />
      <KpiCard label="Cobertura de negociação" value={percent(coverage)} description={<em>do spend negociável passou por negociação</em>} accent="var(--roxo-400)" />
      <KpiCard label="Maior negociação" value={largest ? brlCompact(largest[I.saving]) : '—'} description={largest && <em>{truncate(meta.fornecedores[largest[I.supplier]], 28)}</em>} accent="var(--c60)" />
      <KpiCard label="Cost avoidance" value={brlCompact(avoidance)} description={<em>{number0.format(initiatives.length)} iniciativas · fora das ordens de compra</em>} accent="var(--roxo-400)" />
      <KpiCard label="Saving + avoidance" value={brlCompact(totals.saving + avoidance)} description={<em>impacto total do time no orçamento</em>} accent="var(--roxo)" />
    </div>
    <div className="grid cards-2">
      <DashboardCard className="span-2" title="Saving capturado por mês" hint="Barras: R$ economizados. Linha: % sobre a base negociada (saving ÷ valor original)."><ChartCanvas config={monthlyChart} className="tall" /></DashboardCard>
      <DashboardCard title="Saving por comprador" hint="Valor economizado e taxa de saving sobre o spend negociável"><ChartCanvas config={buyersChart} /></DashboardCard>
      <DashboardCard title="Onde o saving acontece" hint="Top 8 categorias por valor economizado"><ChartCanvas config={categoriesChart} /></DashboardCard>
      <DashboardCard className="span-2" title="Maiores negociações do período" hint="Ordens com maior valor economizado na seleção atual"><DataTable columns={topColumns} rows={top} emptyMessage="Nenhuma ordem atende aos filtros selecionados." /></DashboardCard>
      <DashboardCard title="Distribuição do desconto obtido" hint="Faixas de % de saving entre as ordens negociadas"><ChartCanvas config={distributionChart} /></DashboardCard>
      <DashboardCard title="Cobertura de negociação" hint="Participação do spend negociável que passou por negociação com saving registrado"><ChartCanvas config={coverageChart} /></DashboardCard>
      <DashboardCard className="span-2" title="Cost avoidance — iniciativas estratégicas" hint="Despesa que deixou de existir por renegociação, descontinuação de fornecedor ou otimização de processo. Não aparece como saving nas ordens de compra, porque não há ordem: o gasto simplesmente não aconteceu." headerAction={<Badge>{brl(avoidance)}</Badge>}>
        <div className="ca-grid">{initiatives.map((item, index) => <div className="ca-item" key={`${item.desc}-${index}`} style={{ '--ca': colors[index % colors.length] } as CSSProperties}>
          <div className="ca-top"><span className="ca-ico" aria-hidden="true">{item.icon || '•'}</span><span className="ca-desc">{item.desc}</span><span className="ca-rank num">{index + 1}º</span></div>
          <div className="ca-val"><b className="num">{brl(item.valor)}</b><span>{percent(avoidance ? item.valor / avoidance : 0)} do total</span></div>
          {item.tag && <span className="tag c" style={{ alignSelf: 'flex-start' }}>{item.tag}</span>}
          <p className="ca-detail">{renderDetail(item.detail)}</p>
        </div>)}</div>
        <div style={{ marginTop: 22 }}>
          <div className="sublab-ca" style={{ fontSize: 9.5, fontWeight: 600, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '.11em', marginBottom: 10 }}>Quadro resumo</div>
          <DataTable className="auto" columns={avoidanceColumns} rows={initiatives} emptyMessage="Nenhuma ordem atende aos filtros selecionados." />
          <div className="ca-sum"><span>Total evitado: <b className="num">{brl(avoidance)}</b></span><span>Saving nas OCs{filteredSelection ? ' (seleção atual)' : ''}: <b className="num">{brl(totals.saving)}</b></span><span>Impacto somado: <b className="num">{brl(avoidance + totals.saving)}</b></span><span style={{ color: 'var(--txt-3)' }}>{filteredSelection ? 'O avoidance é uma lista curada por iniciativa, sem mês ou fornecedor associado — não acompanha os filtros do topo.' : 'Valores apurados no período, curados manualmente pelo time.'}</span></div>
        </div>
      </DashboardCard>
    </div>
  </>;
}
