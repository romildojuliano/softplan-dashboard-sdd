'use client';

import { useMemo } from 'react';
import type { ChartConfiguration } from 'chart.js';
import { Badge } from '../Badge';
import { ChartCanvas } from '../ChartCanvas';
import { CsvButton } from '../CsvButton';
import { DashboardCard } from '../DashboardCard';
import { DataTable, type DataTableColumn } from '../DataTable';
import { FilterChips } from '../FilterChips';
import { KpiCard } from '../KpiCard';
import { Note } from '../Note';
import { Pagination } from '../Pagination';
import { percent } from '../../../lib/dashboard-calculations';
import { PROTOCOL_INDEX as P, PURCHASE_INDEX as O, type DashboardViewProps, type ProtocolOrigin, type ProtocolRow } from '../../../types/dashboard';

const emptyStrings: readonly string[] = [];
const count = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const colors = {
  purple: '#5C5CFF', purple400: '#8B8BFF', purple200: '#B9B9FF',
  c80: '#2B2F47', c70: '#464C6B', c60: '#9196AD', c40: '#DCDEEA',
};
const categoryColors = ['#5C5CFF', '#7373FF', '#8B8BFF', '#A2A2FF', '#B9B9FF', '#CACAF5', '#B4B9CE', '#9196AD', '#7F8499', '#6E7391', '#5D627E', '#4E536C', '#43475C', '#383C4E', '#2E3240'];
const companyColors: Record<string, string> = { Softplan: colors.purple, Poligraph: colors.c60, JXS: colors.c40, '1DOC': colors.purple200 };
const companyTags: Record<string, string> = { Softplan: 'softplan', Poligraph: 'poligraph', JXS: 'jxs', '1DOC': 'onedoc' };
const weekdays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const windows = ['Antes das 8h', 'Comercial 8h–18h', 'Após as 18h', 'Fim de semana'];
const gridX = { grid: { display: false }, border: { color: 'rgba(145,150,173,.20)' }, ticks: { padding: 4 } } as const;
const gridY = { grid: { color: 'rgba(145,150,173,.11)', drawTicks: false }, border: { display: false }, ticks: { padding: 6 } } as const;
const horizontalGrid = { ...gridY, grid: { color: 'rgba(145,150,173,.11)' } };
const PAGE_SIZE = 50;

function shortName(name: string): string {
  const parts = name.split(' ');
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]}` : name;
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function time(row: ProtocolRow): string {
  return `${String(row[P.hour]).padStart(2, '0')}:${String(row[P.minute] || 0).padStart(2, '0')}`;
}

// Weekends take precedence; 18:00 belongs to business hours, 18:01 does not.
function windowOf(row: ProtocolRow): number {
  if (row[P.weekday] >= 5) return 3;
  const minutes = row[P.hour] * 60 + (row[P.minute] || 0);
  return minutes < 480 ? 0 : minutes > 1080 ? 2 : 1;
}

function countBy(rows: readonly ProtocolRow[], index: number): { k: number; n: number }[] {
  const totals = new Map<number, number>();
  for (const row of rows) {
    const key = row[index] as number;
    if (key == null || key === -1) continue;
    totals.set(key, (totals.get(key) ?? 0) + 1);
  }
  return [...totals].map(([k, n]) => ({ k, n })).sort((a, b) => b.n - a.n);
}

function sortValue(row: ProtocolRow, key: string, meta: DashboardViewProps['data']['meta']): string | number {
  switch (key) {
    case 'dia': return row[P.date].split('/').reverse().join('') + String(row[P.hour]).padStart(2, '0') + String(row[P.minute] || 0).padStart(2, '0');
    case 'hora': return row[P.hour] * 60 + (row[P.minute] || 0);
    case 'emp': return meta.empresas[row[P.company]];
    case 'forn': return meta.fornecedores[row[P.supplier]];
    case 'pais': return (meta.protPaises ?? [])[row[P.country]];
    case 'met': return (meta.protMetodos ?? [])[row[P.method]];
    case 'resp': return row[P.buyer] >= 0 ? meta.compradores[row[P.buyer]] : 'zzz';
    default: return '';
  }
}

export function InvoicesView({ data, filtered, filters, setFilters, viewSort: sort, setViewSort: setSort }: DashboardViewProps) {
  const { meta } = data;
  const protocols = filtered.protocolos;
  const countries = meta.protPaises ?? emptyStrings;
  const methods = meta.protMetodos ?? emptyStrings;

  const result = useMemo(() => {
    const d = protocols;
    const total = d.length;
    const ext = d.filter((row) => row[P.country] !== meta.protPaisBR).length;
    const days = new Set(d.map((row) => row[P.date])).size;
    const monthsWithNotes = new Set(d.map((row) => row[P.month])).size || 1;
    const suppliers = new Set(d.map((row) => row[P.supplier])).size;
    const wrongMethod = d.filter((row) => row[P.country] !== meta.protPaisBR && !(meta.protMetExterior ?? []).includes(row[P.method])).length;
    const buyers = countBy(d, P.buyer);
    const companies = countBy(d, P.company);
    const groupedMethods = countBy(d, P.method);
    const otherCountries = countBy(d.filter((row) => row[P.country] !== meta.protPaisBR), P.country).slice(0, 10);
    const frequentSuppliers = countBy(d, P.supplier).slice(0, 15);
    const byWindow = [0, 0, 0, 0];
    for (const row of d) byWindow[windowOf(row)]++;
    const outside = byWindow[0] + byWindow[2] + byWindow[3];
    const monthly = meta.meses.map((_, index) => d.filter((row) => row[P.month] === index + 1).length);
    const orders = meta.meses.map((_, index) => new Set(filtered.rows.filter((row) => row[O.month] === index + 1).map((row) => row[O.order])).size);
    const byWeekday = weekdays.map((_, index) => d.filter((row) => row[P.weekday] === index).length);
    const hours = Array.from({ length: 17 }, (_, index) => index + 6);
    const outsideBuyers = buyers.map(({ k, n }) => {
      const sub = d.filter((row) => row[P.buyer] === k);
      const before = sub.filter((row) => windowOf(row) === 0).length;
      const after = sub.filter((row) => windowOf(row) === 2).length;
      const weekend = sub.filter((row) => windowOf(row) === 3).length;
      return { k, total: n, before, after, weekend, outside: before + after + weekend };
    }).sort((a, b) => b.outside - a.outside);
    const monthlyOutside = [0, 2, 3].map((window) => meta.meses.map((_, index) => d.filter((row) => row[P.month] === index + 1 && windowOf(row) === window).length));
    const extremes = d.filter((row) => windowOf(row) !== 1).sort((a, b) => {
      const weight = (row: ProtocolRow) => windowOf(row) === 0 ? -(480 - (row[P.hour] * 60 + (row[P.minute] || 0))) : row[P.hour] * 60 + (row[P.minute] || 0);
      return weight(b) - weight(a);
    }).slice(0, 12);
    const share = (value: number) => percent(value / Math.max(1, total));
    const doughnutOptions = {
      cutout: '62%', plugins: {
        legend: { position: 'bottom' as const },
        tooltip: { callbacks: { label: (context: { parsed: number }) => ` ${count.format(context.parsed)}  (${share(context.parsed)})` } },
      },
    };
    const charts = {
      month: {
        type: 'bar', data: { labels: [...meta.meses], datasets: [
          { type: 'bar', label: 'Notas protocoladas', data: monthly, backgroundColor: colors.purple, borderRadius: { topLeft: 8, topRight: 0 }, maxBarThickness: 48, order: 2 },
          { type: 'line', label: 'OCs emitidas', data: orders, borderColor: colors.c40, backgroundColor: colors.c40, tension: .3, pointRadius: 3.5, borderWidth: 2, order: 1 },
        ] }, options: { scales: { x: gridX, y: gridY }, plugins: { tooltip: { callbacks: {
          label: (context) => ` ${context.dataset.label}: ${count.format(context.parsed.y)}`,
          afterBody: (items) => { const i = items[0].dataIndex; return orders[i] ? `Notas por OC: ${decimal.format(monthly[i] / orders[i])}` : ''; },
        } } } },
      } satisfies ChartConfiguration<'bar' | 'line'>,
      company: {
        type: 'doughnut', data: { labels: companies.map(({ k }) => meta.empresas[k]), datasets: [{ data: companies.map(({ n }) => n), backgroundColor: companies.map(({ k }) => companyColors[meta.empresas[k]]), borderColor: colors.c80, borderWidth: 2, hoverOffset: 6 }] }, options: doughnutOptions,
      } satisfies ChartConfiguration<'doughnut'>,
      origin: {
        type: 'doughnut', data: { labels: ['Exterior', 'Nacional'], datasets: [{ data: [ext, total - ext], backgroundColor: [colors.purple, colors.c60], borderColor: colors.c80, borderWidth: 2, hoverOffset: 6 }] }, options: doughnutOptions,
      } satisfies ChartConfiguration<'doughnut'>,
      method: {
        type: 'bar', data: { labels: groupedMethods.map(({ k }) => methods[k]), datasets: [{ label: 'Notas', data: groupedMethods.map(({ n }) => n), backgroundColor: groupedMethods.map((_, i) => categoryColors[i]), borderRadius: { topRight: 6, bottomRight: 0 } }] }, options: { indexAxis: 'y', scales: { x: horizontalGrid, y: { ...gridX, ticks: { font: { size: 10 }, callback: function (value) { return truncate(this.getLabelForValue(Number(value)), 30); } } } }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (context) => ` ${count.format(context.parsed.x)} notas  (${share(context.parsed.x)})` } } } },
      } satisfies ChartConfiguration<'bar'>,
      country: {
        type: 'bar', data: { labels: otherCountries.map(({ k }) => countries[k]), datasets: [{ label: 'Notas', data: otherCountries.map(({ n }) => n), backgroundColor: otherCountries.map((_, i) => categoryColors[i]), borderRadius: { topRight: 6, bottomRight: 0 } }] }, options: { indexAxis: 'y', scales: { x: horizontalGrid, y: gridX }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (context) => ` ${count.format(context.parsed.x)} notas` } } } },
      } satisfies ChartConfiguration<'bar'>,
      buyer: {
        type: 'bar', data: { labels: [...meta.meses], datasets: buyers.map(({ k }, i) => ({ label: shortName(meta.compradores[k]), data: meta.meses.map((_, mi) => d.filter((row) => row[P.buyer] === k && row[P.month] === mi + 1).length), backgroundColor: categoryColors[i], stack: 's', borderRadius: 0 })) }, options: { scales: { x: { ...gridX, stacked: true }, y: { ...gridY, stacked: true } }, plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: (context) => ` ${context.dataset.label}: ${count.format(context.parsed.y)} notas` } } } },
      } satisfies ChartConfiguration<'bar'>,
      supplier: {
        type: 'bar', data: { labels: frequentSuppliers.map(({ k }) => meta.fornecedores[k]), datasets: [{ label: 'Notas', data: frequentSuppliers.map(({ n }) => n), backgroundColor: frequentSuppliers.map((_, i) => categoryColors[i % categoryColors.length]), borderRadius: { topRight: 6, bottomRight: 0 } }] }, options: { indexAxis: 'y', scales: { x: horizontalGrid, y: { ...gridX, ticks: { font: { size: 10 }, callback: function (value) { return truncate(this.getLabelForValue(Number(value)), 34); } } } }, plugins: { legend: { display: false }, tooltip: { callbacks: {
          title: (items) => meta.fornecedores[frequentSuppliers[items[0].dataIndex].k],
          label: (context) => ` ${count.format(context.parsed.x)} notas`,
          afterLabel: (context) => { const country = countries[d.find((row) => row[P.supplier] === frequentSuppliers[context.dataIndex].k)?.[P.country] ?? -1]; return country ? `Origem: ${country}` : ''; },
        } } } },
      } satisfies ChartConfiguration<'bar'>,
      weekday: {
        type: 'bar', data: { labels: weekdays, datasets: [{ label: 'Notas', data: byWeekday, backgroundColor: byWeekday.map((_, i) => i >= 5 ? colors.c70 : colors.purple), borderRadius: { topLeft: 8, topRight: 0 }, maxBarThickness: 44 }] }, options: { scales: { x: gridX, y: gridY }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (context) => ` ${count.format(context.parsed.y)} notas  (${share(context.parsed.y)})` } } } },
      } satisfies ChartConfiguration<'bar'>,
      hour: {
        type: 'bar', data: { labels: hours.map((hour) => `${String(hour).padStart(2, '0')}h`), datasets: [{ type: 'bar', label: 'Notas', data: hours.map((hour) => d.filter((row) => row[P.hour] === hour).length), backgroundColor: colors.purple, borderRadius: { topLeft: 5, topRight: 0 } }] }, options: { scales: { x: { ...gridX, ticks: { font: { size: 9 } } }, y: gridY }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (context) => ` ${count.format(context.parsed.y)} notas` } } } },
      } satisfies ChartConfiguration<'bar'>,
      window: {
        type: 'bar', data: { labels: windows, datasets: [{ label: 'Notas', data: byWindow, backgroundColor: [colors.purple, 'rgba(145,150,173,.30)', colors.purple, colors.purple400], borderRadius: { topLeft: 8, topRight: 0 }, maxBarThickness: 56 }] }, options: { scales: { x: { ...gridX, ticks: { font: { size: 10 } } }, y: gridY }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (context) => ` ${count.format(context.parsed.y)} notas  (${share(context.parsed.y)})` } } } },
      } satisfies ChartConfiguration<'bar'>,
      outsideBuyer: {
        type: 'bar', data: { labels: outsideBuyers.map(({ k }) => shortName(meta.compradores[k])), datasets: [
          { label: 'Antes das 8h', data: outsideBuyers.map(({ before }) => before), backgroundColor: colors.purple200, stack: 's', borderRadius: 0 },
          { label: 'Após as 18h', data: outsideBuyers.map(({ after }) => after), backgroundColor: colors.purple, stack: 's', borderRadius: 0 },
          { label: 'Fim de semana', data: outsideBuyers.map(({ weekend }) => weekend), backgroundColor: colors.c60, stack: 's', borderRadius: { topLeft: 8, topRight: 0 } },
        ] }, options: { scales: { x: { ...gridX, stacked: true, ticks: { font: { size: 10 } } }, y: { ...gridY, stacked: true } }, plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: {
          title: (items) => meta.compradores[outsideBuyers[items[0].dataIndex].k],
          label: (context) => ` ${context.dataset.label}: ${count.format(context.parsed.y)}`,
          afterBody: (items) => { const person = outsideBuyers[items[0].dataIndex]; return `${person.outside} de ${person.total} notas fora do horário (${percent(person.outside / person.total)})`; },
        } } } },
      } satisfies ChartConfiguration<'bar'>,
      outsideMonth: {
        type: 'bar', data: { labels: [...meta.meses], datasets: [
          { type: 'bar', label: 'Antes das 8h', data: monthlyOutside[0], backgroundColor: colors.purple200, stack: 's', order: 3 },
          { type: 'bar', label: 'Após as 18h', data: monthlyOutside[1], backgroundColor: colors.purple, stack: 's', order: 3 },
          { type: 'bar', label: 'Fim de semana', data: monthlyOutside[2], backgroundColor: colors.c60, stack: 's', borderRadius: { topLeft: 8, topRight: 0 }, order: 3 },
          { type: 'line', label: '% fora do horário', data: meta.meses.map((_, index) => monthly[index] ? (monthlyOutside[0][index] + monthlyOutside[1][index] + monthlyOutside[2][index]) / monthly[index] * 100 : 0), yAxisID: 'y1', borderColor: colors.c40, backgroundColor: colors.c40, tension: .3, pointRadius: 3.5, borderWidth: 2, order: 1 },
        ] }, options: { scales: { x: { ...gridX, stacked: true }, y: { ...gridY, stacked: true }, y1: { ...gridY, position: 'right', grid: { display: false }, ticks: { callback: (value: string | number) => `${count.format(Number(value))}%` }, suggestedMax: 16 } }, plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: (context) => context.dataset.yAxisID === 'y1' ? ` Fora do horário: ${decimal.format(context.parsed.y)}% do mês` : ` ${context.dataset.label}: ${count.format(context.parsed.y)}` } } } },
      } satisfies ChartConfiguration<'bar' | 'line'>,
    };
    return { total, ext, days, monthsWithNotes, suppliers, wrongMethod, buyers, outside, extremes, charts };
  }, [protocols, filtered.rows, meta, countries, methods]);

  const sorted = useMemo(() => [...protocols].sort((a, b) => {
    const left = sortValue(a, sort.key, meta);
    const right = sortValue(b, sort.key, meta);
    return (typeof left === 'string' && typeof right === 'string' ? left.localeCompare(right) : Number(left) - Number(right)) * (sort.direction === 'asc' ? 1 : -1);
  }), [protocols, sort, meta]);
  const maxPage = Math.max(0, Math.ceil(sorted.length / PAGE_SIZE) - 1);
  const page = Math.min(filters.pageProt, maxPage);
  const pageRows = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const { total, ext, days, monthsWithNotes, suppliers, wrongMethod, buyers, outside, extremes, charts } = result;
  const outsideShare = percent(outside / Math.max(1, total));
  const tableColumns: DataTableColumn<ProtocolRow>[] = [
    { key: 'dia', header: 'Data', align: 'left', render: (row) => <strong className="num">{row[P.date]}</strong> },
    { key: 'hora', header: 'Hora', render: (row) => <span className="num" style={windowOf(row) !== 1 ? { color: 'var(--roxo-200)' } : undefined}>{time(row)}</span> },
    { header: 'Dia', render: (row) => weekdays[row[P.weekday]] },
    { key: 'emp', header: 'Empresa', align: 'left', render: (row) => row[P.company] < 0 ? <span className="tag nd">n/d</span> : <span className={`tag ${companyTags[meta.empresas[row[P.company]]] ?? 'c'}`}>{meta.empresas[row[P.company]]}</span> },
    { key: 'forn', header: 'Fornecedor', align: 'left', render: (row) => truncate(meta.fornecedores[row[P.supplier]], 42) },
    { key: 'pais', header: 'País', render: (row) => row[P.country] === meta.protPaisBR ? countries[row[P.country]] : <span className="tag neg">{countries[row[P.country]]}</span> },
    { key: 'met', header: 'Método de pagamento', align: 'left', render: (row) => truncate(methods[row[P.method]], 32) },
    { key: 'resp', header: 'Protocolado por', align: 'left', render: (row) => row[P.buyer] >= 0 ? shortName(meta.compradores[row[P.buyer]]) : '—' },
  ];
  const outsideColumns: DataTableColumn<ProtocolRow>[] = [
    { header: 'Data', align: 'left', render: (row) => <strong className="num">{row[P.date]}</strong> },
    { header: 'Hora', render: (row) => <strong className="num">{time(row)}</strong> },
    { header: 'Dia', render: (row) => weekdays[row[P.weekday]] },
    { header: 'Janela', align: 'left', render: (row) => <span className={`tag ${windowOf(row) === 3 ? 'c' : 'neg'}`}>{windows[windowOf(row)]}</span> },
    { header: 'Fornecedor', align: 'left', render: (row) => truncate(meta.fornecedores[row[P.supplier]], 40) },
    { header: 'Protocolado por', align: 'left', render: (row) => row[P.buyer] >= 0 ? shortName(meta.compradores[row[P.buyer]]) : '—' },
  ];

  return <>
    <div className="grid kpis">
      <KpiCard label="Notas protocoladas" value={count.format(total)} description={<em>{count.format(Math.round(total / monthsWithNotes))} por mês em média</em>} accent="var(--roxo)" />
      <KpiCard label="Por dia com movimento" value={decimal.format(days ? total / days : 0)} description={<em>{count.format(days)} dias com protocolo no período</em>} accent="var(--c60)" />
      <KpiCard label="Fornecedores" value={count.format(suppliers)} description={<em>{decimal.format(suppliers ? total / suppliers : 0)} notas por fornecedor</em>} accent="var(--c40)" />
      <KpiCard label="Exterior" value={count.format(ext)} description={<em>{total ? percent(ext / total) : '0,0%'} das notas · {count.format(new Set(protocols.filter((row) => row[P.country] !== meta.protPaisBR).map((row) => row[P.country])).size)} países</em>} accent="var(--roxo-400)" />
      <KpiCard label="Maior carga" value={buyers.length ? shortName(meta.compradores[buyers[0].k]) : '—'} description={buyers.length ? <em>{count.format(buyers[0].n)} notas · {percent(buyers[0].n / total)} do total</em> : null} accent="var(--c60)" />
      <KpiCard label="Fora do horário" value={count.format(outside)} description={<em>{total ? outsideShare : '0,0%'} · antes das 8h, após as 18h ou fim de semana</em>} accent="var(--roxo-400)" />
    </div>
    <Note><b>O que esta aba mede.</b> Volume de notas fiscais protocoladas para pagamento — é a carga operacional do time depois que a compra já aconteceu. Não há valor em R$ na base, só a contagem de documentos, então os indicadores aqui são de <b>volume e ritmo</b>, não financeiros. {wrongMethod > 0 && <><b>Atenção à classificação.</b> {count.format(wrongMethod)} notas de fornecedores estrangeiros estão registradas com método de pagamento nacional, quase todas como “Cartão - Bradesco” em vez de “Exterior - Cartão - Bradesco”. O dashboard classifica origem pelo <b>país do fornecedor</b>, que é confiável — mas vale corrigir o método na origem, porque ele costuma alimentar controles de câmbio e retenção.</>}</Note>
    <div className="grid cards-2">
      <DashboardCard className="span-2" title="Notas protocoladas mês a mês" hint="Barras: notas protocoladas. Linha: ordens de compra emitidas no mesmo mês, para comparar as duas cargas." headerAction={<div className="localfilter"><span className="flabel">Origem</span><FilterChips label="Origem" value={filters.origin} options={[{ value: 'todos', label: 'Todas' }, { value: 'br', label: 'Nacional' }, { value: 'ext', label: 'Exterior' }]} onChange={(value) => setFilters((current) => ({ ...current, origin: value as ProtocolOrigin, pageProt: 0 }))} /></div>}><ChartCanvas config={charts.month} className="tall" /></DashboardCard>
      <DashboardCard title="Protocolos por empresa" hint="Participação no volume de notas"><ChartCanvas config={charts.company} /></DashboardCard>
      <DashboardCard title="Nacional x exterior" hint="Classificação pelo país do fornecedor"><ChartCanvas config={charts.origin} /></DashboardCard>
      <DashboardCard title="Método de pagamento" hint="Como cada nota foi liquidada"><ChartCanvas config={charts.method} className="tall" /></DashboardCard>
      <DashboardCard title="Países de origem" hint="Excluindo o Brasil · 10 maiores"><ChartCanvas config={charts.country} className="tall" /></DashboardCard>
      <DashboardCard className="span-2" title="Carga por responsável" hint="Notas protocoladas por pessoa, mês a mês"><ChartCanvas config={charts.buyer} className="tall" /></DashboardCard>
      <DashboardCard className="span-2" title="Fornecedores mais protocolados" hint="15 maiores por número de notas · indica recorrência de faturamento, não valor"><ChartCanvas config={charts.supplier} className="tall" /></DashboardCard>
      <DashboardCard className="span-2" title="Ritmo operacional" hint="Quando o protocolo acontece de fato — base para dimensionar plantão e definir prazos internos"><div className="subgrid"><div><div className="sublab">Por dia da semana</div><ChartCanvas config={charts.weekday} /></div><div><div className="sublab">Por hora do dia</div><ChartCanvas config={charts.hour} /></div></div></DashboardCard>
      <DashboardCard className="span-2" title="Protocolos fora do horário comercial" hint="Janela de referência: 8h às 18h em dia útil. Fim de semana entra como fora do horário independentemente da hora, e 18:00 em ponto ainda conta como comercial." headerAction={<Badge muted={!total || outside / total < .1}>{count.format(outside)} de {count.format(total)}</Badge>}>
        <div className="subgrid"><div><div className="sublab">Distribuição por janela</div><ChartCanvas config={charts.window} /></div><div><div className="sublab">Quem protocola fora do horário</div><ChartCanvas config={charts.outsideBuyer} /></div></div>
        <div style={{ marginTop: 20 }}><div className="sublab">Evolução mês a mês</div><ChartCanvas config={charts.outsideMonth} /></div>
        <div style={{ marginTop: 22 }}><div className="sublab">Registros mais extremos da seleção</div><DataTable rows={extremes} columns={outsideColumns} className="auto" emptyMessage="Nenhuma ordem atende aos filtros selecionados." /></div>
      </DashboardCard>
      <DashboardCard className="span-2" title="Detalhamento dos protocolos" hint="Clique nos títulos para ordenar. A busca livre do topo cobre fornecedor, método e país." headerAction={<CsvButton filename="notas_protocoladas_selecao.csv" headers={['Data', 'Hora', 'Dia da semana', 'Janela', 'Empresa', 'Fornecedor', 'Pais', 'Metodo de pagamento', 'Protocolado por']} rows={sorted.map((row) => [`${row[P.date]}/2026`, time(row), weekdays[row[P.weekday]], windows[windowOf(row)], meta.empresas[row[P.company]], meta.fornecedores[row[P.supplier]], countries[row[P.country]], methods[row[P.method]], row[P.buyer] >= 0 ? meta.compradores[row[P.buyer]] : ''])} />}>
        <DataTable rows={pageRows} columns={tableColumns} sort={sort} onSort={(key) => { setSort((current) => ({ key, direction: current.key === key ? current.direction === 'asc' ? 'desc' : 'asc' : key === 'dia' || key === 'hora' ? 'desc' : 'asc' })); setFilters((current) => ({ ...current, pageProt: 0 })); }} emptyMessage="Nenhuma ordem atende aos filtros selecionados." />
        <div className="tfoot"><span>{sorted.length ? `Mostrando ${count.format(page * PAGE_SIZE + 1)}–${count.format(Math.min(sorted.length, (page + 1) * PAGE_SIZE))} de ${count.format(sorted.length)} notas` : 'Nenhuma nota na seleção'}</span><Pagination page={page + 1} pageCount={maxPage + 1} onPageChange={(selected) => setFilters((current) => ({ ...current, pageProt: selected - 1 }))} /></div>
      </DashboardCard>
    </div>
  </>;
}
