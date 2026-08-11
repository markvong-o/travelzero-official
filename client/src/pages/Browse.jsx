import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { DestinationCard } from '../components/DestinationCard';
import './Browse.css';

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
    <div className="browse-page">
      {isAnonymous && (
        <div className="guest-banner">
          <span>👤 Browsing as Guest</span>
          <span className="session-id">Session: {sessionId?.substring(0, 8)}</span>
        </div>
      )}

      <div className="hero-section">
        <div className="hero-content">
          <h1>Discover Your Next Italian Adventure</h1>
          <p>
            Explore Italy's most enchanting destinations. Sign up for a free account and unlock
            10,000 loyalty points!
          </p>
        </div>
      </div>

      <main className="container">
        <section className="destinations-section">
          <h2>Featured Destinations</h2>
          <div className="destinations-grid">
            {DESTINATIONS.map((dest) => (
              <DestinationCard
                key={dest.id}
                destination={dest}
                onBook={handleBook}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
