import {
  PROTOCOL_INDEX,
  PURCHASE_INDEX,
  REQUEST_INDEX,
  type DashboardData,
  type DashboardFilters,
  type FilteredDashboardData,
  type Totals,
} from '../types/dashboard.ts';

export const DEFAULT_FILTERS: DashboardFilters = {
  months: new Set<number>(),
  companies: new Set<number>(),
  nature: 'todos',
  buyer: null,
  category: null,
  query: '',
  origin: 'todos',
  urgency: null,
  system: null,
  page: 0,
  pageReq: 0,
  pageProt: 0,
};

function matchesQuery(query: string, first: string, second: string, third = ''): boolean {
  return !query || first.toLowerCase().includes(query)
    || second.toLowerCase().includes(query)
    || third.toLowerCase().includes(query);
}

export function filterDashboardData(
  data: DashboardData,
  filters: DashboardFilters,
): FilteredDashboardData {
  const query = filters.query.trim().toLowerCase();
  const rows = data.rows.filter((row) => {
    if (filters.months.size && !filters.months.has(row[PURCHASE_INDEX.month])) return false;
    if (filters.companies.size && !filters.companies.has(row[PURCHASE_INDEX.company])) return false;
    if (filters.nature === 'neg' && row[PURCHASE_INDEX.nature] >= 0) return false;
    if (filters.nature === 'reg' && row[PURCHASE_INDEX.nature] < 0) return false;
    if (filters.nature === 'sav' && !(row[PURCHASE_INDEX.saving] > 0)) return false;
    if (filters.buyer !== null && row[PURCHASE_INDEX.buyer] !== filters.buyer) return false;
    if (filters.category !== null && row[PURCHASE_INDEX.category] !== filters.category) return false;
    if (query && !matchesQuery(
      query,
      data.meta.fornecedores[row[PURCHASE_INDEX.supplier]],
      row[PURCHASE_INDEX.description],
      String(row[PURCHASE_INDEX.order]),
    )) return false;
    return true;
  });
  const requisicoes = data.requisicoes.filter((row) => {
    if (filters.months.size && !filters.months.has(row[REQUEST_INDEX.month])) return false;
    if (filters.companies.size && !filters.companies.has(row[REQUEST_INDEX.company])) return false;
    if (filters.buyer !== null && row[REQUEST_INDEX.buyer] !== filters.buyer) return false;
    if (filters.urgency !== null && row[REQUEST_INDEX.urgency] !== filters.urgency) return false;
    if (filters.system !== null && row[REQUEST_INDEX.system] !== filters.system) return false;
    const requester = row[REQUEST_INDEX.requester] >= 0
      ? (data.meta.reqPessoas ?? [])[row[REQUEST_INDEX.requester]]
      : '';
    if (query && !matchesQuery(
      query,
      row[REQUEST_INDEX.description],
      String(row[REQUEST_INDEX.number]),
      requester,
    )) return false;
    return true;
  });
  const protocolos = data.protocolos.filter((row) => {
    if (filters.months.size && !filters.months.has(row[PROTOCOL_INDEX.month])) return false;
    if (filters.companies.size && !filters.companies.has(row[PROTOCOL_INDEX.company])) return false;
    if (filters.buyer !== null && row[PROTOCOL_INDEX.buyer] !== filters.buyer) return false;
    if (filters.origin === 'br' && row[PROTOCOL_INDEX.country] !== data.meta.protPaisBR) return false;
    if (filters.origin === 'ext' && row[PROTOCOL_INDEX.country] === data.meta.protPaisBR) return false;
    if (query && !matchesQuery(
      query,
      data.meta.fornecedores[row[PROTOCOL_INDEX.supplier]],
      (data.meta.protMetodos ?? [])[row[PROTOCOL_INDEX.method]],
      (data.meta.protPaises ?? [])[row[PROTOCOL_INDEX.country]],
    )) return false;
    return true;
  });

  return { rows, requisicoes, protocolos };
}

export function calculateTotals(rows: readonly DashboardData['rows'][number][]): Totals {
  let spend = 0;
  let saving = 0;
  let records = 0;
  let negotiable = 0;
  let negotiatedOrders = 0;
  let negotiableBase = 0;
  let savingBase = 0;
  const orders = new Set<number>();
  const suppliers = new Set<number>();

  for (const row of rows) {
    spend += row[PURCHASE_INDEX.spend];
    saving += row[PURCHASE_INDEX.saving];
    orders.add(row[PURCHASE_INDEX.order]);
    suppliers.add(row[PURCHASE_INDEX.supplier]);
    if (row[PURCHASE_INDEX.nature] >= 0) records += row[PURCHASE_INDEX.spend];
    else negotiable += row[PURCHASE_INDEX.spend];
    if (row[PURCHASE_INDEX.saving] > 0) {
      negotiatedOrders++;
      negotiableBase += row[PURCHASE_INDEX.spend] + row[PURCHASE_INDEX.saving];
      savingBase += row[PURCHASE_INDEX.saving];
    }
  }

  const orderCount = orders.size;
  return {
    orders: orderCount,
    lines: rows.length,
    suppliers: suppliers.size,
    spend,
    saving,
    records,
    negotiable,
    negotiatedOrders,
    negotiableBase,
    savingBase,
    savingRateOnNegotiable: negotiable > 0 ? saving / negotiable : 0,
    savingRateOnSpend: spend > 0 ? saving / spend : 0,
    averageDiscount: negotiableBase > 0 ? savingBase / negotiableBase : 0,
    averageTicket: orderCount > 0 ? spend / orderCount : 0,
  };
}

export function median(values: readonly number[]): number {
  if (!values.length) return -1;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function groupByMonth(
  rows: readonly DashboardData['rows'][number][],
  months: readonly string[],
) {
  const grouped = months.map((month, index) => ({
    month,
    index: index + 1,
    spend: 0,
    saving: 0,
    records: 0,
    negotiable: 0,
    negotiableBase: 0,
    orders: new Set<number>(),
  }));

  for (const row of rows) {
    const group = grouped[row[PURCHASE_INDEX.month] - 1];
    if (!group) continue;

    group.spend += row[PURCHASE_INDEX.spend];
    group.saving += row[PURCHASE_INDEX.saving];
    group.orders.add(row[PURCHASE_INDEX.order]);
    if (row[PURCHASE_INDEX.nature] >= 0) {
      group.records += row[PURCHASE_INDEX.spend];
    } else {
      group.negotiable += row[PURCHASE_INDEX.spend];
    }
    if (row[PURCHASE_INDEX.saving] > 0) {
      group.negotiableBase += row[PURCHASE_INDEX.spend] + row[PURCHASE_INDEX.saving];
    }
  }

  return grouped.map(({ orders, ...group }) => ({
    ...group,
    orders: orders.size,
    savingRateOnBase: group.negotiableBase > 0
      ? group.saving / group.negotiableBase
      : 0,
    savingRateOnNegotiable: group.negotiable > 0
      ? group.saving / group.negotiable
      : 0,
  }));
}

type SupplierClass = 'A' | 'B' | 'C';

export interface SupplierAbc {
  supplier: number;
  spend: number;
  saving: number;
  records: number;
  negotiable: number;
  lines: number;
  orders: number;
  negotiableBase: number;
  savingRateOnNegotiable: number;
  averageTicket: number;
  medianCycle: number;
  share: number;
  cumulativeShare: number;
  classification: SupplierClass;
}

export function calculateSupplierAbc(rows: readonly DashboardData['rows'][number][]) {
  const groups = new Map<number, {
    supplier: number;
    spend: number;
    saving: number;
    records: number;
    negotiable: number;
    negotiableBase: number;
    orders: Set<number>;
    cycles: number[];
    lines: number;
  }>();

  for (const row of rows) {
    const supplier = row[PURCHASE_INDEX.supplier];
    let group = groups.get(supplier);
    if (!group) {
      group = {
        supplier,
        spend: 0,
        saving: 0,
        records: 0,
        negotiable: 0,
        negotiableBase: 0,
        orders: new Set<number>(),
        cycles: [],
        lines: 0,
      };
      groups.set(supplier, group);
    }

    const spend = row[PURCHASE_INDEX.spend];
    const saving = row[PURCHASE_INDEX.saving];
    group.spend += spend;
    group.saving += saving;
    group.lines++;
    group.orders.add(row[PURCHASE_INDEX.order]);
    if (row[PURCHASE_INDEX.nature] >= 0) group.records += spend;
    else group.negotiable += spend;
    if (saving > 0) group.negotiableBase += spend + saving;
    if (row[PURCHASE_INDEX.cycleHours] >= 0) {
      group.cycles.push(row[PURCHASE_INDEX.cycleHours]);
    }
  }

  const sorted = [...groups.values()].sort((a, b) => b.spend - a.spend);
  const total = sorted.reduce((sum, group) => sum + group.spend, 0);
  let cumulativeSpend = 0;
  const suppliers: SupplierAbc[] = sorted.map((group) => {
    cumulativeSpend += group.spend;
    const share = total > 0 ? group.spend / total : 0;
    const cumulativeShare = total > 0 ? cumulativeSpend / total : 0;
    return {
      supplier: group.supplier,
      spend: group.spend,
      saving: group.saving,
      records: group.records,
      negotiable: group.negotiable,
      lines: group.lines,
      orders: group.orders.size,
      negotiableBase: group.negotiableBase,
      savingRateOnNegotiable: group.negotiable > 0 ? group.saving / group.negotiable : 0,
      averageTicket: group.orders.size ? group.spend / group.orders.size : 0,
      medianCycle: median(group.cycles),
      share,
      cumulativeShare,
      classification: cumulativeShare <= 0.8
        ? 'A'
        : cumulativeShare <= 0.95 ? 'B' : 'C',
    };
  });

  return { suppliers, total };
}

export interface SupplierProfile {
  supplier: number;
  spend: number;
  saving: number;
  orders: number;
  months: number;
  invoices: number;
  ticket: number;
  invoicesPerOrder: number;
  share: number;
  cumulativeShare: number;
  classification: SupplierClass;
  category: string;
}

export function profileSuppliers(
  rows: readonly DashboardData['rows'][number][],
  protocols: readonly DashboardData['protocolos'][number][],
  categories: readonly string[],
) {
  const groups = new Map<number, {
    supplier: number;
    spend: number;
    saving: number;
    orders: Set<number>;
    months: Set<number>;
    categories: Map<number, number>;
    invoices: number;
  }>();

  for (const row of rows) {
    const supplier = row[PURCHASE_INDEX.supplier];
    let group = groups.get(supplier);
    if (!group) {
      group = {
        supplier,
        spend: 0,
        saving: 0,
        orders: new Set<number>(),
        months: new Set<number>(),
        categories: new Map<number, number>(),
        invoices: 0,
      };
      groups.set(supplier, group);
    }
    group.spend += row[PURCHASE_INDEX.spend];
    group.saving += row[PURCHASE_INDEX.saving];
    group.orders.add(row[PURCHASE_INDEX.order]);
    group.months.add(row[PURCHASE_INDEX.month]);
    const category = row[PURCHASE_INDEX.category];
    group.categories.set(category, (group.categories.get(category) ?? 0) + row[PURCHASE_INDEX.spend]);
  }

  for (const protocol of protocols) {
    const group = groups.get(protocol[PROTOCOL_INDEX.supplier]);
    if (group) group.invoices++;
  }

  const sorted = [...groups.values()].sort((a, b) => b.spend - a.spend);
  const total = sorted.reduce((sum, group) => sum + group.spend, 0);
  let cumulativeSpend = 0;
  const suppliers: SupplierProfile[] = sorted.map((group) => {
    cumulativeSpend += group.spend;
    const orders = group.orders.size;
    const share = total > 0 ? group.spend / total : 0;
    const cumulativeShare = total > 0 ? cumulativeSpend / total : 0;
    let topCategory = -1;
    let topCategorySpend = -1;
    for (const [category, spend] of group.categories) {
      if (spend > topCategorySpend) {
        topCategory = category;
        topCategorySpend = spend;
      }
    }
    return {
      supplier: group.supplier,
      spend: group.spend,
      saving: group.saving,
      orders,
      months: group.months.size,
      invoices: group.invoices,
      ticket: orders ? group.spend / orders : 0,
      invoicesPerOrder: orders ? group.invoices / orders : 0,
      share,
      cumulativeShare,
      classification: cumulativeShare <= 0.8
        ? 'A'
        : cumulativeShare <= 0.95 ? 'B' : 'C',
      category: topCategory >= 0 ? categories[topCategory] ?? '—' : '—',
    };
  });

  return { suppliers, total };
}

export function supplierActionBucket(
  supplier: Pick<SupplierProfile, 'orders' | 'months' | 'invoices'>,
) {
  if (supplier.orders >= 3 && supplier.months >= 3) {
    return { id: 'guarda' as const, avoidableOrders: supplier.orders - 1 };
  }
  if (supplier.orders >= 2) {
    return { id: 'consol' as const, avoidableOrders: supplier.orders - 1 };
  }
  if (supplier.invoices >= 3) {
    return { id: 'formal' as const, avoidableOrders: 0 };
  }
  return { id: 'catalogo' as const, avoidableOrders: supplier.orders };
}

const number0 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const number1 = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const number2 = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function brl(value: number | null | undefined): string {
  return `R$ ${number2.format(value || 0)}`;
}

export function brlCompact(value: number | null | undefined): string {
  const amount = value || 0;
  const absolute = Math.abs(amount);
  if (absolute >= 1_000_000) return `R$ ${number1.format(amount / 1_000_000)} mi`;
  if (absolute >= 1_000) return `R$ ${number0.format(amount / 1_000)} mil`;
  return `R$ ${number0.format(amount)}`;
}

export function percent(value: number | null | undefined): string {
  return `${number1.format((value || 0) * 100)}%`;
}

export function hours(value: number | null | undefined): string {
  if (value == null || value < 0) return '—';
  if (value < 1) return `${number0.format(value * 60)} min`;
  if (value < 48) return `${number1.format(value)} h`;
  return `${number1.format(value / 24)} d`;
}
