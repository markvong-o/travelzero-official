import React from 'react';
import s from './LoyaltyMeter.module.css';

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
    <div className={s.meter}>
      <div className={s.wash} />

      <div className={s.header}>
        <h3 className={s.title}>Loyalty Points</h3>
        <span className={s.tier} style={{ backgroundColor: tier.color }}>
          {tier.name}
        </span>
      </div>

      <div className={s.points}>
        <span className={s.pointsNumber}>{points.toLocaleString()}</span>
        <span className={s.pointsUnit}>pts</span>
      </div>

      <div className={s.track}>
        <div className={s.fill} style={{ width: `${percentage}%` }} />
      </div>

      <div className={s.tiers}>
        {[...TIERS].reverse().map((t) => (
          <div key={t.name} className={s.tierCol}>
            <span className={s.tierName}>{t.name}</span>
            <span className={s.tierLabel}>{t.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
