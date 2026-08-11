import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { DestinationCard } from '../components/DestinationCard';

const DESTINATIONS = [
  {
    id: 'rome',
    name: 'Rome',
    region: 'Lazio',
    tagline: 'The Eternal City',
    climate: 'Warm & Sunny',
    color: 'rome',
    description:
      'Explore ancient history, iconic architecture, and world-class art in Italy\'s capital. From the Colosseum to the Vatican, Rome is a timeless masterpiece.',
  },
  {
    id: 'amalfi',
    name: 'Amalfi Coast',
    region: 'Campania',
    tagline: 'Cliff-Hanging Views',
    climate: 'Mediterranean',
    color: 'amalfi',
    description:
      'Experience dramatic coastal scenery, charming villages, and fresh seafood along one of Europe\'s most stunning coastlines.',
  },
  {
    id: 'tuscany',
    name: 'Tuscany',
    region: 'Toscana',
    tagline: 'Rolling Hills & Wine',
    climate: 'Warm & Breezy',
    color: 'tuscany',
    description:
      'Discover Renaissance art, rolling vineyards, medieval towns, and authentic Italian cuisine in the heart of Tuscany.',
  },
  {
    id: 'como',
    name: 'Lake Como',
    region: 'Lombardy',
    tagline: 'Alpine Elegance',
    climate: 'Cool & Serene',
    color: 'como',
    description:
      'Relax by Europe\'s deepest lake surrounded by Alpine mountains, charming waterfront towns, and luxury villas.',
  },
];

export default function Browse() {
  const { isAnonymous, sessionId } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleBook = (destination) => {
    if (isAnonymous) {
      navigate(`/signup?destination=${destination.id}&returnTo=${encodeURIComponent('/')}`);
    } else {
      showToast('Booking feature coming soon!', 'info');
    }
  };

  return (
    <div className="flex-1">
      {isAnonymous && (
        <div className="flex flex-col items-center gap-4 border-b border-border bg-card px-6 py-4 text-sm text-slate-700 md:flex-row md:justify-between md:gap-0">
          <span>👤 Browsing as Guest</span>
          <span className="rounded-full border border-border bg-muted px-3 py-1 font-mono font-medium">
            Session: {sessionId?.substring(0, 8)}
          </span>
        </div>
      )}

      <div className="relative flex min-h-[360px] items-end justify-center bg-[url('/images/hero-italy.jpg')] bg-cover bg-[center_65%] bg-no-repeat px-6 py-16 text-white md:min-h-[440px]">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/75 to-transparent to-60%" />
        <div className="relative z-10 max-w-2xl text-center">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Discover Your Next Italian Adventure
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/95">
            Explore Italy's most enchanting destinations. Sign up for a free account and unlock
            10,000 loyalty points!
          </p>
        </div>
      </div>

      <main className="mx-auto w-full max-w-7xl px-6 py-16">
        <h2 className="mb-8 text-2xl font-semibold text-foreground">Featured Destinations</h2>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {DESTINATIONS.map((dest) => (
            <DestinationCard key={dest.id} destination={dest} onBook={handleBook} />
          ))}
        </div>
      </main>
    </div>
  );
}
