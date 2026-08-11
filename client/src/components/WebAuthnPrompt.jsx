import React, { useCallback, useEffect, useRef, useState } from 'react';

// Replaces the raw-DOM "fake WebAuthn ceremony" overlay that Login.jsx and
// SignupModal.jsx used to each build by hand via document.createElement +
// innerHTML. Call `prompt(message)` to show the overlay; it resolves after
// a simulated 1.2s ceremony, same timing as the code it replaces. Spread
// `promptProps` onto <WebAuthnPrompt/> to render it.
export function useWebAuthnPrompt() {
  const [state, setState] = useState(null);
  const resolveRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => () => timerRef.current && clearTimeout(timerRef.current), []);

  const prompt = useCallback((message, icon = '👆') => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({ message, icon });
      timerRef.current = setTimeout(() => {
        setState(null);
        resolveRef.current?.();
        resolveRef.current = null;
      }, 1200);
    });
  }, []);

  return { prompt, promptProps: state };
}

export function WebAuthnPrompt({ message, icon = '👆' }) {
  if (!message) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30">
      <div className="mx-4 max-w-xs rounded-xl bg-white p-10 text-center shadow-2xl">
        <div className="mb-4 text-5xl">{icon}</div>
        <p className="mb-6 text-lg font-semibold text-foreground">{message}</p>
        <div className="inline-block size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    </div>
  );
}
