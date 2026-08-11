import React from 'react';
import './LoyaltyMeter.css';

export function LoyaltyMeter({ points = 0, maxPoints = 100000 }) {
  const percentage = Math.min((points / maxPoints) * 100, 100);

  // Determine tier based on points
  let tier = 'Bronze';
  let tierColor = '#9C7A4A';

  if (points >= 50000) {
    tier = 'Platinum';
    tierColor = '#B8AFA0';
  } else if (points >= 25000) {
    tier = 'Gold';
    tierColor = '#D4A017';
  } else if (points >= 10000) {
    tier = 'Silver';
    tierColor = '#CBBFA6';
  }

  return (
    <div className="loyalty-meter">
      <div className="loyalty-header">
        <h3>Loyalty Points</h3>
        <span className="tier-badge" style={{ backgroundColor: tierColor }}>
          {tier}
        </span>
      </div>

      <div className="loyalty-value">{points.toLocaleString()}</div>

      <div className="loyalty-bar">
        <div className="loyalty-fill" style={{ width: `${percentage}%` }}></div>
      </div>

      <div className="loyalty-milestones">
        <div className="milestone">
          <span>Bronze</span>
          <span>0</span>
        </div>
        <div className="milestone">
          <span>Silver</span>
          <span>10K</span>
        </div>
        <div className="milestone">
          <span>Gold</span>
          <span>25K</span>
        </div>
        <div className="milestone">
          <span>Platinum</span>
          <span>50K</span>
        </div>
      </div>
    </div>
  );
}
