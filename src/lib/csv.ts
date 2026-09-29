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
