import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  DEFAULT_FILTERS,
  brl,
  brlCompact,
  calculateSupplierAbc,
  calculateTotals,
  filterDashboardData,
  groupByMonth,
  hours,
  median,
  percent,
  profileSuppliers,
  supplierActionBucket,
} from './dashboard-calculations.ts';
import { DASHBOARD_DATA } from '../data/dashboard-data.ts';
import type { DashboardData, DashboardFilters, PurchaseRow } from '../types/dashboard.ts';

const fixture = {
  meta: {
    meses: ['Jan', 'Fev'],
    empresas: ['Softplan', 'JXS'],
    moedas: ['BRL'],
    compradores: ['Buyer', 'Second Buyer'],
    fornecedores: ['Alpha Supplier', 'Beta Supplier'],
    categorias: ['Services', 'Software'],
    regTipos: ['Negotiable', 'Record'],
    status: ['Approved'],
    taxaDolar: 5.2,
    periodo: 'Jan–Fev',
    nLinhas: 8,
    nOCs: 8,
    protPaises: ['BR', 'Alpha Country', 'Beta Country'],
    protMetodos: ['Alpha payment', 'Beta payment'],
    protPaisBR: 0,
    reqPessoas: ['Alpha requester', 'Beta requester'],
    reqPapeis: ['Requester', 'Approver'],
    reqSistemas: ['Oracle', '1DOC'],
  },
  rows: [
    [101, 0, 1, 0, 0, 0, 0, 1000, 100, -1, '02/01', 1, 'Order description', 0, 1000, 0],
    [102, 1, 1, 0, 0, 0, 0, 200, 0, -1, '02/01', -1, 'Alpha description', 0, 200, 0],
    [103, 0, 2, 0, 0, 0, 0, 300, 0, -1, '02/02', -1, 'Alpha description', 0, 300, 0],
    [104, 0, 1, 0, 0, 0, 0, 400, 0, 0, '02/01', -1, 'Alpha description', 0, 400, 0],
    [105, 0, 1, 0, 0, 1, 0, 500, 0, -1, '02/01', -1, 'Unmatched description', 0, 500, 0],
    [106, 0, 1, 0, 1, 1, 1, 600, 0, -1, '02/01', -1, 'Other filters match', 0, 600, 0],
    [107, 0, 1, 0, 0, 1, 1, 700, 0, -1, '02/01', -1, 'Buyer mismatch', 0, 700, 0],
    [108, 0, 1, 0, 1, 1, 0, 800, 0, -1, '02/01', -1, 'Category mismatch', 0, 800, 0],
  ],
  requisicoes: [
    [0, 1, 0, 1, 1, 0, 900, 'Request description', 0, 0],
    [1, 1, 0, 1, 1, 0, 901, 'Request description', 0, 0],
    [0, 2, 0, 1, 1, 0, 902, 'Request description', 0, 0],
    [0, 1, 0, 1, 1, 0, 903, 'Unmatched request', 1, 0],
    [0, 1, 1, 0, 1, 1, 904, 'Filter request', 1, 0],
    [0, 1, 0, 0, 1, 1, 905, 'Filter request', 1, 0],
    [0, 1, 1, 1, 1, 1, 906, 'Filter request', 1, 0],
    [0, 1, 1, 0, 1, 0, 907, 'Filter request', 1, 0],
  ],
  protocolos: [
    [0, 1, 1, 1, 1, 0, 0, 10, '02/01', 0],
    [1, 1, 1, 1, 1, 0, 0, 10, '02/01', 0],
    [0, 2, 1, 1, 1, 0, 0, 10, '02/02', 0],
    [0, 1, 1, 2, 1, 0, 0, 10, '02/01', 0],
    [0, 1, 1, 0, 1, 1, 0, 10, '02/01', 0],
    [0, 1, 1, 1, 1, 1, 0, 10, '02/01', 0],
    [0, 1, 1, 0, 1, 0, 0, 10, '02/01', 0],
  ],
} as const satisfies DashboardData;

test('default selection preserves source totals and counts unique orders', () => {
  const { rows } = filterDashboardData(DASHBOARD_DATA, DEFAULT_FILTERS);
  const totals = calculateTotals(rows);

  assert.equal(totals.orders, 2267);
  assert.equal(Math.round(totals.spend / 100_000), 573);
  assert.equal(Math.round(totals.negotiable / 100_000), 412);
  assert.equal(Math.round(totals.saving / 100_000), 40);
  assert.equal(totals.negotiatedOrders, 474);
});

test('month, company, nature, and query filters follow source scope', () => {
  const filters: DashboardFilters = {
    ...DEFAULT_FILTERS,
    months: new Set([1]),
    companies: new Set([0]),
    nature: 'neg',
    query: 'alpha',
  };
  const filtered = filterDashboardData(fixture, filters);

  assert.deepEqual(filtered.rows, [fixture.rows[0]]);
  assert.deepEqual(filtered.requisicoes, [fixture.requisicoes[0]]);
  assert.deepEqual(filtered.protocolos, [fixture.protocolos[0], fixture.protocolos[5]]);
});

test('text search covers the source fields for all three data families', () => {
  const cases = [
    {
      query: ' ALPHA SUPPLIER ',
      rows: [fixture.rows[0], fixture.rows[1], fixture.rows[2], fixture.rows[3]],
      requisicoes: [],
      protocolos: [],
    },
    { query: 'order description', rows: [fixture.rows[0]], requisicoes: [], protocolos: [] },
    { query: '101', rows: [fixture.rows[0]], requisicoes: [], protocolos: [] },
    {
      query: 'request description',
      rows: [],
      requisicoes: [fixture.requisicoes[0], fixture.requisicoes[1], fixture.requisicoes[2]],
      protocolos: [],
    },
    { query: '900', rows: [], requisicoes: [fixture.requisicoes[0]], protocolos: [] },
    {
      query: 'alpha requester',
      rows: [],
      requisicoes: [fixture.requisicoes[0], fixture.requisicoes[1], fixture.requisicoes[2]],
      protocolos: [],
    },
    {
      query: 'beta supplier',
      rows: [fixture.rows[4], fixture.rows[5], fixture.rows[6], fixture.rows[7]],
      requisicoes: [],
      protocolos: fixture.protocolos,
    },
    { query: 'beta payment', rows: [], requisicoes: [], protocolos: fixture.protocolos },
    {
      query: 'alpha country',
      rows: [],
      requisicoes: [],
      protocolos: [...fixture.protocolos.slice(0, 3), fixture.protocolos[5]],
    },
  ];

  for (const { query, ...expected } of cases) {
    assert.deepEqual(
      filterDashboardData(fixture, { ...DEFAULT_FILTERS, query }),
      expected,
      `query: ${query}`,
    );
  }
});

test('buyer, category, protocol origin, request urgency and system stay scoped', () => {
  const filtered = filterDashboardData(fixture, {
    ...DEFAULT_FILTERS,
    buyer: 1,
    category: 1,
    origin: 'br',
    urgency: 0,
    system: 1,
    page: 1,
    pageReq: 2,
    pageProt: 3,
  });

  assert.deepEqual(filtered.rows, [fixture.rows[5]]);
  assert.deepEqual(filtered.requisicoes, [fixture.requisicoes[4]]);
  assert.deepEqual(filtered.protocolos, [fixture.protocolos[4]]);

  const international = filterDashboardData(fixture, {
    ...DEFAULT_FILTERS,
    origin: 'ext',
  });
  assert.deepEqual(international.protocolos, [
    ...fixture.protocolos.slice(0, 4),
    fixture.protocolos[5],
  ]);
});
test('monthly aggregation keeps source month order and filters unknown month indexes', () => {
  const monthly = groupByMonth(
    [...fixture.rows, [109, 0, 3, 0, 0, 0, 0, 50, 0, -1, '02/03', 2, 'Extra', 0, 50, 0]],
    fixture.meta.meses,
  );

  assert.deepEqual(monthly.map((month) => ({
    month: month.month,
    index: month.index,
    spend: month.spend,
    saving: month.saving,
    records: month.records,
    negotiable: month.negotiable,
    orders: month.orders,
    negotiableBase: month.negotiableBase,
  })), [
    {
      month: 'Jan',
      index: 1,
      spend: 4200,
      saving: 100,
      records: 400,
      negotiable: 3800,
      orders: 7,
      negotiableBase: 1100,
    },
    {
      month: 'Fev',
      index: 2,
      spend: 300,
      saving: 0,
      records: 0,
      negotiable: 300,
      orders: 1,
      negotiableBase: 0,
    },
  ]);
  assert.equal(monthly[0].savingRateOnBase, 100 / 1100);
  assert.equal(monthly[0].savingRateOnNegotiable, 100 / 3800);
});

test('median sorts values and handles odd, even, and empty samples', () => {
  assert.equal(median([5, 1, 3]), 3);
  assert.equal(median([4, 1]), 2.5);
  assert.equal(median([]), -1);
});

test('supplier ABC assigns cumulative 80/95 percent boundaries deterministically', () => {
  const rows = [
    [1, 0, 1, 0, 0, 0, 0, 80, 0, -1, '01/01', 1, '', 0, 80, 0],
    [2, 0, 1, 0, 0, 1, 0, 15, 0, -1, '01/01', 5, '', 0, 15, 0],
    [3, 0, 1, 0, 0, 2, 0, 5, 0, -1, '01/01', 3, '', 0, 5, 0],
  ] as const satisfies readonly PurchaseRow[];
  const result = calculateSupplierAbc(rows);

  assert.equal(result.total, 100);
  assert.deepEqual(result.suppliers.map(({
    supplier,
    share,
    cumulativeShare,
    classification,
    medianCycle,
  }) => ({
    supplier,
    share,
    cumulativeShare,
    classification,
    medianCycle,
  })), [
    { supplier: 0, share: 0.8, cumulativeShare: 0.8, classification: 'A', medianCycle: 1 },
    { supplier: 1, share: 0.15, cumulativeShare: 0.95, classification: 'B', medianCycle: 5 },
    { supplier: 2, share: 0.05, cumulativeShare: 1, classification: 'C', medianCycle: 3 },
  ]);
});

test('supplier profiles combine spend, purchase months, invoice counts, and leading category', () => {
  const result = profileSuppliers(fixture.rows, fixture.protocolos, fixture.meta.categorias);

  assert.equal(result.total, 4500);
  assert.deepEqual(result.suppliers.map((supplier) => ({
    supplier: supplier.supplier,
    spend: supplier.spend,
    saving: supplier.saving,
    orders: supplier.orders,
    months: supplier.months,
    invoices: supplier.invoices,
    classification: supplier.classification,
    category: supplier.category,
  })), [
    {
      supplier: 1,
      spend: 2600,
      saving: 0,
      orders: 4,
      months: 1,
      invoices: 7,
      classification: 'A',
      category: 'Services',
    },
    {
      supplier: 0,
      spend: 1900,
      saving: 100,
      orders: 4,
      months: 2,
      invoices: 0,
      classification: 'C',
      category: 'Services',
    },
  ]);
});

test('supplier action buckets respect order, month, and invoice priority', () => {
  assert.deepEqual(supplierActionBucket({ orders: 3, months: 3, invoices: 1 }), {
    id: 'guarda',
    avoidableOrders: 2,
  });
  assert.deepEqual(supplierActionBucket({ orders: 2, months: 1, invoices: 5 }), {
    id: 'consol',
    avoidableOrders: 1,
  });
  assert.deepEqual(supplierActionBucket({ orders: 1, months: 1, invoices: 3 }), {
    id: 'formal',
    avoidableOrders: 0,
  });
  assert.deepEqual(supplierActionBucket({ orders: 1, months: 1, invoices: 0 }), {
    id: 'catalogo',
    avoidableOrders: 1,
  });
});

test('formatters preserve Portuguese currency, percentage, and duration output', () => {
  assert.equal(brl(1234.5), 'R$ 1.234,50');
  assert.equal(brlCompact(1_250_000), 'R$ 1,3 mi');
  assert.equal(brlCompact(2400), 'R$ 2 mil');
  assert.equal(brlCompact(-1_250_000), 'R$ -1,3 mi');
  assert.equal(percent(0.125), '12,5%');
  assert.equal(hours(null), '—');
  assert.equal(hours(-1), '—');
  assert.equal(hours(0.5), '30 min');
  assert.equal(hours(1), '1,0 h');
  assert.equal(hours(48), '2,0 d');
});
