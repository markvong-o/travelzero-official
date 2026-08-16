import React, { createContext, useContext, useState } from 'react';

const ExperimentContext = createContext(null);

function readStorage() {
  try {
    const raw = sessionStorage.getItem('tz_experiment_variants');
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function writeStorage(variants) {
  try { sessionStorage.setItem('tz_experiment_variants', JSON.stringify(variants)); } catch {}
}

export function ExperimentProvider({ children }) {
  const [variants, setVariants] = useState(() => readStorage());

  const setVariant = (experimentId, variant) => {
    setVariants((prev) => {
      const next = { ...prev, [experimentId]: variant };
      writeStorage(next);
      return next;
    });
  };

  const getVariant = (experimentId) => variants[experimentId] || 'control';

  return (
    <ExperimentContext.Provider value={{ variants, setVariant, getVariant }}>
      {children}
    </ExperimentContext.Provider>
  );
}

// useExperiment(id) — primary hook for consuming pages/components
export function useExperiment(experimentId) {
  const ctx = useContext(ExperimentContext);
  if (!ctx) throw new Error('useExperiment must be used within ExperimentProvider');
  const variant = ctx.getVariant(experimentId);
  return {
    variant,
    setVariant: (v) => ctx.setVariant(experimentId, v),
    isControl: variant === 'control',
    isTreatment: variant === 'treatment',
  };
}

// useExperimentContext() — for ExperimentCenter which needs the full state
export function useExperimentContext() {
  const ctx = useContext(ExperimentContext);
  if (!ctx) throw new Error('useExperimentContext must be used within ExperimentProvider');
  return ctx;
}
