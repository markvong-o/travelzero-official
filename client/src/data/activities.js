// Shared activity catalog — single source of truth for both the Gemini
// agentic-commerce demo (recommendations shown in RecsPanel) and the Browse
// page's favoritable Activities section, so the two never drift.
//
// `icon` is a string key rather than a component reference so this file has
// no React/JSX dependency — each consumer maps the key to its own lucide-react
// import locally.
export const ACTIVITIES = [
  {
    id: 'thames-cruise',
    type: 'activity',
    name: 'Thames Sunset Cruise',
    tagline: 'Golden hour on the river',
    desc: 'A sunset cruise along the Thames — ideal for a warm evening.',
    cost: 230,
    partner: 'Thames Cruises Ltd',
    icon: 'sailboat',
    color: 'thames-cruise',
    imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200&q=80',
  },
  {
    id: 'rooftop-dinner',
    type: 'activity',
    name: 'Rooftop Terrace Dinner — Sky Garden',
    tagline: 'Sky Garden, 35 floors up',
    desc: 'Panoramic views, warm evening air, 35 floors up.',
    cost: 85,
    partner: null,
    icon: 'utensils',
    color: 'rooftop-dinner',
    imageUrl: 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=1200&q=80',
  },
  {
    id: 'kent-vineyard',
    type: 'activity',
    name: 'Kent Vineyard Tour',
    tagline: "England's wine country",
    desc: "A day in Kent's wine country — outdoor, countryside, heatwave-perfect.",
    cost: 95,
    partner: null,
    icon: 'wine',
    color: 'kent-vineyard',
    imageUrl: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=1200&q=80',
  },
];
