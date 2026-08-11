import React from 'react';
import { cn } from '@/lib/utils';

const FORMATTERS = {
  plain: (v) => (typeof v === 'number' ? v.toLocaleString() : v),
  currency: (v) => `$${Number(v).toLocaleString()}`,
  percent: (v) => `${Math.round(Number(v))}%`,
  compact: (v) => Number(v).toLocaleString(undefined, { notation: 'compact' }),
};

export function Metric({
  label,
  value,
  format = 'plain',
  tone = 'default',
  size = 'default',
  className,
  ...props
}) {
  return (
    <div className={cn('flex flex-col gap-1', className)} {...props}>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd
        className={cn(
          'font-semibold tabular-nums tracking-tight',
          size === 'sm' ? 'text-base' : 'text-2xl',
          tone === 'accent' ? 'text-accent' : 'text-foreground'
        )}
      >
        {FORMATTERS[format](value)}
      </dd>
    </div>
  );
}
