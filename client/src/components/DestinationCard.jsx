import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '@/components/ui/button';

export function DestinationCard({ destination, onBook, isFavorite = false, onFavoriteToggle }) {
  const { isAnonymous } = useAuth();
  const { showToast } = useToast();
  const [favorited, setFavorited] = useState(isFavorite);

  const handleFavorite = () => {
    if (isAnonymous) {
      showToast('Sign up to add favorites', 'info');
      return;
    }
    setFavorited(!favorited);
    onFavoriteToggle?.(destination, !favorited);
  };

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
      <div className="relative aspect-video w-full overflow-hidden">
        {/* bg-{color} is a destination gradient defined in styles/theme.css —
            it shows through until the photo loads. */}
        <div className={`size-full bg-${destination.color}`}>
          <img
            src={`/images/destinations/${destination.id}.jpg`}
            alt={destination.name}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
        <button
          type="button"
          onClick={handleFavorite}
          title={favorited ? 'Remove from favorites' : 'Add to favorites'}
          className={`absolute right-4 top-4 flex size-10 items-center justify-center rounded-full border border-border text-lg shadow-sm transition-transform hover:scale-110 ${
            favorited ? 'bg-accent' : 'bg-card'
          }`}
        >
          {favorited ? '❤️' : '🤍'}
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">
            {destination.tagline}
          </p>
          <h3 className="text-xl font-semibold text-foreground">{destination.name}</h3>
        </div>

        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>📍 {destination.region}</span>
          <span>🌡️ {destination.climate}</span>
        </div>

        <p className="flex-1 text-sm leading-relaxed text-slate-700">{destination.description}</p>

        <Button onClick={() => onBook(destination)} className="mt-auto w-full" size="lg">
          Book This Trip
        </Button>
      </div>
    </div>
  );
}
