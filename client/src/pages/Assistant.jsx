import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Info, Plane, Send, Loader2, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { ScopeChip } from '../components/ScopeChip';
import { CiamMoment } from '../components/CiamMoment';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import api from '../api.js';
import s from './Assistant.module.css';

const SUGGESTED_PROMPTS = [
  'Plan a 5-day Italy trip using my loyalty points',
  'Design a romantic weekend in Rome under $1,500',
  'Plan a Tuscany wine tour, I have 10,000 points',
  'Plan a family week in Italy under $3,000',
];

// Keyword-matched response text — first match wins, overrides the generic server message.
// Placeholder tokens from the itinerary object are substituted at call time.
const CANNED_RESPONSES = [
  {
    pattern: /loyalty|points|reward|redeem/i,
    message: (itin) =>
      `You have ${itin.loyaltyPointsApplied.toLocaleString()} loyalty points applied to this itinerary, bringing your out-of-pocket cost down to $${Math.round(itin.estimatedNetCost || itin.totalCost).toLocaleString()}. Points are drawn from your TravelZero balance in real time, so there's no separate redemption step.`,
  },
  {
    pattern: /romantic|anniversary|honeymoon|couple/i,
    message: (itin) =>
      `A romantic Italian escape, done well. I've built a ${itin.duration}-day itinerary with Tuscany and the Amalfi Coast as anchors, including private wine tastings, a sunset boat tour, and a hilltop dinner in Positano. I've applied ${itin.loyaltyPointsApplied.toLocaleString()} loyalty points, bringing your total to $${itin.totalCost.toLocaleString()}. The pace is intentionally unhurried throughout.`,
  },
  {
    pattern: /family|kids|children|child/i,
    message: (itin) =>
      `Italy has everything families travel for: pizza-making classes where kids actually learn, gelato on every corner, and the Colosseum as a genuine spectacle. I've planned a ${itin.duration}-day itinerary that balances history, coastal beach days, and local food for $${itin.totalCost.toLocaleString()}, with each day staying at two or three highlights to keep energy and engagement right.`,
  },
  {
    pattern: /wine|tasting|chianti|tuscany/i,
    message: (itin) =>
      `Tuscany's Chianti Classico region is one of the world's great wine corridors. I've built your ${itin.duration}-day itinerary around an al fresco tasting through countryside vineyards, a winery dinner in Greve, and a sunrise drive through the Val d'Orcia. I've applied ${itin.loyaltyPointsApplied.toLocaleString()} loyalty points, bringing your total to $${itin.totalCost.toLocaleString()}. The Gemini agent can book the wine experience as an add-on if you'd like.`,
  },
];

// Anonymous users never reach this page — AppLayout redirects to /login
// before this component mounts.
export default function Assistant() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [metaModal, setMetaModal] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!metaModal) return;
    const onKey = (e) => { if (e.key === 'Escape') setMetaModal(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [metaModal]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (userMessage) => {
    if (!userMessage.trim() || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { type: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const [response] = await Promise.all([
        api.chat(userMessage),
        new Promise((r) => setTimeout(r, 3000)),
      ]);
      const cannedMatch = CANNED_RESPONSES.find((r) => r.pattern.test(userMessage));
      const messageText = cannedMatch
        ? cannedMatch.message(response.itinerary)
        : response.message;
      setMessages((prev) => [
        ...prev,
        {
          type: 'assistant',
          text: messageText,
          metadata: response.agentMetadata,
          itinerary: response.itinerary,
        },
      ]);
      setItinerary(response.itinerary);
    } catch (error) {
      showToast(error.error || 'Failed to get response', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleBookItinerary = async () => {
    if (!itinerary) return;
    try {
      await api.updateMe({ itinerary });
      showToast('Itinerary saved to your dashboard!', 'success');
      navigate('/dashboard');
    } catch (error) {
      showToast(error.error || 'Failed to save itinerary', 'error');
    }
  };

  const handleAgentBook = async () => {
    if (!itinerary) {
      showToast('Generate an itinerary first', 'warning');
      return;
    }

    try {
      const booking = {
        name: 'Sunset Cruise - Amalfi Coast',
        description: 'Experience a magical sunset from the water',
        cost: 180,
        type: 'experience',
      };

      const result = await api.agentBook('gemini-travel-agent', booking);
      setReceipt(result.bookingReceipt);
      setShowReceipt(true);

      // Update itinerary with new booking
      setItinerary({
        ...itinerary,
        addOns: [...(itinerary.addOns || []), result.booking],
        totalCost: itinerary.totalCost + result.booking.cost,
      });

      showToast(result.booking.bookedBy + ' booked an add-on for you!', 'success');
    } catch (error) {
      showToast(error.error || 'Failed to book add-on', 'error');
    }
  };

  return (
    <div className={s.grid}>
      <div className={s.chat}>
        <div className={s.chatHead}>
          <h1 className={s.chatTitle}>Travel Assistant</h1>
          <p className={s.chatSubtitle}>Plan your perfect Italian getaway with AI</p>
        </div>

        <div className={s.messages}>
          {messages.length === 0 ? (
            <div className={s.emptyState}>
              <div className={s.emptyIcon}>
                <Plane size={20} />
              </div>
              <h2 className={s.emptyTitle}>Start Planning Your Trip</h2>
              <p className={s.emptyText}>
                Describe the trip you have in mind. Pick a starting point below.
              </p>
              <div className={s.prompts}>
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    disabled={loading}
                    className={s.prompt}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={cn(s.msgRow, msg.type === 'user' ? s.msgRowUser : s.msgRowAssistant)}
              >
                <div
                  className={cn(s.bubble, msg.type === 'user' ? s.bubbleUser : s.bubbleAssistant)}
                >
                  <p className={s.bubbleText}>{msg.text}</p>
                </div>
                {msg.metadata && (
                  <button
                    type="button"
                    className={s.infoBtn}
                    onClick={() => setMetaModal(msg.metadata)}
                    aria-label="View agent call details"
                  >
                    <Info size={13} />
                  </button>
                )}
              </div>
            ))
          )}
          {loading && (
            <div className={cn(s.msgRow, s.msgRowAssistant)}>
              <div className={cn(s.bubble, s.bubbleAssistant, s.bubbleThinking)}>
                <span className={s.dot} />
                <span className={s.dot} />
                <span className={s.dot} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {messages.length > 0 && (
          <div className={s.chips}>
            <div className={s.chipsInner}>
              {SUGGESTED_PROMPTS.map((p) => (
                <button key={p} type="button" className={s.chip} onClick={() => sendMessage(p)}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
        <form onSubmit={handleSendMessage} className={s.composer}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell me about your ideal trip..."
            disabled={loading}
          />
          <Button type="submit" disabled={loading} size="icon" aria-label="Send message">
            {loading ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
          </Button>
        </form>
      </div>

      <div className={s.side}>
        {itinerary && (
          <Card>
            <CardHeader>
              <CardTitle>Your Itinerary</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className={s.summary}>
                {[
                  ['Duration', `${itinerary.duration} days`],
                  ['Cost', `$${itinerary.totalCost}`],
                  ['Points Used', itinerary.loyaltyPointsApplied],
                ].map(([label, value]) => (
                  <div key={label} className={s.summaryRow}>
                    <dt className={s.summaryLabel}>{label}</dt>
                    <dd className={s.summaryValue}>{value}</dd>
                  </div>
                ))}
              </dl>

              <div className={s.sideActions} style={{ marginTop: '1rem' }}>
                <Button onClick={handleBookItinerary} variant="brand">
                  Save to Dashboard
                </Button>
                <Button onClick={handleAgentBook} variant="secondary">
                  Simulate: Agent Books Add-on
                </Button>
              </div>

              {showReceipt && receipt && (
                <CiamMoment
                  className={s.receipt}
                  title="Agent Booking Receipt"
                  rows={[
                    { label: 'External Agent', value: receipt.agentIdentity },
                    { label: 'Delegated Scope', value: receipt.delegatedScope.join(', ') },
                    {
                      label: 'Actor Claim (RFC 8693)',
                      value: `sub: ${receipt.actorClaim.sub.substring(0, 10)}… act.sub: ${receipt.actorClaim.act.sub}`,
                      mono: true,
                    },
                    {
                      label: 'Token Vault Exchange',
                      value: `${receipt.tokenVault.tokenReference} · expires in ${receipt.tokenVault.expiresIn}s`,
                      mono: true,
                    },
                    { label: 'MCP Tool', value: receipt.mcp.toolInvoked, mono: true },
                    { label: 'MCP Resource', value: receipt.mcp.resource, mono: true },
                  ]}
                >
                  <img
                    src="/images/sunset-cruise.jpg"
                    alt="Sunset Cruise - Amalfi Coast"
                    className={s.receiptImg}
                  />
                  <p className={s.receiptMsg}>
                    <Check size={16} />
                    {receipt.message}
                  </p>
                </CiamMoment>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Demo Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => {
                api.flagSecurity();
                showToast('Security flag set. Try sharing your itinerary next.', 'info');
              }}
              variant="outline"
              size="sm"
              style={{ width: '100%' }}
            >
              Simulate: Security Agent Detects Breach
            </Button>
          </CardContent>
        </Card>
      </div>

      {metaModal && (
        <div className={s.modalOverlay} onClick={() => setMetaModal(null)}>
          <div className={s.modal} onClick={(e) => e.stopPropagation()}>
            <div className={s.modalHead}>
              <span className={s.modalTitle}>Agent Call Details</span>
              <button
                type="button"
                className={s.modalClose}
                onClick={() => setMetaModal(null)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className={s.modalBody}>
              <ScopeChip
                label={metaModal.agentPrincipal}
                scopes={metaModal.scopesUsed}
                variant="highlight"
              />
              <div className={s.modalSection}>
                <p className={s.modalLabel}>Resources accessed</p>
                <div className={s.modalMonoList}>
                  {metaModal.accessLog.map((log, i) => (
                    <span key={i} className={s.modalMono}>{log.resource}</span>
                  ))}
                </div>
              </div>
              <div className={s.modalSection}>
                <p className={s.modalLabel}>Actor claim (RFC 8693)</p>
                <span className={s.modalMono}>
                  sub: {metaModal.actorClaim.sub.substring(0, 12)}… &nbsp;·&nbsp; act.sub: {metaModal.actorClaim.act.sub}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
