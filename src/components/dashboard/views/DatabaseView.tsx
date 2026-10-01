'use client';

import { DashboardCard } from '../DashboardCard';
import { DataTable, type DataTableColumn } from '../DataTable';
import { KpiCard } from '../KpiCard';
import { Pagination } from '../Pagination';
import { CsvButton } from '../CsvButton';
import { brl, brlCompact, calculateTotals, percent, sortPurchaseRows } from '../../../lib/dashboard-calculations';
import { purchaseCsvRows, PURCHASE_CSV_HEADERS } from '../../../lib/csv';
import { PURCHASE_INDEX as P, type DashboardViewProps, type PurchaseRow } from '../../../types/dashboard';

const n0 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const n2 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pageSize = 50;
const truncate = (value: string, length: number) => value.length > length ? `${value.slice(0, length - 1)}…` : value;
const companyClasses: Record<string, string> = { Softplan: 'softplan', Poligraph: 'poligraph', JXS: 'jxs', '1DOC': 'onedoc' };

export function DatabaseView({ data, filtered, filters, setFilters, viewSort: baseSort, setViewSort: setBaseSort }: DashboardViewProps) {
  const { meta } = data;
  const totals = calculateTotals(filtered.rows);
  const sorted = sortPurchaseRows(data, filtered.rows, baseSort);
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const page = Math.min(Math.max(0, filters.page), pageCount - 1);
  const visible = sorted.slice(page * pageSize, (page + 1) * pageSize);
  const columns: DataTableColumn<PurchaseRow>[] = [
    { key: 'po', header: 'OC', align: 'left', render: (row) => <strong className="num">{row[P.order]}</strong> },
    { key: 'mes', header: 'Data', render: (row) => <span className="num">{row[P.date]}</span> },
    { key: 'emp', header: 'Empresa', align: 'left', render: (row) => row[P.company] < 0 ? <span className="tag nd">n/d</span> : <span className={`tag ${companyClasses[meta.empresas[row[P.company]]] ?? 'c'}`}>{meta.empresas[row[P.company]]}</span> },
    { key: 'forn', header: 'Fornecedor', align: 'left', render: (row) => <span title={meta.fornecedores[row[P.supplier]]}>{truncate(meta.fornecedores[row[P.supplier]], 34)}</span> },
    { key: 'cat', header: 'Categoria', align: 'left', render: (row) => <span className="tag c" title={meta.categorias[row[P.category]]}>{truncate(meta.categorias[row[P.category]], 18)}</span> },
    { header: 'Descrição', align: 'left', className: 'desc', render: (row) => <span title={row[P.description]}>{truncate(row[P.description], 150)}</span> },
    { key: 'comp', header: 'Comprador', align: 'left', render: (row) => { const name = meta.compradores[row[P.buyer]]; const pieces = name.split(' '); return pieces.length > 1 ? `${pieces[0]} ${pieces[pieces.length - 1]}` : name; } },
    { key: 'nat', header: 'Natureza', render: (row) => row[P.nature] >= 0 ? <span className="tag reg" title={meta.regTipos[row[P.nature]]}>{truncate(meta.regTipos[row[P.nature]], 16)}</span> : <span className="tag neg">Negociável</span> },
    { key: 'mo', header: 'Moeda', render: (row) => <span className="num">{meta.moedas[row[P.currency]]}{row[P.currency] ? ` ${n2.format(row[P.currencyAmount])}` : ''}</span> },
    { key: 'v', header: 'Valor final (R$)', render: (row) => <strong className="num">{brl(row[P.spend])}</strong> },
    { key: 'sv', header: 'Saving', render: (row) => <span className="num" style={row[P.saving] > 0 ? { color: '#B9B9FF' } : undefined}>{row[P.saving] > 0 ? brl(row[P.saving]) : '—'}</span> },
    { key: 'pc', header: '%', render: (row) => <span className="num">{row[P.saving] > 0 ? percent(row[P.saving] / (row[P.saving] + row[P.spend])) : '—'}</span> },
  ];

  return <div>
    <div className="grid kpis">
      <KpiCard label="Linhas na seleção" value={n0.format(totals.lines)} description={<em>{n0.format(totals.orders)} ordens distintas</em>} accent="var(--c40)" />
      <KpiCard label="Spend" value={brl(totals.spend)} description={<em>negociável {brlCompact(totals.negotiable)} · registros {brlCompact(totals.records)}</em>} accent="var(--c60)" />
      <KpiCard label="Saving" value={brl(totals.saving)} description={<em>{percent(totals.savingRateOnNegotiable)} do negociável</em>} accent="var(--roxo)" />
      <KpiCard label="Fornecedores" value={n0.format(totals.suppliers)} description={<em>ticket médio {brlCompact(totals.averageTicket)}</em>} accent="var(--c60)" />
    </div>
    <DashboardCard title="Base de ordens de compra" hint="Todas as linhas da seleção atual. Clique nos títulos para ordenar." headerAction={<CsvButton filename="ocs_softplan_selecao.csv" headers={PURCHASE_CSV_HEADERS} rows={purchaseCsvRows(data, sorted)} />}>
      <DataTable columns={columns} rows={visible} sort={baseSort} onSort={(key) => { setBaseSort((current) => ({ key, direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc' })); setFilters((current) => ({ ...current, page: 0 })); }} emptyMessage="Nenhuma ordem atende aos filtros selecionados." />
      <div className="tfoot"><span>{sorted.length ? `Mostrando ${n0.format(page * pageSize + 1)}–${n0.format(Math.min(sorted.length, (page + 1) * pageSize))} de ${n0.format(sorted.length)} linhas` : 'Nenhuma linha na seleção'}</span><Pagination page={page + 1} pageCount={pageCount} onPageChange={(selectedPage) => setFilters((current) => ({ ...current, page: selectedPage - 1 }))} /></div>
    </DashboardCard>
  </div>;
}
