import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import s from './CiamMoment.module.css';

// Shared "security moment" panel — the visual anchor for the Auth0 CIAM beats
// this demo exists to show off (agent-booking receipts, breach step-up, scope
// grants). Presentational only: a gradient-tinted, elevated card with a
// ShieldCheck chip, an eyebrow label, and structured mono detail rows.
export function CiamMoment({
  eyebrow = 'Auth0-secured',
  title,
  icon: Icon = ShieldCheck,
  rows = [],
  children,
  className,
}) {
  return (
    <div className={cn(s.moment, className)}>
      <div className={s.wash} />
      <div className={s.topBar} />

      <div className={s.inner}>
        <div className={s.head}>
          <span className={s.chip}>
            <Icon />
          </span>
          <div>
            <p className={s.eyebrow}>{eyebrow}</p>
            {title && <h4 className={s.title}>{title}</h4>}
          </div>
        </div>

        {rows.length > 0 && (
          <dl className={s.rows}>
            {rows.map(({ label, value, mono }) => (
              <div key={label} className={s.row}>
                <dt className={s.rowLabel}>{label}</dt>
                <dd className={cn(s.rowValue, mono && s.rowValueMono)}>{value}</dd>
              </div>
            ))}
          </dl>
        )}

        {children}
      </div>
    </div>
  );
}
