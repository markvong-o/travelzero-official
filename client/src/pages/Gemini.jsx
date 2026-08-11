import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, CloudSun, Sailboat, Wine, Loader2, ShieldCheck, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '../api.js';

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
    <div className={`flex ${isGemini ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isGemini ? 'bg-neutral-800 text-neutral-100' : 'bg-blue-600 text-white'
        }`}
      >
        {children}
      </div>
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
  }, [messages, showSuggestions, booking]);

  const pushMessage = (msg) => setMessages((prev) => [...prev, msg]);

  const respondToWeather = () => {
    pushMessage({
      from: 'gemini',
      content:
        "It's looking exceptionally nice for your dates in Italy — sunny and mid-70s the whole trip. Since the weather's this good, a few add-ons would pair really well with your itinerary:",
    });
    setShowSuggestions(true);
  };

  const handleSend = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || thinking) return;

    pushMessage({ from: 'user', content: text });
    setInput('');
    setThinking(true);

    setTimeout(() => {
      setThinking(false);
      if (/weather|outfit|forecast/i.test(text)) {
        respondToWeather();
      } else {
        pushMessage({
          from: 'gemini',
          content: "I'm mainly keeping an eye on your Italy trip right now — try asking me about the weather there.",
        });
      }
    }, 700);
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
    <div className="flex min-h-screen flex-col bg-neutral-950 text-neutral-100">
      <header className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-red-400">
            <Sparkles className="size-4 text-white" />
          </span>
          <span className="text-lg font-medium tracking-tight">Gemini</span>
        </div>
        <Badge variant="outline" className="border-neutral-700 text-[10px] font-normal text-neutral-400">
          Simulated external app — not affiliated with TravelZero
        </Badge>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 overflow-y-auto px-6 py-6">
        {messages.map((msg, idx) => (
          <Bubble key={idx} from={msg.from}>
            {msg.content}
          </Bubble>
        ))}

        {thinking && (
          <Bubble from="gemini">
            <Loader2 className="size-4 animate-spin" />
          </Bubble>
        )}

        {showSuggestions && (
          <div className="grid gap-3 sm:grid-cols-1">
            {ADD_ONS.map((addOn) => {
              const Icon = addOn.icon;
              const state = bookings[addOn.id] || { status: 'idle' };
              const isBooked = state.status === 'success';
              return (
                <div key={addOn.id} className="flex flex-col gap-3 rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-lg bg-neutral-800">
                        <Icon className="size-4 text-neutral-300" />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-neutral-100">{addOn.name}</p>
                        <p className="text-xs text-neutral-400">{addOn.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-sm font-medium text-neutral-200">${addOn.cost}</span>
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
                    <div className="rounded-lg border border-emerald-800/50 bg-emerald-950/40 p-3 text-xs text-emerald-200">
                      <div className="mb-2 flex items-center gap-2 font-medium text-emerald-100">
                        <ShieldCheck className="size-4" />
                        Delegated booking authorized via TravelZero
                      </div>
                      <div className="space-y-1 font-mono text-[11px] text-emerald-300/90">
                        <p>agent: {state.receipt.agentIdentity}</p>
                        <p>delegatedScope: {state.receipt.delegatedScope.join(', ')}</p>
                        <p>
                          actorClaim: sub={state.receipt.actorClaim.sub.substring(0, 10)}… act.sub=
                          {state.receipt.actorClaim.act.sub}
                        </p>
                        <p>
                          tokenVault: {state.receipt.tokenVault.tokenReference} (expires in{' '}
                          {state.receipt.tokenVault.expiresIn}s)
                        </p>
                        <p>mcp.tool: {state.receipt.mcp.toolInvoked}</p>
                      </div>
                    </div>
                  )}

                  {state.status === 'error' && state.error === 'not_authenticated' && (
                    <div className="rounded-lg border border-amber-800/50 bg-amber-950/40 p-3 text-xs text-amber-200">
                      Sign in to TravelZero, then come back and I can book on your behalf.{' '}
                      <Link to="/login" className="underline">
                        Open TravelZero login
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div ref={endRef} />
      </main>

      <form onSubmit={handleSend} className="border-t border-neutral-800 bg-neutral-950 px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          <CloudSun className="size-4 shrink-0 text-neutral-500" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Gemini anything…"
            className="flex-1 rounded-full border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-600"
          />
          <Button type="submit" size="icon" disabled={!input.trim() || thinking}>
            <Send className="size-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
