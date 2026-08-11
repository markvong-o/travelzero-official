import React from 'react';
import { Outlet } from 'react-router-dom';

// Chrome-less shell for auth + interrupt pages (login, signup, the security
// step-up interstitial). No nav/sidebar — each page owns its own centering.
export default function FocusedLayout() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Outlet />
    </div>
  );
}
