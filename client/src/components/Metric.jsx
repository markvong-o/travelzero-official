import React from 'react';
import { cn } from '@/lib/utils';
import s from './Metric.module.css';

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
    <div className={cn(s.metric, className)} {...props}>
      <dt className={s.label}>{label}</dt>
      <dd
        className={cn(
          s.value,
          size === 'sm' ? s.sizeSm : s.sizeDefault,
          tone === 'accent' && s.toneAccent
        )}
      >
        {FORMATTERS[format](value)}
      </dd>
    </div>
  );
}
