import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Sparkles, Plane } from 'lucide-react';
import { useToast } from '../context/ToastContext';
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
import api from '../api.js';

// Anonymous users never reach this page — AppLayout redirects to /login
// before this component mounts.
export default function Dashboard() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, [showToast]);

  if (loading) {
    return (
      <div className="p-8 text-sm text-muted-foreground">Loading your dashboard…</div>
    );
  }

  if (!profile) {
    return <div className="p-8 text-sm text-destructive">Failed to load profile</div>;
  }

  const handleShareItinerary = async () => {
    try {
      const result = await api.shareItinerary();
      showToast(`Itinerary shared! Code: ${result.shareCode}`, 'success');
    } catch (error) {
      if (error.status === 403) {
        // Security flag detected — SecurityInterstitial owns the step-up flow.
        navigate('/security-interstitial');
      } else {
        showToast(error.error || 'Failed to share itinerary', 'error');
      }
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-6 lg:p-10">
      <header className="flex flex-wrap items-center gap-4">
        <img
          src="https://i.pravatar.cc/150?img=47"
          alt=""
          className="size-14 rounded-full object-cover ring-1 ring-border"
        />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {profile.email.split('@')[0]}
          </h1>
          <p className="text-sm text-muted-foreground">
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
          {profile.favorites?.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {profile.favorites.map((fav) => (
                <div
                  key={fav.id}
                  className="flex items-center gap-3 rounded-lg bg-muted/60 p-3"
                >
                  <div className={`size-10 shrink-0 rounded-md bg-${fav.color}`} />
                  <div>
                    <p className="font-medium text-foreground">{fav.name}</p>
                    <p className="text-xs text-muted-foreground">{fav.region}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-start gap-3 rounded-lg bg-muted/60 p-6">
              <Heart className="size-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
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
        <CardContent className="flex flex-col gap-6">
          {itinerary ? (
            <>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{itinerary.title}</h3>
                <dl className="mt-3 grid gap-3 sm:grid-cols-3">
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
                      className="rounded-lg bg-muted/60 px-3 py-2"
                    />
                  ))}
                </dl>
              </div>

              {itinerary.days?.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-foreground">Daily Plan</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Day</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead className="w-24 text-right">Est. Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itinerary.days.map((day) => (
                        <TableRow key={day.day}>
                          <TableCell className="font-medium">{day.day}</TableCell>
                          <TableCell>
                            <p className="font-medium text-foreground">{day.title}</p>
                            <ul className="mt-1 list-inside list-disc text-xs text-muted-foreground">
                              {day.activities.map((activity) => (
                                <li key={activity}>{activity}</li>
                              ))}
                            </ul>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            ${day.estimatedCost}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {itinerary.addOns?.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-foreground">Add-ons</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Add-on</TableHead>
                        <TableHead>Booked by</TableHead>
                        <TableHead className="w-24 text-right">Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itinerary.addOns.map((addOn) => (
                        <TableRow key={addOn.id}>
                          <TableCell>
                            <p className="font-medium text-foreground">{addOn.name}</p>
                            <p className="text-xs text-muted-foreground">{addOn.description}</p>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {addOn.bookedBy}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">${addOn.cost}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <Button onClick={handleShareItinerary} className="self-start">
                  Share Itinerary
                </Button>
                <a
                  href="/gemini"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted"
                >
                  <Sparkles className="size-4 shrink-0 text-accent" />
                  Gemini noticed great weather for your trip — open Gemini
                </a>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-start gap-3 rounded-lg bg-muted/60 p-6">
              <Plane className="size-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Describe your travel vision and the assistant will build a tailored itinerary
                that aligns with your preferences and constraints.
              </p>
              <Button asChild variant="outline">
                <Link to="/assistant">Plan with AI Assistant</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
