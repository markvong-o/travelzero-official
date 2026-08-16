import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Fingerprint, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { meetsViewThreshold } from '../lib/view-tracking';
import { useToast } from '../context/ToastContext';
import { useExperiment } from '../context/ExperimentContext';
import { useWebAuthnPrompt, WebAuthnPrompt } from '../components/WebAuthnPrompt';
import { Button } from '@/components/ui/button';
import { isAuth0Configured } from '../lib/auth-config';
import { cn } from '@/lib/utils';
import { PanelCarousel } from '../components/PanelCarousel';
import s from './Signup.module.css';

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

// Keyed by DestinationCard's `destination.id` (see Browse.jsx) — enough to
// show contextual copy without importing the full destinations dataset.
const DESTINATION_COPY = {
  rome: { name: 'Rome', emoji: '🏛️' },
  amalfi: { name: 'the Amalfi Coast', emoji: '🏖️' },
  tuscany: { name: 'Tuscany', emoji: '🍇' },
  como: { name: 'Lake Como', emoji: '🏔️' },
  london: { name: 'London', emoji: '🎡' },
};

// Promoted from the old SignupModal.jsx (a shadcn Dialog opened from
// Browse's "Book This Trip") into a full route. `returnTo` sends the user
// back to wherever they were, and this page now owns the loyalty-points
// success toast that Browse.jsx used to fire from its onSuccess callback.
export default function Signup() {
  const { signup, login } = useAuth();
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
  const { isTreatment: anonConversionTreatment } = useExperiment('exp_anon_conversion');
  const { isTreatment: mfaCopyTreatment } = useExperiment('exp_mfa_copy');

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 900));
      try {
        await signup('emma@demo.travelzero.com', 'passkey', null);
      } catch {
        // User already exists — sign in instead. This is the pre-seeded demo
        // Emma account, so no fresh loyalty-points grant applies here either
        // way — login doesn't return a points figure to report accurately.
        await login('emma@demo.travelzero.com', 'passkey');
      }
      showToast('Welcome to TravelZero!', 'success');
      navigate(returnTo);
    } catch {
      showToast('Google sign-up failed', 'error');
    } finally {
      setGoogleLoading(false);
    }
  };

  const returnTo = searchParams.get('returnTo') || '/dashboard';
  const destinationParam = searchParams.get('destination');
  const destination = DESTINATION_COPY[destinationParam];
  const viewThresholdMet = meetsViewThreshold('london');
  // Two distinct concerns, kept separate on purpose:
  // - Reward eligibility (destinationParam present OR viewThresholdMet) is
  //   decided server-side (server/routes/auth.js) from the raw signals —
  //   it does not depend on which messaging variant is shown.
  // - showPersonalizedCTA only controls copy. exp_anon_conversion still gates
  //   the destination-based personalized framing specifically (that's what
  //   the experiment tests — same reward, different messaging), but the new
  //   view-threshold signal isn't part of that experiment, so it always shows
  //   personalized copy when true.
  const showPersonalizedCTA = (anonConversionTreatment && Boolean(destination)) || viewThresholdMet;
  const authRedirect = isAuth0Configured();

  useEffect(() => {
    if (authRedirect) {
      signup(undefined, undefined, undefined, {
        destination: searchParams.get('destination') || undefined,
        returnTo: searchParams.get('returnTo') || '/dashboard',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authRedirect]);

  if (authRedirect) {
    return <div className={s.redirect}>Redirecting to sign up…</div>;
  }

  const finishSignup = (result) => {
    showToast(
      result?.loyaltyPoints > 0
        ? `Welcome! You earned ${result.loyaltyPoints.toLocaleString()} loyalty points! 🎉`
        : 'Welcome to TravelZero!',
      'success'
    );
    navigate(returnTo);
  };

  const handlePasskeySignup = async () => {
    if (!email) {
      showToast('Please enter your email', 'warning');
      return;
    }
    setLoading(true);
    try {
      await prompt(mfaCopyTreatment ? 'One more step to keep your account secure' : 'Use Face ID / Touch ID / Security Key');
      const result = await signup(email, 'passkey', null, destinationParam);
      finishSignup(result);
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
      const result = await signup(email, 'password', password, destinationParam);
      finishSignup(result);
    } catch (error) {
      showToast(error.error || 'Signup failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={s.layout}>
        <PanelCarousel>
          <h2 className={s.panelTitle}>
            {destination
              ? `Ready to explore ${destination.name}? ${destination.emoji}`
              : viewThresholdMet ? 'Ready to book your London trip?' : 'Join TravelZero'}
          </h2>
          <p className={s.panelText}>
            {showPersonalizedCTA
              ? 'Sign up for a free account and get 10,000 loyalty points you can use towards your next trip.'
              : 'Sign up for a free account to save your favorites and unlock personalized offers.'}
          </p>
        </PanelCarousel>

        <div className={s.formCol}>
          <div className={s.formInner}>
            {/* anon conversion treatment: personalized session banner, one
                variant per signal — destination-click takes precedence if
                both happen to be true. */}
            {anonConversionTreatment && destination ? (
              <div className={s.sessionBanner}>
                <span className={s.sessionBannerIcon}>👋</span>
                <div>
                  <p className={s.sessionBannerTitle}>We saved your session</p>
                  <p className={s.sessionBannerText}>
                    You were browsing {destination.name}. Create a free account to book it and earn 10,000 welcome points.
                  </p>
                </div>
              </div>
            ) : viewThresholdMet && (
              <div className={s.sessionBanner}>
                <span className={s.sessionBannerIcon}>👋</span>
                <div>
                  <p className={s.sessionBannerTitle}>We saved your session</p>
                  <p className={s.sessionBannerText}>
                    You've been checking out London hotels and flights. Create a free account and unlock 10,000 loyalty points.
                  </p>
                </div>
              </div>
            )}

            {passkeyFirst ? (
              /* ── Treatment: passkey-first ── */
              <>
                <div className={s.head}>
                  <h1 className={s.title}>
                    {showPersonalizedCTA ? 'Claim your account' : 'Create account with passkey'}
                  </h1>
                  <p className={s.subtitle}>Skip passwords — use Face ID or Touch ID to sign up in seconds</p>
                </div>
                <div className={s.form}>
                  <input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
                  <Button onClick={handlePasskeySignup} disabled={loading} variant="brand" size="lg">
                    {loading ? 'Setting up passkey…' : (showPersonalizedCTA ? 'Claim my 10,000 points →' : 'Continue with passkey')}
                  </Button>
                </div>
                <div className={s.divider} style={{ marginTop: '1rem' }}><span>or</span></div>
                <button type="button" onClick={handleGoogleSignup} disabled={googleLoading || loading} className={s.googleBtn}>
                  <GoogleIcon />
                  <span>{googleLoading ? 'Signing up…' : 'Continue with Google'}</span>
                </button>
                <button type="button" className={s.fallbackLink} onClick={() => setShowPasswordFallback((v) => !v)}>
                  {showPasswordFallback ? '← Back to passkey' : 'Use password instead →'}
                </button>
                {showPasswordFallback && (
                  <form onSubmit={handlePasswordSignup} className={s.form} style={{ marginTop: '0.75rem' }}>
                    <input type="password" placeholder="Password (min 8 characters)" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} required />
                    <Button type="submit" disabled={loading} variant="brand" size="lg">{loading ? 'Creating account…' : 'Create account'}</Button>
                  </form>
                )}
              </>
            ) : (
              /* ── Control: multi-method picker ── */
              <>
                <div className={s.head}>
                  <h1 className={s.title}>
                    {showPersonalizedCTA ? 'Continue where you left off' : 'Create your account'}
                  </h1>
                  <p className={s.subtitle}>
                    {showPersonalizedCTA
                      ? 'Create a free account to save your browsing history and unlock member pricing.'
                      : 'Takes less than a minute'}
                  </p>
                </div>
                <button type="button" onClick={handleGoogleSignup} disabled={googleLoading || loading} className={s.googleBtn}>
                  <GoogleIcon />
                  <span>{googleLoading ? 'Signing up…' : 'Continue with Google'}</span>
                </button>
                <div className={s.divider}><span>or sign up with</span></div>
                <div className={s.methods}>
                  <button type="button" onClick={() => setMethod('passkey')} disabled={loading} className={cn(s.method, method === 'passkey' && s.methodActive)}>
                    <Fingerprint size={16} /><span>Sign up with Passkey</span>
                  </button>
                  <button type="button" onClick={() => setMethod('password')} disabled={loading} className={cn(s.method, method === 'password' && s.methodActive)}>
                    <KeyRound size={16} /><span>Sign up with Password</span>
                  </button>
                </div>
                {method === 'passkey' && (
                  <div className={s.form}>
                    <input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
                    <Button onClick={handlePasskeySignup} disabled={loading} variant="brand" size="lg">
                      {loading ? 'Setting up passkey…' : (showPersonalizedCTA ? 'Claim my 10,000 points →' : 'Continue with Passkey')}
                    </Button>
                  </div>
                )}
                {method === 'password' && (
                  <form onSubmit={handlePasswordSignup} className={s.form}>
                    <input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} required />
                    <input type="password" placeholder="Password (min 8 characters)" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} required />
                    <Button type="submit" disabled={loading} variant="brand" size="lg">
                      {loading ? 'Creating account…' : (showPersonalizedCTA ? 'Claim my 10,000 points →' : 'Create account')}
                    </Button>
                  </form>
                )}
              </>
            )}

            <p className={s.altText}>
              Have an account?{' '}
              <Link to={`/login?returnTo=${encodeURIComponent(returnTo)}`} className={s.link}>Sign in</Link>
            </p>
            <p className={s.backText}>
              <Link to={returnTo} className={s.backLink}>Continue browsing as guest</Link>
            </p>
          </div>
        </div>
      </div>
      <WebAuthnPrompt {...promptProps} />
    </>
  );
}
