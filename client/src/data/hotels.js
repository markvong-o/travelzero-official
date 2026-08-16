// Shared hotel catalog. The 'the-curtain' entry matches the hotel already
// referenced in server/store.js's recentlyViewed data for narrative consistency
// with the Gemini demo (Emma's London trip). At least 2 distinct hotels exist
// here since the narrative has Emma "favorited two hotels."
export const HOTELS = [
  {
    id: 'the-curtain',
    type: 'hotel',
    destination: 'london',
    name: 'The Curtain Hotel',
    location: 'Shoreditch, London',
    tagline: 'Boutique, nightlife-adjacent',
    desc: 'A design-forward boutique hotel in the heart of Shoreditch, steps from East London\'s best bars and restaurants.',
    pricePerNightUSD: 160,
    checkIn: '2026-09-05',
    checkOut: '2026-09-09',
    color: 'london',
    imageUrl: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=1200&q=80',
  },
  {
    id: 'zetter-townhouse',
    type: 'hotel',
    destination: 'london',
    name: 'The Zetter Townhouse',
    location: 'Clerkenwell, London',
    tagline: 'Eccentric, cocktail bar downstairs',
    desc: 'A quirky, antique-filled townhouse hotel with a celebrated cocktail lounge on the ground floor.',
    pricePerNightUSD: 195,
    checkIn: '2026-09-05',
    checkOut: '2026-09-09',
    color: 'rooftop-dinner',
    imageUrl: 'https://images.unsplash.com/photo-1519449556851-5720b33024e7?w=1200&q=80',
  },
  {
    id: 'the-savoy',
    type: 'hotel',
    destination: 'london',
    name: 'The Savoy',
    location: 'Strand, London',
    tagline: 'Classic luxury, riverside',
    desc: 'An iconic riverside institution overlooking the Thames, blending Edwardian grandeur with modern service.',
    pricePerNightUSD: 480,
    checkIn: '2026-09-05',
    checkOut: '2026-09-09',
    color: 'thames-cruise',
    imageUrl: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&q=80',
  },
];
