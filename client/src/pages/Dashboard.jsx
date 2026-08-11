import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LoyaltyMeter } from '../components/LoyaltyMeter';
import api from '../api.js';
import './Dashboard.css';

export default function Dashboard() {
  const { user, isAnonymous } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAnonymous) {
      navigate('/');
      return;
    }

    const loadProfile = async () => {
      try {
        const data = await api.getMe();
        setProfile(data);
        setItinerary(data.itinerary);
      } catch (error) {
        showToast('Failed to load profile', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [isAnonymous, navigate, showToast]);

  if (loading) {
    return (
      <main className="dashboard-page">
        <div className="loading">Loading your dashboard...</div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="dashboard-page">
        <div className="error">Failed to load profile</div>
      </main>
    );
  }

  const handleShareItinerary = async () => {
    try {
      const result = await api.shareItinerary();
      showToast(`Itinerary shared! Code: ${result.shareCode}`, 'success');
    } catch (error) {
      if (error.status === 403) {
        // Security flag detected - this is handled by SecurityInterstitial
        navigate('/security-interstitial');
      } else {
        showToast(error.error || 'Failed to share itinerary', 'error');
      }
    }
  };

  return (
    <main className="dashboard-page">
      <div className="container">
        <div className="dashboard-grid">
          <div className="sidebar">
            <div className="profile-card">
              <img
                src="https://i.pravatar.cc/150?img=47"
                alt=""
                className="profile-avatar-photo"
              />
              <h2>{profile.email.split('@')[0]}</h2>
              <p className="profile-email">{profile.email}</p>
              <p className="profile-meta">Member since {new Date(profile.createdAt).getFullYear()}</p>
            </div>

            <div className="loyalty-section">
              <LoyaltyMeter points={profile.loyaltyPoints} maxPoints={100000} />
            </div>
          </div>

          <div className="main-content">
            <section className="favorites-section">
              <h3>Your Favorites</h3>
              {profile.favorites && profile.favorites.length > 0 ? (
                <div className="favorites-list">
                  {profile.favorites.map((fav) => (
                    <div key={fav.id} className="favorite-item">
                      <div className={`fav-icon bg-${fav.color}`}></div>
                      <div className="fav-info">
                        <h4>{fav.name}</h4>
                        <p>{fav.region}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>You haven't added any favorites yet.</p>
                  <a href="/" className="btn btn-secondary">
                    Browse destinations
                  </a>
                </div>
              )}
            </section>

            <section className="itinerary-section">
              <h3>Your Itinerary</h3>
              {itinerary ? (
                <div className="itinerary-card">
                  <h4>{itinerary.title}</h4>
                  <div className="itinerary-details">
                    <div className="detail">
                      <span className="label">Duration:</span>
                      <span className="value">{itinerary.duration} days</span>
                    </div>
                    <div className="detail">
                      <span className="label">Total Cost:</span>
                      <span className="value">${itinerary.totalCost}</span>
                    </div>
                    <div className="detail">
                      <span className="label">Loyalty Points Applied:</span>
                      <span className="value">{itinerary.loyaltyPointsApplied}</span>
                    </div>
                  </div>

                  {itinerary.days && itinerary.days.length > 0 && (
                    <div className="itinerary-days">
                      <h5>Daily Plan</h5>
                      {itinerary.days.map((day) => (
                        <div key={day.day} className="day-item">
                          <span className="day-number">Day {day.day}</span>
                          <div className="day-content">
                            <h6>{day.title}</h6>
                            <ul>
                              {day.activities.map((activity, idx) => (
                                <li key={idx}>{activity}</li>
                              ))}
                            </ul>
                            <p className="day-cost">${day.estimatedCost}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {itinerary.addOns && itinerary.addOns.length > 0 && (
                    <div className="add-ons-section">
                      <h5>Add-ons</h5>
                      {itinerary.addOns.map((addOn) => (
                        <div key={addOn.id} className="add-on-item">
                          <div className="add-on-info">
                            <h6>{addOn.name}</h6>
                            <p>{addOn.description}</p>
                            <small>Booked by {addOn.bookedBy}</small>
                          </div>
                          <div className="add-on-cost">${addOn.cost}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <button onClick={handleShareItinerary} className="btn btn-primary">
                    Share Itinerary
                  </button>

                  <a
                    href="/gemini"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted"
                  >
                    ✨ Gemini noticed great weather for your trip — open Gemini
                  </a>
                </div>
              ) : (
                <div className="empty-state">
                  <p>You don't have an itinerary yet.</p>
                  <a href="/assistant" className="btn btn-secondary">
                    Plan with AI Assistant
                  </a>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
