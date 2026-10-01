'use client';

import type { ChartConfiguration } from 'chart.js';
import { brl, brlCompact, calculateTotals, percent } from '../../../lib/dashboard-calculations';
import { PURCHASE_INDEX as I, type DashboardViewProps, type PurchaseRow } from '../../../types/dashboard';
import { ChartCanvas } from '../ChartCanvas';
import { DashboardCard } from '../DashboardCard';
import { DataTable, type DataTableColumn } from '../DataTable';
import { KpiCard } from '../KpiCard';

const number0 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const colors = ['#5C5CFF','#7373FF','#8B8BFF','#A2A2FF','#B9B9FF','#CACAF5'];
const gridX = { grid: { display: false }, border: { color: 'rgba(145,150,173,.20)' }, ticks: { padding: 4 } } as const;
const gridY = { grid: { color: 'rgba(145,150,173,.11)', drawTicks: false }, border: { display: false }, ticks: { padding: 6 } } as const;
const truncate = (value: string, limit: number) => value.length > limit ? `${value.slice(0, limit - 1)}…` : value;

interface Category {
  k: number;
  linhas: number;
  spend: number;
  neg: number;
  reg: number;
  sav: number;
  taxa: number;
  ticket: number;
}

export function CategoriesView({ data, filtered, viewSort: sort, setViewSort: setSort }: DashboardViewProps) {
  const rows = filtered.rows;
  const totals = calculateTotals(rows);
  const groups = new Map<number, PurchaseRow[]>();
  for (const row of rows) {
    const key = row[I.category];
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }
  const categories: Category[] = [...groups].map(([k, items]) => {
    const t = calculateTotals(items);
    return { k, linhas: t.lines, spend: t.spend, neg: t.negotiable, reg: t.records,
      sav: t.saving, taxa: t.savingRateOnNegotiable, ticket: t.averageTicket };
  }).sort((a, b) => b.spend - a.spend);
  const leader = categories[0];
  const savingLeader = [...categories].sort((a, b) => b.sav - a.sav)[0];
  const top3 = categories.slice(0, 3).reduce((sum, category) => sum + category.spend, 0);
  const top6 = categories.slice(0, 6).map(category => category.k);
  const values: Record<string, (category: Category) => number | string> = {
    nome: category => data.meta.categorias[category.k], linhas: category => category.linhas,
    spend: category => category.spend, part: category => category.spend,
    neg: category => category.neg, sav: category => category.sav,
    taxa: category => category.taxa, ticket: category => category.ticket,
  };
  const sorted = [...categories].sort((a, b) => {
    const x = values[sort.key](a), y = values[sort.key](b);
    return (typeof x === 'string' && typeof y === 'string' ? x.localeCompare(y) : (x as number) - (y as number)) * (sort.direction === 'asc' ? 1 : -1);
  });
  const maxSpend = Math.max(0, ...categories.map(category => category.spend));
  const num = (value: string) => <span className="num">{value}</span>;
  const columns: DataTableColumn<Category>[] = [
    { key: 'nome', header: 'Categoria', align: 'left', render: category => <strong>{data.meta.categorias[category.k]}</strong> },
    { key: 'linhas', header: 'Linhas', render: category => num(number0.format(category.linhas)) },
    { key: 'spend', header: 'Spend', render: category => <div className="bar-cell"><div className="fill" style={{ width: `${maxSpend > 0 ? Math.max(1.5, category.spend / maxSpend * 100) : 0}%` }} />{num(brl(category.spend))}</div> },
    { key: 'part', header: '% do total', render: category => num(percent(totals.spend ? category.spend / totals.spend : 0)) },
    { key: 'neg', header: 'Negociável', render: category => num(brl(category.neg)) },
    { key: 'sav', header: 'Saving', render: category => <strong className="num">{brl(category.sav)}</strong> },
    { key: 'taxa', header: 'Taxa de saving', render: category => num(percent(category.taxa)) },
    { key: 'ticket', header: 'Ticket médio', render: category => num(brl(category.ticket)) },
  ];
  const allChart: ChartConfiguration<'bar'> = {
    type: 'bar', data: { labels: categories.map(category => data.meta.categorias[category.k]), datasets: [
      { label: 'Negociável', data: categories.map(category => category.neg), backgroundColor: '#5C5CFF', stack: 's' },
      { label: 'Registros', data: categories.map(category => category.reg), backgroundColor: 'rgba(145,150,173,.24)', borderColor: '#9196AD', borderWidth: { right: 1 }, stack: 's', borderRadius: { topRight: 8, bottomRight: 0 } },
    ] },
    options: { indexAxis: 'y', scales: { x: { ...gridY, stacked: true, grid: { color: 'rgba(145,150,173,.11)' }, ticks: { ...gridY.ticks, callback: value => brlCompact(Number(value)) } },
      y: { ...gridX, stacked: true, ticks: { font: { size: 10.5 }, callback: function (value) { return truncate(this.getLabelForValue(Number(value)), 26); } } } },
      plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: {
        label: context => ` ${context.dataset.label}: ${brl(context.parsed.x)}`,
        afterBody: contexts => { const category = categories[contexts[0].dataIndex]; return `Total: ${brl(category.spend)}  (${percent(category.spend / totals.spend)})`; },
      } } } },
  };
  const monthly: ChartConfiguration<'bar'> = {
    type: 'bar', data: { labels: [...data.meta.meses], datasets: [
      ...top6.map((k, index) => ({ label: data.meta.categorias[k],
        data: data.meta.meses.map((_, month) => rows.filter(row => row[I.category] === k && row[I.month] === month + 1).reduce((sum, row) => sum + row[I.spend], 0)),
        backgroundColor: colors[index], borderRadius: 0, stack: 's' })),
      { label: 'Outras', data: data.meta.meses.map((_, month) => rows.filter(row => !top6.includes(row[I.category]) && row[I.month] === month + 1).reduce((sum, row) => sum + row[I.spend], 0)),
        backgroundColor: '#464C6B', borderRadius: { topLeft: 8, topRight: 0 }, stack: 's' },
    ] },
    options: { scales: { x: { ...gridX, stacked: true }, y: { ...gridY, stacked: true, ticks: { ...gridY.ticks, callback: value => brlCompact(Number(value)) } } },
      plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: context => ` ${context.dataset.label}: ${brl(context.parsed.y)}` } } } },
  };

  return <>
    <div className="grid kpis">
      <KpiCard label="Categorias com spend" value={number0.format(categories.length)} description={<em>classificação automática por descrição e fornecedor</em>} accent="var(--c40)" />
      <KpiCard label="Maior categoria" value={leader ? truncate(data.meta.categorias[leader.k], 18) : '—'} description={leader && <em>{brlCompact(leader.spend)} · {percent(leader.spend / totals.spend)} do spend</em>} accent="var(--c60)" />
      <KpiCard label="Concentração top 3" value={percent(totals.spend ? top3 / totals.spend : 0)} description={<em>participação das três maiores categorias</em>} accent="var(--c60)" />
      <KpiCard label="Categoria com mais saving" value={savingLeader?.sav > 0 ? truncate(data.meta.categorias[savingLeader.k], 18) : '—'} description={savingLeader?.sav > 0 && <em>{brlCompact(savingLeader.sav)} · taxa de {percent(savingLeader.taxa)}</em>} accent="var(--roxo)" />
    </div>
    <div className="grid cards-2">
      <DashboardCard className="span-2" title="Spend por categoria" hint="Todas as categorias da seleção, em ordem de valor"><ChartCanvas config={allChart} className="tall" /></DashboardCard>
      <DashboardCard className="span-2" title="Evolução mensal das 6 maiores categorias" hint="Demais categorias agrupadas em “Outras”"><ChartCanvas config={monthly} className="tall" /></DashboardCard>
      <DashboardCard className="span-2" title="Detalhe por categoria" hint="Spend, participação, saving e taxa de saving">
        <DataTable columns={columns} rows={sorted} className="auto" sort={sort} onSort={key => setSort(current => ({ key, direction: current.key === key ? current.direction === 'desc' ? 'asc' : 'desc' : key === 'nome' ? 'asc' : 'desc' }))} emptyMessage="Nenhuma ordem atende aos filtros selecionados." />
      </DashboardCard>
    </div>
  </>;
}
