import React from 'react';

// A phone bezel around a real iframe viewport (not a scaled-down div) so
// genuine mobile breakpoints in the app's CSS fire — this is a true 375px
// browsing context, same as a phone would produce. Purely presentational;
// see pages/MobileApp.jsx for the route that hosts it and picks `src`.
export function PhoneFrame({ src }) {
  return (
    <div className="relative flex h-[812px] max-h-full w-[375px] flex-none flex-col rounded-[2.75rem] border-[12px] border-slate-900 bg-slate-900 shadow-2xl">
      <div className="absolute left-1/2 top-0 z-10 h-6 w-28 -translate-x-1/2 rounded-b-2xl bg-slate-900" />
      <iframe
        src={src}
        title="TravelZero mobile app"
        className="h-full w-full flex-1 rounded-[2.1rem] border-0 bg-background"
      />
      <div className="absolute bottom-2 left-1/2 h-1 w-28 -translate-x-1/2 rounded-full bg-slate-700" />
    </div>
  );
}
