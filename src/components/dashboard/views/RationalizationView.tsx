'use client';

import type { ChartConfiguration } from 'chart.js';
import { ChartCanvas } from '../ChartCanvas';
import { DashboardCard } from '../DashboardCard';
import { DataTable, type DataTableColumn } from '../DataTable';
import { KpiCard } from '../KpiCard';
import { Note } from '../Note';
import { brl, brlCompact, percent, profileSuppliers, supplierActionBucket, type SupplierProfile } from '../../../lib/dashboard-calculations';
import { PURCHASE_INDEX as P, type DashboardViewProps } from '../../../types/dashboard';

const n0 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const n1 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const colors = { purple: '#5C5CFF', purple200: '#B9B9FF', gray: '#9196AD' };
const categoryColors = ['#5C5CFF','#7373FF','#8B8BFF','#A2A2FF','#B9B9FF','#CACAF5','#B4B9CE','#9196AD','#7F8499','#6E7391'];
const gridX = { grid: { display: false }, border: { color: 'rgba(145,150,173,.20)' }, ticks: { padding: 4 } } as const;
const gridY = { grid: { color: 'rgba(145,150,173,.11)', drawTicks: false }, border: { display: false }, ticks: { padding: 6 } } as const;
const truncate = (value: string, length: number) => value.length > length ? `${value.slice(0, length - 1)}…` : value;

function barCell(value: number, max: number, text: string) {
  return <div className="bar-cell"><div className="fill" style={{ width: `${max > 0 ? Math.max(1.5, value / max * 100) : 0}%` }} /><span className="num">{text}</span></div>;
}

const actions = [
  { id: 'guarda', name: 'Contrato guarda-chuva', how: 'Um contrato por fornecedor, com liberação por demanda no lugar de uma OC por compra.' },
  { id: 'consol', name: 'Consolidar em ordem única', how: 'Compras esparsas do mesmo fornecedor agrupadas em uma ordem por período.' },
  { id: 'formal', name: 'Formalizar contrato recorrente', how: 'Uma só ordem, mas faturamento mensal: o contrato já existe na prática e precisa virar contrato.' },
  { id: 'catalogo', name: 'Catálogo ou cartão corporativo', how: 'Compra pontual de baixo valor que não justifica abrir ordem.' },
] as const;

type ActionRow = (typeof actions)[number] & { members: SupplierProfile[]; orders: number; spend: number; invoices: number; avoidable: number };
type CategoryRow = { category: string; suppliers: number; orders: number; spend: number; invoices: number };
type DuplicateRow = { name: string; note: string; registrations: { name: string; profile?: SupplierProfile }[]; orders: number; spend: number; invoices: number };

export function RationalizationView({ data, filtered }: DashboardViewProps) {
  const { suppliers, total } = profileSuppliers(filtered.rows, filtered.protocolos, data.meta.categorias);
  const classes = ['A', 'B', 'C'] as const;
  const byClass = classes.map((classification) => suppliers.filter((supplier) => supplier.classification === classification));
  const classTotals = byClass.map((members) => ({ members: members.length, spend: members.reduce((sum, supplier) => sum + supplier.spend, 0), orders: members.reduce((sum, supplier) => sum + supplier.orders, 0), invoices: members.reduce((sum, supplier) => sum + supplier.invoices, 0) }));
  const totalOrders = suppliers.reduce((sum, supplier) => sum + supplier.orders, 0);
  const totalInvoices = suppliers.reduce((sum, supplier) => sum + supplier.invoices, 0);
  const longTail = byClass[2];
  const spendC = classTotals[2].spend;
  const ordersC = classTotals[2].orders;
  const invoicesC = classTotals[2].invoices;
  const buckets: ActionRow[] = actions.map((action) => ({ ...action, members: [], orders: 0, spend: 0, invoices: 0, avoidable: 0 }));
  for (const supplier of longTail) {
    const { id, avoidableOrders } = supplierActionBucket(supplier);
    const bucket = buckets.find((action) => action.id === id)!;
    bucket.members.push(supplier);
    bucket.orders += supplier.orders;
    bucket.spend += supplier.spend;
    bucket.invoices += supplier.invoices;
    bucket.avoidable += avoidableOrders;
  }
  const avoidableTotal = buckets.reduce((sum, bucket) => sum + bucket.avoidable, 0);
  const ordersPerMonth = totalOrders / (new Set(filtered.rows.map((row) => row[P.month])).size || 1);
  const supplierName = (supplier: SupplierProfile) => data.meta.fornecedores[supplier.supplier];
  const classShare = (value: number, denominator: number) => value / Math.max(1, denominator);
  const dimensions = [
    { label: 'Fornecedores', values: classTotals.map((row) => classShare(row.members, suppliers.length)) },
    { label: 'Spend', values: classTotals.map((row) => classShare(row.spend, total)) },
    { label: 'Ordens de compra', values: classTotals.map((row) => classShare(row.orders, totalOrders)) },
    { label: 'Notas fiscais', values: classTotals.map((row) => classShare(row.invoices, totalInvoices)) },
  ];
  const paradox: ChartConfiguration<'bar'> = {
    type: 'bar',
    data: { labels: dimensions.map((dimension) => dimension.label), datasets: classes.map((classification, index) => ({ label: `Classe ${classification}`, data: dimensions.map((dimension) => dimension.values[index] * 100), backgroundColor: [colors.purple, colors.gray, colors.purple200][index], borderRadius: { topLeft: 7, topRight: 0 } })) },
    options: { scales: { x: gridX, y: { ...gridY, max: 100, ticks: { callback: (value) => `${n0.format(Number(value))}%` } } }, plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: (item) => ` ${item.dataset.label}: ${n1.format(item.parsed.y)}%` } } } },
  };
  const paradoxColumns: DataTableColumn<(typeof classTotals)[number] & { classification: string }>[] = [
    { header: 'Classe', align: 'left', render: (row) => <span className={`tag ${row.classification.toLowerCase()}`}>{row.classification}</span> },
    { header: 'Fornecedores', render: (row) => <span className="num">{n0.format(row.members)}</span> },
    { header: 'Spend', render: (row) => <strong className="num">{brl(row.spend)}</strong> },
    { header: '% do spend', render: (row) => <span className="num">{percent(classShare(row.spend, total))}</span> },
    { header: 'OCs', render: (row) => <span className="num">{n0.format(row.orders)}</span> },
    { header: '% das OCs', render: (row) => <span className="num">{percent(classShare(row.orders, totalOrders))}</span> },
    { header: 'Notas', render: (row) => <span className="num">{n0.format(row.invoices)}</span> },
    { header: 'Ticket médio', render: (row) => <span className="num">{row.orders ? brl(row.spend / row.orders) : '—'}</span> },
  ];
  const maxAvoidable = Math.max(1, ...buckets.map((bucket) => bucket.avoidable));
  const actionColumns: DataTableColumn<ActionRow>[] = [
    { header: 'Ação', align: 'left', render: (row) => <strong>{row.name}</strong> },
    { header: 'Como funciona', align: 'left', className: 'desc', render: (row) => row.how },
    { header: 'Fornecedores', render: (row) => <span className="num">{n0.format(row.members.length)}</span> },
    { header: 'OCs hoje', render: (row) => <span className="num">{n0.format(row.orders)}</span> },
    { header: 'Spend', render: (row) => <span className="num">{brl(row.spend)}</span> },
    { header: 'Notas', render: (row) => <span className="num">{n0.format(row.invoices)}</span> },
    { header: 'OCs evitáveis', render: (row) => barCell(row.avoidable, maxAvoidable, n0.format(row.avoidable)) },
  ];
  const contractCandidates = [...buckets[0].members].sort((a, b) => b.orders - a.orders).slice(0, 40);
  const maxOrders = Math.max(1, ...contractCandidates.map((supplier) => supplier.orders));
  const contractColumns: DataTableColumn<SupplierProfile>[] = [
    { header: 'Fornecedor', align: 'left', render: (row) => <strong title={supplierName(row)}>{truncate(supplierName(row), 40)}</strong> },
    { header: 'Categoria', align: 'left', render: (row) => <span className="tag c" title={row.category}>{truncate(row.category, 20)}</span> },
    { header: 'OCs', render: (row) => barCell(row.orders, maxOrders, n0.format(row.orders)) },
    { header: 'Meses ativos', render: (row) => <span className="num">{n0.format(row.months)}</span> },
    { header: 'Spend', render: (row) => <span className="num">{brl(row.spend)}</span> },
    { header: 'Ticket médio', render: (row) => <span className="num">{brl(row.ticket)}</span> },
    { header: 'Notas', render: (row) => <span className="num">{n0.format(row.invoices)}</span> },
    { header: 'OCs evitáveis', render: (row) => <strong className="num">{n0.format(row.orders - 1)}</strong> },
  ];
  const categories = new Map<string, CategoryRow>();
  for (const supplier of longTail) {
    let category = categories.get(supplier.category);
    if (!category) {
      category = { category: supplier.category, suppliers: 0, orders: 0, spend: 0, invoices: 0 };
      categories.set(supplier.category, category);
    }
    category.suppliers++;
    category.orders += supplier.orders;
    category.spend += supplier.spend;
    category.invoices += supplier.invoices;
  }
  const fragmented = [...categories.values()].sort((a, b) => b.orders - a.orders);
  const topCategories = fragmented.slice(0, 10);
  const categoryChart: ChartConfiguration<'bar'> = {
    type: 'bar', data: { labels: topCategories.map((row) => row.category), datasets: [{ label: 'OCs', data: topCategories.map((row) => row.orders), backgroundColor: topCategories.map((_, index) => categoryColors[index]), borderRadius: { topRight: 6, bottomRight: 0 } }] },
    options: { indexAxis: 'y', scales: { x: gridY, y: { ...gridX, ticks: { font: { size: 10 }, callback: function(value) { return truncate(this.getLabelForValue(Number(value)), 24); } } } }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (item) => ` ${n0.format(item.parsed.x)} ordens`, afterLabel: (item) => `${n0.format(topCategories[item.dataIndex].suppliers)} fornecedores · ${brl(topCategories[item.dataIndex].spend)}` } } } },
  };
  const maxSuppliers = Math.max(1, ...fragmented.map((row) => row.suppliers));
  const categoryColumns: DataTableColumn<CategoryRow>[] = [
    { header: 'Categoria', align: 'left', render: (row) => <strong>{row.category}</strong> },
    { header: 'Fornecedores na curva C', render: (row) => barCell(row.suppliers, maxSuppliers, n0.format(row.suppliers)) },
    { header: 'OCs', render: (row) => <span className="num">{n0.format(row.orders)}</span> },
    { header: 'Spend', render: (row) => <span className="num">{brl(row.spend)}</span> },
    { header: 'Notas', render: (row) => <span className="num">{n0.format(row.invoices)}</span> },
    { header: 'Ticket médio', render: (row) => <span className="num">{row.orders ? brl(row.spend / row.orders) : '—'}</span> },
    { header: 'OCs por fornecedor', render: (row) => <span className="num">{n1.format(row.suppliers ? row.orders / row.suppliers : 0)}</span> },
  ];
  const orderSpend = new Map<number, number>();
  for (const row of filtered.rows) orderSpend.set(row[P.order], (orderSpend.get(row[P.order]) ?? 0) + row[P.spend]);
  const bands = [[0, 1000, 'até R$ 1 mil'], [1000, 5000, 'R$ 1 a 5 mil'], [5000, 20000, 'R$ 5 a 20 mil'], [20000, 100000, 'R$ 20 a 100 mil'], [100000, Infinity, 'acima de R$ 100 mil']] as const;
  const ranges = bands.map(() => ({ orders: 0, spend: 0 }));
  for (const spend of orderSpend.values()) {
    const index = bands.findIndex(([minimum, maximum]) => spend >= minimum && spend < maximum);
    if (index !== -1) { ranges[index].orders++; ranges[index].spend += spend; }
  }
  const orderTotalSpend = [...orderSpend.values()].reduce((sum, value) => sum + value, 0);
  const bandChart: ChartConfiguration<'bar'> = {
    type: 'bar', data: { labels: bands.map((band) => band[2]), datasets: [{ label: 'Ordens', data: ranges.map((range) => range.orders), backgroundColor: ranges.map((_, index) => index < 2 ? colors.purple : colors.gray), borderRadius: { topRight: 6, bottomRight: 0 } }] },
    options: { indexAxis: 'y', scales: { x: gridY, y: { ...gridX, ticks: { font: { size: 10.5 } } } }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (item) => ` ${n0.format(item.parsed.x)} ordens  (${percent(item.parsed.x / Math.max(1, orderSpend.size))} das OCs)`, afterLabel: (item) => `Spend na faixa: ${brl(ranges[item.dataIndex].spend)}  (${percent(ranges[item.dataIndex].spend / Math.max(1, orderTotalSpend))} do total)` } } } },
  };
  const profilesBySupplier = new Map(suppliers.map((supplier) => [supplier.supplier, supplier]));
  const supplierIds = new Map(data.meta.fornecedores.map((name, index) => [name, index]));
  const duplicates: DuplicateRow[] = (data.meta.duplicados ?? []).flatMap((group) => {
    const registrations = group.nomes.map((name) => ({ name, profile: profilesBySupplier.get(supplierIds.get(name) ?? -1) }));
    const orders = registrations.reduce((sum, row) => sum + (row.profile?.orders ?? 0), 0);
    const spend = registrations.reduce((sum, row) => sum + (row.profile?.spend ?? 0), 0);
    const invoices = registrations.reduce((sum, row) => sum + (row.profile?.invoices ?? 0), 0);
    return orders || spend || invoices ? [{ name: group.grupo, note: group.nota, registrations, orders, spend, invoices }] : [];
  });
  const duplicateColumns: DataTableColumn<DuplicateRow>[] = [
    { header: 'Empresa', align: 'left', render: (row) => <strong>{row.name}</strong> },
    { header: 'Cadastros', align: 'left', className: 'desc', render: (row) => row.registrations.map((registration, index) => <span key={index}>{index > 0 && <br />}{registration.name}{registration.profile && <> <span style={{ color: 'var(--txt-3)' }}>({n0.format(registration.profile.orders)} OCs · {n0.format(registration.profile.invoices)} NF)</span></>}</span>) },
    { header: 'OCs somadas', render: (row) => <span className="num">{n0.format(row.orders)}</span> },
    { header: 'Spend somado', render: (row) => <span className="num">{brl(row.spend)}</span> },
    { header: 'Notas', render: (row) => <span className="num">{n0.format(row.invoices)}</span> },
    { header: 'Por que importa', align: 'left', className: 'desc', render: (row) => row.note },
  ];
  const heavyInvoices = suppliers.filter((supplier) => supplier.invoices >= 6 && supplier.invoicesPerOrder >= 3).sort((a, b) => b.invoices - a.invoices).slice(0, 15);
  const maxInvoices = Math.max(1, ...heavyInvoices.map((supplier) => supplier.invoices));
  const invoiceColumns: DataTableColumn<SupplierProfile>[] = [
    { header: 'Fornecedor', align: 'left', render: (row) => <strong title={supplierName(row)}>{truncate(supplierName(row), 40)}</strong> },
    { header: 'Classe', render: (row) => <span className={`tag ${row.classification.toLowerCase()}`}>{row.classification}</span> },
    { header: 'Categoria', align: 'left', render: (row) => <span className="tag c" title={row.category}>{truncate(row.category, 20)}</span> },
    { header: 'OCs', render: (row) => <span className="num">{n0.format(row.orders)}</span> },
    { header: 'Notas', render: (row) => barCell(row.invoices, maxInvoices, n0.format(row.invoices)) },
    { header: 'Notas por OC', render: (row) => <strong className="num">{n1.format(row.invoicesPerOrder)}</strong> },
    { header: 'Spend', render: (row) => <span className="num">{brl(row.spend)}</span> },
  ];
  const empty = 'Nenhuma ordem atende aos filtros selecionados.';

  return <div>
    <div className="grid kpis">
      <KpiCard label="Fornecedores curva C" value={n0.format(longTail.length)} description={<em>{percent(suppliers.length ? longTail.length / suppliers.length : 0)} da base de fornecedores</em>} accent="var(--c60)" />
      <KpiCard label="Spend da curva C" value={brlCompact(spendC)} description={<em>{percent(total ? spendC / total : 0)} do valor comprado</em>} accent="var(--c40)" />
      <KpiCard label="Ordens da curva C" value={n0.format(ordersC)} description={<em>{percent(totalOrders ? ordersC / totalOrders : 0)} das OCs · {percent(totalInvoices ? invoicesC / totalInvoices : 0)} das notas fiscais</em>} accent="var(--roxo-400)" />
      <KpiCard label="Ordens evitáveis" value={n0.format(avoidableTotal)} description={<em>{percent(totalOrders ? avoidableTotal / totalOrders : 0)} de todas as OCs do período</em>} accent="var(--roxo)" />
      <KpiCard label="Capacidade liberada" value={`${n1.format(ordersPerMonth ? avoidableTotal / ordersPerMonth : 0)} mês`} description={<em>ao ritmo atual de {n0.format(Math.round(ordersPerMonth))} OCs por mês</em>} accent="var(--roxo)" />
    </div>
    <Note><b>A leitura central.</b> A curva C reúne <b>{n0.format(longTail.length)} fornecedores</b> que respondem por <b>{percent(total ? spendC / total : 0)} do spend</b> e por <b>{percent(totalOrders ? ordersC / totalOrders : 0)} das ordens de compra</b>. Cada ordem custa aproximadamente o mesmo para processar, independente do valor: cotação, aprovação, emissão, recebimento de nota e conferência. Então o esforço do time está concentrado justamente onde o dinheiro não está — e é aí que a racionalização paga. Nada aqui propõe cortar gasto: propõe comprar a mesma coisa com menos transações.</Note>
    <div className="grid cards-2">
      <DashboardCard className="span-2" title="O paradoxo da curva ABC" hint="Cada classe comparada em quatro dimensões: quantos fornecedores são, quanto gastam, quantas ordens geram e quantas notas fiscais chegam. O esforço operacional não acompanha o valor."><ChartCanvas config={paradox} className="tall" /><div style={{ marginTop: 16 }}><DataTable columns={paradoxColumns} rows={classTotals.map((row, index) => ({ ...row, classification: classes[index] }))} className="auto" emptyMessage={empty} /></div></DashboardCard>
      <div className="card span-2" style={{ borderTop: '2px solid var(--roxo)' }}>
        <div className="card-head"><div><h3>Plano de ação para a curva C</h3><div className="hint">Cada fornecedor cai em um único balde, pela combinação de recorrência e volume. A coluna final estima quantas ordens deixariam de ser abertas se a ação fosse aplicada.</div></div></div>
        <DataTable columns={actionColumns} rows={buckets.filter((bucket) => bucket.members.length > 0)} className="auto" emptyMessage={empty} />
        <div className="ca-sum">
          <span>Ordens evitáveis somadas: <b className="num">{n0.format(avoidableTotal)}</b></span>
          <span>Equivale a <b className="num">{percent(totalOrders ? avoidableTotal / totalOrders : 0)}</b> das ordens do período</span>
          <span>Spend afetado: <b className="num">{brl(spendC)}</b> ({percent(total ? spendC / total : 0)} do total)</span>
          <span style={{ color: 'var(--txt-3)' }}>A conta assume uma ordem-mãe por fornecedor nos contratos e nenhuma ordem nas compras via catálogo.</span>
        </div>
      </div>
      <DashboardCard className="span-2" title="Candidatos a contrato guarda-chuva" hint="Curva C com pelo menos 3 ordens em 3 meses distintos: gasto previsível e recorrente, que cabe num contrato único com liberação por demanda em vez de uma OC por compra."><DataTable columns={contractColumns} rows={contractCandidates} emptyMessage={empty} /></DashboardCard>
      <DashboardCard title="Fragmentação por categoria" hint="Ordens da curva C agrupadas por categoria · quanto mais fornecedores para a mesma necessidade, maior o ganho em unificar"><ChartCanvas config={categoryChart} className="tall" /></DashboardCard>
      <DashboardCard title="Ordens por faixa de valor" hint="Distribuição de todas as OCs do período · barras em roxo são as faixas onde o custo de processar tende a superar o valor comprado"><ChartCanvas config={bandChart} className="tall" /></DashboardCard>
      <DashboardCard className="span-2" title="Categorias mais fragmentadas" hint="Detalhe da curva C · use a coluna de fornecedores para dimensionar o esforço de consolidação"><DataTable columns={categoryColumns} rows={fragmented} className="auto" emptyMessage={empty} /></DashboardCard>
      <DashboardCard className="span-2" title="Cadastros duplicados" hint="Mesma empresa em mais de um cadastro · apurado no período completo, não acompanha os filtros"><DataTable columns={duplicateColumns} rows={duplicates} className="auto" emptyMessage={empty} /></DashboardCard>
      <DashboardCard className="span-2" title="Carga de nota fiscal desproporcional" hint="Fornecedores com muitas notas por ordem de compra: o contrato existe de fato, mas está sendo tratado como compra pontual"><DataTable columns={invoiceColumns} rows={heavyInvoices} className="auto" emptyMessage={empty} /></DashboardCard>
    </div>
  </div>;
}
