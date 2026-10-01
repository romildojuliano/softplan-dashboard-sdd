'use client';

import type { ChartConfiguration } from 'chart.js';
import { calculateTotals, brl, brlCompact, hours, median, percent } from '../../../lib/dashboard-calculations';
import { PURCHASE_INDEX as I, type DashboardViewProps, type PurchaseRow } from '../../../types/dashboard';
import { ChartCanvas } from '../ChartCanvas';
import { DashboardCard } from '../DashboardCard';
import { DataTable, type DataTableColumn } from '../DataTable';
import { KpiCard } from '../KpiCard';

const number0 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const number1 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const colors = ['#5C5CFF','#7373FF','#8B8BFF','#A2A2FF','#B9B9FF','#CACAF5','#B4B9CE','#9196AD','#7F8499','#6E7391','#5D627E','#4E536C','#43475C','#383C4E','#2E3240'];
const gridX = { grid: { display: false }, border: { color: 'rgba(145,150,173,.20)' }, ticks: { padding: 4 } } as const;
const gridY = { grid: { color: 'rgba(145,150,173,.11)', drawTicks: false }, border: { display: false }, ticks: { padding: 6 } } as const;
const shortName = (name: string) => { const parts = name.split(' '); return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]}` : name; };

interface Buyer {
  k: number;
  ocs: number;
  linhas: number;
  spend: number;
  neg: number;
  reg: number;
  sav: number;
  taxa: number;
  ticket: number;
  ciclo: number;
}

export function BuyersView({ data, filtered, viewSort: sort, setViewSort: setSort }: DashboardViewProps) {
  const rows = filtered.rows;
  const totals = calculateTotals(rows);
  const groups = new Map<number, PurchaseRow[]>();
  for (const row of rows) {
    const key = row[I.buyer];
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }
  const buyers: Buyer[] = [...groups].map(([k, items]) => {
    const t = calculateTotals(items);
    return { k, ocs: t.orders, linhas: t.lines, spend: t.spend, neg: t.negotiable,
      reg: t.records, sav: t.saving, taxa: t.savingRateOnNegotiable,
      ticket: t.averageTicket, ciclo: median(items.filter(row => row[I.cycleHours] >= 0).map(row => row[I.cycleHours])) };
  });
  const top = [...buyers].sort((a, b) => b.sav - a.sav)[0];
  const ordered = [...buyers].sort((a, b) => b.spend - a.spend);
  const values: Record<string, (buyer: Buyer) => number | string> = {
    nome: buyer => data.meta.compradores[buyer.k], ocs: buyer => buyer.ocs,
    linhas: buyer => buyer.linhas, spend: buyer => buyer.spend, neg: buyer => buyer.neg,
    sav: buyer => buyer.sav, taxa: buyer => buyer.taxa, ticket: buyer => buyer.ticket,
    ciclo: buyer => buyer.ciclo,
  };
  const sorted = [...buyers].sort((a, b) => {
    const x = values[sort.key](a), y = values[sort.key](b);
    return (typeof x === 'string' && typeof y === 'string' ? x.localeCompare(y) : (x as number) - (y as number)) * (sort.direction === 'asc' ? 1 : -1);
  });
  const maxSpend = Math.max(0, ...buyers.map(buyer => buyer.spend));
  const num = (value: string) => <span className="num">{value}</span>;
  const columns: DataTableColumn<Buyer>[] = [
    { key: 'nome', header: 'Comprador', align: 'left', render: buyer => <strong>{data.meta.compradores[buyer.k]}</strong> },
    { key: 'ocs', header: 'OCs', render: buyer => num(number0.format(buyer.ocs)) },
    { key: 'linhas', header: 'Linhas', render: buyer => num(number0.format(buyer.linhas)) },
    { key: 'spend', header: 'Spend', render: buyer => <div className="bar-cell"><div className="fill" style={{ width: `${maxSpend > 0 ? Math.max(1.5, buyer.spend / maxSpend * 100) : 0}%` }} />{num(brl(buyer.spend))}</div> },
    { key: 'neg', header: 'Negociável', render: buyer => num(brl(buyer.neg)) },
    { key: 'sav', header: 'Saving', render: buyer => <strong className="num">{brl(buyer.sav)}</strong> },
    { key: 'taxa', header: 'Taxa de saving', render: buyer => num(percent(buyer.taxa)) },
    { key: 'ticket', header: 'Ticket médio', render: buyer => num(brl(buyer.ticket)) },
    { key: 'ciclo', header: 'Aprovação (mediana)', render: buyer => num(hours(buyer.ciclo)) },
  ];
  const workload: ChartConfiguration<'bar'> = {
    type: 'bar', data: { labels: [...data.meta.meses], datasets: ordered.map((buyer, index) => ({
      label: shortName(data.meta.compradores[buyer.k]),
      data: data.meta.meses.map((_, month) => new Set(rows.filter(row => row[I.buyer] === buyer.k && row[I.month] === month + 1).map(row => row[I.order])).size),
      backgroundColor: colors[index], borderRadius: 0, stack: 's',
    })) },
    options: { scales: { x: { ...gridX, stacked: true }, y: { ...gridY, stacked: true } },
      plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: context => ` ${context.dataset.label}: ${number0.format(context.parsed.y)} OCs` } } } },
  };
  const spendChart: ChartConfiguration<'bar' | 'line'> = {
    type: 'bar', data: { labels: ordered.map(buyer => shortName(data.meta.compradores[buyer.k])), datasets: [
      { type: 'bar', label: 'Negociável', data: ordered.map(buyer => buyer.neg), backgroundColor: '#9196AD', stack: 's', order: 3 },
      { type: 'bar', label: 'Registros', data: ordered.map(buyer => buyer.reg), backgroundColor: 'rgba(145,150,173,.20)', borderColor: '#9196AD', borderWidth: { top: 1 }, stack: 's', borderRadius: { topLeft: 8, topRight: 0 }, order: 3 },
      { type: 'line', label: 'Taxa de saving', data: ordered.map(buyer => buyer.taxa * 100), yAxisID: 'y1', borderColor: '#5C5CFF', backgroundColor: '#5C5CFF', tension: .25, pointRadius: 3.5, borderWidth: 2.5, order: 1 },
    ] },
    options: { scales: { x: { ...gridX, stacked: true, ticks: { font: { size: 10 } } },
      y: { ...gridY, stacked: true, ticks: { ...gridY.ticks, callback: value => brlCompact(Number(value)) } },
      y1: { ...gridY, position: 'right', grid: { display: false }, ticks: { callback: value => `${number0.format(Number(value))}%` }, suggestedMax: 16 } },
      plugins: { tooltip: { callbacks: { title: contexts => data.meta.compradores[ordered[contexts[0].dataIndex].k],
        label: context => context.dataset.yAxisID === 'y1' ? ` Taxa: ${number1.format(context.parsed.y)}%` : ` ${context.dataset.label}: ${brl(context.parsed.y)}` } } } },
  };
  const bins = [[0, 1, 'menos de 1 h'], [1, 4, '1 a 4 h'], [4, 24, '4 a 24 h'], [24, 72, '1 a 3 dias'], [72, 1e9, 'mais de 3 dias']] as const;
  const counts = bins.map(([min, max]) => rows.filter(row => row[I.cycleHours] >= min && row[I.cycleHours] < max).length);
  const missing = rows.filter(row => row[I.cycleHours] < 0).length;
  const dated = counts.reduce((sum, count) => sum + count, 0);
  const cycleChart: ChartConfiguration<'bar'> = {
    type: 'bar', data: { labels: bins.map(bin => bin[2]), datasets: [{ label: 'Ordens', data: counts,
      backgroundColor: ['#5C5CFF', '#8B8BFF', '#B9B9FF', '#9196AD', '#464C6B'], borderRadius: { topLeft: 10, topRight: 0 }, maxBarThickness: 62 }] },
    options: { scales: { x: gridX, y: gridY }, plugins: { legend: { display: false }, tooltip: { callbacks: {
      label: context => ` ${number0.format(context.parsed.y)} ordens (${percent(context.parsed.y / Math.max(1, dated))} das com data)`,
    } } } },
  };

  return <>
    <div className="grid kpis">
      <KpiCard label="Compradores ativos" value={number0.format(buyers.length)} description={<em>{number0.format(totals.orders)} ordens no período</em>} accent="var(--c40)" />
      <KpiCard label="Ordens por comprador" value={number0.format(buyers.length ? totals.orders / buyers.length : 0)} description={<em>média · máx. {number0.format(Math.max(0, ...buyers.map(buyer => buyer.ocs)))}</em>} accent="var(--c60)" />
      <KpiCard label="Maior saving" value={top ? brlCompact(top.sav) : '—'} description={top && <em>{shortName(data.meta.compradores[top.k])} · {percent(top.taxa)} do negociável</em>} accent="var(--roxo)" />
      <KpiCard label="Mediana de aprovação" value={hours(median(rows.filter(row => row[I.cycleHours] >= 0).map(row => row[I.cycleHours])))} description={<em>entre criação e emissão da ordem</em>} accent="var(--c60)" />
    </div>
    <div className="grid cards-2">
      <DashboardCard className="span-2" title="Performance por comprador" hint="Ordene por qualquer coluna. Aprovação = mediana entre criação e emissão da ordem.">
        <DataTable columns={columns} rows={sorted} className="auto" sort={sort} onSort={key => setSort(current => ({ key, direction: current.key === key ? current.direction === 'desc' ? 'asc' : 'desc' : key === 'nome' ? 'asc' : 'desc' }))} emptyMessage="Nenhuma ordem atende aos filtros selecionados." />
      </DashboardCard>
      <DashboardCard title="Carga de trabalho mês a mês" hint="Ordens criadas por comprador"><ChartCanvas config={workload} className="tall" /></DashboardCard>
      <DashboardCard title="Spend x saving por comprador" hint="Eixo esquerdo em R$; linha marca a taxa de saving"><ChartCanvas config={spendChart} className="tall" /></DashboardCard>
      <DashboardCard className="span-2" title="Tempo entre requisição aprovada e emissão da OC" hint={missing ? `Distribuição das ordens por faixa de tempo · ${number0.format(missing)} linhas sem data de emissão distinta ficaram fora` : 'Distribuição das ordens por faixa de tempo'}><ChartCanvas config={cycleChart} /></DashboardCard>
    </div>
  </>;
}
