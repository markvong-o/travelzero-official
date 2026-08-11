import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Fingerprint, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useWebAuthnPrompt, WebAuthnPrompt } from '../components/WebAuthnPrompt';
import { Button } from '@/components/ui/button';
import { isAuth0Configured } from '../lib/auth-config';

// Keyed by DestinationCard's `destination.id` (see Browse.jsx) — enough to
// show contextual copy without importing the full destinations dataset.
const DESTINATION_COPY = {
  rome: { name: 'Rome', emoji: '🏛️' },
  amalfi: { name: 'the Amalfi Coast', emoji: '🏖️' },
  tuscany: { name: 'Tuscany', emoji: '🍇' },
  como: { name: 'Lake Como', emoji: '🏔️' },
};

function methodButtonClass(active) {
  return `flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors ${
    active
      ? 'border-primary bg-primary/5 text-primary'
      : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
  }`;
}

// Promoted from the old SignupModal.jsx (a shadcn Dialog opened from
// Browse's "Book This Trip") into a full route. `returnTo` sends the user
// back to wherever they were, and this page now owns the loyalty-points
// success toast that Browse.jsx used to fire from its onSuccess callback.
export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { prompt, promptProps } = useWebAuthnPrompt();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [method, setMethod] = useState('passkey');
  const [loading, setLoading] = useState(false);

  const returnTo = searchParams.get('returnTo') || '/dashboard';
  const destination = DESTINATION_COPY[searchParams.get('destination')];
  const authRedirect = isAuth0Configured();

  useEffect(() => {
    if (authRedirect) {
      signup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authRedirect]);

  if (authRedirect) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Redirecting to sign up…
      </div>
    );
  }

  const finishSignup = () => {
    showToast('Welcome! You earned 10,000 loyalty points! 🎉', 'success');
    navigate(returnTo);
  };

  const handlePasskeySignup = async () => {
    if (!email) {
      showToast('Please enter your email', 'warning');
      return;
    }
    setLoading(true);
    try {
      await prompt('Use Face ID / Touch ID / Security Key');
      await signup(email, 'passkey');
      finishSignup();
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
      finishSignup();
    } catch (error) {
      showToast(error.error || 'Signup failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="grid min-h-screen lg:grid-cols-[420px_minmax(0,1fr)]">
        <div
          className="hidden flex-col justify-center gap-4 p-10 text-white lg:flex"
          style={{ background: 'var(--gradient-brand)' }}
        >
          <h2 className="text-xl font-semibold">
            {destination ? `Ready to explore ${destination.name}? ${destination.emoji}` : 'Join TravelZero'}
          </h2>
          <p className="text-sm text-white/90">
            Sign up for a free account and get 10,000 loyalty points you can use towards your next
            trip.
          </p>
        </div>

        <div className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-semibold text-foreground">Create your account</h1>
              <p className="mt-1 text-sm text-muted-foreground">Takes less than a minute</p>
            </div>

            <div className="mb-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setMethod('passkey')}
                disabled={loading}
                className={methodButtonClass(method === 'passkey')}
              >
                <Fingerprint className="size-4 shrink-0" />
                <span>Sign up with Passkey</span>
              </button>
              <button
                type="button"
                onClick={() => setMethod('password')}
                disabled={loading}
                className={methodButtonClass(method === 'password')}
              >
                <KeyRound className="size-4 shrink-0" />
                <span>Sign up with Password</span>
              </button>
            </div>

            {method === 'passkey' && (
              <div className="flex flex-col gap-3">
                <input
                  type="email"
                  className="w-full"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
                <Button onClick={handlePasskeySignup} disabled={loading} size="lg" className="w-full">
                  {loading ? 'Setting up passkey…' : 'Continue with Passkey'}
                </Button>
              </div>
            )}

            {method === 'password' && (
              <form onSubmit={handlePasswordSignup} className="flex flex-col gap-3">
                <input
                  type="email"
                  className="w-full"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
                <input
                  type="password"
                  className="w-full"
                  placeholder="Password (min 8 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <Button type="submit" disabled={loading} size="lg" className="w-full">
                  {loading ? 'Creating account…' : 'Create account'}
                </Button>
              </form>
            )}

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Have an account?{' '}
              <Link to={`/login?returnTo=${encodeURIComponent(returnTo)}`} className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
            <p className="mt-2 text-center">
              <Link to={returnTo} className="text-sm text-muted-foreground hover:underline">
                Continue browsing as guest
              </Link>
            </p>
          </div>
        </div>
      </div>
      <WebAuthnPrompt {...promptProps} />
    </>
  );
}
