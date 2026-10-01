import type { CsvValue } from '../../lib/csv';
import { PURCHASE_CSV_HEADERS } from '../../lib/csv';
import { brl } from '../../lib/dashboard-calculations';
import type { DashboardData } from '../../types/dashboard';
import { CsvButton } from './CsvButton';
import { DashboardTabs, type DashboardTabId } from './DashboardTabs';

interface DashboardHeaderProps {
  data: DashboardData;
  scope: string;
  activeTab: DashboardTabId;
  onTabChange: (tab: DashboardTabId) => void;
  csvRows: readonly (readonly CsvValue[])[];
}

export function DashboardHeader({ data, scope, activeTab, onTabChange, csvRows }: DashboardHeaderProps) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand">
          <span className="mark" aria-hidden="true" />
          <span className="brand-txt">
            <h1>Dashboard de Compras</h1>
            <span className="sub">Softplan · Poligraph · JXS &nbsp;·&nbsp; Jan – Jul 2026</span>
          </span>
        </div>
        <div className="topbar-right">
          <span className="pill-stat">Dólar <b className="num">{brl(data.meta.taxaDolar)}</b></span>
          <span className="pill-stat">Seleção: <b>{scope}</b></span>
          <CsvButton filename="ocs_softplan_selecao.csv" headers={PURCHASE_CSV_HEADERS} rows={csvRows}>
            Exportar seleção (CSV)
          </CsvButton>
        </div>
      </div>
      <DashboardTabs active={activeTab} onSelect={onTabChange} />
    </header>
  );
}
