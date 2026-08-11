import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Plane } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { ScopeChip } from '../components/ScopeChip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '../api.js';

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
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput('');
    setMessages((prev) => [...prev, { type: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const response = await api.chat(userMessage);
      setMessages((prev) => [
        ...prev,
        {
          type: 'assistant',
          text: response.message,
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
    <div className="grid h-full min-h-0 gap-6 p-6 lg:grid-cols-3 lg:p-8">
      <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card lg:col-span-2">
        <div className="shrink-0 border-b border-border px-6 py-4">
          <h1 className="text-lg font-semibold text-foreground">Travel Assistant</h1>
          <p className="text-sm text-muted-foreground">
            Plan your perfect Italian getaway with AI
          </p>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
          {messages.length === 0 ? (
            <div className="m-auto max-w-sm text-center">
              <span className="text-4xl">✈️</span>
              <h2 className="mt-3 text-base font-semibold text-foreground">
                Start Planning Your Trip
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Try: &ldquo;Plan me a weekend in Rome under $1,500&rdquo;
              </p>
              <p className="text-sm text-muted-foreground">
                or: &ldquo;Design a 5-day Italy itinerary using my loyalty points&rdquo;
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${
                    msg.type === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  {msg.metadata && (
                    <div className="mt-3 flex flex-col gap-2">
                      <ScopeChip
                        label={msg.metadata.agentPrincipal}
                        scopes={msg.metadata.scopesUsed}
                        variant="highlight"
                      />
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>Accessed:</span>
                        {msg.metadata.accessLog.map((log, i) => (
                          <span key={i} className="font-mono">
                            {log.resource}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form
          onSubmit={handleSendMessage}
          className="flex shrink-0 gap-2 border-t border-border px-6 py-4"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell me about your ideal trip..."
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" disabled={loading} size="icon">
            {loading ? '…' : '→'}
          </Button>
        </form>
      </div>

      <div className="flex flex-col gap-4 overflow-y-auto">
        {itinerary && (
          <Card>
            <CardHeader>
              <CardTitle>Your Itinerary</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <dl className="flex flex-col gap-2 text-sm">
                {[
                  ['Duration', `${itinerary.duration} days`],
                  ['Cost', `$${itinerary.totalCost}`],
                  ['Points Used', itinerary.loyaltyPointsApplied],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-medium text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="flex flex-col gap-2">
                <Button onClick={handleBookItinerary} className="w-full">
                  Save to Dashboard
                </Button>
                <Button onClick={handleAgentBook} variant="secondary" className="w-full">
                  Simulate: Agent Books Add-on
                </Button>
              </div>

              {showReceipt && receipt && (
                <div className="flex flex-col gap-3 rounded-lg border border-l-4 border-accent/30 border-l-accent bg-accent/5 p-4 shadow-md">
                  <img
                    src="/images/sunset-cruise.jpg"
                    alt="Sunset Cruise - Amalfi Coast"
                    className="h-32 w-full rounded-md object-cover"
                  />
                  <h4 className="text-base font-semibold text-foreground">
                    Agent Booking Receipt
                  </h4>
                  {[
                    ['External Agent', receipt.agentIdentity, false],
                    ['Delegated Scope', receipt.delegatedScope.join(', '), false],
                    [
                      'Actor Claim (RFC 8693)',
                      `sub: ${receipt.actorClaim.sub.substring(0, 10)}… act.sub: ${receipt.actorClaim.act.sub}`,
                      true,
                    ],
                    [
                      'Token Vault Exchange',
                      `${receipt.tokenVault.tokenReference} · expires in ${receipt.tokenVault.expiresIn}s`,
                      true,
                    ],
                    ['MCP Tool', receipt.mcp.toolInvoked, true],
                    ['MCP Resource', receipt.mcp.resource, true],
                  ].map(([label, value, mono]) => (
                    <div key={label} className="flex flex-col gap-0.5">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {label}
                      </span>
                      <span
                        className={
                          mono
                            ? 'break-all font-mono text-[13px] tabular-nums text-foreground'
                            : 'break-all text-sm font-medium text-foreground'
                        }
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                  <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-accent">
                    <Check className="size-4 shrink-0" />
                    {receipt.message}
                  </p>
                </div>
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
              className="w-full"
            >
              Simulate: Security Agent Detects Breach
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
