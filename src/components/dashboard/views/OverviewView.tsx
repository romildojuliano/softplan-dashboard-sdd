'use client';

import type { ChartConfiguration } from 'chart.js';
import { ChartCanvas } from '../ChartCanvas';
import { DashboardCard } from '../DashboardCard';
import { KpiCard } from '../KpiCard';
import { Note } from '../Note';
import { brl, brlCompact, calculateTotals, groupByMonth, percent } from '../../../lib/dashboard-calculations';
import { PURCHASE_INDEX as I, type DashboardViewProps } from '../../../types/dashboard';

const n0 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const n1 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const purple = '#5C5CFF';
const gray = '#9196AD';
const dark = '#2B2F47';
const ramp = ['#5C5CFF','#7373FF','#8B8BFF','#A2A2FF','#B9B9FF','#CACAF5','#B4B9CE','#9196AD','#7F8499','#6E7391'];
const gridX = { grid: { display: false }, border: { color: 'rgba(145,150,173,.20)' }, ticks: { padding: 4 } };
const gridY = { grid: { color: 'rgba(145,150,173,.11)', drawTicks: false }, border: { display: false }, ticks: { padding: 6 } };
const money = { ...gridY, ticks: { padding: 6, callback: (value: string | number) => brlCompact(Number(value)) } };
const short = (value: string, max: number) => value.length > max ? `${value.slice(0, max - 1)}…` : value;

export function OverviewView({ data, filtered }: DashboardViewProps) {
  const rows = filtered.rows;
  const totals = calculateTotals(rows);
  const months = groupByMonth(rows, data.meta.meses);
  const grouped = (index: number) => {
    const sums = new Map<number, { key: number; spend: number; lines: number }>();
    for (const row of rows) {
      const key = row[index];
      if (typeof key !== 'number') continue;
      const entry = sums.get(key) ?? { key, spend: 0, lines: 0 };
      entry.spend += row[I.spend];
      entry.lines++;
      sums.set(key, entry);
    }
    return [...sums.values()].sort((a, b) => b.spend - a.spend);
  };
  const companies = grouped(I.company);
  const categories = grouped(I.category).slice(0, 10);
  const currencies = grouped(I.currency);
  const monthly: ChartConfiguration<'bar' | 'line'> = {
    type: 'bar', data: { labels: months.map(m => m.month), datasets: [
      { type: 'bar', label: 'Negociável', data: months.map(m => m.negotiable), backgroundColor: gray, stack: 's', order: 3 },
      { type: 'bar', label: 'Registros', data: months.map(m => m.records), backgroundColor: 'rgba(145,150,173,.20)', borderColor: gray, borderWidth: { top: 1 }, stack: 's', borderRadius: { topLeft: 8, topRight: 0 }, order: 3 },
      { type: 'line', label: 'Saving % do negociável', data: months.map(m => m.savingRateOnNegotiable * 100), yAxisID: 'y1', borderColor: purple, backgroundColor: purple, tension: .3, pointRadius: 4, pointHoverRadius: 6, borderWidth: 2.5, order: 1 },
    ] }, options: { scales: { x: { ...gridX, stacked: true }, y: { ...money, stacked: true, grace: '12%' }, y1: { ...gridY, position: 'right', grid: { display: false }, ticks: { callback: (v: string | number) => `${n0.format(Number(v))}%` }, suggestedMax: 16 } }, plugins: {
      totalPilha: { ativo: true, formato: brlCompact, cor: '#FFFFFF', tamanho: 11.5, recuo: 9 },
      tooltip: { callbacks: { label: ctx => ctx.dataset.yAxisID === 'y1' ? ` Saving: ${n1.format(ctx.parsed.y)}% do negociável` : ` ${ctx.dataset.label}: ${brl(ctx.parsed.y)}`, afterBody: items => `Spend total do mês: ${brl(months[items[0].dataIndex].spend)}` } },
    } },
  };
  const companyChart: ChartConfiguration<'doughnut'> = { type: 'doughnut', data: { labels: companies.map(c => data.meta.empresas[c.key]), datasets: [{ data: companies.map(c => c.spend), backgroundColor: companies.map(c => ({ Softplan: purple, Poligraph: gray, JXS: '#DCDEEA', '1DOC': '#B9B9FF' })[data.meta.empresas[c.key]] ?? gray), borderColor: dark, borderWidth: 2, hoverOffset: 6 }] }, options: { cutout: '62%', plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: c => ` ${brl(c.parsed)}  (${percent(c.parsed / (totals.spend || 1))})` } } } } };
  const volume: ChartConfiguration<'bar'> = { type: 'bar', data: { labels: months.map(m => m.month), datasets: [{ label: 'Ordens criadas', data: months.map(m => m.orders), backgroundColor: purple, borderRadius: { topLeft: 8, topRight: 0 }, maxBarThickness: 42 }] }, options: { scales: { x: gridX, y: gridY }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ` ${n0.format(c.parsed.y)} ordens` } } } } };
  const categoryChart: ChartConfiguration<'bar'> = { type: 'bar', data: { labels: categories.map(c => data.meta.categorias[c.key]), datasets: [{ label: 'Spend', data: categories.map(c => c.spend), backgroundColor: categories.map((_, i) => ramp[i]), borderRadius: { topRight: 6, bottomRight: 0 } }] }, options: { indexAxis: 'y', scales: { x: money, y: { ...gridX, ticks: { font: { size: 10.5 }, callback: function (value) { return short(this.getLabelForValue(Number(value)), 26); } } } }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ` ${brl(c.parsed.x)}` } } } } };
  const currencyChart: ChartConfiguration<'bar'> = { type: 'bar', data: { labels: currencies.map(c => data.meta.moedas[c.key]), datasets: [{ label: 'Spend em R$', data: currencies.map(c => c.spend), backgroundColor: [purple, gray, '#DCDEEA'], borderRadius: { topLeft: 10, topRight: 0 }, maxBarThickness: 58 }] }, options: { scales: { x: gridX, y: money }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ` ${brl(c.parsed.y)}`, afterLabel: c => `${n0.format(currencies[c.dataIndex].lines)} linhas` } } } } };
  return <>
    <div className="grid kpis">
      <KpiCard label="Spend total" value={brlCompact(totals.spend)} description={<em>{n0.format(totals.orders)} ordens · {n0.format(totals.lines)} linhas</em>} accent="var(--c60)" />
      <KpiCard label="Spend negociável" value={brlCompact(totals.negotiable)} description={<em>{percent(totals.spend ? totals.negotiable / totals.spend : 0)} do total · registros {brlCompact(totals.records)}</em>} accent="var(--c60)" />
      <KpiCard label="Saving capturado" value={brlCompact(totals.saving)} description={<em>{percent(totals.savingRateOnNegotiable)} do negociável · {percent(totals.savingRateOnSpend)} do total</em>} accent="var(--roxo)" />
      <KpiCard label="Ticket médio por OC" value={brlCompact(totals.averageTicket)} description={<em>{n0.format(totals.suppliers)} fornecedores ativos</em>} accent="var(--c40)" />
      <KpiCard label="Ordens negociadas" value={n0.format(totals.negotiatedOrders)} description={<em>desconto médio de {percent(totals.averageDiscount)} nessas ordens</em>} accent="var(--roxo-400)" />
    </div>
    <Note><b>Como ler os números.</b> Ordem de compra (OC) é o documento; linha é cada item dentro dele. Jan–Mai e Jul vieram do extrato consolidado por OC, então linha e OC coincidem. Junho veio detalhado por item — 699 linhas para 310 OCs — o que não altera spend nem saving, mas explica o salto na contagem de linhas. Todos os indicadores de volume usam <b>OCs distintas</b>; os financeiros somam as linhas.</Note>
    <div className="grid cards-2">
      <DashboardCard className="span-2" title="Spend e saving mês a mês" hint={<>Barras empilhadas: valor negociável x registros, com o <b>spend total do mês</b> rotulado no topo. Linha: saving capturado sobre o negociável.</>}><ChartCanvas config={monthly} className="tall" /></DashboardCard>
      <DashboardCard title="Spend por empresa" hint="Participação no valor total das ordens"><ChartCanvas config={companyChart} /></DashboardCard>
      <DashboardCard title="Volume de ordens por mês" hint="OCs distintas criadas no período"><ChartCanvas config={volume} /></DashboardCard>
      <DashboardCard title="Top 10 categorias por spend" hint="Classificação derivada da descrição e do fornecedor"><ChartCanvas config={categoryChart} className="tall" /></DashboardCard>
      <DashboardCard title="Moeda de contratação" hint="Valores convertidos a R$ 5,20/US$"><ChartCanvas config={currencyChart} className="tall" /></DashboardCard>
    </div>
  </>;
}
