import React from 'react';
import { cn } from '@/lib/utils';
import s from './ScopeChip.module.css';

export function ScopeChip({ label, scopes, variant = 'default' }) {
  const highlight = variant === 'highlight';

  return (
    <div className={cn(s.chip, highlight && s.highlight)}>
      {highlight && <div className={s.accentBar} />}
      <div className={cn(s.label, highlight && s.labelInset)}>{label}</div>
      {scopes?.length > 0 && (
        <div className={cn(s.scopes, highlight && s.scopesInset)}>
          {scopes.map((scope) => (
            <span key={scope} className={s.scope}>
              {scope}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
