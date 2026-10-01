import type { Dispatch, SetStateAction } from 'react';

export const PURCHASE_INDEX = {
  order: 0,
  company: 1,
  month: 2,
  currency: 3,
  buyer: 4,
  supplier: 5,
  category: 6,
  spend: 7,
  saving: 8,
  nature: 9,
  date: 10,
  cycleHours: 11,
  description: 12,
  status: 13,
  currencyAmount: 14,
  source: 15,
} as const;

export const REQUEST_INDEX = {
  company: 0,
  month: 1,
  buyer: 2,
  urgency: 3,
  lines: 4,
  system: 5,
  number: 6,
  description: 7,
  requester: 8,
  estimated: 9,
} as const;

export const PROTOCOL_INDEX = {
  company: 0,
  month: 1,
  supplier: 2,
  country: 3,
  method: 4,
  buyer: 5,
  weekday: 6,
  hour: 7,
  date: 8,
  minute: 9,
} as const;

export type PurchaseRow = readonly [
  order: number,
  company: number,
  month: number,
  currency: number,
  buyer: number,
  supplier: number,
  category: number,
  spend: number,
  saving: number,
  nature: number,
  date: string,
  cycleHours: number,
  description: string,
  status: number,
  currencyAmount: number,
  source: number,
];

export type RequestRow = readonly [
  company: number,
  month: number,
  buyer: number,
  urgency: number,
  lines: number,
  system: number,
  number: number | string,
  description: string,
  requester: number,
  estimated: number,
];

export type ProtocolRow = readonly [
  company: number,
  month: number,
  supplier: number,
  country: number,
  method: number,
  buyer: number,
  weekday: number,
  hour: number,
  date: string,
  minute: number,
];

export interface CostAvoidanceItem {
  desc: string;
  valor: number;
  icon: string;
  detail: string;
  tag: string;
  color: string;
}

export interface DuplicateSupplierGroup {
  grupo: string;
  nomes: readonly string[];
  nota: string;
}

export interface TeamCostAccount {
  conta: string;
  valor: number;
}

export interface TeamCost {
  periodo: string;
  total: number;
  meses: number;
  fonte: string;
  contas: readonly TeamCostAccount[];
}

export interface DashboardMeta {
  meses: readonly string[];
  empresas: readonly string[];
  moedas: readonly string[];
  compradores: readonly string[];
  fornecedores: readonly string[];
  categorias: readonly string[];
  regTipos: readonly string[];
  status: readonly string[];
  taxaDolar: number;
  periodo: string;
  nLinhas: number;
  nOCs: number;
  costAvoidance?: readonly CostAvoidanceItem[];
  duplicados?: readonly DuplicateSupplierGroup[];
  custoTime?: TeamCost | null;
  protPaises?: readonly string[];
  protMetodos?: readonly string[];
  protPaisBR?: number;
  protMetExterior?: readonly number[];
  reqPessoas?: readonly string[];
  reqPapeis?: readonly string[];
  reqSistemas?: readonly string[];
  reqLinhasTotais?: Readonly<Record<string, number>>;
  reqConflitoComprador?: number;
  reqEstimadas?: number;
  reqEstimadasNota?: string;
  [key: string]: unknown;
}

export interface DashboardData {
  meta: DashboardMeta;
  rows: readonly PurchaseRow[];
  requisicoes: readonly RequestRow[];
  protocolos: readonly ProtocolRow[];
  [key: string]: unknown;
}

export type NatureFilter = 'todos' | 'neg' | 'reg' | 'sav';
export type ProtocolOrigin = 'todos' | 'br' | 'ext';

export interface DashboardFilters {
  months: ReadonlySet<number>;
  companies: ReadonlySet<number>;
  nature: NatureFilter;
  buyer: number | null;
  category: number | null;
  query: string;
  origin: ProtocolOrigin;
  urgency: number | null;
  system: number | null;
  page: number;
  pageReq: number;
  pageProt: number;
}

export type FilteredDashboardData = Pick<
  DashboardData,
  'rows' | 'requisicoes' | 'protocolos'
>;

export interface BaseTableSort {
  key: string;
  direction: 'asc' | 'desc';
}

export interface DashboardViewProps {
  data: DashboardData;
  filtered: FilteredDashboardData;
  filters: DashboardFilters;
  setFilters: Dispatch<SetStateAction<DashboardFilters>>;
  viewSort: BaseTableSort;
  setViewSort: Dispatch<SetStateAction<BaseTableSort>>;
}

export interface Totals {
  orders: number;
  lines: number;
  suppliers: number;
  spend: number;
  saving: number;
  records: number;
  negotiable: number;
  negotiatedOrders: number;
  negotiableBase: number;
  savingBase: number;
  savingRateOnNegotiable: number;
  savingRateOnSpend: number;
  averageDiscount: number;
  averageTicket: number;
}
