import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '@/components/ui/button';
import api from '../api.js';

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
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-lg">
        <div className="mb-4 text-center text-4xl">⚠️</div>

        <h1 className="text-center text-xl font-semibold text-foreground">
          Account Security Alert
        </h1>

        <p className="mt-3 text-center text-sm leading-relaxed text-muted-foreground">
          We&apos;ve detected unusual activity on your account. To protect your account, please
          reset your password to continue.
        </p>

        <form onSubmit={handleResetPassword} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={user?.email || ''}
              disabled
              className="w-full bg-muted"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
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
              className="w-full"
            />
          </div>

          <Button type="submit" disabled={loading} size="lg" className="w-full">
            {loading ? 'Resetting password…' : 'Reset Password & Continue'}
          </Button>
        </form>

        <div className="mt-6 rounded-lg bg-muted p-4">
          <h4 className="text-sm font-semibold text-foreground">Password Tips:</h4>
          <ul className="mt-1 flex list-inside list-disc flex-col gap-0.5 text-xs text-muted-foreground">
            <li>Use at least 8 characters</li>
            <li>Mix uppercase, lowercase, numbers, and symbols</li>
            <li>Don&apos;t reuse passwords from other accounts</li>
          </ul>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          This is a mandatory security measure. Your account will remain locked until you reset your
          password.
        </p>
      </div>
    </div>
  );
}
