'use client';

interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pageCount, onPageChange }: PaginationProps) {
  return (
    <nav className="pager" aria-label="Paginação">
      <button className="btn" type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Anterior
      </button>
      <span className="num">{page} / {pageCount}</span>
      <button className="btn" type="button" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>
        Próxima
      </button>
    </nav>
  );
}
