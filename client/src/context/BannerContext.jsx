import React, { createContext, useState } from 'react';

export const BannerContext = createContext();

export function BannerProvider({ children }) {
  const [bannerVisible, setBannerVisible] = useState(false);

  const showBanner = () => setBannerVisible(true);
  const dismissBanner = () => setBannerVisible(false);

  return (
    <BannerContext.Provider value={{ bannerVisible, showBanner, dismissBanner }}>
      {children}
    </BannerContext.Provider>
  );
}

export function useBanner() {
  const context = React.useContext(BannerContext);
  if (!context) {
    throw new Error('useBanner must be used within a BannerProvider');
  }
  return context;
}
