'use client';

import type { ReactNode } from 'react';
import { downloadCsv, type CsvValue } from '../../lib/csv.ts';

interface CsvButtonProps {
  filename: string;
  headers: readonly CsvValue[];
  rows: readonly (readonly CsvValue[])[];
  children?: ReactNode;
  className?: string;
}

export function CsvButton({ filename, headers, rows, children = 'Exportar CSV', className }: CsvButtonProps) {
  const classes = className ? `btn ${className}` : 'btn';

  return (
    <button className={classes} type="button" onClick={() => downloadCsv(filename, headers, rows)}>
      {children}
    </button>
  );
}
