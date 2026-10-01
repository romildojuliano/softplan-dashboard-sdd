'use client';

import { useMemo, useState, type ComponentType } from 'react';
import { DASHBOARD_DATA } from '../../data/dashboard-data';
import { DEFAULT_FILTERS, filterDashboardData, sortPurchaseRows } from '../../lib/dashboard-calculations';
import { purchaseCsvRows } from '../../lib/csv';
import type { BaseTableSort, DashboardFilters, DashboardViewProps } from '../../types/dashboard';
import { Mosaic } from './Mosaic';
import { DashboardFilters as FilterControls } from './DashboardFilters';
import { DashboardFooter } from './DashboardFooter';
import { DashboardHeader } from './DashboardHeader';
import type { DashboardTabId } from './DashboardTabs';
import { OverviewView } from './views/OverviewView';
import { RecordsView } from './views/RecordsView';
import { SavingsView } from './views/SavingsView';
import { RoiView } from './views/RoiView';
import { RequestsView } from './views/RequestsView';
import { BuyersView } from './views/BuyersView';
import { InvoicesView } from './views/InvoicesView';
import { CategoriesView } from './views/CategoriesView';
import { SuppliersView } from './views/SuppliersView';
import { RationalizationView } from './views/RationalizationView';
import { DatabaseView } from './views/DatabaseView';

const VIEWS: Record<DashboardTabId, ComponentType<DashboardViewProps>> = {
  geral: OverviewView,
  reg: RecordsView,
  saving: SavingsView,
  roi: RoiView,
  req: RequestsView,
  comp: BuyersView,
  prot: InvoicesView,
  cat: CategoriesView,
  forn: SuppliersView,
  rac: RationalizationView,
  base: DatabaseView,
};

const defaultBaseSort: BaseTableSort = { key: 'v', direction: 'desc' };

function scopeLabel(data: typeof DASHBOARD_DATA, filters: DashboardFilters): string {
  const labels = [filters.months.size
    ? [...filters.months].sort((a, b) => a - b).map((month) => data.meta.meses[month - 1]).join(' · ')
    : 'Jan–Jul'];
  if (filters.companies.size) labels.push([...filters.companies].map((index) => data.meta.empresas[index]).join(' · '));
  if (filters.nature !== 'todos') labels.push({ neg: 'negociável', reg: 'registros', sav: 'com saving' }[filters.nature]);
  if (filters.buyer !== null) {
    const parts = data.meta.compradores[filters.buyer].split(' ');
    labels.push(parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]}` : parts[0]);
  }
  if (filters.category !== null) labels.push(data.meta.categorias[filters.category]);
  if (filters.origin !== 'todos') labels.push(filters.origin === 'br' ? 'nacional' : 'exterior');
  if (filters.urgency !== null) labels.push(filters.urgency === 1 ? 'urgentes' : 'planejadas');
  if (filters.system !== null) labels.push((data.meta.reqSistemas ?? [])[filters.system]);
  if (filters.query) labels.push(`“${filters.query}”`);
  return labels.join(' · ');
}

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTabId>('geral');
  const [filters, setFilters] = useState<DashboardFilters>(() => ({
    ...DEFAULT_FILTERS, months: new Set(), companies: new Set(),
  }));
  const [tableSorts, setTableSorts] = useState<Partial<Record<DashboardTabId, BaseTableSort>>>({
    base: defaultBaseSort,
    comp: { key: 'spend', direction: 'desc' },
    cat: { key: 'spend', direction: 'desc' },
    req: { key: 'nr', direction: 'desc' },
    prot: { key: 'dia', direction: 'desc' },
  });
  const baseSort = tableSorts.base ?? defaultBaseSort;
  const filtered = useMemo(() => filterDashboardData(DASHBOARD_DATA, filters), [filters]);
  const csvRows = useMemo(() => purchaseCsvRows(DASHBOARD_DATA,
    sortPurchaseRows(DASHBOARD_DATA, filtered.rows, baseSort)), [filtered, baseSort]);
  const ActiveView = VIEWS[activeTab];

  function selectTab(tab: DashboardTabId) {
    setActiveTab(tab);
    setFilters((current) => ({ ...current, page: 0 }));
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  return (
    <div className="dashboard">
      <Mosaic />
      <DashboardHeader data={DASHBOARD_DATA} scope={scopeLabel(DASHBOARD_DATA, filters)} activeTab={activeTab} onTabChange={selectTab} csvRows={csvRows} />
      <FilterControls data={DASHBOARD_DATA} filters={filters} setFilters={setFilters} />
      <main className="wrap">
        <section className="view on" id={`v-${activeTab}`} role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
          <ActiveView data={DASHBOARD_DATA} filtered={filtered} filters={filters} setFilters={setFilters} viewSort={tableSorts[activeTab] ?? defaultBaseSort} setViewSort={(sort) => setTableSorts((current) => ({ ...current, [activeTab]: typeof sort === 'function' ? sort(current[activeTab] ?? defaultBaseSort) : sort }))} />
        </section>
        <DashboardFooter data={DASHBOARD_DATA} selectedRows={filtered.rows.length} />
      </main>
    </div>
  );
}
