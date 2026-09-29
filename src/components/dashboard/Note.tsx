import type { ReactNode } from 'react';

export function Note({ children }: { children: ReactNode }) {
  return <div className="note">{children}</div>;
}
