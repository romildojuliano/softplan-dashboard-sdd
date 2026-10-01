'use client';

import type { KeyboardEvent } from 'react';

export const DASHBOARD_TABS = [
  { id: 'geral', label: 'Visão geral' },
  { id: 'reg', label: 'Registros' },
  { id: 'saving', label: 'Savings' },
  { id: 'roi', label: 'ROI do time' },
  { id: 'req', label: 'Requisições' },
  { id: 'comp', label: 'Compradores' },
  { id: 'prot', label: 'Notas fiscais' },
  { id: 'cat', label: 'Categorias' },
  { id: 'forn', label: 'Fornecedores · Curva ABC' },
  { id: 'rac', label: 'Racionalização' },
  { id: 'base', label: 'Base de dados' },
] as const;

export type DashboardTabId = (typeof DASHBOARD_TABS)[number]['id'];

interface DashboardTabsProps {
  active: DashboardTabId;
  onSelect: (tab: DashboardTabId) => void;
}

export function DashboardTabs({ active, onSelect }: DashboardTabsProps) {
  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const index = DASHBOARD_TABS.findIndex((tab) => tab.id === active);
    const next = event.key === 'Home' ? 0 : event.key === 'End'
      ? DASHBOARD_TABS.length - 1
      : (index + (event.key === 'ArrowRight' ? 1 : -1) + DASHBOARD_TABS.length) % DASHBOARD_TABS.length;
    const id = DASHBOARD_TABS[next].id;
    onSelect(id);
    document.getElementById(`tab-${id}`)?.focus();
  }
  return (
    <nav className="tabs" role="tablist" aria-label="Visões do dashboard" onKeyDown={onKeyDown}>
      {DASHBOARD_TABS.map(({ id, label }) => (
        <button
          key={id}
          id={`tab-${id}`}
          className={active === id ? 'tab on' : 'tab'}
          type="button"
          role="tab"
          aria-selected={active === id}
          aria-controls={`v-${id}`}
          tabIndex={active === id ? 0 : -1}
          onClick={() => onSelect(id)}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
