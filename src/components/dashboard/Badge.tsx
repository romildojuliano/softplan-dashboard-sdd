import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  muted?: boolean;
  className?: string;
}

export function Badge({ children, muted = false, className }: BadgeProps) {
  const classes = [
    'badge',
    muted && 'mut',
    className,
  ].filter(Boolean).join(' ');

  return <span className={classes}>{children}</span>;
}
