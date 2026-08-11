import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/Badge';
import api from '../api.js';
import './ExperimentCenter.css';

export default function ExperimentCenter() {
  const { isAnonymous } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAnonymous) {
      navigate('/');
      return;
    }

    const loadStats = async () => {
      try {
        const data = await api.getPasskeyTestStats();
        setStats(data);
      } catch (error) {
        showToast('Failed to load experiment data', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [isAnonymous, navigate, showToast]);

  if (loading) {
    return (
      <main className="experiment-center">
        <div className="container">
          <div className="loading">Loading experiment data...</div>
        </div>
      </main>
    );
  }

  if (!stats) {
    return (
      <main className="experiment-center">
        <div className="container">
          <div className="error">Failed to load experiment data</div>
        </div>
      </main>
    );
  }

  return (
    <main className="experiment-center">
      <div className="container">
        <div className="experiment-header">
          <h1>Experiment Center</h1>
          <Badge variant="primary">Internal / Admin View</Badge>
        </div>

        <p className="experiment-disclaimer">
          Conceptual preview — Auth0 doesn't currently ship a dashboard product named
          "Experiment Center." What's shown below is real-time data computed from actual
          signup events, in a shape you could build today with an Auth0 Action that tags
          each signup with an experiment bucket, paired with your own analytics.
        </p>

        <div className="experiment-card">
          <div className="card-header">
            <div>
              <h2>{stats.experimentName}</h2>
              <p className="experiment-id">{stats.experimentId}</p>
            </div>
            <Badge variant={stats.status === 'active' ? 'success' : 'warning'}>
              {stats.status}
            </Badge>
          </div>

          <div className="experiment-overview">
            <div className="overview-item">
              <span className="label">Total Signups</span>
              <span className="value">{stats.totalSignups}</span>
            </div>
            <div className="overview-item">
              <span className="label">Winner</span>
              <span className="value badge-accent">{stats.winner?.toUpperCase()}</span>
            </div>
          </div>

          <div className="bucket-comparison">
            <div className="bucket">
              <h3>Passkey</h3>
              <div className="bucket-stats">
                <div className="stat">
                  <span className="stat-label">Started</span>
                  <span className="stat-value">{stats.buckets.passkey.totalStarted}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Completed</span>
                  <span className="stat-value">{stats.buckets.passkey.totalCompleted}</span>
                </div>
              </div>

              <div className="progress-section">
                <div className="progress-label">
                  <span>Completion Rate</span>
                  <span className="progress-value">
                    {stats.buckets.passkey.completionRate}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${stats.buckets.passkey.completionRate}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="bucket-percentage">
                <span className="percentage">{stats.buckets.passkey.percentage}%</span>
                <span className="of-total">of total signups</span>
              </div>
            </div>

            <div className="bucket">
              <h3>Password</h3>
              <div className="bucket-stats">
                <div className="stat">
                  <span className="stat-label">Started</span>
                  <span className="stat-value">{stats.buckets.password.totalStarted}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Completed</span>
                  <span className="stat-value">{stats.buckets.password.totalCompleted}</span>
                </div>
              </div>

              <div className="progress-section">
                <div className="progress-label">
                  <span>Completion Rate</span>
                  <span className="progress-value">
                    {stats.buckets.password.completionRate}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill password"
                    style={{
                      width: `${stats.buckets.password.completionRate}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="bucket-percentage">
                <span className="percentage">{stats.buckets.password.percentage}%</span>
                <span className="of-total">of total signups</span>
              </div>
            </div>
          </div>

          <div className="insights-section">
            <h3>Insights</h3>
            <ul className="insights-list">
              {stats.insights.map((insight, idx) => (
                <li key={idx}>{insight}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="methodology-card">
          <h3>Methodology</h3>
          <p>
            This experiment compares signup completion rates between passkey and password
            authentication methods. Signups are randomly assigned to buckets, and real data is
            collected from actual user registrations.
          </p>
          <p>
            The passkey method simulates WebAuthn ceremony with a 1.2-second delay to approximate
            real biometric authentication timing. Both methods create user accounts and assign
            loyalty points.
          </p>
        </div>
      </div>
    </main>
  );
}
