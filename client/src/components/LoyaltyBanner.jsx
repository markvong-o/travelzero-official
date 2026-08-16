import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, X } from 'lucide-react';
import { useBanner } from '../context/BannerContext';
import s from './LoyaltyBanner.module.css';

// Persistent top-of-app strip, shown once an anonymous session crosses the
// London flight/hotel view threshold (see TravelDetailsModal + view-tracking.js).
// Mounted alongside ToastContainer in App.jsx so it survives route navigation.
export function LoyaltyBanner() {
  const { bannerVisible, dismissBanner } = useBanner();
  const navigate = useNavigate();

  if (!bannerVisible) return null;

  const handleClaim = () => {
    dismissBanner();
    // No need to pass the view-threshold state through the URL — Signup.jsx
    // independently checks the same sessionStorage-backed counter via
    // meetsViewThreshold() from view-tracking.js.
    navigate('/signup');
  };

  return (
    <div className={s.banner}>
      <div className={s.inner}>
        <Gift size={16} className={s.icon} />
        <p className={s.text}>
          You've been eyeing London — sign up now and get <strong>10,000 loyalty points</strong>.
        </p>
        <button type="button" className={s.claim} onClick={handleClaim}>
          Claim my points →
        </button>
      </div>
      <button type="button" className={s.dismiss} onClick={dismissBanner} aria-label="Dismiss">
        <X size={16} />
      </button>
    </div>
  );
}
