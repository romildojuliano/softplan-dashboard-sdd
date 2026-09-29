'use client';

import type { KeyboardEvent, ReactNode } from 'react';

export interface DataTableColumn<T> {
  key?: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export interface DataTableSort {
  key: string;
  direction: 'asc' | 'desc';
}

interface DataTableProps<T> {
  columns: readonly DataTableColumn<T>[];
  rows: readonly T[];
  sort?: DataTableSort | null;
  onSort?: (key: string) => void;
  emptyMessage: ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns,
  rows,
  sort,
  onSort,
  emptyMessage,
  className,
}: DataTableProps<T>) {
  const wrapperClass = className ? `tblwrap ${className}` : 'tblwrap';

  if (!rows.length) {
    return <div className={wrapperClass}><div className="empty" role="status">{emptyMessage}</div></div>;
  }

  return (
    <div className={wrapperClass}>
      <table>
        <thead>
          <tr>
            {columns.map((column, index) => {
              const key = column.key;
              const sortable = key !== undefined && onSort !== undefined;
              const selected = key !== undefined && sort?.key === key;
              const classes = [
                column.align === 'left' && 'l',
                sortable && 'sortable',
              ].filter(Boolean).join(' ');
              const onKeyDown = (event: KeyboardEvent<HTMLTableCellElement>) => {
                if (!sortable || (event.key !== 'Enter' && event.key !== ' ')) return;
                event.preventDefault();
                onSort(key);
              };

              return (
                <th
                  key={key ?? index}
                  className={classes || undefined}
                  scope="col"
                  aria-sort={selected ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined}
                  tabIndex={sortable ? 0 : undefined}
                  onClick={sortable ? () => onSort(key) : undefined}
                  onKeyDown={sortable ? onKeyDown : undefined}
                >
                  {column.header}
                  {selected && <span className="arw" aria-hidden="true">{sort.direction === 'desc' ? '▾' : '▴'}</span>}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((column, columnIndex) => {
                const cellClass = [
                  column.align === 'left' && 'l',
                  column.className,
                ].filter(Boolean).join(' ');

                return <td key={column.key ?? columnIndex} className={cellClass || undefined}>{column.render(row)}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
