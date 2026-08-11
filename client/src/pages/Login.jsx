import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Fingerprint, KeyRound, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useWebAuthnPrompt, WebAuthnPrompt } from '../components/WebAuthnPrompt';
import { Button } from '@/components/ui/button';
import { isAuth0Configured } from '../lib/auth-config';

const METHODS = [
  { id: 'passkey', Icon: Fingerprint, label: 'Sign in with Passkey' },
  { id: 'password', Icon: KeyRound, label: 'Use password instead' },
  { id: 'email_code', Icon: Mail, label: 'Get a login code by email' },
];

function methodButtonClass(active) {
  return `flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors ${
    active
      ? 'border-primary bg-primary/5 text-primary'
      : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
  }`;
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { prompt, promptProps } = useWebAuthnPrompt();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [method, setMethod] = useState('passkey');
  const [loading, setLoading] = useState(false);

  const returnTo = searchParams.get('returnTo') || '/dashboard';
  // Real Auth0 mode redirects to Universal Login and never reads these
  // form fields, so skip rendering the form entirely and trigger the
  // redirect immediately instead of showing inputs that do nothing.
  const authRedirect = isAuth0Configured();

  useEffect(() => {
    if (authRedirect) {
      login();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authRedirect]);

  if (authRedirect) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Redirecting to sign in…
      </div>
    );
  }

  const handlePasskeyLogin = async () => {
    if (!email) {
      showToast('Please enter your email', 'warning');
      return;
    }
    setLoading(true);
    try {
      await prompt('Authenticate with Face ID / Touch ID');
      await login(email, 'passkey');
      showToast('Login successful!', 'success');
      navigate(returnTo);
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
      navigate(returnTo);
    } catch (error) {
      showToast(error.error || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-semibold text-foreground">Welcome back</h1>
              <p className="mt-1 text-sm text-muted-foreground">Sign in to TravelZero</p>
            </div>

            <div className="mb-6 flex flex-col gap-2">
              {METHODS.map(({ id, Icon, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMethod(id)}
                  disabled={loading}
                  className={methodButtonClass(method === id)}
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{label}</span>
                </button>
              ))}
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
                <Button onClick={handlePasskeyLogin} disabled={loading} size="lg" className="w-full">
                  {loading ? 'Authenticating…' : 'Sign in with Passkey'}
                </Button>
              </div>
            )}

            {method === 'password' && (
              <form onSubmit={handlePasswordLogin} className="flex flex-col gap-3">
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
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <Button type="submit" disabled={loading} size="lg" className="w-full">
                  {loading ? 'Signing in…' : 'Sign In'}
                </Button>
              </form>
            )}

            {method === 'email_code' && (
              <div className="flex flex-col gap-3">
                <input
                  type="email"
                  className="w-full"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
                <Button
                  onClick={() => showToast('Check your email for a login code', 'info')}
                  disabled={loading}
                  size="lg"
                  className="w-full"
                >
                  Send Login Code
                </Button>
              </div>
            )}

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link to={`/signup?returnTo=${encodeURIComponent(returnTo)}`} className="font-medium text-primary hover:underline">
                Sign up
              </Link>
            </p>
            <p className="mt-2 text-center">
              <Link to="/" className="text-sm text-muted-foreground hover:underline">
                Go back home
              </Link>
            </p>
          </div>
        </div>

        <div
          className="hidden flex-col justify-center gap-4 p-10 text-white lg:flex"
          style={{ background: 'var(--gradient-brand)' }}
        >
          <h2 className="text-xl font-semibold">Why choose TravelZero?</h2>
          <ul className="flex flex-col gap-3 text-sm">
            <li>🔐 Secure authentication with passkeys</li>
            <li>⭐ Earn loyalty points on every booking</li>
            <li>✈️ Personalized travel recommendations</li>
            <li>💳 Save your favorite destinations</li>
          </ul>
        </div>
      </div>
      <WebAuthnPrompt {...promptProps} />
    </>
  );
}
