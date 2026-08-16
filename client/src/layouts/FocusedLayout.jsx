import React from 'react';
import { Outlet } from 'react-router-dom';

// Chrome-less shell for auth + interrupt pages (login, signup, the security
// step-up interstitial). No nav/sidebar — each page owns its own centering.
export default function FocusedLayout() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Outlet />
    </div>
  );
}
