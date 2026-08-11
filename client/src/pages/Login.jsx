import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '@/components/ui/button';
import './Login.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [method, setMethod] = useState('passkey');
  const [loading, setLoading] = useState(false);

  const handlePasskeyLogin = async () => {
    if (!email) {
      showToast('Please enter your email', 'warning');
      return;
    }

    setLoading(true);
    try {
      // Simulate WebAuthn
      const simulateWebAuthn = new Promise((resolve) => {
        setTimeout(() => resolve(true), 1200);
      });

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
          <p style="font-size: 18px; font-weight: 600; margin: 0 0 8px 0;">Authenticate with Face ID / Touch ID</p>
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

      await login(email, 'passkey');
      showToast('Login successful!', 'success');
      navigate('/dashboard');
    } catch (error) {
      showToast(error.error || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please fill in all fields', 'warning');
      return;
    }

    setLoading(true);
    try {
      await login(email, 'password', password);
      showToast('Login successful!', 'success');
      navigate('/dashboard');
    } catch (error) {
      showToast(error.error || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1>Sign In</h1>
            <p>Welcome back to TravelZero</p>
          </div>

          <div className="login-methods">
            <button
              className={`method-btn ${method === 'passkey' ? 'active' : ''}`}
              onClick={() => setMethod('passkey')}
              disabled={loading}
            >
              <span className="method-icon">🔐</span>
              Sign in with Passkey
            </button>

            <button
              className={`method-btn secondary ${method === 'password' ? 'active' : ''}`}
              onClick={() => setMethod('password')}
              disabled={loading}
            >
              <span className="method-icon">🔑</span>
              Use password instead
            </button>

            <button
              className={`method-btn secondary ${method === 'email_code' ? 'active' : ''}`}
              onClick={() => setMethod('email_code')}
              disabled={loading}
            >
              <span className="method-icon">📧</span>
              Get a login code by email
            </button>
          </div>

          {method === 'passkey' && (
            <div className="login-form">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              <Button onClick={handlePasskeyLogin} disabled={loading} size="lg" className="w-full">
                {loading ? 'Authenticating...' : 'Sign in with Passkey'}
              </Button>
            </div>
          )}

          {method === 'password' && (
            <form onSubmit={handlePasswordLogin} className="login-form">
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
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
              <Button type="submit" disabled={loading} size="lg" className="w-full">
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          )}

          {method === 'email_code' && (
            <div className="login-form">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              <Button
                onClick={() => {
                  showToast('Check your email for a login code', 'info');
                }}
                disabled={loading}
                size="lg"
                className="w-full"
              >
                Send Login Code
              </Button>
            </div>
          )}

          <div className="login-footer">
            <p>Don't have an account?</p>
            <a href="/">Go back home to sign up</a>
          </div>
        </div>

        <div className="login-aside">
          <div className="aside-card">
            <h3>Why choose TravelZero?</h3>
            <ul>
              <li>🔐 Secure authentication with passkeys</li>
              <li>⭐ Earn loyalty points on every booking</li>
              <li>✈️ Personalized travel recommendations</li>
              <li>💳 Save your favorite destinations</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
