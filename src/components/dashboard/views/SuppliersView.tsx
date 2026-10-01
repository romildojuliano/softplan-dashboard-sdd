'use client';

import type { ChartConfiguration } from 'chart.js';
import { ChartCanvas } from '../ChartCanvas';
import { DashboardCard } from '../DashboardCard';
import { DataTable, type DataTableColumn } from '../DataTable';
import { KpiCard } from '../KpiCard';
import { Note } from '../Note';
import { brl, brlCompact, calculateSupplierAbc, percent, type SupplierAbc } from '../../../lib/dashboard-calculations';
import type { DashboardViewProps } from '../../../types/dashboard';

const n0 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const n1 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const colors = { purple: '#5C5CFF', light: '#DCDEEA', gray: '#9196AD', dark: '#464C6B', text: '#B9B9FF', panel: '#2B2F47' };
const gridX = { grid: { display: false }, border: { color: 'rgba(145,150,173,.20)' }, ticks: { padding: 4 } } as const;
const gridY = { grid: { color: 'rgba(145,150,173,.11)', drawTicks: false }, border: { display: false }, ticks: { padding: 6 } } as const;
const moneyAxis = { ...gridY, ticks: { ...gridY.ticks, callback: (value: string | number) => brlCompact(Number(value)) } };
const truncate = (value: string, length: number) => value.length > length ? `${value.slice(0, length - 1)}…` : value;

export function SuppliersView({ data, filtered }: DashboardViewProps) {
  const { suppliers, total } = calculateSupplierAbc(filtered.rows);
  const count = (classification: SupplierAbc['classification']) => suppliers.filter((supplier) => supplier.classification === classification).length;
  const a = count('A');
  const b = count('B');
  const c = count('C');
  const spendC = suppliers.filter((supplier) => supplier.classification === 'C').reduce((sum, supplier) => sum + supplier.spend, 0);
  const top = suppliers.slice(0, 25);
  const classes = ['A', 'B', 'C'] as const;
  const classSpend = classes.map((classification) => suppliers.filter((supplier) => supplier.classification === classification).reduce((sum, supplier) => sum + supplier.spend, 0));
  const classCounts = [a, b, c];
  const topSaving = suppliers.filter((supplier) => supplier.saving > 0).sort((x, y) => y.saving - x.saving).slice(0, 8);
  const supplierName = (supplier: SupplierAbc) => data.meta.fornecedores[supplier.supplier];
  const pareto: ChartConfiguration<'bar' | 'line'> = {
    type: 'bar',
    data: { labels: top.map((supplier) => truncate(supplierName(supplier), 22)), datasets: [
      { type: 'bar', label: 'Spend', data: top.map((supplier) => supplier.spend), backgroundColor: top.map((supplier) => supplier.classification === 'A' ? colors.purple : supplier.classification === 'B' ? colors.gray : colors.dark), borderRadius: { topLeft: 6, topRight: 0 }, order: 2 },
      { type: 'line', label: 'Spend acumulado', data: top.map((supplier) => supplier.cumulativeShare * 100), yAxisID: 'y1', borderColor: colors.light, backgroundColor: colors.light, tension: .2, pointRadius: 2.5, borderWidth: 2, order: 1 },
    ] },
    options: { scales: {
      x: { ...gridX, ticks: { font: { size: 9 }, maxRotation: 62, minRotation: 62 } },
      y: moneyAxis,
      y1: { ...gridY, position: 'right', grid: { display: false }, min: 0, max: 100, ticks: { callback: (value) => `${n0.format(Number(value))}%` } },
    }, plugins: { tooltip: { callbacks: {
      title: (items) => supplierName(top[items[0].dataIndex]),
      label: (item) => item.dataset.yAxisID === 'y1' ? ` Acumulado: ${n1.format(item.parsed.y)}%` : ` Spend: ${brl(item.parsed.y)}`,
      afterBody: (items) => { const supplier = top[items[0].dataIndex]; return `Classe ${supplier.classification} · ${n0.format(supplier.orders)} OCs · saving ${brl(supplier.saving)}`; },
    } } } },
  };
  const concentration: ChartConfiguration<'doughnut'> = {
    type: 'doughnut',
    data: { labels: classes.map((classification, index) => `Classe ${classification} · ${n0.format(classCounts[index])} forn.`), datasets: [{ data: classSpend, backgroundColor: [colors.purple, colors.gray, colors.dark], borderColor: colors.panel, borderWidth: 2, hoverOffset: 6 }] },
    options: { cutout: '60%', plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: (item) => ` ${brl(item.parsed)}  (${percent(total ? item.parsed / total : 0)})` } } } },
  };
  const saving: ChartConfiguration<'bar'> = {
    type: 'bar',
    data: { labels: topSaving.map((supplier) => truncate(supplierName(supplier), 22)), datasets: [{ label: 'Saving', data: topSaving.map((supplier) => supplier.saving), backgroundColor: colors.purple, borderRadius: { topRight: 6, bottomRight: 0 } }] },
    options: { indexAxis: 'y', scales: { x: moneyAxis, y: { ...gridX, ticks: { font: { size: 10 } } } }, plugins: { legend: { display: false }, tooltip: { callbacks: {
      title: (items) => supplierName(topSaving[items[0].dataIndex]),
      label: (item) => ` ${brl(item.parsed.x)}`,
      afterLabel: (item) => `Taxa: ${percent(topSaving[item.dataIndex].savingRateOnNegotiable)}`,
    } } } },
  };
  const maxSpend = suppliers[0]?.spend ?? 0;
  const columns: DataTableColumn<SupplierAbc & { rank: number }>[] = [
    { header: '#', render: (supplier) => <span className="num" style={{ color: 'var(--txt-3)' }}>{supplier.rank}</span> },
    { header: 'Fornecedor', align: 'left', render: (supplier) => <strong title={supplierName(supplier)}>{truncate(supplierName(supplier), 46)}</strong> },
    { header: 'Classe', render: (supplier) => <span className={`tag ${supplier.classification.toLowerCase()}`}>{supplier.classification}</span> },
    { header: 'OCs', render: (supplier) => <span className="num">{n0.format(supplier.orders)}</span> },
    { header: 'Spend', render: (supplier) => <div className="bar-cell"><div className="fill" style={{ width: `${maxSpend > 0 ? Math.max(1.5, supplier.spend / maxSpend * 100) : 0}%` }} /><span className="num">{brl(supplier.spend)}</span></div> },
    { header: '% do total', render: (supplier) => <span className="num">{percent(supplier.share)}</span> },
    { header: '% acumulado', render: (supplier) => <span className="num">{percent(supplier.cumulativeShare)}</span> },
    { header: 'Saving', render: (supplier) => <span className="num">{supplier.saving > 0 ? brl(supplier.saving) : '—'}</span> },
    { header: 'Taxa', render: (supplier) => <span className="num">{supplier.saving > 0 ? percent(supplier.savingRateOnNegotiable) : '—'}</span> },
  ];

  return <div>
    <div className="grid kpis">
      <KpiCard label="Fornecedores ativos" value={n0.format(suppliers.length)} description={<em>{n0.format(filtered.rows.length)} linhas de ordem</em>} accent="var(--c40)" />
      <KpiCard label="Concentração top 10" value={percent(total ? suppliers.slice(0, 10).reduce((sum, supplier) => sum + supplier.spend, 0) / total : 0)} description={<em>do spend em 10 fornecedores</em>} accent="var(--c60)" />
      <KpiCard label="Classe A" value={n0.format(a)} description={<em>{percent(suppliers.length ? a / suppliers.length : 0)} dos fornecedores respondem por 80% do spend</em>} accent="var(--roxo)" />
      <KpiCard label="Cauda longa (classe C)" value={n0.format(c)} description={<em>{brlCompact(spendC)} em {percent(suppliers.length ? c / suppliers.length : 0)} dos fornecedores</em>} accent="var(--c70)" />
    </div>
    <Note><b>Leitura da curva.</b> {n0.format(a)} fornecedores concentram 80% do spend da seleção — é neles que a negociação tem maior alavancagem. As classes B ({n0.format(b)}) e C ({n0.format(c)}) somam {percent(total ? (total - suppliers.slice(0, a).reduce((sum, supplier) => sum + supplier.spend, 0)) / total : 0)} do valor e pedem simplificação ou compra por catálogo, não negociação individual.</Note>
    <div className="grid cards-2">
      <DashboardCard title="Curva ABC de fornecedores" hint="Top 25 por spend. Linha mostra o acumulado do spend total da seleção." className="span-2"><ChartCanvas config={pareto} className="tall" /></DashboardCard>
      <DashboardCard title="Concentração por classe" hint="A até 80% do spend · B até 95% · C o restante"><ChartCanvas config={concentration} /></DashboardCard>
      <DashboardCard title="Fornecedores com maior saving" hint="Top 8 por valor economizado"><ChartCanvas config={saving} /></DashboardCard>
      <DashboardCard title="Ranking de fornecedores" hint="Classe ABC, spend acumulado, ordens e saving" className="span-2"><DataTable columns={columns} rows={suppliers.slice(0, 120).map((supplier, index) => ({ ...supplier, rank: index + 1 }))} emptyMessage="Nenhuma ordem atende aos filtros selecionados." /></DashboardCard>
    </div>
  </div>;
}
