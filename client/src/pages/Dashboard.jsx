import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Sparkles, Plane, CalendarPlus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useWebAuthnPrompt, WebAuthnPrompt } from '../components/WebAuthnPrompt';
import { PasskeySection } from '../components/PasskeySection';
import { LoyaltyMeter } from '../components/LoyaltyMeter';
import { Metric } from '../components/Metric';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { destinationGradient } from '@/lib/utils';
import api from '../api.js';
import { isAuth0Configured } from '../lib/auth-config';
import s from './Dashboard.module.css';

// Anonymous users never reach this page — AppLayout redirects to /login
// before this component mounts.
export default function Dashboard() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user: authUser, removeFavorite } = useAuth();
  const securityCardRef = React.useRef(null);
  const { prompt, promptProps } = useWebAuthnPrompt();
  const [profile, setProfile] = useState(null);
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      // Real Auth0 mode: AuthContext syncs a mock session after login so api.getMe()
      // works. Seed from authUser immediately as the fast-path while that sync completes.
      if (isAuth0Configured() && !api.token) {
        if (authUser) {
          setProfile({
            email: authUser.email,
            loyaltyPoints: authUser.loyaltyPoints ?? 0,
            favorites: authUser.user_metadata?.favorites ?? [],
            createdAt: new Date().toISOString(),
          });
        }
        setLoading(false);
        return;
      }

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
  }, [authUser?.sub]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return <div className={s.state}>Loading your dashboard…</div>;
  }

  if (!profile) {
    return <div className={`${s.state} ${s.stateError}`}>Failed to load profile</div>;
  }

  const buildCalendarUrl = (itin) => {
    const start = new Date();
    start.setDate(1);
    start.setMonth(start.getMonth() + 1);
    const end = new Date(start);
    end.setDate(end.getDate() + (itin.duration || 4));

    const fmt = (d) =>
      d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const details = itin.days
      ?.map((d) => `Day ${d.day}: ${d.title} — ${d.activities?.join(', ')}`)
      .join('\n');

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: itin.title || 'Italy Trip — TravelZero',
      dates: `${fmt(start)}/${fmt(end)}`,
      details: details || '',
      location: 'Italy',
    });
    return `https://calendar.google.com/calendar/render?${params}`;
  };

  const handleShareItinerary = async () => {
    if (isAuth0Configured()) {
      showToast('Itinerary shared! Code: TZ-DEMO-2026', 'success');
      return;
    }
    try {
      const result = await api.shareItinerary();
      showToast(`Itinerary shared! Code: ${result.shareCode}`, 'success');
    } catch (error) {
      if (error.status === 403) {
        navigate('/security-interstitial');
      } else {
        showToast(error.error || 'Failed to share itinerary', 'error');
      }
    }
  };

  return (
    <>
    <div className={s.page}>
      <header className={s.header}>
        <div className={s.avatar}>{profile.email.slice(0, 2).toUpperCase()}</div>
        <div>
          <h1 className={`font-display ${s.name}`}>{profile.email.split('@')[0]}</h1>
          <p className={s.sub}>
            {profile.email} · Member since {new Date(profile.createdAt).getFullYear()}
          </p>
        </div>
      </header>

      <LoyaltyMeter points={profile.loyaltyPoints} maxPoints={100000} />

      <Card>
        <CardHeader>
          <CardTitle>Your Favorites</CardTitle>
        </CardHeader>
        <CardContent>
          {(authUser?.user_metadata?.favorites ?? profile.favorites ?? []).length > 0 ? (
            <div className={s.favGrid}>
              {(authUser?.user_metadata?.favorites ?? profile.favorites ?? []).map((fav) => (
                <div key={fav.id} className={s.favItem}>
                  <div
                    className={s.favSwatch}
                    style={{ background: destinationGradient(fav.color) }}
                  />
                  <div className={s.favInfo}>
                    <p className={s.favName}>{fav.name}</p>
                    <p className={s.favRegion}>{fav.region}</p>
                  </div>
                  <button
                    type="button"
                    className={s.favRemove}
                    onClick={async () => {
                      await removeFavorite(fav.id);
                      showToast(`${fav.name} removed from favorites`, 'info');
                    }}
                    aria-label={`Remove ${fav.name} from favorites`}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className={s.empty}>
              <Heart size={20} className={s.emptyIcon} />
              <p className={s.emptyText}>
                Select any destination with the heart icon to save it for later reference.
              </p>
              <Button asChild variant="outline">
                <Link to="/">Browse destinations</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card variant="raised">
        <CardHeader>
          <CardTitle>Your Itinerary</CardTitle>
        </CardHeader>
        <CardContent className={s.itinContent}>
          {itinerary ? (
            <>
              <div>
                <h3 className={s.itinTitle}>{itinerary.title}</h3>
                <dl className={s.metrics}>
                  {[
                    ['Duration', `${itinerary.duration} days`, 'plain'],
                    ['Total Cost', itinerary.totalCost, 'currency'],
                    ['Loyalty Points Applied', itinerary.loyaltyPointsApplied, 'plain'],
                  ].map(([label, value, format]) => (
                    <Metric
                      key={label}
                      label={label}
                      value={value}
                      format={format}
                      size="sm"
                      className={s.metricBox}
                    />
                  ))}
                </dl>
              </div>

              {itinerary.days?.length > 0 && (
                <div>
                  <h4 className={s.subhead}>Daily Plan</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead style={{ width: '4rem' }}>Day</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead style={{ width: '6rem', textAlign: 'right' }}>Est. Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itinerary.days.map((day) => (
                        <TableRow key={day.day}>
                          <TableCell style={{ fontWeight: 500 }}>{day.day}</TableCell>
                          <TableCell>
                            <p className={s.dayTitle}>{day.title}</p>
                            <ul className={s.activities}>
                              {day.activities.map((activity) => (
                                <li key={activity}>{activity}</li>
                              ))}
                            </ul>
                          </TableCell>
                          <TableCell className={s.num}>${day.estimatedCost}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {itinerary.addOns?.length > 0 && (
                <div>
                  <h4 className={s.subhead}>Add-ons</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Add-on</TableHead>
                        <TableHead>Booked by</TableHead>
                        <TableHead style={{ width: '6rem', textAlign: 'right' }}>Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itinerary.addOns.map((addOn) => (
                        <TableRow key={addOn.id}>
                          <TableCell>
                            <p className={s.addOnName}>{addOn.name}</p>
                            <p className={s.addOnDesc}>{addOn.description}</p>
                          </TableCell>
                          <TableCell className={s.bookedBy}>{addOn.bookedBy}</TableCell>
                          <TableCell className={s.num}>${addOn.cost}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className={s.actions}>
                <Button onClick={handleShareItinerary} className={s.shareBtn}>
                  Share Itinerary
                </Button>
                <Button
                  variant="outline"
                  asChild
                >
                  <a href={buildCalendarUrl(itinerary)} target="_blank" rel="noopener noreferrer" className={s.calendarBtn}>
                    <CalendarPlus size={16} />
                    Add to Google Calendar
                  </a>
                </Button>
                <a href="/gemini" target="_blank" rel="noopener noreferrer" className={s.geminiLink}>
                  <Sparkles size={16} className={s.geminiIcon} />
                  Gemini noticed great weather for your trip — open Gemini
                </a>
              </div>
            </>
          ) : (
            <div className={s.empty}>
              <Plane size={20} className={s.emptyIcon} />
              <p className={s.emptyText}>
                Describe your travel vision and the assistant will build a tailored itinerary that
                aligns with your preferences and constraints.
              </p>
              <Button asChild variant="outline">
                <Link to="/assistant">Plan with AI Assistant</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      {isAuth0Configured() && (
        <div ref={securityCardRef}>
          <Card>
            <CardHeader>
              <CardTitle>Passkeys &amp; Security</CardTitle>
            </CardHeader>
            <CardContent>
              <PasskeySection />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
    <WebAuthnPrompt {...promptProps} />
    </>
  );
}
