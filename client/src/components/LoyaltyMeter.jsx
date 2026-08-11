import React from 'react';

// Tier colors stay metallic on purpose — they read as bronze/silver/gold/
// platinum, so they intentionally sit outside the indigo/teal brand ramp.
const TIERS = [
  { name: 'Platinum', min: 50000, label: '50K', color: '#B8AFA0' },
  { name: 'Gold', min: 25000, label: '25K', color: '#D4A017' },
  { name: 'Silver', min: 10000, label: '10K', color: '#C0C6CE' },
  { name: 'Bronze', min: 0, label: '0', color: '#A97449' },
];

export function LoyaltyMeter({ points = 0, maxPoints = 100000 }) {
  const percentage = Math.min((points / maxPoints) * 100, 100);
  const tier = TIERS.find((t) => points >= t.min);

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Loyalty Points</h3>
        <span
          className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-900"
          style={{ backgroundColor: tier.color }}
        >
          {tier.name}
        </span>
      </div>

      <div className="mb-4 text-3xl font-bold text-accent">{points.toLocaleString()}</div>

      <div className="mb-6 h-3 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${percentage}%`, background: 'var(--gradient-brand)' }}
        />
      </div>

      <div className="flex justify-between gap-4">
        {[...TIERS].reverse().map((t) => (
          <div key={t.name} className="flex flex-1 flex-col items-center gap-0.5 text-xs">
            <span className="font-semibold text-foreground">{t.name}</span>
            <span className="text-muted-foreground">{t.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
