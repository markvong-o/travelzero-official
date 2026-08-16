import React, { useEffect, useState } from 'react';
import s from './PanelCarousel.module.css';

const SLIDES = [
  {
    src: '/images/hero-italy.jpg',
    label: 'Italy',
    caption: 'Your next Italian adventure awaits',
  },
  {
    src: '/images/destinations/rome.jpg',
    label: 'Rome',
    caption: 'Explore the Eternal City',
  },
  {
    src: '/images/destinations/amalfi.jpg',
    label: 'Amalfi Coast',
    caption: 'Cliff-hanging views, Mediterranean bliss',
  },
  {
    src: '/images/destinations/tuscany.jpg',
    label: 'Tuscany',
    caption: 'Rolling hills, fine wine, timeless art',
  },
  {
    src: '/images/destinations/como.jpg',
    label: 'Lake Como',
    caption: 'Alpine elegance on Europe\'s deepest lake',
  },
];

const INTERVAL_MS = 10000;

export function PanelCarousel({ children }) {
  const [active, setActive] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setActive((i) => (i + 1) % SLIDES.length);
        setFading(false);
      }, 400);
    }, INTERVAL_MS);
    return () => clearInterval(t);
  }, []);

  return (
    <div className={s.panel}>
      {SLIDES.map((slide, i) => (
        <div
          key={slide.src}
          className={`${s.slide} ${i === active ? s.slideActive : s.slideHidden}`}
          style={{ backgroundImage: `url(${slide.src})` }}
        />
      ))}
      <div className={s.scrim} />
      <div className={s.content}>
        {children}
      </div>
    </div>
  );
}
