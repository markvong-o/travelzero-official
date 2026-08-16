// Dependency-free className joiner (drop-in for the old clsx + tailwind-merge
// cn). Accepts strings, numbers, arrays, and { class: truthy } objects.
export function cn(...inputs) {
  const out = [];
  const walk = (v) => {
    if (!v) return;
    if (typeof v === 'string' || typeof v === 'number') out.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (typeof v === 'object') for (const k in v) if (v[k]) out.push(k);
  };
  inputs.forEach(walk);
  return out.join(' ');
}

// Per-destination fallback gradient, painted behind the photo. Keyed by
// `destination.color` (see Browse.jsx / Dashboard.jsx). Returns a CSS value
// for inline `style={{ background: destinationGradient(color) }}`.
const DESTINATION_GRADIENTS = {
  rome: 'linear-gradient(135deg, #4F3CF0, #7A5CFA)',
  amalfi: 'linear-gradient(135deg, #0EA5E9, #00C2A8)',
  tuscany: 'linear-gradient(135deg, #00C2A8, #10B981)',
  como: 'linear-gradient(135deg, #3B29C4, #0EA5E9)',
  london: 'linear-gradient(135deg, #1E3A5F, #C8102E)',
  'thames-cruise': 'linear-gradient(135deg, #1E3A5F, #4F86F7)',
  'rooftop-dinner': 'linear-gradient(135deg, #7A5CFA, #C8102E)',
  'kent-vineyard': 'linear-gradient(135deg, #10B981, #00C2A8)',
};

export function destinationGradient(color) {
  return DESTINATION_GRADIENTS[color] || DESTINATION_GRADIENTS.rome;
}
