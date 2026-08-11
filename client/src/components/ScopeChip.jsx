import React from 'react';

export function ScopeChip({ label, scopes, variant = 'default' }) {
  const highlight = variant === 'highlight';

  return (
    <div
      className={`inline-flex flex-col gap-2 rounded-lg border p-4 ${
        highlight ? 'border-accent bg-accent/8' : 'border-border bg-muted'
      }`}
    >
      <div className="text-sm font-semibold text-primary">{label}</div>
      {scopes?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {scopes.map((scope) => (
            <span
              key={scope}
              className="rounded-full border border-border bg-card px-2 py-0.5 font-mono text-xs font-medium"
            >
              {scope}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
