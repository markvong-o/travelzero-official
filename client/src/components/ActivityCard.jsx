import React from 'react';
import { Heart, DollarSign, Handshake } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { cn, destinationGradient } from '@/lib/utils';
import s from './ActivityCard.module.css';

export function ActivityCard({ activity, isFavorite = false, onFavoriteToggle }) {
  const { isAnonymous } = useAuth();
  const { showToast } = useToast();

  const handleFavorite = () => {
    onFavoriteToggle?.(activity, !isFavorite);
    if (isAnonymous && !isFavorite) {
      showToast(`${activity.name} saved — sign up to keep your favorites`, 'info');
    }
  };

  return (
    <div className={s.card}>
      <div className={s.media}>
        <div className={s.fallback} style={{ background: destinationGradient(activity.color) }}>
          <img
            src={activity.imageUrl}
            alt={activity.name}
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
          <p className={s.tagline}>{activity.tagline}</p>
          <h3 className={s.name}>{activity.name}</h3>
        </div>
      </div>

      <div className={s.body}>
        <div className={s.meta}>
          <span className={s.metaItem}>
            <DollarSign />
            {activity.cost}
          </span>
          {activity.partner && (
            <span className={s.metaItem}>
              <Handshake />
              via {activity.partner}
            </span>
          )}
        </div>

        <p className={s.description}>{activity.desc}</p>
      </div>
    </div>
  );
}
