import React, { useState } from 'react';
import { ShieldAlert, BotMessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '@/components/ui/button';
import { CiamMoment } from '../components/CiamMoment';
import api from '../api.js';
import s from './SecurityInterstitial.module.css';

const DETECTION_TIME = new Date(Date.now() - 1000 * 60 * 7).toLocaleTimeString([], {
  hour: '2-digit',
  minute: '2-digit',
});

const BREACH_ROWS = [
  { label: 'agent.id', value: 'auth0-security-agent-v2', mono: true },
  { label: 'breach.source', value: 'HaveIBeenPwned / dark web scan', mono: true },
  { label: 'detected.at', value: DETECTION_TIME, mono: true },
  { label: 'action.taken', value: 'session.blocked — step-up required', mono: true },
  { label: 'credential.type', value: 'password (plaintext exposure)', mono: true },
];

export default function SecurityInterstitial() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword) {
      showToast('Please enter a new password', 'warning');
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword(user.email, newPassword);
      showToast('Password reset successful! Your account is now secure.', 'success');
      navigate('/dashboard');
    } catch (error) {
      showToast(error.error || 'Failed to reset password', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.screen}>
      <div className={s.card}>
        <div className={s.topBar} />
        <div className={s.wash} />

        <div className={s.inner}>
          <div className={s.iconRow}>
            <span className={s.iconChip}>
              <ShieldAlert size={28} />
            </span>
          </div>

          <p className={s.eyebrow}>Auth0 Attack Protection</p>
          <h1 className={s.title}>Your credentials were found in a data breach</h1>

          <p className={s.intro}>
            The Auth0 Security AI Agent has detected your password in a known credential breach.
            Your account has been automatically locked. Reset your password to regain access.
          </p>

          <CiamMoment
            eyebrow="Security AI Agent — detection receipt"
            title="Credential Breach Detected"
            icon={BotMessageSquare}
            rows={BREACH_ROWS}
          />

          <form onSubmit={handleResetPassword} className={s.form}>
            <div className={s.field}>
              <label htmlFor="email" className={s.label}>
                Email
              </label>
              <input type="email" id="email" value={user?.email || ''} disabled />
            </div>

            <div className={s.field}>
              <label htmlFor="password" className={s.label}>
                New Password
              </label>
              <input
                type="password"
                id="password"
                placeholder="Enter a strong password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                minLength={8}
                required
              />
            </div>

            <Button type="submit" disabled={loading} variant="brand" size="lg">
              {loading ? 'Resetting password…' : 'Reset Password & Continue'}
            </Button>
          </form>

          <div className={s.tips}>
            <h4 className={s.tipsTitle}>Password Tips:</h4>
            <ul className={s.tipsList}>
              <li>Use at least 8 characters</li>
              <li>Mix uppercase, lowercase, numbers, and symbols</li>
              <li>Don&apos;t reuse passwords from other accounts</li>
            </ul>
          </div>

          <p className={s.footnote}>
            This is an automated security measure triggered by the Auth0 Security AI Agent. Your
            account will remain locked until you reset your password.
          </p>
        </div>
      </div>
    </div>
  );
}
