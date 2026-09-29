import type { CSSProperties, ReactNode } from 'react';

interface KpiCardProps {
  label: ReactNode;
  value: ReactNode;
  description?: ReactNode;
  accent?: string;
}

export function KpiCard({ label, value, description, accent }: KpiCardProps) {
  const style = accent ? { '--accent': accent } as CSSProperties : undefined;

  return (
    <div className="kpi" style={style}>
      <div className="k-lab">{label}</div>
      <div className="k-val num">{value}</div>
      <div className="k-sub">{description}</div>
    </div>
  );
}
