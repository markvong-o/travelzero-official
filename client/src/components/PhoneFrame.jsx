import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Renders the real app inside an actual narrow iframe viewport (not just a
// scaled-down div) so genuine mobile breakpoints in NavBar/page CSS fire —
// this is a true 375px browsing context, same as a phone would produce.
export function PhoneFrame({ onClose, path = '/' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-6">
      <Button
        onClick={onClose}
        size="icon"
        variant="secondary"
        className="absolute right-6 top-6 rounded-full shadow-lg"
        aria-label="Exit mobile app view"
      >
        <X className="size-4" />
      </Button>
      <div className="relative flex h-[812px] max-h-full w-[375px] flex-none flex-col rounded-[2.75rem] border-[12px] border-slate-900 bg-slate-900 shadow-2xl">
        <div className="absolute left-1/2 top-0 z-10 h-6 w-28 -translate-x-1/2 rounded-b-2xl bg-slate-900" />
        <iframe
          src={`${window.location.origin}${path}`}
          title="TravelZero mobile app"
          className="h-full w-full flex-1 rounded-[2.1rem] border-0 bg-background"
        />
        <div className="absolute bottom-2 left-1/2 h-1 w-28 -translate-x-1/2 rounded-full bg-slate-700" />
      </div>
    </div>
  );
}
