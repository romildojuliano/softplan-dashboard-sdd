'use client';

import { useState } from 'react';
import type { ChartConfiguration } from 'chart.js';
import { REQUEST_INDEX as Q, PURCHASE_INDEX as P, type DashboardViewProps, type RequestRow } from '../../../types/dashboard';
import { ChartCanvas } from '../ChartCanvas';
import { KpiCard } from '../KpiCard';
import { DashboardCard } from '../DashboardCard';
import { DataTable, type DataTableColumn, type DataTableSort } from '../DataTable';
import { FilterChips } from '../FilterChips';
import { Pagination } from '../Pagination';
import { Note } from '../Note';
import { Badge } from '../Badge';
import { CsvButton } from '../CsvButton';

const fmt0 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const fmt1 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const pct = (value: number) => `${fmt1.format(value * 100)}%`;
const shortName = (name: string) => { const words = name.split(' '); return words.length > 1 ? `${words[0]} ${words[words.length - 1]}` : name; };
const trunc = (text: string, size: number) => text.length > size ? `${text.slice(0, size - 1)}…` : text;
const violet = '#5C5CFF';
const violet400 = '#8B8BFF';
const grey = '#9196AD';
const light = '#DCDEEA';
const colors = ['#5C5CFF','#7373FF','#8B8BFF','#A2A2FF','#B9B9FF','#CACAF5','#B4B9CE','#9196AD','#7F8499','#6E7391','#5D627E','#4E536C','#43475C','#383C4E','#2E3240'];
const gridX = { grid: { display: false }, border: { color: 'rgba(145,150,173,.20)' }, ticks: { padding: 4 } } as const;
const gridY = { grid: { color: 'rgba(145,150,173,.11)', drawTicks: false }, border: { display: false }, ticks: { padding: 6 } } as const;
const legendBottom = { legend: { position: 'bottom' as const } };
const noLegend = { legend: { display: false } };
const PAGE_SIZE = 50;
const MIN_VOLUME = 5;

type Count = { k: number; n: number };
type Performer = Count & { det: number; est: number; linhas: number; urg: number; comUrg: number; meses: number; ora: number; doc: number };
type Originator = { k: number; sx: number; req: number; urg: number; nmes: number; p: number };

function count(rows: readonly RequestRow[], index: number): Count[] {
  const counts = new Map<number, number>();
  for (const row of rows) {
    const key = row[index];
    if (typeof key === 'number' && key >= 0) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts].map(([k, n]) => ({ k, n })).sort((a, b) => b.n - a.n);
}

function BarCell({ value, max }: { value: number; max: number }) {
  return <div className="bar-cell"><div className="fill" style={{ width: `${Math.max(1.5, value / max * 100)}%` }} /><span className="num">{fmt0.format(value)}</span></div>;
}

function companyTag(company: number, names: readonly string[]) {
  if (company < 0) return <span className="tag nd">n/d</span>;
  const name = names[company];
  const label = ({ Softplan: 'softplan', Poligraph: 'poligraph', JXS: 'jxs', '1DOC': 'onedoc' } as Record<string, string>)[name] ?? 'c';
  return <span className={`tag ${label}`}>{name}</span>;
}

export function RequestsView({ data, filtered, filters, setFilters, viewSort: requestSort, setViewSort: setRequestSort }: DashboardViewProps) {
  const [performanceSort, setPerformanceSort] = useState<DataTableSort | null>(null);
  const d = filtered.requisicoes;
  const detailed = d.filter(row => row[Q.estimated] !== 1);
  const estimated = d.length - detailed.length;
  const lines = detailed.reduce((total, row) => total + row[Q.lines], 0);
  const monthsCount = new Set(d.map(row => row[Q.month])).size || 1;
  const urgencyCount = d.filter(row => row[Q.urgency] >= 0).length;
  const urgentCount = d.filter(row => row[Q.urgency] === 1).length;
  const buyers = count(d, Q.buyer);
  const { meses: months, empresas: companies, compradores: buyerNames } = data.meta;
  const monthLabels = [...months];
  const people = data.meta.reqPessoas ?? [];
  const systems = data.meta.reqSistemas ?? ['Oracle', '1DOC'];
  const roles = data.meta.reqPapeis ?? ['Criador', 'Aprovador'];
  const byMonth = months.map((_, index) => d.filter(row => row[Q.month] === index + 1));
  const oracleByMonth = byMonth.map(rows => rows.filter(row => row[Q.system] === 0).length);
  const docByMonth = byMonth.map(rows => rows.filter(row => row[Q.system] === 1).length);
  const uniqueByMonth = byMonth.map(rows => rows.length);
  const itemByMonth = byMonth.map(rows => rows.reduce((sum, row) => sum + (row[Q.estimated] === 1 ? 1 : row[Q.lines]), 0));
  const urgencyByMonth = byMonth.map(rows => rows.filter(row => row[Q.urgency] === 1).length);
  const knownByMonth = byMonth.map(rows => rows.filter(row => row[Q.urgency] >= 0).length);
  const companyCounts = count(d, Q.company);
  const companyTotal = companyCounts.reduce((sum, row) => sum + row.n, 0);
  const maxBuyer = Math.max(1, ...buyers.map(row => row.n));

  const performance: Performer[] = buyers.map(({ k, n }) => {
    const rows = d.filter(row => row[Q.buyer] === k);
    const details = rows.filter(row => row[Q.estimated] !== 1);
    return { k, n, det: details.length, est: n - details.length,
      linhas: details.reduce((sum, row) => sum + row[Q.lines], 0),
      urg: rows.filter(row => row[Q.urgency] === 1).length,
      comUrg: rows.filter(row => row[Q.urgency] >= 0).length,
      meses: new Set(rows.map(row => row[Q.month])).size,
      ora: rows.filter(row => row[Q.system] === 0).length,
      doc: rows.filter(row => row[Q.system] === 1).length };
  });
  const performanceKeys: Record<string, (person: Performer) => string | number> = {
    buyer: row => buyerNames[row.k], n: row => row.n, share: row => row.n / Math.max(1, d.length),
    month: row => row.meses ? Math.round(row.n / row.meses) : 0,
    estimated: row => row.est, lines: row => row.linhas,
    perRequest: row => row.det ? row.linhas / row.det : -1,
    urgent: row => row.urg, urgencyRate: row => row.comUrg ? row.urg / row.comUrg : -1,
    oracle: row => row.ora, doc: row => row.doc,
  };
  const displayedPerformance = performanceSort ? [...performance].sort((a, b) => {
    const first = performanceKeys[performanceSort.key](a);
    const second = performanceKeys[performanceSort.key](b);
    const result = typeof first === 'string' && typeof second === 'string' ? first.localeCompare(second) : Number(first) - Number(second);
    return result * (performanceSort.direction === 'asc' ? 1 : -1);
  }) : performance;
  const performanceColumns: DataTableColumn<Performer>[] = [
    { key: 'buyer', header: 'Comprador', align: 'left', render: row => <strong>{buyerNames[row.k]}</strong> },
    { key: 'n', header: 'Requisições', render: row => <BarCell value={row.n} max={maxBuyer} /> },
    { key: 'share', header: '% do total', render: row => <span className="num">{pct(row.n / Math.max(1, d.length))}</span> },
    { key: 'month', header: 'Média por mês', render: row => <span className="num">{fmt0.format(row.meses ? Math.round(row.n / row.meses) : 0)}</span> },
    { key: 'estimated', header: 'Estimadas', render: row => row.est ? <span className="num">{fmt0.format(row.est)}</span> : '—' },
    { key: 'lines', header: 'Linhas de item', render: row => <span className="num">{fmt0.format(row.linhas)}</span> },
    { key: 'perRequest', header: 'Itens por req.', render: row => <span className="num">{row.det ? fmt1.format(row.linhas / row.det) : '—'}</span> },
    { key: 'urgent', header: 'Urgentes', render: row => <span className="num">{fmt0.format(row.urg)}</span> },
    { key: 'urgencyRate', header: '% urgentes', render: row => <span className="num">{row.comUrg ? pct(row.urg / row.comUrg) : '—'}</span> },
    { key: 'oracle', header: 'Oracle', render: row => <span className="num">{fmt0.format(row.ora)}</span> },
    { key: 'doc', header: '1DOC', render: row => <span className="num">{fmt0.format(row.doc)}</span> },
  ];

  const ocByMonth = months.map((_, index) => new Set(filtered.rows.filter(row => row[P.month] === index + 1).map(row => row[P.order])).size);
  const systemsUrgency = [0, 1].map(system => {
    const rows = d.filter(row => row[Q.system] === system && row[Q.urgency] >= 0);
    return { system, n: rows.length, urgent: rows.filter(row => row[Q.urgency] === 1).length };
  }).filter(row => row.n > 0);
  const oracleUrgency = systemsUrgency.find(row => row.system === 0);
  const docUrgency = systemsUrgency.find(row => row.system === 1);

  function originators(system: number): Originator[] {
    const grouped = new Map<number, { req: number; urg: number; months: Set<number> }>();
    for (const row of detailed) {
      if (row[Q.system] !== system || row[Q.requester] < 0) continue;
      const person = grouped.get(row[Q.requester]) ?? { req: 0, urg: 0, months: new Set<number>() };
      person.req++;
      person.urg += row[Q.urgency];
      person.months.add(row[Q.month]);
      grouped.set(row[Q.requester], person);
    }
    return [...grouped].map(([k, row]) => ({ k, sx: system, req: row.req, urg: row.urg,
      nmes: row.months.size, p: row.req ? row.urg / row.req : 0 }));
  }
  const oracleOriginators = originators(0);
  const docOriginators = originators(1);
  const rank = [...oracleOriginators, ...docOriginators].filter(row => row.urg > 0).sort((a, b) => b.urg - a.urg || b.p - a.p);
  const recurrent = [...oracleOriginators, ...docOriginators].filter(row => row.req >= MIN_VOLUME && row.urg > 0).sort((a, b) => b.p - a.p).slice(0, 14);
  const maxUrgent = Math.max(1, ...rank.map(row => row.urg));
  const topPeople = count(d, Q.requester).slice(0, 15);
  const totalOracle = oracleOriginators.reduce((total, row) => ({ req: total.req + row.req, urg: total.urg + row.urg }), { req: 0, urg: 0 });
  const totalDoc = docOriginators.reduce((total, row) => ({ req: total.req + row.req, urg: total.urg + row.urg }), { req: 0, urg: 0 });
  const highRecurrence = recurrent.filter(row => row.p >= .5).length;

  function offenderChart(rows: Originator[]): ChartConfiguration<'bar'> {
    const top = [...rows].filter(row => row.urg > 0).sort((a, b) => b.urg - a.urg).slice(0, 10);
    return { type: 'bar', data: { labels: top.map(row => people[row.k]), datasets: [{ label: 'Urgentes', data: top.map(row => row.urg), backgroundColor: top.map(row => row.p >= .5 ? violet : grey), borderRadius: { topRight: 6, bottomRight: 0 } }] },
      options: { indexAxis: 'y', scales: { x: gridY, y: { ...gridX, ticks: { font: { size: 10 }, callback(value) { return trunc(this.getLabelForValue(Number(value)), 24); } } } }, plugins: { ...noLegend,
        tooltip: { callbacks: { title: items => people[top[items[0].dataIndex].k],
          label: item => ` ${fmt0.format(item.parsed.x)} urgentes`,
          afterLabel: item => { const row = top[item.dataIndex]; return `${pct(row.p)} das ${fmt0.format(row.req)} requisições dele · ${fmt0.format(row.nmes)} ${row.nmes === 1 ? 'mês' : 'meses'}`; } } } } } };
  }

  const requestKeys: Record<string, (row: RequestRow) => string | number> = {
    nr: row => String(row[Q.number]).padStart(14, '0'), mes: row => row[Q.month],
    emp: row => row[Q.company] >= 0 ? companies[row[Q.company]] : 'zzz',
    comp: row => row[Q.buyer] >= 0 ? buyerNames[row[Q.buyer]] : 'zzz',
    urg: row => row[Q.urgency], linhas: row => row[Q.lines], sist: row => systems[row[Q.system]],
    reqte: row => row[Q.requester] >= 0 ? people[row[Q.requester]] : 'zzz',
    desc: row => row[Q.description],
  };
  const sorted = [...d].sort((a, b) => {
    const first = requestKeys[requestSort.key](a);
    const second = requestKeys[requestSort.key](b);
    const result = typeof first === 'string' && typeof second === 'string' ? first.localeCompare(second) : Number(first) - Number(second);
    return result * (requestSort.direction === 'asc' ? 1 : -1);
  });
  const pages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.max(0, Math.min(filters.pageReq, pages - 1));
  const pageRows = sorted.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const requestColumns: DataTableColumn<RequestRow>[] = [
    { key: 'nr', header: 'Nº req', align: 'left', render: row => row[Q.estimated] === 1 ? <span className="tag nd">Estimada</span> : <strong className="num">{row[Q.number]}</strong> },
    { key: 'sist', header: 'Sistema', align: 'left', render: row => <span className={`tag ${row[Q.system] ? 'onedoc' : 'c'}`}>{systems[row[Q.system]]}</span> },
    { key: 'mes', header: 'Mês', render: row => months[row[Q.month] - 1] },
    { key: 'emp', header: 'Empresa', align: 'left', render: row => companyTag(row[Q.company], companies) },
    { key: 'comp', header: 'Comprador', align: 'left', render: row => row[Q.buyer] >= 0 ? shortName(buyerNames[row[Q.buyer]]) : '—' },
    { key: 'reqte', header: 'Criador / aprovador', align: 'left', render: row => row[Q.requester] >= 0 ? trunc(people[row[Q.requester]], 22) : '—' },
    { key: 'urg', header: 'Urgente', render: row => row[Q.urgency] === 1 ? <span className="tag urg">Sim</span> : row[Q.urgency] === 0 ? '—' : <span style={{ color: 'var(--txt-3)' }}>n/d</span> },
    { key: 'linhas', header: 'Itens', render: row => row[Q.estimated] === 1 ? '—' : <span className="num">{fmt0.format(row[Q.lines])}</span> },
    { key: 'desc', header: 'Descrição', align: 'left', className: 'desc', render: row => trunc(row[Q.description], 140) },
  ];
  const csvRows = sorted.map(row => [row[Q.number], row[Q.estimated] === 1 ? 'Estimada por rateio' : 'Detalhada', systems[row[Q.system]], months[row[Q.month] - 1], row[Q.company] >= 0 ? companies[row[Q.company]] : 'n/d', row[Q.buyer] >= 0 ? buyerNames[row[Q.buyer]] : '', row[Q.requester] >= 0 ? people[row[Q.requester]] : '', roles[row[Q.system]], row[Q.urgency] === 1 ? 'Sim' : row[Q.urgency] === 0 ? 'Nao' : 'n/d', row[Q.estimated] === 1 ? '' : row[Q.lines], row[Q.description]]);
  const changeSort = (key: string) => {
    setRequestSort(previous => previous.key === key
      ? { key, direction: previous.direction === 'desc' ? 'asc' : 'desc' }
      : { key, direction: ['mes', 'urg', 'linhas'].includes(key) ? 'desc' : 'asc' });
    setFilters(previous => ({ ...previous, pageReq: 0 }));
  };

  const monthlyChart: ChartConfiguration<'bar'> = { type: 'bar', data: { labels: monthLabels, datasets: [
    { label: 'Oracle', data: oracleByMonth, backgroundColor: grey, stack: 's', borderRadius: 0 },
    { label: '1DOC', data: docByMonth, backgroundColor: violet, stack: 's', borderRadius: { topLeft: 8, topRight: 0 } },
  ] }, options: { scales: { x: { ...gridX, stacked: true }, y: { ...gridY, stacked: true } }, plugins: { ...legendBottom, tooltip: { callbacks: {
    label: item => ` ${item.dataset.label}: ${fmt0.format(item.parsed.y)} requisições`,
    afterBody: items => `Total do mês: ${fmt0.format(oracleByMonth[items[0].dataIndex] + docByMonth[items[0].dataIndex])}`,
  } } } } };
  const methodChart: ChartConfiguration<'bar'> = { type: 'bar', data: { labels: monthLabels, datasets: [
    { label: 'Requisições únicas', data: uniqueByMonth, backgroundColor: violet, borderRadius: { topLeft: 7, topRight: 0 } },
    { label: 'Linhas de item (método antigo)', data: itemByMonth, backgroundColor: 'rgba(145,150,173,.30)', borderRadius: { topLeft: 7, topRight: 0 } },
  ] }, options: { scales: { x: gridX, y: gridY }, plugins: { ...legendBottom, tooltip: { callbacks: {
    label: item => ` ${item.dataset.label}: ${fmt0.format(item.parsed.y)}`,
    afterBody: items => { const index = items[0].dataIndex; return uniqueByMonth[index] ? `Distorção: +${fmt1.format((itemByMonth[index] / uniqueByMonth[index] - 1) * 100)}%` : ''; },
  } } } } };
  const buyerChart: ChartConfiguration<'bar'> = { type: 'bar', data: { labels: buyers.map(row => shortName(buyerNames[row.k])), datasets: [{ label: 'Requisições', data: buyers.map(row => row.n), backgroundColor: buyers.map((_, index) => colors[index % colors.length]), borderRadius: { topLeft: 8, topRight: 0 }, maxBarThickness: 56 }] },
    options: { scales: { x: { ...gridX, ticks: { font: { size: 10 } } }, y: gridY }, plugins: { ...noLegend, tooltip: { callbacks: {
      title: items => buyerNames[buyers[items[0].dataIndex].k], label: item => ` ${fmt0.format(item.parsed.y)} requisições  (${pct(item.parsed.y / Math.max(1, d.length))})`,
    } } } } };
  const companyChart: ChartConfiguration<'doughnut'> = { type: 'doughnut', data: { labels: companyCounts.map(row => companies[row.k]), datasets: [{ data: companyCounts.map(row => row.n), backgroundColor: companyCounts.map(row => ({ Softplan: violet, Poligraph: grey, JXS: light, '1DOC': '#B9B9FF' } as Record<string, string>)[companies[row.k]]), borderColor: '#2B2F47', borderWidth: 2, hoverOffset: 6 }] },
    options: { cutout: '62%', plugins: { ...legendBottom, tooltip: { callbacks: { label: item => ` ${fmt0.format(item.parsed)}  (${pct(item.parsed / Math.max(1, companyTotal))})` } } } } };
  const buyerMonthChart: ChartConfiguration<'bar'> = { type: 'bar', data: { labels: monthLabels, datasets: buyers.map((row, index) => ({ label: shortName(buyerNames[row.k]), data: byMonth.map(rows => rows.filter(request => request[Q.buyer] === row.k).length), backgroundColor: colors[index % colors.length], stack: 's', borderRadius: 0 })) },
    options: { scales: { x: { ...gridX, stacked: true }, y: { ...gridY, stacked: true } }, plugins: { ...legendBottom, tooltip: { callbacks: { label: item => ` ${item.dataset.label}: ${fmt0.format(item.parsed.y)}` } } } } };
  const vsOrdersChart: ChartConfiguration<'bar' | 'line'> = { type: 'bar', data: { labels: monthLabels, datasets: [
    { type: 'bar', label: 'Requisições', data: uniqueByMonth, backgroundColor: violet, borderRadius: { topLeft: 8, topRight: 0 }, maxBarThickness: 48, order: 2 },
    { type: 'line', label: 'OCs emitidas', data: ocByMonth, borderColor: light, backgroundColor: light, tension: .3, pointRadius: 3.5, borderWidth: 2, order: 1 },
  ] }, options: { scales: { x: gridX, y: gridY }, plugins: { tooltip: { callbacks: {
    label: item => ` ${item.dataset.label}: ${fmt0.format(item.parsed.y)}`,
    afterBody: items => { const index = items[0].dataIndex; return uniqueByMonth[index] ? `OCs por requisição: ${fmt1.format(ocByMonth[index] / uniqueByMonth[index])}` : ''; },
  } } } } };
  const urgencySystemChart: ChartConfiguration<'bar'> = { type: 'bar', data: { labels: systemsUrgency.map(row => systems[row.system]), datasets: [{ label: '% urgentes', data: systemsUrgency.map(row => row.urgent / row.n * 100), backgroundColor: systemsUrgency.map(row => row.urgent / row.n >= .3 ? violet : grey), borderRadius: { topLeft: 8, topRight: 0 }, maxBarThickness: 70 }] }, options: { scales: { x: gridX, y: { ...gridY, max: 100, ticks: { callback: value => `${fmt0.format(Number(value))}%` } } }, plugins: { ...noLegend, tooltip: { callbacks: {
    label: item => ` ${fmt1.format(item.parsed.y)}% urgentes`, afterLabel: item => `${fmt0.format(systemsUrgency[item.dataIndex].urgent)} de ${fmt0.format(systemsUrgency[item.dataIndex].n)} requisições`,
  } } } } };
  const urgencyMonthChart: ChartConfiguration<'bar' | 'line'> = { type: 'bar', data: { labels: monthLabels, datasets: [
    { type: 'bar', label: 'Urgentes', data: urgencyByMonth, backgroundColor: violet, borderRadius: { topLeft: 8, topRight: 0 }, order: 2 },
    { type: 'line', label: '% das que informam', data: months.map((_, index) => knownByMonth[index] ? urgencyByMonth[index] / knownByMonth[index] * 100 : 0), yAxisID: 'y1', borderColor: light, backgroundColor: light, tension: .3, pointRadius: 3.5, borderWidth: 2, order: 1 },
  ] }, options: { scales: { x: gridX, y: gridY, y1: { ...gridY, position: 'right', grid: { display: false }, max: 100, ticks: { callback: value => `${fmt0.format(Number(value))}%` } } }, plugins: { ...legendBottom, tooltip: { callbacks: {
    label: item => item.dataset.yAxisID === 'y1' ? ` ${fmt1.format(item.parsed.y)}% do mês` : ` ${fmt0.format(item.parsed.y)} urgentes`,
  } } } } };
  const recurrenceChart: ChartConfiguration<'bar'> = { type: 'bar', data: { labels: recurrent.map(row => `${people[row.k]}  (${systems[row.sx]})`), datasets: [{ label: '% urgentes', data: recurrent.map(row => row.p * 100), backgroundColor: recurrent.map(row => row.p >= .5 ? violet : row.p >= .3 ? violet400 : grey), borderRadius: { topRight: 6, bottomRight: 0 } }] }, options: { indexAxis: 'y', scales: { x: { ...gridY, grid: { color: 'rgba(145,150,173,.11)' }, max: 100, ticks: { callback: value => `${fmt0.format(Number(value))}%` } }, y: { ...gridX, ticks: { font: { size: 9.5 }, callback(value) { return trunc(this.getLabelForValue(Number(value)), 30); } } } }, plugins: { ...noLegend, tooltip: { callbacks: {
    title: items => people[recurrent[items[0].dataIndex].k], label: item => ` ${fmt1.format(item.parsed.x)}% urgentes`,
    afterLabel: item => { const row = recurrent[item.dataIndex]; return `${fmt0.format(row.urg)} de ${fmt0.format(row.req)} requisições · ${roles[row.sx]} no ${systems[row.sx]}`; },
  } } } } };
  const peopleChart: ChartConfiguration<'bar'> = { type: 'bar', data: { labels: topPeople.map(row => people[row.k]), datasets: [{ label: 'Requisições', data: topPeople.map(row => row.n), backgroundColor: topPeople.map((_, index) => colors[index % colors.length]), borderRadius: { topRight: 6, bottomRight: 0 } }] }, options: { indexAxis: 'y', scales: { x: { ...gridY, grid: { color: 'rgba(145,150,173,.11)' } }, y: { ...gridX, ticks: { font: { size: 10 }, callback(value) { return trunc(this.getLabelForValue(Number(value)), 26); } } } }, plugins: { ...noLegend, tooltip: { callbacks: { label: item => ` ${fmt0.format(item.parsed.x)} requisições` } } } } };
  const offenderColumns: DataTableColumn<Originator>[] = [
    { header: 'Pessoa', align: 'left', render: row => <strong>{people[row.k]}</strong> },
    { header: 'Papel', align: 'left', render: row => <span className={`tag ${row.sx ? 'onedoc' : 'c'}`}>{roles[row.sx]}</span> },
    { header: 'Sistema', align: 'left', render: row => systems[row.sx] },
    { header: 'Requisições', render: row => <span className="num">{fmt0.format(row.req)}</span> },
    { header: 'Urgentes', render: row => <BarCell value={row.urg} max={maxUrgent} /> },
    { header: '% urgentes', render: row => <strong className="num" style={row.p >= .5 ? { color: 'var(--roxo-200)' } : undefined}>{pct(row.p)}</strong> },
    { header: 'Meses ativos', render: row => <span className="num">{fmt0.format(row.nmes)}</span> },
    { header: 'Volume relevante', render: row => row.req >= MIN_VOLUME ? <span className="tag neg">Sim</span> : <span className="tag c">Menos de {MIN_VOLUME}</span> },
  ];

  return <>
    <div className="grid kpis">
      <KpiCard label="Requisições únicas" value={fmt0.format(d.length)} description={<em>{fmt0.format(detailed.length)} detalhadas{estimated ? ` · ${fmt0.format(estimated)} estimadas por rateio` : ''}</em>} accent="var(--roxo)" />
      <KpiCard label="Média por mês" value={fmt0.format(Math.round(d.length / monthsCount))} description={<em>em {fmt0.format(monthsCount)} {monthsCount === 1 ? 'mês' : 'meses'} da seleção</em>} accent="var(--c60)" />
      <KpiCard label="Por comprador" value={fmt0.format(Math.round(d.length / (buyers.length || 1)))} description={<em>média entre {fmt0.format(buyers.length || 1)} compradores · máx. {fmt0.format(buyers[0]?.n ?? 0)}</em>} accent="var(--c40)" />
      <KpiCard label="Itens por requisição" value={fmt1.format(detailed.length ? lines / detailed.length : 0)} description={<em>{fmt0.format(lines)} linhas nas {fmt0.format(detailed.length)} detalhadas</em>} accent="var(--c60)" />
      <KpiCard label="Urgentes" value={fmt0.format(urgentCount)} description={<em>{urgencyCount ? pct(urgentCount / urgencyCount) : '0,0%'} das {fmt0.format(urgencyCount)} que informam urgência</em>} accent="var(--roxo-400)" />
    </div>
    <Note><b>Contagem por requisição única.</b> Cada requisição vale 1, mesmo com 10 itens dentro — na seleção atual são <b>{fmt0.format(d.length)} requisições</b> contra <b>{fmt0.format(lines)} linhas</b> nos arquivos de origem. Os dois sistemas foram normalizados no mesmo esquema: empresa, mês, comprador, urgência e contagem de itens vêm de campos equivalentes, então a comparação Oracle x 1DOC é direta. {detailed.filter(row => row[Q.company] < 0).length > 0 && <><b>{fmt0.format(detailed.filter(row => row[Q.company] < 0).length)} requisições</b> do 1DOC vieram com a coluna de empresa corrompida no export e aparecem como <b>n/d</b> — contam no total, mas ficam fora do corte por empresa. </>}{estimated > 0 && <><b>{fmt0.format(estimated)} requisições</b> da 1DOC não têm detalhamento disponível e foram informadas apenas como total. Entram no volume e na <b>carga por comprador</b>, rateadas em partes iguais, mas ficam fora de tudo que dependa de campo ausente: empresa, urgência, itens por requisição e o ranking de ofensores. Aparecem como <b>Estimada</b> na tabela.</>}</Note>
    <div className="grid cards-2">
      <DashboardCard className="span-2" title="Requisições únicas por mês" hint="Cada requisição conta uma vez, independente de quantos itens tenha. As cores separam os dois sistemas — a virada aconteceu em 1º de junho." headerAction={<div className="localfilter"><span className="flabel">Sistema</span><FilterChips label="Sistema" options={[{ value: 'todos', label: 'Ambos' }, { value: '0', label: 'Oracle' }, { value: '1', label: '1DOC' }]} value={filters.system === null ? 'todos' : String(filters.system)} onChange={value => setFilters(previous => ({ ...previous, system: value === 'todos' ? null : Number(value), pageReq: 0 }))} /><span className="flabel">Urgência</span><FilterChips label="Urgência" options={[{ value: 'todos', label: 'Todas' }, { value: '1', label: 'Urgentes' }, { value: '0', label: 'Planejadas' }]} value={filters.urgency === null ? 'todos' : String(filters.urgency)} onChange={value => setFilters(previous => ({ ...previous, urgency: value === 'todos' ? null : Number(value), pageReq: 0 }))} /></div>}><ChartCanvas config={monthlyChart} className="tall" /></DashboardCard>
      <DashboardCard className="span-2" title="Requisição única x linha de requisição" hint="O método antigo contava cada item como uma requisição. Esta comparação mostra o tamanho da distorção mês a mês."><ChartCanvas config={methodChart} /><div className="ca-sum"><span>Requisições únicas: <b className="num">{fmt0.format(d.length)}</b></span><span>Linhas de item: <b className="num">{fmt0.format(lines)}</b></span><span>Distorção do método antigo: <b className="num">+{fmt1.format(detailed.length ? (lines / detailed.length - 1) * 100 : 0)}%</b></span><span style={{ color: 'var(--txt-3)' }}>O Oracle registra uma linha por item; o 1DOC concentra quase tudo em linha única.</span></div></DashboardCard>
      <DashboardCard title="Carga por comprador" hint="Requisições únicas atribuídas a cada comprador"><ChartCanvas config={buyerChart} /></DashboardCard>
      <DashboardCard title="Requisições por empresa" hint="1DOC aparece só a partir de junho, quando o campo passou a existir"><ChartCanvas config={companyChart} /></DashboardCard>
      <DashboardCard className="span-2" title="Carga mensal por comprador" hint="Quantas requisições cada pessoa teve que executar em cada mês"><ChartCanvas config={buyerMonthChart} className="tall" /></DashboardCard>
      <DashboardCard className="span-2" title="Desempenho por comprador" hint="Ordene por qualquer coluna. Itens por requisição indica a complexidade média do que cada um processa."><DataTable columns={performanceColumns} rows={displayedPerformance} sort={performanceSort} onSort={key => setPerformanceSort(previous => previous?.key === key ? { key, direction: previous.direction === 'desc' ? 'asc' : 'desc' } : { key, direction: key === 'buyer' ? 'asc' : 'desc' })} className="auto" emptyMessage="Nenhuma requisição na seleção" /></DashboardCard>
      <DashboardCard className="span-2" title="Requisições x ordens de compra" hint="Barras: requisições abertas. Linha: OCs emitidas no mesmo mês. Mais de uma OC por requisição indica fracionamento do atendimento."><ChartCanvas config={vsOrdersChart} /></DashboardCard>
      <DashboardCard className="span-2" title="Urgência: a quebra entre os dois sistemas" hint="O campo existe nos dois sistemas, mas o comportamento de preenchimento mudou radicalmente na virada"><div className="subgrid"><div><div className="sublab">% de urgentes por sistema</div><ChartCanvas config={urgencySystemChart} /></div><div><div className="sublab">Urgentes mês a mês</div><ChartCanvas config={urgencyMonthChart} /></div></div><div style={{ margin: '18px 0 0' }}><Note>{oracleUrgency && docUrgency ? <><b>Cuidado ao comparar urgência entre os sistemas.</b> No Oracle, {pct(oracleUrgency.urgent / oracleUrgency.n)} das requisições eram marcadas como urgentes; no 1DOC são {pct(docUrgency.urgent / docUrgency.n)}. Um salto dessa ordem não costuma refletir mudança de comportamento das áreas — indica que o campo mudou de significado, de preenchimento padrão ou de obrigatoriedade na virada. Vale checar como o 1DOC apresenta essa opção antes de usar o indicador para cobrar planejamento de alguém.</> : <><b>Sobre a urgência.</b> O campo existe nos dois sistemas, mas o padrão de preenchimento mudou na virada de junho — compare com cuidado.</>}</Note></div></DashboardCard>
      <DashboardCard className="span-2" title="Urgentes: de quem parte o pedido" hint={<>No Oracle o campo disponível é quem <b>abriu</b> a requisição; no 1DOC, quem a <b>aprovou</b>. São papéis diferentes, então os dois rankings ficam separados — somar os dois numa lista única seria comparar coisas distintas.</>} headerAction={<Badge muted={!urgencyCount || urgentCount / urgencyCount < .25}>{fmt0.format(urgentCount)} urgentes de {fmt0.format(urgencyCount)}</Badge>}><div className="subgrid"><div><div className="sublab">Oracle · por quem abriu (Jan–Mai)</div><ChartCanvas config={offenderChart(oracleOriginators)} className="tall" /></div><div><div className="sublab">1DOC · por quem aprovou (Jun–Jul)</div><ChartCanvas config={offenderChart(docOriginators)} className="tall" /></div></div><div style={{ marginTop: 22 }}><div className="sublab">Reincidência · % de urgentes sobre o próprio volume</div><ChartCanvas config={recurrenceChart} className="tall" /></div><div style={{ marginTop: 22 }}><div className="sublab">Ranking completo para a conversa</div><DataTable columns={offenderColumns} rows={rank.slice(0, 40)} emptyMessage="Nenhuma requisição na seleção" /></div><div style={{ margin: '18px 0 0' }}><Note><b>Como usar na conversa.</b> Volume alto de urgentes não é necessariamente problema: quem abre 300 requisições vai ter mais urgentes em números absolutos. O sinal que importa é a <b>reincidência</b> — a proporção de urgentes sobre o próprio volume, com piso de {MIN_VOLUME} requisições para o percentual ter significado. {highRecurrence > 0 && <>Na seleção atual, <b>{fmt0.format(highRecurrence)} {highRecurrence === 1 ? 'pessoa' : 'pessoas'}</b> {highRecurrence === 1 ? 'passa' : 'passam'} de 50% de urgentes: aí a urgência deixou de ser exceção e virou o modo padrão de operar. </>}Duas ressalvas antes de cobrar alguém: no 1DOC o nome é do <b>aprovador</b>, que pode estar apenas homologando um pedido urgente de outra pessoa; e a taxa de urgentes salta de {totalOracle.req ? pct(totalOracle.urg / totalOracle.req) : '—'} no Oracle para {totalDoc.req ? pct(totalDoc.urg / totalDoc.req) : '—'} no 1DOC, o que sugere mudança no preenchimento do campo, não nas áreas.</Note></div></DashboardCard>
      <DashboardCard className="span-2" title="Volume por pessoa" hint="Quem mais movimenta requisições, urgentes ou não · criador no Oracle, aprovador no 1DOC"><ChartCanvas config={peopleChart} className="tall" /></DashboardCard>
      <DashboardCard className="span-2" title="Detalhamento das requisições" hint="Uma linha por requisição única. A busca livre do topo cobre número, descrição e requisitante." headerAction={<CsvButton filename="requisicoes_unicas_selecao.csv" headers={['Numero', 'Origem do dado', 'Sistema', 'Mes', 'Empresa', 'Comprador', 'Pessoa', 'Papel', 'Urgente', 'Itens', 'Descricao']} rows={csvRows} />}><DataTable columns={requestColumns} rows={pageRows} sort={requestSort} onSort={changeSort} emptyMessage="Nenhuma requisição na seleção" /><div className="tfoot"><span>{sorted.length ? `Mostrando ${fmt0.format(currentPage * PAGE_SIZE + 1)}–${fmt0.format(Math.min(sorted.length, (currentPage + 1) * PAGE_SIZE))} de ${fmt0.format(sorted.length)} requisições${estimated ? ` · ${fmt0.format(estimated)} estimadas por rateio` : ''}` : 'Nenhuma requisição na seleção'}</span><Pagination page={currentPage + 1} pageCount={pages} onPageChange={page => setFilters(previous => ({ ...previous, pageReq: page - 1 }))} /></div></DashboardCard>
    </div>
  </>;
}
