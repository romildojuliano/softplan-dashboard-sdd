import { PURCHASE_INDEX as P, type DashboardData, type PurchaseRow } from '../types/dashboard.ts';

export type CsvValue = string | number | boolean | null | undefined;

export function serializeCsv(
  headers: readonly CsvValue[],
  rows: readonly (readonly CsvValue[])[],
): string {
  const quote = (value: CsvValue) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  return `\uFEFF${[headers, ...rows].map((row) => row.map(quote).join(';')).join('\r\n')}`;
}

export function downloadCsv(
  filename: string,
  headers: readonly CsvValue[],
  rows: readonly (readonly CsvValue[])[],
): void {
  const blob = new Blob([serializeCsv(headers, rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);

  try {
    anchor.click();
  } finally {
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

export const PURCHASE_CSV_HEADERS = [
  'OC', 'Data', 'Empresa', 'Fornecedor', 'Categoria', 'Descricao', 'Comprador',
  'Natureza', 'Moeda', 'Total moeda', 'Valor final BRL', 'Saving BRL', '% saving', 'Status',
] as const;

const currency = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const percent = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function purchaseCsvRows(data: DashboardData, rows: readonly PurchaseRow[]): CsvValue[][] {
  const { meta } = data;
  return rows.map((row) => [
    row[P.order],
    `${row[P.date]}/2026`,
    meta.empresas[row[P.company]],
    meta.fornecedores[row[P.supplier]],
    meta.categorias[row[P.category]],
    row[P.description],
    meta.compradores[row[P.buyer]],
    row[P.nature] >= 0 ? `Registro - ${meta.regTipos[row[P.nature]]}` : 'Negociavel',
    meta.moedas[row[P.currency]],
    currency.format(row[P.currencyAmount]),
    currency.format(row[P.spend]),
    row[P.saving] > 0 ? currency.format(row[P.saving]) : '',
    row[P.saving] > 0 ? `${percent.format(row[P.saving] / (row[P.saving] + row[P.spend]) * 100)}%` : '',
    meta.status[row[P.status]],
  ]);
}
