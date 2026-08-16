import React from 'react';
import s from './PhoneFrame.module.css';

export function PhoneFrame({ src }) {
  return (
    <div className={s.frame}>
      <div className={s.notchBar}>
        <div className={s.notch} />
      </div>
      <iframe src={src} title="TravelZero mobile app" className={s.viewport} />
      <div className={s.homeBar}>
        <div className={s.home} />
      </div>
    </div>
  );
}
