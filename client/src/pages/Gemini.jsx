import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, BadgeCheck, CheckCircle2, Clock, CreditCard,
  Gift, Hotel, Loader2, Lock, Plane, Sailboat, Send,
  ShieldCheck, Sparkles, Sun, Utensils, Wine,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import api from '../api.js';
import s from './Gemini.module.css';

// This page simulates a *separate, external* app (Google Gemini) that has been
// delegated permission to act on TravelZero on the user's behalf. It intentionally
// has no TravelZero nav/branding. The booking calls it makes are real server calls.

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const LONDON_PROMPT =
  'Plan me a long weekend in London next month for under $2,000, using loyalty points wherever possible';

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
            {profile.loyalty_balance.toLocaleString()} pts{' '}
            <span className={s.kvMuted}>(${profile.loyalty_value_usd} value)</span>
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
        <div className={s.delegationRow}>
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
        <span className={s.panelTitle}>London Forecast — Sep 5–11</span>
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

const ADD_ONS = [
  {
    id: 'thames-cruise',
    name: 'Thames Sunset Cruise',
    desc: 'A sunset cruise along the Thames — ideal for a warm evening.',
    cost: 230,
    Icon: Sailboat,
    partner: 'Thames Cruises Ltd',
  },
  {
    id: 'rooftop-dinner',
    name: 'Rooftop Terrace Dinner — Sky Garden',
    desc: 'Panoramic views, warm evening air, 35 floors up.',
    cost: 85,
    Icon: Utensils,
    partner: null,
  },
  {
    id: 'kent-vineyard',
    name: 'Kent Vineyard Tour',
    desc: "A day in Kent's wine country — outdoor, countryside, heatwave-perfect.",
    cost: 95,
    Icon: Wine,
    partner: null,
  },
];

function RecsPanel() {
  return (
    <div className={s.panel}>
      <div className={s.panelHead}>
        <Sparkles size={14} className={s.panelIconAccent} />
        <span className={s.panelTitle}>Recommended — matched to profile + forecast</span>
      </div>
      <div className={s.panelBody}>
        <div className={s.recList}>
          {ADD_ONS.map((a) => (
            <div key={a.id} className={s.recRow}>
              <span className={s.recIconWrap}>
                <a.Icon size={14} />
              </span>
              <div className={s.recInfo}>
                <span className={s.recName}>{a.name}</span>
                {a.partner && <span className={s.recPartner}>via {a.partner}</span>}
                <span className={s.recDesc}>{a.desc}</span>
              </div>
              <span className={s.recCost}>${a.cost}</span>
            </div>
          ))}
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
            <span className={s.birthdayDate}>Sep 9</span>
          </div>
          <ArrowRight size={14} className={s.birthdayArrow} />
          <div className={s.birthdayItem}>
            <span className={s.birthdayLabel}>Your birthday</span>
            <span className={cn(s.birthdayDate, s.birthdayDateAccent)}>Sep 11</span>
          </div>
        </div>
        <p className={s.birthdayNote}>
          Two-day gap. The cruise runs evenings along the Thames. If you extend through the 11th,
          you'd be on it for your birthday.
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
              <td>Flights (Sep 5–11, updated)</td>
              <td className={s.offerAmt}>$630</td>
            </tr>
            <tr>
              <td>The Curtain Hotel (6 nights)</td>
              <td className={s.offerAmt}>$960</td>
            </tr>
            <tr>
              <td>Thames Sunset Cruise</td>
              <td className={s.offerAmt}>$230</td>
            </tr>
            <tr className={s.offerSubtotalRow}>
              <td>Subtotal</td>
              <td className={s.offerAmt}>$1,820</td>
            </tr>
            <tr className={s.offerDiscountRow}>
              <td>Loyalty points (2,000 pts)</td>
              <td className={s.offerAmt}>−$100</td>
            </tr>
            <tr className={s.offerTotalRow}>
              <td>
                <strong>Total</strong>
              </td>
              <td className={s.offerAmt}>
                <strong>$1,720</strong>
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
        <div className={s.delegationRow}>
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
        outbound: 'Sep 5, 2026',
        inbound: 'Sep 9, 2026',
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
    birthday: '2026-09-11',
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
      { id: '1', description: 'British Airways BA 178 — JFK → LHR, Sep 5–11 (extended)', updatedCost: 630 },
      { id: '2', description: 'The Curtain Hotel, Shoreditch — 6 nights (Sep 5–11)', updatedCost: 960 },
      { id: '3', description: 'Thames Sunset Cruise — Sep 10, evening', cost: 230 },
    ],
    receipt: {
      subtotal: 1820,
      loyaltyApplied: 2000,
      loyaltyDiscount: 100,
      total: 1720,
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
  const { user, isAnonymous } = useAuth();

  const [messages, setMessages] = useState([
    {
      id: 'init',
      from: 'gemini',
      type: 'text',
      content:
        "Hi Emma — your TravelZero account is connected. Try asking me to plan a trip using your actual profile data.",
    },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [phase, setPhase] = useState('idle');

  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const pushMsg = useCallback((msg) => {
    const id = msg.id ?? Math.random().toString(36).slice(2);
    setMessages((prev) => [...prev, { ...msg, id }]);
    return id;
  }, []);

  const updateMsg = useCallback((id, newData) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, data: newData } : m)));
  }, []);

  const runPhase1 = useCallback(async () => {
    setPhase('running_1');

    const say = async (content, delay = 900) => {
      setThinking(true);
      await sleep(delay);
      setThinking(false);
      pushMsg({ from: 'gemini', type: 'text', content });
    };

    await say(
      "Looking into it. I'm pulling your TravelZero profile first because I work from your actual data, not guesses.",
      800,
    );

    setThinking(true);
    await sleep(1400);
    let profile = MOCK_PROFILE;
    try {
      profile = await api.getUcpProfile();
    } catch {}
    setThinking(false);
    pushMsg({ from: 'gemini', type: 'panel', panel: 'profile', data: profile });

    await say(
      "You've already been circling London: flights on the 5th through the 9th, The Curtain Hotel in Shoreditch. Let me check what that week actually looks like.",
      1000,
    );

    setThinking(true);
    await sleep(1100);
    setThinking(false);
    pushMsg({ from: 'gemini', type: 'panel', panel: 'weather' });

    await say(
      "London in September usually means drizzle and grey skies. This particular week is shaping up to be an unexpected heatwave. That shifts what makes sense for your itinerary.",
      800,
    );

    await sleep(400);
    pushMsg({ from: 'gemini', type: 'panel', panel: 'recs' });

    await say(
      "Given your outdoor interests and the forecast, here are three things you hadn't been considering. Each one's matched to the weather and your profile.",
      700,
    );

    await sleep(600);
    pushMsg({ from: 'gemini', type: 'panel', panel: 'birthday' });

    await say(
      "Your trip ends September 9th, two days before your birthday. A sunset cruise runs evenings along the Thames. Extend through the 11th, and you'd be on it for your birthday.",
      700,
    );

    await say(
      "Extending adds two nights at The Curtain, an updated return flight, and the cruise. Total with loyalty points: $1,720. Still under $2,000.",
      600,
    );

    pushMsg({ from: 'gemini', type: 'panel', panel: 'offer' });

    setPhase('awaiting_confirm');
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
          { id: 'flight', label: 'Updated return flight (Sep 5 → Sep 11)', status: 'done' },
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

    pushMsg({ from: 'gemini', type: 'panel', panel: 'vault', data: result.receipt });

    await sleep(800);

    updateMsg(progressId, {
      items: [
        { id: 'flight', label: 'Updated return flight (Sep 5 → Sep 11)', status: 'done' },
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
        "Done. I've updated your stay at The Curtain through the 11th, confirmed the cruise for your birthday evening, and everything's locked in with one confirmation. Safe travels.",
    });

    setPhase('complete');
  }, [pushMsg, updateMsg, user]);

  const handleSendLondon = useCallback(() => {
    if (phase !== 'idle') return;
    pushMsg({ from: 'user', type: 'text', content: LONDON_PROMPT });
    runPhase1();
  }, [phase, pushMsg, runPhase1]);

  const handleCustomSend = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || phase !== 'idle') return;
    setInput('');
    if (/london|trip|plan|weekend|travel/i.test(text)) {
      pushMsg({ from: 'user', type: 'text', content: text });
      runPhase1();
    } else {
      pushMsg({ from: 'user', type: 'text', content: text });
      setTimeout(() => {
        pushMsg({
          from: 'gemini',
          type: 'text',
          content:
            "Try the London planning prompt above — that's where I can show you what I can do with your profile.",
        });
      }, 700);
    }
  };

  const renderPanel = (msg) => {
    switch (msg.panel) {
      case 'profile':
        return <ProfilePanel data={msg.data} />;
      case 'weather':
        return <WeatherPanel />;
      case 'recs':
        return <RecsPanel />;
      case 'birthday':
        return <BirthdayPanel />;
      case 'offer':
        return (
          <ExtendOfferPanel
            onConfirm={runPhase2}
            notAuthenticated={!user || isAnonymous}
            disabled={phase !== 'awaiting_confirm'}
          />
        );
      case 'booking_progress':
        return <BookingProgressPanel items={msg.data.items} />;
      case 'vault':
        return <VaultPanel data={msg.data} />;
      case 'receipt':
        return <ReceiptPanel receipt={msg.data.receipt} bookings={msg.data.bookings} />;
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

  return (
    <div className={s.shell}>
      <header className={s.header}>
        <div className={s.brand}>
          <span className={s.brandChip}>
            <Sparkles size={16} />
          </span>
          <span className={s.brandName}>Gemini</span>
        </div>
        <Badge variant="outline" className={s.headerBadge}>
          Simulated external app — not affiliated with TravelZero
        </Badge>
      </header>

      <main className={s.main}>
        {messages.map(renderMsg)}

        {thinking && (
          <div className={cn(s.row, s.rowGemini)}>
            <div className={cn(s.bubble, s.bubbleGemini)}>
              <Loader2 size={16} className="spin" />
            </div>
          </div>
        )}

        <div ref={endRef} />
      </main>

      {phase === 'idle' && (
        <div className={s.chips}>
          <div className={s.chipsInner}>
            <button type="button" className={cn(s.chip, s.chipFeatured)} onClick={handleSendLondon}>
              {LONDON_PROMPT}
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleCustomSend} className={s.composer}>
        <div className={s.composerInner}>
          <Sparkles size={16} className={s.composerIcon} />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              phase === 'idle' ? 'Ask Gemini anything, or use the prompt above…' : ''
            }
            disabled={phase !== 'idle'}
            className={s.composerInput}
          />
          <Button type="submit" size="icon" disabled={!input.trim() || phase !== 'idle'}>
            <Send size={16} />
          </Button>
        </div>
      </form>
    </div>
  );
}
