import React, { useCallback, useEffect, useRef, useState } from 'react';
import s from './WebAuthnPrompt.module.css';

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
    <div className={s.overlay}>
      <div className={s.card}>
        <div className={s.icon}>{icon}</div>
        <p className={s.message}>{message}</p>
        <div className={s.spinner} />
      </div>
    </div>
  );
}
