import React from 'react';
import { Heart, MapPin, Thermometer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, destinationGradient } from '@/lib/utils';
import s from './DestinationCard.module.css';

export function DestinationCard({ destination, onBook, isFavorite = false, onFavoriteToggle }) {
  const handleFavorite = () => {
    onFavoriteToggle?.(destination, !isFavorite);
  };

  return (
    <div className={s.card}>
      <div className={s.media}>
        {/* Destination gradient shows through until the photo loads. */}
        <div className={s.fallback} style={{ background: destinationGradient(destination.color) }}>
          <img
            src={destination.imageUrl || `/images/destinations/${destination.id}.jpg`}
            alt={destination.name}
            className={s.photo}
            loading="lazy"
          />
        </div>
        <div className={s.scrim} />
        <button
          type="button"
          onClick={handleFavorite}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          className={cn(s.fav, isFavorite ? s.favOn : s.favOff)}
        >
          <Heart className={cn(s.favIcon, isFavorite && s.favIconOn)} />
        </button>
        <div className={s.caption}>
          <p className={s.tagline}>{destination.tagline}</p>
          <h3 className={s.name}>{destination.name}</h3>
        </div>
      </div>

      <div className={s.body}>
        <div className={s.meta}>
          <span className={s.metaItem}>
            <MapPin />
            {destination.region}
          </span>
          <span className={s.metaItem}>
            <Thermometer />
            {destination.climate}
          </span>
        </div>

        <p className={s.description}>{destination.description}</p>

        <Button onClick={() => onBook(destination)} variant="brand" size="lg" className={s.cta}>
          Book This Trip
        </Button>
      </div>
    </div>
  );
}
