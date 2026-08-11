import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { DestinationCard } from '../components/DestinationCard';
import { Modal } from '../components/Modal';
import SignupModal from './SignupModal';
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
  const { isAnonymous, sessionId, signup } = useAuth();
  const { showToast } = useToast();
  const [showSignup, setShowSignup] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState(null);

  const handleBook = (destination) => {
    if (isAnonymous) {
      setSelectedDestination(destination);
      setShowSignup(true);
    } else {
      showToast('Booking feature coming soon!', 'info');
    }
  };

  const handleSignupSuccess = async () => {
    setShowSignup(false);
    showToast(
      'Welcome! You earned 10,000 loyalty points! 🎉',
      'success'
    );
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

      <Modal isOpen={showSignup} onClose={() => setShowSignup(false)} size="md">
        <SignupModal
          destination={selectedDestination}
          onSuccess={handleSignupSuccess}
          onCancel={() => setShowSignup(false)}
        />
      </Modal>
    </div>
  );
}
