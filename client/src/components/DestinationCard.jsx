import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './DestinationCard.css';

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
    <div className="destination-card">
      <div className="destination-image">
        <div className={`image-placeholder bg-${destination.color}`}>
          <img
            src={`/images/destinations/${destination.id}.jpg`}
            alt={destination.name}
            className="destination-photo"
            loading="lazy"
          />
        </div>
        <button
          className={`favorite-btn ${favorited ? 'favorited' : ''}`}
          onClick={handleFavorite}
          title={favorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          {favorited ? '❤️' : '🤍'}
        </button>
      </div>

      <div className="destination-content">
        <h3>{destination.name}</h3>
        <p className="destination-tagline">{destination.tagline}</p>

        <div className="destination-meta">
          <span className="meta-item">📍 {destination.region}</span>
          <span className="meta-item">🌡️ {destination.climate}</span>
        </div>

        <p className="destination-description">{destination.description}</p>

        <button onClick={() => onBook(destination)} className="btn btn-primary btn-block">
          Book This Trip
        </button>
      </div>
    </div>
  );
}
