import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './SignupModal.css';

export default function SignupModal({ destination, onSuccess, onCancel }) {
  const { signup, sessionId } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState('passkey');

  const handlePasskeySignup = async () => {
    if (!email) {
      showToast('Please enter your email', 'warning');
      return;
    }

    setLoading(true);
    try {
      // Simulate WebAuthn ceremony
      const simulateWebAuthn = new Promise((resolve) => {
        setTimeout(() => resolve(true), 1200);
      });

      // Show simulated passkey prompt
      const fauxModal = document.createElement('div');
      fauxModal.innerHTML = `
        <div style="
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          z-index: 10000;
          text-align: center;
          max-width: 300px;
        ">
          <div style="font-size: 48px; margin-bottom: 16px;">👆</div>
          <p style="font-size: 18px; font-weight: 600; margin: 0 0 8px 0;">Use Face ID / Touch ID / Security Key</p>
          <div style="
            display: inline-block;
            width: 30px;
            height: 30px;
            border: 3px solid var(--color-primary);
            border-top-color: transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          "></div>
          <style>
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          </style>
        </div>
        <div style="
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.3);
          z-index: 9999;
        "></div>
      `;
      document.body.appendChild(fauxModal);

      await simulateWebAuthn;
      document.body.removeChild(fauxModal);

      await signup(email, 'passkey');
      showToast('Passkey signup successful!', 'success');
      onSuccess?.();
    } catch (error) {
      showToast(error.error || 'Signup failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSignup = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please fill in all fields', 'warning');
      return;
    }

    setLoading(true);
    try {
      await signup(email, 'password', password);
      showToast('Password signup successful!', 'success');
      onSuccess?.();
    } catch (error) {
      showToast(error.error || 'Signup failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-modal-content">
      <div className="signup-hero">
        <span className="signup-emoji">{destination?.color === 'rome' ? '🏛️' : '🏖️'}</span>
        <h2>Ready to explore {destination?.name}?</h2>
        <p>Sign up for a free account and get 10,000 loyalty points you can use towards your next trip!</p>
      </div>

      <div className="signup-methods">
        <button
          className={`method-btn ${method === 'passkey' ? 'active' : ''}`}
          onClick={() => setMethod('passkey')}
          disabled={loading}
        >
          <span className="method-icon">🔐</span>
          <span>Sign up with Passkey</span>
        </button>

        <button
          className={`method-btn ${method === 'password' ? 'active' : ''}`}
          onClick={() => setMethod('password')}
          disabled={loading}
        >
          <span className="method-icon">🔑</span>
          <span>Sign up with Password</span>
        </button>
      </div>

      {method === 'passkey' && (
        <div className="signup-form">
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <button
            onClick={handlePasskeySignup}
            disabled={loading}
            className="btn btn-primary btn-lg"
          >
            {loading ? 'Setting up passkey...' : 'Continue with Passkey'}
          </button>
        </div>
      )}

      {method === 'password' && (
        <form onSubmit={handlePasswordSignup} className="signup-form">
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
          <input
            type="password"
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
      )}

      <div className="signup-footer">
        <button onClick={onCancel} disabled={loading} className="btn-text">
          Continue browsing as guest
        </button>
      </div>
    </div>
  );
}
