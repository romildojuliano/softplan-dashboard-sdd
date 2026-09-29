import type { ReactNode } from 'react';

interface DashboardCardProps {
  title?: ReactNode;
  hint?: ReactNode;
  headerAction?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function DashboardCard({
  title,
  hint,
  headerAction,
  className,
  children,
}: DashboardCardProps) {
  const hasHeader = title != null || hint != null || headerAction != null;

  return (
    <div className={className ? `card ${className}` : 'card'}>
      {hasHeader && (
        <div className="card-head">
          <div>
            {title != null && <h3>{title}</h3>}
            {hint != null && <div className="hint">{hint}</div>}
          </div>
          {headerAction}
        </div>
      )}
      {children}
    </div>
  );
}
