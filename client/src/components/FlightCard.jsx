import React from 'react';
import { Heart, Plane, DollarSign } from 'lucide-react';
import { cn, destinationGradient } from '@/lib/utils';
import s from './FlightCard.module.css';

export function FlightCard({ flight, isFavorite = false, onFavoriteToggle, onView }) {
  const handleFavorite = (e) => {
    e.stopPropagation();
    onFavoriteToggle?.(flight, !isFavorite);
  };

  return (
    <div className={s.card} onClick={() => onView?.(flight)} role="button" tabIndex={0}>
      <div className={s.media}>
        <div className={s.fallback} style={{ background: destinationGradient(flight.color) }}>
          <img src={flight.imageUrl} alt={flight.route} className={s.photo} loading="lazy" />
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
          <p className={s.tagline}>{flight.tagline}</p>
          <h3 className={s.name}>{flight.route}</h3>
        </div>
      </div>

      <div className={s.body}>
        <div className={s.meta}>
          <span className={s.metaItem}>
            <Plane />
            {flight.airline} {flight.flightNumber}
          </span>
          <span className={s.metaItem}>
            <DollarSign />
            {flight.priceUSD}
          </span>
        </div>
        <p className={s.description}>{flight.outbound} – {flight.inbound}</p>
      </div>
    </div>
  );
}
