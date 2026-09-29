'use client';

import type { ReactNode } from 'react';

export interface FilterChipOption {
  value: string;
  label: ReactNode;
  dotColor?: string;
}

interface FilterChipsProps {
  options: readonly FilterChipOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export function FilterChips({ options, value, onChange, label }: FilterChipsProps) {
  return (
    <div className="chips" role={label ? 'group' : undefined} aria-label={label}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            className={selected ? 'chip on' : 'chip'}
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
          >
            {option.dotColor && <span className="cdot" style={{ backgroundColor: option.dotColor }} aria-hidden="true" />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
