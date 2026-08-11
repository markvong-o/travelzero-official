import React from 'react';
import './ScopeChip.css';

export function ScopeChip({ label, scopes, variant = 'default' }) {
  return (
    <div className={`scope-chip scope-chip-${variant}`}>
      <div className="chip-label">{label}</div>
      {scopes && scopes.length > 0 && (
        <div className="chip-scopes">
          {scopes.map((scope, idx) => (
            <span key={idx} className="scope-tag">
              {scope}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
