import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, CloudSun, Sailboat, Wine, Loader2, ShieldCheck, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import api from '../api.js';
import s from './Gemini.module.css';

const SUGGESTED_PROMPTS = [
  "What's the weather like in Italy?",
  "What should I pack for Italy?",
  "Can you suggest some add-ons for my trip?",
  "How can I use my loyalty points?",
];

// Mock: this page simulates a *separate, external* app (Google Gemini) that has
// been delegated permission to act on TravelZero on the user's behalf — it is not
// part of TravelZero's own product surface, which is why it deliberately doesn't
// share TravelZero's NavBar/branding (see App.jsx). The booking call it makes below
// is real (POST /api/assistant/agent-book), demonstrating genuine delegated agentic
// commerce rather than a purely client-side simulation.
const ADD_ONS = [
  {
    id: 'lake-como',
    name: 'Private Boat Day — Lake Como',
    description: 'A full day cruising Lake Como with a private skipper.',
    cost: 220,
    type: 'experience',
    icon: Sailboat,
  },
  {
    id: 'amalfi-cruise',
    name: 'Sunset Cruise - Amalfi Coast',
    description: 'Experience a magical sunset from the water',
    cost: 180,
    type: 'experience',
    icon: Sailboat,
  },
  {
    id: 'tuscany-wine',
    name: 'Outdoor Wine Tasting — Tuscany',
    description: 'An al fresco tasting through Chianti\'s countryside vineyards.',
    cost: 95,
    type: 'experience',
    icon: Wine,
  },
];

function Bubble({ from, children }) {
  const isGemini = from === 'gemini';
  return (
    <div className={cn(s.row, isGemini ? s.rowGemini : s.rowUser)}>
      <div className={cn(s.bubble, isGemini ? s.bubbleGemini : s.bubbleUser)}>{children}</div>
    </div>
  );
}

export default function Gemini() {
  const { user, isAnonymous } = useAuth();
  const [messages, setMessages] = useState([
    {
      from: 'gemini',
      content: "Hi Emma, I've been tracking your upcoming Italy trip. Ask me anything — try \"what's the weather like?\"",
    },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  // Keyed by add-on id, since any of the three suggestions can be booked independently.
  const [bookings, setBookings] = useState({});
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showSuggestions, bookings]);

  const pushMessage = (msg) => setMessages((prev) => [...prev, msg]);

  const respondToWeather = () => {
    pushMessage({
      from: 'gemini',
      content:
        "It's looking exceptionally nice for your dates in Italy: sunny and mid-70s the whole trip. Given the forecast, a few outdoor experiences would pair really well with your itinerary.",
    });
    setShowSuggestions(true);
  };

  const respondToPacking = () => {
    pushMessage({
      from: 'gemini',
      content:
        "For Italy in summer, reach for light linen layers, comfortable walking shoes, and a scarf that covers both style and church dress codes. Sunscreen and a refillable water bottle are non-negotiable. A carry-on keeps things streamlined if you're moving between cities.",
    });
  };

  const respondToAddOns = () => {
    pushMessage({
      from: 'gemini',
      content:
        "Your Italy itinerary is looking solid. Given the forecast, a few outdoor experiences would pair really well with your dates and weather window. I've pulled the ones that fit.",
    });
    setShowSuggestions(true);
  };

  const respondToLoyalty = () => {
    pushMessage({
      from: 'gemini',
      content:
        "I can see your TravelZero loyalty balance, and you have enough points to meaningfully offset one of these experiences. The Tuscany wine tasting at $95 would use the fewest points if you'd rather stretch them further.",
    });
    setShowSuggestions(true);
  };

  const respondToTrip = () => {
    pushMessage({
      from: 'gemini',
      content:
        "I'm keeping an eye on your Italy trip, and the forecast is looking excellent for your dates. Want me to suggest some experiences that would work well with the weather?",
    });
  };

  const send = (text) => {
    if (!text || thinking) return;
    pushMessage({ from: 'user', content: text });
    setInput('');
    setThinking(true);

    setTimeout(() => {
      setThinking(false);
      if (/weather|forecast/i.test(text)) {
        respondToWeather();
      } else if (/pack|outfit|luggage|clothes|bring/i.test(text)) {
        respondToPacking();
      } else if (/suggest|add.?on|experience|activity/i.test(text)) {
        respondToAddOns();
      } else if (/loyalty|points|reward/i.test(text)) {
        respondToLoyalty();
      } else if (/itinerary|trip|plan|schedule/i.test(text)) {
        respondToTrip();
      } else {
        pushMessage({
          from: 'gemini',
          content: "I'm mainly keeping an eye on your Italy trip right now. Try asking about the weather, what to pack, or whether I can suggest any add-ons.",
        });
      }
    }, 700);
  };

  const handleSend = (e) => {
    e.preventDefault();
    send(input.trim());
  };

  const handleBookAddOn = async (addOn) => {
    pushMessage({ from: 'user', content: `Let's do "${addOn.name}" — it's almost my birthday, might as well treat myself!` });
    setBookings((prev) => ({ ...prev, [addOn.id]: { status: 'booking', receipt: null, error: null } }));

    if (isAnonymous || !user) {
      setBookings((prev) => ({ ...prev, [addOn.id]: { status: 'error', receipt: null, error: 'not_authenticated' } }));
      pushMessage({
        from: 'gemini',
        content: "I don't have permission to book that yet — you'll need to sign in to TravelZero first so I can act on your behalf.",
      });
      return;
    }

    try {
      const result = await api.agentBook('gemini', {
        name: addOn.name,
        description: addOn.description,
        cost: addOn.cost,
        type: addOn.type,
      });
      setBookings((prev) => ({ ...prev, [addOn.id]: { status: 'success', receipt: result.bookingReceipt, error: null } }));
      pushMessage({
        from: 'gemini',
        content: `Done — I booked "${addOn.name}" on TravelZero for you. Happy birthday! 🎉`,
      });
    } catch (error) {
      setBookings((prev) => ({ ...prev, [addOn.id]: { status: 'error', receipt: null, error: error?.error || 'booking_failed' } }));
      pushMessage({
        from: 'gemini',
        content: "That booking didn't go through on TravelZero's end — mind trying again from there directly?",
      });
    }
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
        {messages.map((msg, idx) => (
          <Bubble key={idx} from={msg.from}>
            {msg.content}
          </Bubble>
        ))}

        {thinking && (
          <Bubble from="gemini">
            <Loader2 size={16} className="spin" />
          </Bubble>
        )}

        {showSuggestions && (
          <div className={s.suggestions}>
            {ADD_ONS.map((addOn) => {
              const Icon = addOn.icon;
              const state = bookings[addOn.id] || { status: 'idle' };
              const isBooked = state.status === 'success';
              return (
                <div key={addOn.id} className={s.suggestion}>
                  <div className={s.suggestionTop}>
                    <div className={s.suggestionInfo}>
                      <span className={s.suggestionIcon}>
                        <Icon size={16} />
                      </span>
                      <div>
                        <p className={s.suggestionName}>{addOn.name}</p>
                        <p className={s.suggestionDesc}>{addOn.description}</p>
                      </div>
                    </div>
                    <div className={s.suggestionRight}>
                      <span className={s.price}>${addOn.cost}</span>
                      <Button
                        size="sm"
                        variant={isBooked ? 'secondary' : 'default'}
                        disabled={state.status === 'booking' || isBooked}
                        onClick={() => handleBookAddOn(addOn)}
                      >
                        {isBooked ? 'Booked' : 'Book this for me'}
                      </Button>
                    </div>
                  </div>

                  {isBooked && state.receipt && (
                    <div className={s.receipt}>
                      <div className={s.receiptHead}>
                        <span className={s.receiptHeadChip}>
                          <ShieldCheck size={14} />
                        </span>
                        Delegated booking authorized via TravelZero
                      </div>
                      <dl className={s.receiptGrid}>
                        {[
                          ['agent', state.receipt.agentIdentity],
                          ['delegatedScope', state.receipt.delegatedScope.join(', ')],
                          [
                            'actorClaim',
                            `sub=${state.receipt.actorClaim.sub.substring(0, 10)}… act.sub=${state.receipt.actorClaim.act.sub}`,
                          ],
                          [
                            'tokenVault',
                            `${state.receipt.tokenVault.tokenReference} (expires in ${state.receipt.tokenVault.expiresIn}s)`,
                          ],
                          ['mcp.tool', state.receipt.mcp.toolInvoked],
                        ].map(([k, v]) => (
                          <React.Fragment key={k}>
                            <dt className={s.receiptKey}>{k}</dt>
                            <dd className={s.receiptVal}>{v}</dd>
                          </React.Fragment>
                        ))}
                      </dl>
                    </div>
                  )}

                  {state.status === 'error' && state.error === 'not_authenticated' && (
                    <div className={s.authWarn}>
                      Sign in to TravelZero, then come back and I can book on your behalf.{' '}
                      <Link to="/login">Open TravelZero login</Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div ref={endRef} />
      </main>

      <div className={s.chips}>
        <div className={s.chipsInner}>
          {SUGGESTED_PROMPTS.map((p) => (
            <button key={p} type="button" className={s.chip} onClick={() => send(p)}>
              {p}
            </button>
          ))}
        </div>
      </div>
      <form onSubmit={handleSend} className={s.composer}>
        <div className={s.composerInner}>
          <CloudSun size={16} className={s.composerIcon} />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Gemini anything…"
            className={s.composerInput}
          />
          <Button type="submit" size="icon" disabled={!input.trim() || thinking}>
            <Send size={16} />
          </Button>
        </div>
      </form>
    </div>
  );
}
