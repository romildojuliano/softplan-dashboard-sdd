'use client';

import type { ChartConfiguration } from 'chart.js';
import { ChartCanvas } from '../ChartCanvas';
import { DashboardCard } from '../DashboardCard';
import { DataTable } from '../DataTable';
import { KpiCard } from '../KpiCard';
import { Note } from '../Note';
import { brl, brlCompact, calculateTotals, groupByMonth, percent } from '../../../lib/dashboard-calculations';
import { PURCHASE_INDEX as I, type DashboardViewProps } from '../../../types/dashboard';

const n0 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const n1 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const purple = '#5C5CFF';
const gray = '#9196AD';
const ramp = ['#5C5CFF','#7373FF','#8B8BFF','#A2A2FF','#B9B9FF','#CACAF5','#B4B9CE','#9196AD','#7F8499','#6E7391','#5D627E','#4E536C','#43475C','#383C4E','#2E3240'];
const gridX = { grid: { display: false }, border: { color: 'rgba(145,150,173,.20)' }, ticks: { padding: 4 } };
const gridY = { grid: { color: 'rgba(145,150,173,.11)', drawTicks: false }, border: { display: false }, ticks: { padding: 6 } };
const money = { ...gridY, ticks: { padding: 6, callback: (value: string | number) => brlCompact(Number(value)) } };
const short = (value: string, max: number) => value.length > max ? `${value.slice(0, max - 1)}…` : value;

export function RecordsView({ data, filtered }: DashboardViewProps) {
  const totals = calculateTotals(filtered.rows);
  const records = filtered.rows.filter(r => r[I.nature] >= 0);
  const months = groupByMonth(filtered.rows, data.meta.meses);
  const group = (index: number) => {
    const groups = new Map<number, { key: number; spend: number; lines: number }>();
    for (const row of records) {
      const key = row[index];
      if (typeof key !== 'number') continue;
      const item = groups.get(key) ?? { key, spend: 0, lines: 0 };
      item.spend += row[I.spend];
      item.lines++;
      groups.set(key, item);
    }
    return [...groups.values()].sort((a, b) => b.spend - a.spend);
  };
  const reasons = group(I.nature);
  const suppliers = group(I.supplier).slice(0, 25);
  const supplierReasons = new Map<number, Set<string>>();
  for (const row of records) {
    const supplier = row[I.supplier];
    const reason = supplierReasons.get(supplier) ?? new Set<string>();
    reason.add(data.meta.regTipos[row[I.nature]]);
    supplierReasons.set(supplier, reason);
  }
  const reasonChart: ChartConfiguration<'bar'> = { type: 'bar', data: { labels: reasons.map(r => data.meta.regTipos[r.key]), datasets: [{ label: 'Valor', data: reasons.map(r => r.spend), backgroundColor: reasons.map((_, i) => ramp[i]), borderRadius: { topRight: 6, bottomRight: 0 } }] }, options: { indexAxis: 'y', scales: { x: money, y: { ...gridX, ticks: { font: { size: 10.5 } } } }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ` ${brl(c.parsed.x)}`, afterLabel: c => `${n0.format(reasons[c.dataIndex].lines)} linhas · ${percent(totals.records ? reasons[c.dataIndex].spend / totals.records : 0)} dos registros` } } } } };
  const monthlyChart: ChartConfiguration<'bar'> = { type: 'bar', data: { labels: [...data.meta.meses], datasets: [
    { label: 'Negociável', data: months.map(m => m.negotiable), backgroundColor: gray, stack: 's' },
    { label: 'Registros', data: months.map(m => m.records), backgroundColor: purple, stack: 's', borderRadius: { topLeft: 8, topRight: 0 } },
  ] }, options: { scales: { x: { ...gridX, stacked: true }, y: { ...money, stacked: true } }, plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: c => ` ${c.dataset.label}: ${brl(c.parsed.y)}`, afterBody: items => { const month = months[items[0].dataIndex]; return `Registros: ${percent(month.spend ? month.records / month.spend : 0)} do mês`; } } } } } };
  return <>
    <div className="grid kpis">
      <KpiCard label="Total em registros" value={brlCompact(totals.records)} description={<em>{percent(totals.spend ? totals.records / totals.spend : 0)} do spend · {n0.format(records.length)} linhas</em>} accent="var(--roxo)" />
      <KpiCard label="Spend negociável" value={brlCompact(totals.negotiable)} description={<em>base real de atuação da equipe</em>} accent="var(--c60)" />
      <KpiCard label="Maior motivo" value={reasons[0] ? short(data.meta.regTipos[reasons[0].key], 18) : '—'} description={reasons[0] ? <em>{brlCompact(reasons[0].spend)} em {n0.format(reasons[0].lines)} linhas</em> : undefined} accent="var(--roxo-400)" />
      <KpiCard label="Ganho na taxa de saving" value={`+${n1.format((totals.savingRateOnNegotiable - totals.savingRateOnSpend) * 100)} p.p.`} description={<em>medindo sobre o negociável em vez do total</em>} accent="var(--roxo)" />
    </div>
    <Note><b>O que são registros.</b> Ordens marcadas como “Registro” entram no fluxo apenas para formalização e pagamento — contratos PJ, honorários de conselho, restrições normativas, repasses a parceiros e movimentações intercompany. Elas compõem o spend, mas não são endereçáveis por negociação, por isso a taxa de saving da equipe é medida sobre o <b>spend negociável</b>.</Note>
    <div className="grid cards-2">
      <DashboardCard title="Registros por motivo" hint="Valor formalizado em cada natureza"><ChartCanvas config={reasonChart} /></DashboardCard>
      <DashboardCard title="Negociável x registro por mês" hint="Participação do spend não endereçável"><ChartCanvas config={monthlyChart} /></DashboardCard>
      <DashboardCard className="span-2" title="Principais fornecedores em registro" hint="Maiores valores formalizados sem negociação">
        <DataTable rows={suppliers} emptyMessage="Nenhuma ordem atende aos filtros selecionados." columns={[
          { header: 'Fornecedor', align: 'left', render: row => <strong>{short(data.meta.fornecedores[row.key], 40)}</strong> },
          { header: 'Motivo', align: 'left', render: row => <span className="tag reg">{short([...supplierReasons.get(row.key)!].join(', '), 34)}</span> },
          { header: 'Linhas', render: row => <span className="num">{n0.format(row.lines)}</span> },
          { header: 'Valor', render: row => <div className="bar-cell"><div className="fill" style={{ width: `${suppliers[0]?.spend ? Math.max(1.5, row.spend / suppliers[0].spend * 100) : 0}%` }} /><span className="num">{brl(row.spend)}</span></div> },
          { header: '% dos registros', render: row => <span className="num">{percent(totals.records ? row.spend / totals.records : 0)}</span> },
        ]} />
      </DashboardCard>
    </div>
  </>;
}
