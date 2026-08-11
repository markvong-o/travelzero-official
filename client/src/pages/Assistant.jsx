import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ScopeChip } from '../components/ScopeChip';
import { Button } from '@/components/ui/button';
import api from '../api.js';
import './Assistant.css';

export default function Assistant() {
  const { isAnonymous } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isAnonymous) {
      navigate('/');
      return;
    }
  }, [isAnonymous, navigate]);

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
    <main className="assistant-page">
      <div className="container">
        <div className="assistant-layout">
          <div className="chat-section">
            <div className="chat-header">
              <h2>Travel Assistant</h2>
              <p>Plan your perfect Italian getaway with AI</p>
            </div>

            <div className="messages-container">
              {messages.length === 0 ? (
                <div className="empty-chat">
                  <span className="empty-icon">✈️</span>
                  <h3>Start Planning Your Trip</h3>
                  <p>Try: "Plan me a weekend in Rome under $1,500"</p>
                  <p>or: "Design a 5-day Italy itinerary using my loyalty points"</p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className={`message ${msg.type}`}>
                    <div className="message-content">
                      <p>{msg.text}</p>
                      {msg.metadata && (
                        <div className="agent-metadata">
                          <ScopeChip
                            label={msg.metadata.agentPrincipal}
                            scopes={msg.metadata.scopesUsed}
                            variant="highlight"
                          />
                          <div className="access-log">
                            <small>Accessed:</small>
                            {msg.metadata.accessLog.map((log, i) => (
                              <small key={i}>{log.resource}</small>
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

            <form onSubmit={handleSendMessage} className="input-form">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tell me about your ideal trip..."
                disabled={loading}
              />
              <Button type="submit" disabled={loading} size="icon">
                {loading ? '...' : '→'}
              </Button>
            </form>
          </div>

          <div className="sidebar">
            {itinerary && (
              <div className="itinerary-preview">
                <h3>Your Itinerary</h3>
                <div className="preview-details">
                  <div className="detail">
                    <span className="label">Duration</span>
                    <span className="value">{itinerary.duration} days</span>
                  </div>
                  <div className="detail">
                    <span className="label">Cost</span>
                    <span className="value">${itinerary.totalCost}</span>
                  </div>
                  <div className="detail">
                    <span className="label">Points Used</span>
                    <span className="value">{itinerary.loyaltyPointsApplied}</span>
                  </div>
                </div>

                <div className="itinerary-actions">
                  <Button onClick={handleBookItinerary} className="w-full">
                    Save to Dashboard
                  </Button>
                  <Button onClick={handleAgentBook} variant="secondary" className="w-full">
                    Simulate: Agent Books Add-on
                  </Button>
                </div>

                {showReceipt && receipt && (
                  <div className="booking-receipt">
                    <img
                      src="/images/sunset-cruise.jpg"
                      alt="Sunset Cruise - Amalfi Coast"
                      className="receipt-photo"
                    />
                    <h4>Agent Booking Receipt</h4>
                    <div className="receipt-item">
                      <span className="label">External Agent</span>
                      <span className="value">{receipt.agentIdentity}</span>
                    </div>
                    <div className="receipt-item">
                      <span className="label">Delegated Scope</span>
                      <span className="value">{receipt.delegatedScope.join(', ')}</span>
                    </div>
                    <div className="receipt-item">
                      <span className="label">Actor Claim (RFC 8693)</span>
                      <span className="value monospace">
                        sub: {receipt.actorClaim.sub.substring(0, 10)}… act.sub: {receipt.actorClaim.act.sub}
                      </span>
                    </div>
                    <div className="receipt-item">
                      <span className="label">Token Vault Exchange</span>
                      <span className="value monospace">{receipt.tokenVault.tokenReference} · expires in {receipt.tokenVault.expiresIn}s</span>
                    </div>
                    <div className="receipt-item">
                      <span className="label">MCP Tool</span>
                      <span className="value monospace">{receipt.mcp.toolInvoked}</span>
                    </div>
                    <div className="receipt-item">
                      <span className="label">MCP Resource</span>
                      <span className="value monospace">{receipt.mcp.resource}</span>
                    </div>
                    <p className="receipt-message">✓ {receipt.message}</p>
                  </div>
                )}
              </div>
            )}

            <div className="demo-controls">
              <h4>Demo Controls</h4>
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
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
