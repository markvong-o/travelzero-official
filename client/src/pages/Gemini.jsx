import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, BadgeCheck, CheckCircle2, ChevronLeft, ChevronRight, Clock, CreditCard,
  Gift, Heart, Hotel, Info, Loader2, Lock, Plane, Plus, Sailboat, Send,
  ShieldCheck, Sparkles, Sun, Utensils, Wine, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import api from '../api.js';
import { ACTIVITIES } from '../data/activities';
import s from './Gemini.module.css';

const ACTIVITY_ICONS = { sailboat: Sailboat, utensils: Utensils, wine: Wine };

// This page simulates a *separate, external* app (Google Gemini) that has been
// delegated permission to act on TravelZero on the user's behalf. It intentionally
// has no TravelZero nav/branding. The booking calls it makes are real server calls.

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PROMPTS = [
  { id: 'plan_london', text: 'Plan me a long weekend in London next month for under $2,000, using loyalty points wherever possible' },
  { id: 'hotels', text: 'Show me London hotel deals with Thames river views' },
  { id: 'neighborhoods', text: 'What are the best markets and neighborhoods to explore in London?' },
  { id: 'activities', text: 'Book me a sunset Thames cruise and dinner in London' },
  { id: 'events', text: 'Find London events and shows during my stay' },
];

// ─── Panel components ────────────────────────────────────────────────────────

function ProfilePanel({ data }) {
  if (!data) return null;
  const { profile, delegation } = data;
  const rv = profile.recently_viewed;

  return (
    <div className={s.panel}>
      <div className={s.panelHead}>
        <BadgeCheck size={14} className={s.panelIconGreen} />
        <span className={s.panelTitle}>Profile fetched via TravelZero UCP</span>
        <span className={cn(s.panelBadge, s.panelBadgeBlue)}>delegated access</span>
      </div>
      <div className={s.panelBody}>
        <div className={s.kv}>
          <span className={s.kvKey}>loyalty_balance</span>
          <span className={s.kvVal}>
            {"10,000"} pts{' '}
            <span className={s.kvMuted}>(${"100"} value)</span>
          </span>

          <span className={s.kvKey}>interests</span>
          <span className={s.kvVal}>{profile.interests.join(', ')}</span>

          {rv && (
            <>
              <span className={s.kvKey}>recently_viewed.flights</span>
              <span className={s.kvVal}>
                <Plane size={11} className={s.kvIcon} />
                {rv.flights.route} · ${rv.flights.priceUSD} · {rv.flights.outbound} – {rv.flights.inbound}
              </span>

              <span className={s.kvKey}>recently_viewed.hotel</span>
              <span className={s.kvVal}>
                <Hotel size={11} className={s.kvIcon} />
                {rv.hotel.name}, {rv.hotel.location} · ${rv.hotel.pricePerNightUSD}/night × {rv.hotel.nights}
              </span>
            </>
          )}
        </div>
        <div className={s.delegationRow} style={{ display: 'none' }}>
          <Lock size={10} className={s.delegationIcon} />
          <code className={s.delegationText}>
            sub={delegation.actor_claim.sub.substring(0, 20)}&hellip; &nbsp;act.sub=
            {delegation.actor_claim.act.sub}
          </code>
        </div>
      </div>
    </div>
  );
}

function WeatherPanel() {
  return (
    <div className={cn(s.panel, s.panelWarm)}>
      <div className={s.panelHead}>
        <Sun size={14} className={s.panelIconWarm} />
        <span className={s.panelTitle}>London Forecast — Oct 3–7</span>
        <span className={cn(s.panelBadge, s.panelBadgeWarm)}>unexpected heatwave</span>
      </div>
      <div className={s.panelBody}>
        <div className={s.weatherMain}>
          <span className={s.weatherTemp}>27°C</span>
          <span className={s.weatherDesc}>Full sunshine, all week</span>
        </div>
        <p className={s.weatherNote}>
          London's reputation: drizzle and grey. This particular week: an unexpected heatwave.
        </p>
      </div>
    </div>
  );
}

function RecsPanel({ favoriteIds, onFavoriteToggle }) {
  return (
    <div className={s.panel}>
      <div className={s.panelHead}>
        <Sparkles size={14} className={s.panelIconAccent} />
        <span className={s.panelTitle}>Recommended — matched to profile + forecast</span>
      </div>
      <div className={s.panelBody}>
        <div className={s.recList}>
          {ACTIVITIES.map((a) => {
            const Icon = ACTIVITY_ICONS[a.icon];
            const isFavorite = favoriteIds?.has(a.id);
            return (
              <div key={a.id} className={s.recRow}>
                <span className={s.recIconWrap}>
                  <Icon size={14} />
                </span>
                <div className={s.recInfo}>
                  <span className={s.recName}>{a.name}</span>
                  {a.partner && <span className={s.recPartner}>via {a.partner}</span>}
                  <span className={s.recDesc}>{a.desc}</span>
                </div>
                <span className={s.recCost}>${a.cost}</span>
                <button
                  type="button"
                  className={cn(s.recFav, isFavorite && s.recFavOn)}
                  onClick={() => onFavoriteToggle?.(a, !isFavorite)}
                  title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart size={13} className={cn(isFavorite && s.recFavIconOn)} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BirthdayPanel() {
  return (
    <div className={cn(s.panel, s.panelAccent)}>
      <div className={s.panelHead}>
        <Gift size={14} className={s.panelIconAccent} />
        <span className={s.panelTitle}>Something I noticed</span>
      </div>
      <div className={s.panelBody}>
        <div className={s.birthdayRow}>
          <div className={s.birthdayItem}>
            <span className={s.birthdayLabel}>Trip ends</span>
            <span className={s.birthdayDate}>Oct 7</span>
          </div>
          <ArrowRight size={14} className={s.birthdayArrow} />
          <div className={s.birthdayItem}>
            <span className={s.birthdayLabel}>Your birthday</span>
            <span className={cn(s.birthdayDate, s.birthdayDateAccent)}>Oct. 8</span>
          </div>
        </div>
        <p className={s.birthdayNote}>
          Same day! The cruise runs evenings along the Thames. If you extend through the 8th,
          you'd celebrate on the water.
        </p>
      </div>
    </div>
  );
}

function ExtendOfferPanel({ onConfirm, notAuthenticated, disabled }) {
  return (
    <div className={cn(s.panel, s.panelOffer)}>
      <div className={s.panelHead}>
        <CreditCard size={14} className={s.panelIconAccent} />
        <span className={s.panelTitle}>Extended trip — cost breakdown</span>
      </div>
      <div className={s.panelBody}>
        <table className={s.offerTable}>
          <tbody>
            <tr>
              <td>Flights (Oct 3–8, updated)</td>
              <td className={s.offerAmt}>$630</td>
            </tr>
            <tr>
              <td>The Curtain Hotel (5 nights)</td>
              <td className={s.offerAmt}>$800</td>
            </tr>
            <tr>
              <td>Thames Sunset Cruise</td>
              <td className={s.offerAmt}>$230</td>
            </tr>
            <tr className={s.offerSubtotalRow}>
              <td>Subtotal</td>
              <td className={s.offerAmt}>$1,660</td>
            </tr>
            <tr className={s.offerDiscountRow}>
              <td>Loyalty points (10,000 pts)</td>
              <td className={s.offerAmt}>−$100</td>
            </tr>
            <tr className={s.offerTotalRow}>
              <td>
                <strong>Total</strong>
              </td>
              <td className={s.offerAmt}>
                <strong>$1,560</strong>
              </td>
            </tr>
          </tbody>
        </table>

        {notAuthenticated ? (
          <div className={s.authWarn}>
            Sign in to TravelZero so I can act on your behalf.{' '}
            <Link to="/login">Sign in</Link>
          </div>
        ) : (
          <Button size="sm" onClick={onConfirm} disabled={disabled} className={s.offerBtn}>
            Extend my trip and book everything
          </Button>
        )}
      </div>
    </div>
  );
}

function BookingProgressPanel({ items }) {
  return (
    <div className={s.panel}>
      <div className={s.panelHead}>
        <Clock size={14} className={s.panelIconMuted} />
        <span className={s.panelTitle}>Booking in progress</span>
      </div>
      <div className={s.panelBody}>
        <div className={s.progressList}>
          {items.map((item) => (
            <div key={item.id} className={s.progressItem}>
              {item.status === 'done' ? (
                <CheckCircle2 size={14} className={s.progressDone} />
              ) : (
                <Loader2 size={14} className={cn(s.progressLoading, 'spin')} />
              )}
              <div className={s.progressMeta}>
                <span className={s.progressLabel}>{item.label}</span>
                {item.note && <span className={s.progressNote}>{item.note}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VaultPanel({ data }) {
  const tv = data.tokenVault;
  const grantShort = tv.grantType.split(':').slice(-1)[0];
  return (
    <div className={cn(s.panel, s.panelGreen)}>
      <div className={s.panelHead}>
        <Lock size={14} className={s.panelIconGreen} />
        <span className={s.panelTitle}>Token Vault — partner credential</span>
        <span className={cn(s.panelBadge, s.panelBadgeGreen)}>no new consent</span>
      </div>
      <div className={s.panelBody}>
        <div className={s.kv}>
          <span className={s.kvKey}>partner</span>
          <span className={s.kvVal}>{tv.partner}</span>

          <span className={s.kvKey}>vault_ref</span>
          <span className={s.kvVal}>
            <code>{tv.tokenReference}</code>
          </span>

          <span className={s.kvKey}>grant_type</span>
          <span className={s.kvVal}>
            <code className={s.codeSmall}>{grantShort}</code>
          </span>

          <span className={s.kvKey}>new_consent_required</span>
          <span className={cn(s.kvVal, s.kvValGreen)}>false</span>
        </div>
        <p className={s.vaultNote}>
          TravelZero and Thames Cruises Ltd have an established trust relationship. The credential
          was stored once at integration time, so no fresh consent exchange is needed.
        </p>
      </div>
    </div>
  );
}

function ReceiptPanel({ receipt, bookings }) {
  return (
    <div className={cn(s.panel, s.panelGreen)}>
      <div className={s.panelHead}>
        <CheckCircle2 size={14} className={s.panelIconGreen} />
        <span className={s.panelTitle}>Booking confirmed</span>
        <span className={cn(s.panelBadge, s.panelBadgeGreen)}>all items booked</span>
      </div>
      <div className={s.panelBody}>
        <table className={s.offerTable}>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id}>
                <td>{b.description}</td>
                <td className={s.offerAmt}>${(b.updatedCost ?? b.cost).toLocaleString()}</td>
              </tr>
            ))}
            <tr className={s.offerSubtotalRow}>
              <td>Subtotal</td>
              <td className={s.offerAmt}>${receipt.subtotal.toLocaleString()}</td>
            </tr>
            <tr className={s.offerDiscountRow}>
              <td>Loyalty points ({receipt.loyaltyApplied.toLocaleString()} pts)</td>
              <td className={s.offerAmt}>−${receipt.loyaltyDiscount}</td>
            </tr>
            <tr className={s.offerTotalRow}>
              <td>
                <strong>Total charged</strong>
              </td>
              <td className={s.offerAmt}>
                <strong>${receipt.total.toLocaleString()}</strong>
              </td>
            </tr>
          </tbody>
        </table>
        <div className={s.receiptFooter}>
          <ShieldCheck size={13} className={s.receiptFooterIcon} />
          <span>
            Booked by <strong>{receipt.agentIdentity}</strong> on behalf of{' '}
            <strong>{receipt.delegationChain.sub}</strong>
          </span>
        </div>
        <div className={s.delegationRow} style={{ display: 'none' }}>
          <Lock size={10} className={s.delegationIcon} />
          <code className={s.delegationText}>
            sub={receipt.delegationChain.sub} &nbsp;·&nbsp; act.sub=
            {receipt.delegationChain.act.sub}
          </code>
        </div>
      </div>
    </div>
  );
}

// ─── Chat bubble ─────────────────────────────────────────────────────────────

function Bubble({ from, children }) {
  const isGemini = from === 'gemini';
  return (
    <div className={cn(s.row, isGemini ? s.rowGemini : s.rowUser)}>
      <div className={cn(s.bubble, isGemini ? s.bubbleGemini : s.bubbleUser)}>{children}</div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

const MOCK_PROFILE = {
  profile: {
    loyalty_balance: 10000,
    loyalty_value_usd: '100.00',
    interests: ['culture', 'outdoor_activities', 'local_cuisine'],
    travel_style: 'leisurely',
    recently_viewed: {
      flights: {
        route: 'JFK → LHR',
        outbound: 'Oct 3, 2026',
        inbound: 'Oct 7, 2026',
        priceUSD: 420,
        airline: 'British Airways',
        nights: 4,
      },
      hotel: {
        name: 'The Curtain Hotel',
        location: 'Shoreditch, London',
        pricePerNightUSD: 160,
        nights: 4,
      },
    },
    birthday: '2026-10-8',
  },
  delegation: {
    actor_claim: {
      sub: 'emma@demo.travelzero.com',
      act: { sub: 'agent/google-gemini' },
    },
    scopes: ['read:profile', 'read:loyalty', 'read:recently_viewed'],
    issued_to: 'agent/google-gemini',
  },
};

function mockLondonBooking(email) {
  const tvRef = 'tv_' + Math.random().toString(36).slice(2, 10);
  return {
    success: true,
    bookings: [
      { id: '1', description: 'British Airways BA 178 — JFK → LHR, Oct 3–8 (extended)', updatedCost: 630 },
      { id: '2', description: 'The Curtain Hotel, Shoreditch — 5 nights (Oct 3–8)', updatedCost: 800 },
      { id: '3', description: 'Thames Sunset Cruise — Oct 8, evening (birthday)', cost: 230 },
    ],
    receipt: {
      subtotal: 1660,
      loyaltyApplied: 10000,
      loyaltyDiscount: 100,
      total: 1560,
      currency: 'USD',
      agentIdentity: 'Google Gemini Travel Agent',
      delegationChain: {
        sub: email ?? 'emma@demo.travelzero.com',
        act: { sub: 'agent/google-gemini', name: 'Google Gemini' },
      },
      tokenVault: {
        partner: 'Thames Cruises Ltd',
        tokenReference: tvRef,
        grantType:
          'urn:auth0:params:oauth:grant-type:token-exchange:federated-connection-access-token',
        expiresIn: 3600,
        newConsentRequired: false,
      },
      timestamp: new Date().toISOString(),
    },
  };
}

export default function Gemini() {
  const { user, isAnonymous, addFavorite, removeFavorite } = useAuth();
  const favoriteIds = new Set((user?.user_metadata?.favorites ?? []).map((f) => f.id));

  const handleFavoriteToggle = async (activity, adding) => {
    if (adding) {
      await addFavorite(activity);
    } else {
      await removeFavorite(activity.id);
    }
  };

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [phase, setPhase] = useState('idle');

  // Seamless linking modal state
  const [seamlessOpen, setSeamlessOpen] = useState(false);
  const [seamlessStep, setSeamlessStep] = useState('gate1');

  // Checkout sheet state
  const [checkoutSheetOpen, setCheckoutSheetOpen] = useState(false);
  const [checkoutSession, setCheckoutSession] = useState(null);
  const [delegationGrant, setDelegationGrant] = useState(null);
  const [ucpProfile, setUcpProfile] = useState(null);

  // UI state
  const [techModalOpen, setTechModalOpen] = useState(false);
  const [chatHistoryOpen, setChatHistoryOpen] = useState(true);
  const [currentPromptId, setCurrentPromptId] = useState(null);

  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  // Show initial greeting with typing effect on mount
  useEffect(() => {
    const showGreeting = async () => {
      const msgId = 'init';
      setMessages([{ from: 'gemini', type: 'text', content: '', id: msgId }]);

      const greeting = "Hi Emma! Your TravelZero account is connected. Try asking me to plan a trip using your actual profile data.";
      const words = greeting.split(' ');
      let currentContent = '';

      for (const word of words) {
        currentContent += (currentContent ? ' ' : '') + word;
        setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, content: currentContent } : m)));
        const wordDelay = Math.random() * (120 - 50) + 50;
        await sleep(wordDelay);
      }
    };

    showGreeting();
  }, []);

  const pushMsg = useCallback((msg) => {
    const id = msg.id ?? Math.random().toString(36).slice(2);
    setMessages((prev) => [...prev, { ...msg, id }]);
    return id;
  }, []);

  const updateMsg = useCallback((id, newData) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, data: newData } : m)));
  }, []);

  const updateMsgContent = useCallback((id, newContent) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, content: newContent } : m)));
  }, []);

  // Handle checkout session creation & identity linking flow
  const handleExtend = useCallback(async () => {
    setPhase('awaiting_auth');
    try {
      const session = await api.createCheckoutSession();
      if (session.status === 'requires_escalation') {
        // Prompt user to link account
        setCheckoutSession(session);
        setSeamlessOpen(true);
        setSeamlessStep('gate1');
      } else {
        // Already authenticated, show checkout
        setCheckoutSession(session);
        setCheckoutSheetOpen(true);
      }
    } catch (err) {
      console.error('Failed to create checkout session:', err);
      pushMsg({
        from: 'gemini',
        type: 'text',
        content: 'Sorry, I hit an error booking your trip. Please try again.',
      });
      setPhase('awaiting_confirm');
    }
  }, [pushMsg]);

  // Handle seamless link completion
  const handleSeamlessComplete = useCallback(async () => {
    setSeamlessStep('linking');
    try {
      const grant = await api.identityLink();
      setDelegationGrant(grant);
      setSeamlessOpen(false);
      setSeamlessStep('gate1');
      setCheckoutSheetOpen(true);
    } catch (err) {
      console.error('Failed to link identity:', err);
      setSeamlessStep('gate1');
    }
  }, []);

  // Handle checkout confirmation
  const handleCheckoutConfirm = useCallback(async () => {
    setCheckoutSheetOpen(false);
    setPhase('responding');
    setTimeout(() => runPhase2(), 2000);
  }, []);

  const say = useCallback(async (content, delay = 900) => {
    setThinking(true);
    await sleep(delay);
    setThinking(false);

    // Create initial message with empty content
    const msgId = Math.random().toString(36).substring(7);
    pushMsg({ from: 'gemini', type: 'text', content: '', id: msgId });

    // Stream words one at a time with random delay between 50-120ms
    const words = content.split(' ');
    let currentContent = '';

    for (const word of words) {
      currentContent += (currentContent ? ' ' : '') + word;
      updateMsgContent(msgId, currentContent);
      const wordDelay = Math.random() * (120 - 50) + 50;
      await sleep(wordDelay);
    }
  }, [pushMsg, updateMsgContent]);

  const runPhase1 = useCallback(async () => {
    setPhase('running_1');

    await say(
      "Looking into it. I'm pulling your TravelZero profile first because I work from your personalized view.",
      800,
    );

    setThinking(true);
    await sleep(1400);
    let profile = { ...MOCK_PROFILE };
    // Update mock with user's actual loyalty points if authenticated
    if (user && user.loyaltyPoints !== undefined) {
      profile.profile.loyalty_balance = user.loyaltyPoints;
      profile.profile.loyalty_value_usd = (user.loyaltyPoints * 0.01).toFixed(2);
    }
    try {
      const fetchedProfile = await api.getUcpProfile();
      profile = fetchedProfile;
    } catch (err) {
      console.error('Failed to fetch UCP profile:', err);
    }
    setThinking(false);
    pushMsg({ from: 'gemini', type: 'panel', panel: 'profile', data: profile });
    await sleep(1500);

    await say(
      "You've already been circling London: flights on the 3rd through the 7th, The Curtain Hotel in Shoreditch. Let me check what that week actually looks like.",
      1000,
    );
    await sleep(1500);

    setThinking(true);
    await sleep(1100);
    setThinking(false);
    pushMsg({ from: 'gemini', type: 'panel', panel: 'weather' });
    await sleep(1500);

    await say(
      "London in October usually means drizzle and grey skies. This particular week is shaping up to be an unexpected heatwave. That shifts what makes sense for your itinerary.",
      800,
    );
    await sleep(1500);

    pushMsg({ from: 'gemini', type: 'panel', panel: 'recs' });
    await sleep(1500);

    await say(
      "Given your outdoor interests and the forecast, here are three things you hadn't been considering. Each one's matched to the weather and your profile.",
      700,
    );
    await sleep(1500);

    pushMsg({ from: 'gemini', type: 'panel', panel: 'birthday' });
    await sleep(1500);

    await say(
      "Your trip ends October 7th. Your birthday's October 8th — one day after. A sunset cruise runs evenings along the Thames. Extend through the 8th, and you'd celebrate on the water.",
      700,
    );
    await sleep(1500);

    await say(
      "Extending one night adds dinner on the Thames cruise, updated flights, and one more night at The Curtain. Total with loyalty points: $1,560. Well under $2,000.",
      600,
    );
    await sleep(1500);

    pushMsg({ from: 'gemini', type: 'panel', panel: 'offer' });
    await sleep(1000);

    setPhase('awaiting_confirm');
  }, [pushMsg]);

  const runCarouselFlow = useCallback(async (promptId) => {
    setThinking(true);
    await sleep(800);
    setThinking(false);

    let carouselItems = [];
    let intro = '';

    if (promptId === 'hotels') {
      intro = 'Here are some great options with Thames views:';
      carouselItems = [
        { id: 'hotel_1', name: 'The Curtain Hotel', location: 'Shoreditch', price: '$160/night', image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=300&q=80', rating: '4.8★' },
        { id: 'hotel_2', name: 'Mondrian London', location: 'South Bank', price: '$220/night', image: 'https://images.unsplash.com/photo-1582719522997-baf58297d7a1?w=300&q=80', rating: '4.7★' },
        { id: 'hotel_3', name: 'The Standard London', location: 'Shoreditch', price: '$195/night', image: 'https://images.unsplash.com/photo-1590381014948-43d2ace894e2?w=300&q=80', rating: '4.9★' },
      ];
    } else if (promptId === 'neighborhoods') {
      intro = 'Check out these vibrant neighborhoods:';
      carouselItems = [
        { id: 'hood_1', name: 'Shoreditch', desc: 'Trendy cafes, street art, nightlife', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=300&q=80' },
        { id: 'hood_2', name: 'Camden Market', desc: 'Vintage shops, live music, street food', image: 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=300&q=80' },
        { id: 'hood_3', name: 'South Bank', desc: 'Museums, galleries, riverside walks', image: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=300&q=80' },
      ];
    } else if (promptId === 'activities') {
      intro = 'Here are some unforgettable experiences:';
      carouselItems = [
        { id: 'act_1', name: 'Thames Sunset Cruise', desc: '2-hour evening cruise with dinner', price: '$85', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=300&q=80' },
        { id: 'act_2', name: 'West End Show', desc: 'Premium theatre experience', price: '$120', image: 'https://images.unsplash.com/photo-1503212691124-ca42da12dcd9?w=300&q=80' },
        { id: 'act_3', name: 'Tower of London Tour', desc: 'Guided historical tour', price: '$45', image: 'https://images.unsplash.com/photo-1489749798305-4fea3ba63d60?w=300&q=80' },
      ];
    } else if (promptId === 'events') {
      intro = 'Events happening during your dates:';
      carouselItems = [
        { id: 'evt_1', name: 'Frieze Art Fair', desc: 'International contemporary art', date: 'Oct 3-7', image: 'https://images.unsplash.com/photo-1579783902614-e3fb5141b0cb?w=300&q=80' },
        { id: 'evt_2', name: 'London Film Festival', desc: 'World cinema showcase', date: 'Oct 4-15', image: 'https://images.unsplash.com/photo-1489749798305-4fea3ba63d60?w=300&q=80' },
        { id: 'evt_3', name: 'Food Festival', desc: 'Street food & fine dining', date: 'Oct 6-8', image: 'https://images.unsplash.com/photo-1504674900967-a8a12ce17793?w=300&q=80' },
      ];
    }

    await say(intro, 600);
    await sleep(500);

    pushMsg({ from: 'gemini', type: 'panel', panel: 'carousel', data: { items: carouselItems, promptId } });

    setPhase('awaiting_selection');
  }, [pushMsg, say]);

  const handleCarouselSelect = useCallback((item) => {
    pushMsg({ from: 'user', type: 'text', content: `I'd like "${item.name}"` });
    setPhase('idle');
  }, [pushMsg]);

  const runPhase2 = useCallback(async () => {
    setPhase('running_2');

    pushMsg({ from: 'user', type: 'text', content: 'Yes — extend the trip and book everything.' });

    setThinking(true);
    await sleep(600);
    setThinking(false);
    pushMsg({ from: 'gemini', type: 'text', content: 'On it.' });

    await sleep(500);
    const progressId = Math.random().toString(36).slice(2);
    pushMsg({
      id: progressId,
      from: 'gemini',
      type: 'panel',
      panel: 'booking_progress',
      data: {
        items: [
          { id: 'flight', label: 'Updated return flight (Oct 3 → Oct 8)', status: 'done' },
          { id: 'hotel', label: 'The Curtain Hotel — 2 extra nights', status: 'done' },
          {
            id: 'cruise',
            label: 'Thames Sunset Cruise via Thames Cruises Ltd',
            status: 'loading',
            note: 'retrieving partner credential…',
          },
        ],
      },
    });

    await sleep(1600);

    let result = mockLondonBooking(user?.email);
    try {
      result = await api.agentBookLondon();
    } catch {}

    // Vault info shown in left sidebar, not in chat
    // (kept silent in chat, visible in technical details)

    await sleep(800);

    updateMsg(progressId, {
      items: [
        { id: 'flight', label: 'Updated return flight (Oct 3 → Oct 8)', status: 'done' },
        { id: 'hotel', label: 'The Curtain Hotel — 2 extra nights', status: 'done' },
        { id: 'cruise', label: 'Thames Sunset Cruise via Thames Cruises Ltd', status: 'done' },
      ],
    });

    await sleep(400);
    pushMsg({ from: 'gemini', type: 'panel', panel: 'receipt', data: result });

    await sleep(600);
    pushMsg({
      from: 'gemini',
      type: 'text',
      content:
        "Done. I've updated your stay at The Curtain through the 8th, confirmed the cruise for your birthday evening, and everything's locked in with one confirmation. Safe travels.",
    });

    setPhase('idle');
  }, [pushMsg, updateMsg, updateMsgContent, user, say]);

  const handleSendPrompt = useCallback((promptId, promptText) => {
    if (phase !== 'idle') return;
    pushMsg({ from: 'user', type: 'text', content: promptText });
    setCurrentPromptId(promptId);
    setPhase('responding');

    // Route to different flows based on prompt
    if (promptId === 'plan_london') {
      setTimeout(() => runPhase1(), 4500);
    } else if (promptId === 'hotels' || promptId === 'neighborhoods' || promptId === 'activities' || promptId === 'events') {
      // Carousel flow for suggestions
      setTimeout(() => runCarouselFlow(promptId), 4500);
    }
  }, [phase, pushMsg]);

  const handleCustomSend = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || phase !== 'idle') return;
    setInput('');
    pushMsg({ from: 'user', type: 'text', content: text });

    if (/london|trip|plan|weekend|travel/i.test(text)) {
      setPhase('responding');
      setTimeout(() => runPhase1(), 2500);
    } else {
      setPhase('responding');
      setTimeout(() => {
        pushMsg({
          from: 'gemini',
          type: 'text',
          content:
            "Try asking me to plan a London trip — I can show you what I can do with your profile.",
        });
        setPhase('idle');
      }, 2000);
    }
  };

  const renderPanel = (msg) => {
    switch (msg.panel) {
      case 'profile':
        return <ProfilePanel data={msg.data} />;
      case 'weather':
        return <WeatherPanel />;
      case 'recs':
        return <RecsPanel favoriteIds={favoriteIds} onFavoriteToggle={handleFavoriteToggle} />;
      case 'birthday':
        return <BirthdayPanel />;
      case 'offer':
        return (
          <ExtendOfferPanel
            onConfirm={handleExtend}
            notAuthenticated={!user || isAnonymous}
            disabled={phase !== 'awaiting_confirm'}
          />
        );
      case 'order-history':
        return <OrderHistoryPanel orders={msg.data?.orders || []} />;
      case 'weather-insights':
        return <WeatherInsightPanel />;
      case 'payment-method':
        return <PaymentMethodPanel />;
      case 'fulfillment':
        return <FulfillmentPanel />;
      case 'booking_progress':
        return <BookingProgressPanel items={msg.data.items} />;
      case 'receipt':
        return <ReceiptPanel receipt={msg.data.receipt} bookings={msg.data.bookings} />;
      case 'carousel':
        return <CarouselPanel items={msg.data.items} onSelect={handleCarouselSelect} />;
      default:
        return null;
    }
  };

  const renderMsg = (msg) => {
    if (msg.type === 'text') {
      return (
        <Bubble key={msg.id} from={msg.from}>
          {msg.content}
        </Bubble>
      );
    }
    if (msg.type === 'panel') {
      return (
        <div key={msg.id} className={cn(s.row, s.rowGemini)}>
          <div className={s.panelWrap}>{renderPanel(msg)}</div>
        </div>
      );
    }
    return null;
  };

  // SeamlessLinkModal: Multi-step gate flow for account linking
  const SeamlessLinkModal = () => (
    <Dialog open={seamlessOpen} onOpenChange={setSeamlessOpen}>
      <DialogContent className="max-w-md">
        <div className={s.slHeader}>
          <div className={s.slLogoPill}>
            <span>🤖</span>
            <span>Google Gemini</span>
          </div>
          <span className={s.slArrow}>→</span>
          <div className={s.slLogoPill}>
            <span>✈️</span>
            <span>TravelZero</span>
          </div>
        </div>

        {seamlessStep === 'gate1' && (
          <div className={s.slGate}>
            <DialogTitle>Do you have a TravelZero account?</DialogTitle>
            <div className={s.slRadioOpt} onClick={() => setSeamlessStep('gate2')}>
              <input type="radio" defaultChecked />
              <span>Yes, I have a TravelZero account</span>
            </div>
            <div className={s.slRadioOpt}>
              <input type="radio" />
              <span>No, continue as guest</span>
            </div>
          </div>
        )}

        {seamlessStep === 'gate2' && (
          <div className={s.slGate}>
            <DialogTitle>Same email as your Google account?</DialogTitle>
            <div className={s.slRadioOpt} onClick={() => setSeamlessStep('consent')}>
              <input type="radio" defaultChecked />
              <span>Yes, same email</span>
            </div>
            <div className={s.slRadioOpt}>
              <input type="radio" />
              <span>Different email</span>
            </div>
          </div>
        )}

        {seamlessStep === 'consent' && (
          <div className={s.slGate}>
            <DialogTitle>Gemini wants to access your account</DialogTitle>
            <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '1rem' }}>
              Grant Gemini permission to:
            </p>
            <div className={s.slPermRow}>
              <div className={s.slPermRowHead}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className={s.slPermIcon} style={{ background: '#10b981' }} />
                  <span className={s.slPermTitle}>Loyalty points</span>
                </div>
                <span>▼</span>
              </div>
              <div className={s.slPermDesc}>View your balance and redemption value</div>
            </div>
            <div className={s.slPermRow}>
              <div className={s.slPermRowHead}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className={s.slPermIcon} style={{ background: '#8ab4f8' }} />
                  <span className={s.slPermTitle}>Order history</span>
                </div>
              </div>
              <div className={s.slPermDesc}>See your past bookings for trip context</div>
            </div>
            <div className={s.slPermRow}>
              <div className={s.slPermRowHead}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className={s.slPermIcon} style={{ background: '#a855f7' }} />
                  <span className={s.slPermTitle}>Book trips</span>
                </div>
              </div>
              <div className={s.slPermDesc}>Create reservations on your behalf</div>
            </div>
            <div className={s.slActions}>
              <button onClick={() => setSeamlessOpen(false)} className="ghost" style={{ marginRight: 'auto' }}>
                Cancel
              </button>
              <button onClick={handleSeamlessComplete} style={{ background: '#8ab4f8', color: 'white' }}>
                Agree & Link
              </button>
            </div>
          </div>
        )}

        {seamlessStep === 'linking' && (
          <div className={s.slLinking}>
            <div style={{ animation: 'tz-spin 1s linear infinite', fontSize: '2rem', marginBottom: '1rem' }}>⟳</div>
            <p>Linking your TravelZero account…</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  // CheckoutSheet: Right-side sliding overlay for trip confirmation
  const CheckoutSheet = () => (
    <>
      <div className={cn(s.checkoutOverlay, checkoutSheetOpen && s.checkoutSheetOpen)} onClick={() => setCheckoutSheetOpen(false)} />
      <div className={cn(s.checkoutSheet, checkoutSheetOpen && s.checkoutSheetOpen)}>
        <div className={s.checkoutSheetHeader}>
          <span>Review your trip (USD)</span>
          <button onClick={() => setCheckoutSheetOpen(false)} style={{ background: 'none', border: 'none', color: '#e3e3e3', cursor: 'pointer', fontSize: '1.2rem' }}>
            ✕
          </button>
        </div>
        <div className={s.checkoutSheetBody}>
          {/* Order summary table */}
          <div style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Flights (Oct 3–8, updated)</span>
                <span style={{ color: '#8ab4f8' }}>$630</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>The Curtain Hotel (5 nights)</span>
                <span style={{ color: '#8ab4f8' }}>$800</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Thames Sunset Cruise</span>
                <span style={{ color: '#8ab4f8' }}>$230</span>
              </div>
            </div>
            <div style={{ borderTop: '1px solid #3c4043', paddingTop: '0.5rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal</span>
              <span>$1,660</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
              <span>Loyalty (10,000 pts)</span>
              <span>−$100</span>
            </div>
            <div style={{ borderTop: '1px solid rgba(16,185,129,0.3)', paddingTop: '0.5rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontWeight: '600' }}>
              <span>Total</span>
              <span style={{ color: '#8ab4f8' }}>$1,560</span>
            </div>
          </div>

          {/* Google Pay card */}
          <div className={s.payCard}>
            <div className={s.payCardChip} />
            <div className={s.payCardNumber}>•••• 4242</div>
            <div className={s.payCardBrand}>
              <span>Cardholder</span>
              <span style={{ fontWeight: 700 }}>Google Pay</span>
            </div>
          </div>

          {/* Delegation badge */}
          <div className={s.checkoutDelegBadge}>
            <span>🔒</span>
            <span>Gemini acts on your behalf · Auth0 delegation · expires 24h</span>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button onClick={() => setCheckoutSheetOpen(false)} style={{ flex: 1, background: 'transparent', border: '1px solid #3c4043', borderRadius: '8px', padding: '0.75rem', color: '#e3e3e3', cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={handleCheckoutConfirm} style={{ flex: 1, background: '#8ab4f8', border: 'none', borderRadius: '8px', padding: '0.75rem', color: '#000', fontWeight: '600', cursor: 'pointer' }}>
              Confirm & Book
            </button>
          </div>
        </div>
      </div>
    </>
  );

  // OrderHistoryPanel: Display user's past trips
  const OrderHistoryPanel = ({ orders }) => (
    <div className={s.panelWarm}>
      <div className={s.panelHead}>
        <span className={s.panelTitle}>Order history</span>
      </div>
      <div className={s.panelBody}>
        <div className={s.orderGrid}>
          {orders.map((order) => (
            <div key={order.id} className={s.orderCard}>
              <div className={s.orderCardBg} style={{ backgroundImage: `url('${order.imageUrl}')` }} />
              <div className={s.orderCardOverlay} />
              <div className={s.orderCardBody}>
                <div className={s.orderCardDest}>{order.destination}</div>
                <div className={s.orderCardDates}>
                  {order.checkIn} – {order.checkOut}
                </div>
                <div className={s.orderCardFoot}>
                  <span className={s.orderCardAmt}>${order.total}</span>
                  <span className={s.orderCardStatus}>Completed</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // WeatherInsightPanel: Enhanced weather with actionable insights
  const WeatherInsightPanel = () => (
    <div className={s.panelWarm}>
      <div className={s.panelHead}>
        <span className={s.panelIcon} style={{ fontSize: '1rem' }}>☀️</span>
        <span className={s.panelTitle}>London Oct 3–7</span>
      </div>
      <div className={s.panelBody}>
        <div className={s.weatherMain}>
          <span className={s.weatherTemp}>27°C</span>
          <span className={s.weatherDesc}>Full sunshine — heatwave forecasted</span>
        </div>
        <div className={s.weatherChips}>
          <div className={cn(s.weatherChip, s.weatherChipGreen)}>🌿 Outdoor activities unlocked</div>
          <div className={cn(s.weatherChip, s.weatherChipWarm)}>🌅 Sunset at 8:42pm — golden hour</div>
          <div className={cn(s.weatherChip, s.weatherChipPurple)}>🍇 Kent vineyard: perfect day</div>
        </div>
      </div>
    </div>
  );

  // PaymentMethodPanel: Show available payment options with Google Pay card
  const PaymentMethodPanel = () => (
    <div className={s.panel}>
      <div className={s.panelHead}>
        <span className={s.panelIcon}>💳</span>
        <span className={s.panelTitle}>Payment</span>
      </div>
      <div className={s.panelBody}>
        <div className={s.payCard}>
          <div className={s.payCardChip} />
          <div className={s.payCardNumber}>•••• 4242</div>
          <div className={s.payCardBrand}>
            <span>Visa</span>
            <span>Google Pay</span>
          </div>
        </div>
        <div className={s.loyaltyRow}>
          <span>Apply loyalty points</span>
          <span className={s.loyaltyToggleOn}>2,000 pts → −$100</span>
        </div>
      </div>
    </div>
  );

  // FulfillmentPanel: Show animated partner confirmation steps
  const FulfillmentPanel = () => {
    const [steps, setSteps] = useState([{ done: false }, { done: false }, { done: false }]);
    useEffect(() => {
      let timeout1 = setTimeout(() => setSteps([{ done: true }, { done: false }, { done: false }]), 800);
      let timeout2 = setTimeout(() => setSteps([{ done: true }, { done: true }, { done: false }]), 1600);
      let timeout3 = setTimeout(() => setSteps([{ done: true }, { done: true }, { done: true }]), 2400);
      return () => {
        clearTimeout(timeout1);
        clearTimeout(timeout2);
        clearTimeout(timeout3);
      };
    }, []);

    return (
      <div className={s.panelGreen}>
        <div className={s.panelHead}>
          <span className={s.panelIcon}>✓</span>
          <span className={s.panelTitle}>Fulfillment</span>
        </div>
        <div className={s.panelBody}>
          <div className={s.fulfillList}>
            <div className={s.fulfillItem}>
              <div className={cn(s.fulfillIcon, steps[0].done ? s.fulfillDone : s.fulfillLoading)}>
                {steps[0].done ? '✓' : '⟳'}
              </div>
              <div className={s.fulfillMeta}>
                <div className={s.fulfillLabel}>Thames Cruises Ltd received your booking</div>
              </div>
            </div>
            <div className={s.fulfillItem}>
              <div className={cn(s.fulfillIcon, steps[1].done ? s.fulfillDone : s.fulfillLoading)}>
                {steps[1].done ? '✓' : '⟳'}
              </div>
              <div className={s.fulfillMeta}>
                <div className={s.fulfillLabel}>Reservation confirmed</div>
                <div className={s.fulfillRef}>#CRUISE-cs_12345abc</div>
              </div>
            </div>
            <div className={s.fulfillItem}>
              <div className={cn(s.fulfillIcon, steps[2].done ? s.fulfillDone : s.fulfillLoading)}>
                {steps[2].done ? '✓' : '⟳'}
              </div>
              <div className={s.fulfillMeta}>
                <div className={s.fulfillLabel}>Google notified — order sync complete</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Technical details modal
  const TechnicalModal = () => (
    <Dialog open={techModalOpen} onOpenChange={setTechModalOpen}>
      <DialogContent style={{ background: '#1e1f20', border: '1px solid #3c4043', maxWidth: '520px', padding: '1.5rem', paddingRight: '2rem', showClose: true }}>
        <DialogTitle style={{ color: '#e3e3e3', margin: '0 0 1.5rem 0' }}>Technical Details</DialogTitle>

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#8ab4f8', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lock size={16} /> Delegation Chain
          </div>
          <div style={{ background: 'rgba(30,31,32,0.8)', border: '1px solid #3c4043', borderRadius: '8px', padding: '1rem', lineHeight: '1.8', fontSize: '0.85rem', fontFamily: 'ui-monospace', color: '#c8cdd2' }}>
            <div><span style={{ color: '#10b981' }}>user:</span> emma@travel.com</div>
            <div style={{ color: '#8ab4f8', margin: '0.5rem 0' }}>↓ acts via ↓</div>
            <div><span style={{ color: '#10b981' }}>agent:</span> google-gemini</div>
            <div style={{ color: '#8ab4f8', margin: '0.5rem 0' }}>↓ scopes ↓</div>
            <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.75rem', lineHeight: '1.6' }}>
              ✓ read:profile<br />✓ read:loyalty<br />✓ create:bookings
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#fb923c', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🏦 Token Vault
          </div>
          <div style={{ background: 'rgba(30,31,32,0.8)', border: '1px solid #3c4043', borderRadius: '8px', padding: '1rem', lineHeight: '1.8', fontSize: '0.85rem', fontFamily: 'ui-monospace', color: '#c8cdd2' }}>
            <div><span style={{ color: '#10b981' }}>partner:</span> Thames Cruises</div>
            <div style={{ color: '#8ab4f8', fontSize: '0.75rem', marginTop: '0.5rem' }}>
              <span style={{ color: '#10b981' }}>token:</span> tv_abc12345xyz
            </div>
            <div style={{ color: '#10b981', fontSize: '0.75rem', marginTop: '0.5rem' }}>
              ✓ no re-auth needed
            </div>
          </div>
        </div>

        {delegationGrant && (
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#10b981', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ✓ Delegation Active
            </div>
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', padding: '1rem', lineHeight: '1.8', fontSize: '0.85rem', fontFamily: 'ui-monospace', color: '#10b981' }}>
              <div><span style={{ color: '#c8cdd2' }}>grant_id:</span> {delegationGrant.grantId}</div>
              <div style={{ marginTop: '0.5rem', color: '#c8cdd2' }}>expires: 24h</div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  // Chat history sidebar
  const CarouselPanel = ({ items, onSelect }) => (
    <div className={s.carousel}>
      <div className={s.carouselInner}>
        {items.map((item) => (
          <button
            key={item.id}
            className={s.carouselItem}
            onClick={() => onSelect(item)}
          >
            {item.image && (
              <div className={s.carouselImg}>
                <img src={item.image} alt={item.name} />
              </div>
            )}
            <div className={s.carouselContent}>
              <div className={s.carouselName}>{item.name}</div>
              {item.location && <div className={s.carouselMeta}>{item.location}</div>}
              {item.desc && <div className={s.carouselMeta}>{item.desc}</div>}
              {item.date && <div className={s.carouselMeta}>{item.date}</div>}
              {item.price && <div className={s.carouselPrice}>{item.price}</div>}
              {item.rating && <div className={s.carouselRating}>{item.rating}</div>}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const ChatHistorySidebar = () => (
    <div style={{
      position: 'fixed',
      left: 0,
      top: 0,
      width: chatHistoryOpen ? '340px' : '0',
      height: '100vh',
      background: '#0f0f0f',
      borderRight: '1px solid #3c4043',
      transition: 'width 0.3s ease',
      overflow: 'hidden',
      zIndex: 25,
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ padding: '1rem', borderBottom: '1px solid #3c4043', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button style={{ background: 'none', border: 'none', color: '#8ab4f8', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: '600' }}>
          <Plus size={20} /> New chat
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
        <div style={{ fontSize: '0.8rem', color: '#5f6368', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem', padding: '0 0.5rem', fontWeight: '500' }}>
          Today
        </div>
        <div style={{ background: 'rgba(138,180,248,0.1)', border: '1px solid rgba(138,180,248,0.2)', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.5rem', cursor: 'pointer', fontSize: '0.95rem', color: '#e3e3e3', lineHeight: '1.4' }}>
          Plan me a long weekend in London
        </div>
        <div style={{ background: 'rgba(30,31,32,0.5)', border: '1px solid #3c4043', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.5rem', cursor: 'pointer', fontSize: '0.95rem', color: '#9ca3af', lineHeight: '1.4' }}>
          What flights to Paris?
        </div>
        <div style={{ background: 'rgba(30,31,32,0.5)', border: '1px solid #3c4043', borderRadius: '8px', padding: '0.75rem', cursor: 'pointer', fontSize: '0.95rem', color: '#9ca3af', lineHeight: '1.4' }}>
          Show me activities in Rome
        </div>
      </div>
    </div>
  );

  return (
    <div className={s.shell} style={{ marginLeft: chatHistoryOpen ? '340px' : '0' }}>
      <ChatHistorySidebar />
      <header className={s.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => setChatHistoryOpen(!chatHistoryOpen)} style={{ background: 'none', border: 'none', color: '#e3e3e3', cursor: 'pointer', padding: '0.5rem' }}>
            {chatHistoryOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
          <div className={s.brand}>
            <span className={s.brandChip}>
              <Sparkles size={16} />
            </span>
            <span className={s.brandName}>Gemini</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#5f6368', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Simulated demo</span>
            <button onClick={() => setTechModalOpen(true)} style={{ background: 'none', border: 'none', color: '#8ab4f8', cursor: 'pointer', padding: '0.25rem', display: 'flex' }}>
              <Info size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className={s.main}>
        {messages.map(renderMsg)}

        {thinking && (
          <div className={cn(s.row, s.rowGemini)}>
            <div className={cn(s.bubble, s.bubbleGemini)}>
              <div className={s.loadingDots}>
                <span className={s.dot} />
                <span className={s.dot} />
                <span className={s.dot} />
              </div>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </main>

      <div className={s.chips} style={{ display: phase === 'idle' ? 'block' : 'none' }}>
        <div className={s.chipsInner}>
          {PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              className={cn(s.chip, idx === 0 && s.chipFeatured)}
              onClick={() => handleSendPrompt(prompt.id, prompt.text)}
              style={{ fontSize: '0.9rem' }}
            >
              {prompt.text}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleCustomSend} className={s.composer}>
        <div className={s.composerInner}>
          <Sparkles size={16} className={s.composerIcon} />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              phase === 'idle' || phase === 'awaiting_confirm' ? 'Ask Gemini anything…' : ''
            }
            disabled={phase === 'responding'}
            className={s.composerInput}
          />
          <Button type="submit" size="icon" disabled={!input.trim() || phase === 'responding'}>
            <Send size={16} />
          </Button>
        </div>
      </form>

      {/* Modals and overlays */}
      <SeamlessLinkModal />
      <CheckoutSheet />
      <TechnicalModal />
    </div>
  );
}
