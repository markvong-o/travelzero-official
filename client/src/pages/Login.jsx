import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Fingerprint, KeyRound, Mail, ShieldCheck, Star, Plane, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useExperiment } from '../context/ExperimentContext';
import { useWebAuthnPrompt, WebAuthnPrompt } from '../components/WebAuthnPrompt';
import { Button } from '@/components/ui/button';
import { isAuth0Configured } from '../lib/auth-config';
import { cn } from '@/lib/utils';
import { PanelCarousel } from '../components/PanelCarousel';
import s from './Login.module.css';

const METHODS = [
  { id: 'passkey', Icon: Fingerprint, label: 'Sign in with Passkey' },
  { id: 'password', Icon: KeyRound, label: 'Use password instead' },
  { id: 'email_code', Icon: Mail, label: 'Get a login code by email' },
];

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

export default function Login() {
  const { login, loginWithVariant } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { prompt, promptProps } = useWebAuthnPrompt();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [method, setMethod] = useState('passkey');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPasswordFallback, setShowPasswordFallback] = useState(false);
  const { isTreatment: passkeyFirst } = useExperiment('exp_signup_method');
  const { isTreatment: mfaCopyTreatment } = useExperiment('exp_mfa_copy');

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 900));
      await login('emma@demo.travelzero.com', 'passkey');
      showToast('Signed in with Google', 'success');
      navigate(returnTo);
    } catch {
      showToast('Google sign-in failed', 'error');
    } finally {
      setGoogleLoading(false);
    }
  };

  const returnTo = searchParams.get('returnTo') || '/dashboard';
  // Real Auth0 mode redirects to Universal Login and never reads these
  // form fields, so skip rendering the form entirely. Instead of redirecting
  // immediately, offer explicit variant picks — this is the front door for
  // showing the ACUL experiment (passkey-first vs password-first) live.
  const authRedirect = isAuth0Configured();

  if (authRedirect) {
    return (
      <div className={s.variantPicker}>
        <div className={s.variantPickerInner}>
          <h1 className={s.title}>Sign in to TravelZero</h1>
          <p className={s.subtitle}>Choose an experience to preview the live ACUL experiment</p>

          <Button onClick={() => loginWithVariant('passkey')} variant="brand" size="lg" className={s.variantBtn}>
            <Fingerprint size={16} /> Passkey-first experience
          </Button>
          <Button onClick={() => loginWithVariant('password')} variant="outline" size="lg" className={s.variantBtn}>
            <KeyRound size={16} /> Password-first experience
          </Button>

          <button type="button" className={s.fallbackLink} onClick={() => login(returnTo)}>
            Or sign in normally (live traffic allocation) →
          </button>
        </div>
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
      await prompt(mfaCopyTreatment ? 'One more step to keep your account secure' : 'Authenticate with Face ID / Touch ID');
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
      <div className={s.layout}>
        <div className={s.formCol}>
          <div className={s.formInner}>
            {passkeyFirst ? (
              /* ── Treatment: passkey-first ── */
              <>
                <div className={s.head}>
                  <h1 className={s.title}>Sign in with passkey</h1>
                  <p className={s.subtitle}>Use Face ID or Touch ID to authenticate instantly</p>
                </div>
                <div className={s.form}>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                  <Button onClick={handlePasskeyLogin} disabled={loading} variant="brand" size="lg">
                    {loading ? 'Authenticating…' : 'Sign in with passkey'}
                  </Button>
                </div>
                <div className={s.divider} style={{ marginTop: '1rem' }}>
                  <span>or</span>
                </div>
                <button type="button" onClick={handleGoogleLogin} disabled={googleLoading || loading} className={s.googleBtn}>
                  <GoogleIcon />
                  <span>{googleLoading ? 'Signing in…' : 'Continue with Google'}</span>
                </button>
                <button
                  type="button"
                  className={s.fallbackLink}
                  onClick={() => setShowPasswordFallback((v) => !v)}
                >
                  {showPasswordFallback ? '← Back to passkey' : 'Use password instead →'}
                </button>
                {showPasswordFallback && (
                  <form onSubmit={handlePasswordLogin} className={s.form} style={{ marginTop: '0.75rem' }}>
                    <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} required />
                    <Button type="submit" disabled={loading} size="lg">{loading ? 'Signing in…' : 'Sign In'}</Button>
                  </form>
                )}
              </>
            ) : (
              /* ── Control: multi-method picker ── */
              <>
                <div className={s.head}>
                  <h1 className={s.title}>Welcome back</h1>
                  <p className={s.subtitle}>Sign in to TravelZero</p>
                </div>

                <button type="button" onClick={handleGoogleLogin} disabled={googleLoading || loading} className={s.googleBtn}>
                  <GoogleIcon />
                  <span>{googleLoading ? 'Signing in…' : 'Continue with Google'}</span>
                </button>

                <div className={s.divider}><span>or sign in with</span></div>

                <div className={s.methods}>
                  {METHODS.map(({ id, Icon, label }) => (
                    <button key={id} type="button" onClick={() => setMethod(id)} disabled={loading} className={cn(s.method, method === id && s.methodActive)}>
                      <Icon size={16} /><span>{label}</span>
                    </button>
                  ))}
                </div>

                {method === 'passkey' && (
                  <div className={s.form}>
                    <input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
                    <Button onClick={handlePasskeyLogin} disabled={loading} variant="brand" size="lg">
                      {loading ? 'Authenticating…' : 'Sign in with Passkey'}
                    </Button>
                  </div>
                )}

                {method === 'password' && (
                  <form onSubmit={handlePasswordLogin} className={s.form}>
                    <input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} required />
                    <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} required />
                    <Button type="submit" disabled={loading} size="lg">{loading ? 'Signing in…' : 'Sign In'}</Button>
                  </form>
                )}

            {method === 'email_code' && (
              <div className={s.form}>
                <input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
                <Button onClick={() => showToast('Check your email for a login code', 'info')} disabled={loading} size="lg">Send Login Code</Button>
              </div>
            )}
              </> /* end control branch */
            )} {/* end passkeyFirst ternary */}

            <p className={s.altText}>
              Don&apos;t have an account?{' '}
              <Link to={`/signup?returnTo=${encodeURIComponent(returnTo)}`} className={s.link}>Sign up</Link>
            </p>
            <p className={s.backText}>
              <Link to="/" className={s.backLink}>Go back home</Link>
            </p>
          </div>
        </div>

        <PanelCarousel>
          <h2 className={s.panelTitle}>Why choose TravelZero?</h2>
          <ul className={s.panelList}>
            {[
              [ShieldCheck, 'Secure authentication with passkeys'],
              [Star, 'Earn loyalty points on every booking'],
              [Plane, 'Personalized travel recommendations'],
              [Heart, 'Save your favorite destinations'],
            ].map(([Icon, label]) => (
              <li key={label} className={s.panelItem}>
                <span className={s.panelIcon}>
                  <Icon size={16} />
                </span>
                <span className={s.panelLabel}>{label}</span>
              </li>
            ))}
          </ul>
        </PanelCarousel>
      </div>
      <WebAuthnPrompt {...promptProps} />
    </>
  );
}
