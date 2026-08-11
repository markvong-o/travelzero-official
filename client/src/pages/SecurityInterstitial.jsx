import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api.js';
import './SecurityInterstitial.css';

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
    <main className="security-interstitial">
      <div className="security-overlay">
        <div className="security-container">
          <div className="security-card">
            <div className="security-icon">⚠️</div>

            <h1>Account Security Alert</h1>

            <p className="security-message">
              We've detected unusual activity on your account. To protect your account, please
              reset your password to continue.
            </p>

            <form onSubmit={handleResetPassword} className="security-form">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="disabled-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">New Password</label>
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

              <button type="submit" disabled={loading} className="btn btn-primary btn-lg btn-block">
                {loading ? 'Resetting password...' : 'Reset Password & Continue'}
              </button>
            </form>

            <div className="security-tips">
              <h4>Password Tips:</h4>
              <ul>
                <li>Use at least 8 characters</li>
                <li>Mix uppercase, lowercase, numbers, and symbols</li>
                <li>Don't reuse passwords from other accounts</li>
              </ul>
            </div>

            <div className="security-footer">
              <small>
                This is a mandatory security measure. Your account will remain locked until you
                reset your password.
              </small>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
