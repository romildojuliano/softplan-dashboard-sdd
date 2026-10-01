'use client';

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { DEFAULT_FILTERS } from '../../lib/dashboard-calculations';
import type { DashboardData, DashboardFilters as Filters, NatureFilter } from '../../types/dashboard';
import { FilterChips } from './FilterChips';

const companyColors = ['#5C5CFF', '#9196AD', '#DCDEEA', '#B9B9FF'];
const natureOptions = [
  { value: 'todos', label: 'Tudo' },
  { value: 'neg', label: 'Só negociável' },
  { value: 'reg', label: 'Só registros' },
  { value: 'sav', label: 'Com saving' },
];

interface DashboardFiltersProps {
  data: DashboardData;
  filters: Filters;
  setFilters: Dispatch<SetStateAction<Filters>>;
}

export function DashboardFilters({ data, filters, setFilters }: DashboardFiltersProps) {
  const [search, setSearch] = useState(filters.query);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  function toggle(key: 'months' | 'companies', value: number) {
    setFilters((current) => {
      const selected = new Set(current[key]);
      if (selected.has(value)) selected.delete(value);
      else selected.add(value);
      return { ...current, [key]: selected, page: 0, pageReq: 0, pageProt: 0 };
    });
  }

  function reset() {
    window.clearTimeout(timer.current);
    setSearch('');
    setFilters({ ...DEFAULT_FILTERS, months: new Set(), companies: new Set() });
  }

  return (
    <section className="filters" aria-label="Filtros globais">
      <div className="filters-inner">
        <div className="fgroup">
          <span className="flabel">Mês de criação</span>
          <div className="chips" role="group" aria-label="Mês de criação">
            {data.meta.meses.map((month, index) => {
              const value = index + 1;
              const selected = filters.months.has(value);
              return <button key={month} className={selected ? 'chip on' : 'chip'} type="button" aria-pressed={selected} onClick={() => toggle('months', value)}>{month}</button>;
            })}
          </div>
        </div>
        <div className="fgroup">
          <span className="flabel">Empresa</span>
          <div className="chips" role="group" aria-label="Empresa">
            {data.meta.empresas.map((company, index) => {
              const selected = filters.companies.has(index);
              return (
                <button key={company} className={selected ? 'chip on' : 'chip'} type="button" aria-pressed={selected} onClick={() => toggle('companies', index)}>
                  <i className="cdot" style={{ backgroundColor: companyColors[index] }} aria-hidden="true" />
                  {company}
                </button>
              );
            })}
          </div>
        </div>
        <div className="fgroup">
          <span className="flabel">Natureza</span>
          <FilterChips
            label="Natureza"
            options={natureOptions}
            value={filters.nature}
            onChange={(value) => setFilters((current) => ({ ...current, nature: value as NatureFilter, page: 0 }))}
          />
        </div>
        <div className="fgroup">
          <label className="flabel" htmlFor="fComprador">Comprador</label>
          <select id="fComprador" value={filters.buyer ?? ''} onChange={(event) => setFilters((current) => ({ ...current, buyer: event.target.value === '' ? null : Number(event.target.value), page: 0, pageReq: 0, pageProt: 0 }))}>
            <option value="">Todos os compradores</option>
            {data.meta.compradores.map((name, index) => <option key={name} value={index}>{name}</option>)}
          </select>
        </div>
        <div className="fgroup">
          <label className="flabel" htmlFor="fCategoria">Categoria</label>
          <select id="fCategoria" value={filters.category ?? ''} onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value === '' ? null : Number(event.target.value), page: 0 }))}>
            <option value="">Todas as categorias</option>
            {data.meta.categorias.map((name, index) => <option key={name} value={index}>{name}</option>)}
          </select>
        </div>
        <div className="fgroup">
          <label className="flabel" htmlFor="fBusca">Busca livre</label>
          <input id="fBusca" type="search" placeholder="fornecedor, descrição ou nº da OC" value={search} onChange={(event) => {
            const value = event.target.value;
            setSearch(value);
            window.clearTimeout(timer.current);
            timer.current = window.setTimeout(() => setFilters((current) => ({ ...current, query: value.trim().toLowerCase(), page: 0, pageReq: 0, pageProt: 0 })), 220);
          }} />
        </div>
        <div className="fgroup reset">
          <span className="flabel" aria-hidden="true">&nbsp;</span>
          <button className="btn" type="button" onClick={reset}>Limpar filtros</button>
        </div>
      </div>
    </section>
  );
}
