import React from 'react';
import { Toaster } from '@/components/ui/sonner';

// Kept as a named export so App.jsx's existing <ToastContainer /> call site
// doesn't need to change — internals now render shadcn's sonner Toaster.
// Actual toast triggering lives in ToastContext's showToast(), not here.
// Positioned top-left with gap for staggered appearance.
export function ToastContainer() {
  return (
    <Toaster
      position="top-left"
      gap={12}
      richColors
      expand
    />
  );
}
