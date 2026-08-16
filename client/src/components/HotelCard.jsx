import React from 'react';
import { Heart, Building2, DollarSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { cn, destinationGradient } from '@/lib/utils';
import s from './HotelCard.module.css';

export function HotelCard({ hotel, isFavorite = false, onFavoriteToggle, onView }) {
  const { isAnonymous } = useAuth();
  const { showToast } = useToast();

  const handleFavorite = (e) => {
    e.stopPropagation();
    onFavoriteToggle?.(hotel, !isFavorite);
    if (isAnonymous && !isFavorite) {
      showToast(`${hotel.name} saved — sign up to keep your favorites`, 'info');
    }
  };

  return (
    <div className={s.card} onClick={() => onView?.(hotel)} role="button" tabIndex={0}>
      <div className={s.media}>
        <div className={s.fallback} style={{ background: destinationGradient(hotel.color) }}>
          <img src={hotel.imageUrl} alt={hotel.name} className={s.photo} loading="lazy" />
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
          <p className={s.tagline}>{hotel.tagline}</p>
          <h3 className={s.name}>{hotel.name}</h3>
        </div>
      </div>

      <div className={s.body}>
        <div className={s.meta}>
          <span className={s.metaItem}>
            <Building2 />
            {hotel.location}
          </span>
          <span className={s.metaItem}>
            <DollarSign />
            {hotel.pricePerNightUSD}/night
          </span>
        </div>
        <p className={s.description}>{hotel.desc}</p>
      </div>
    </div>
  );
}
