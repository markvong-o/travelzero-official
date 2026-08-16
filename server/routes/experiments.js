import express from 'express';
import store from '../store.js';
import { isAuth0Configured, getExperiments, getFeatureFlag, getSegment } from '../lib/auth0-management.js';

const router = express.Router();

/**
 * Helper: Extract user from token
 */
const authenticateUser = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  const payload = store.verifyToken(token);
  if (!payload || !payload.userId) {
    return null;
  }
  return store.users[payload.userId];
};

/**
 * GET /api/experiments/passkey-test
 * Returns aggregated statistics for the passkey vs password signup experiment.
 *
 * Note: Auth0 Experiment Center is a real (beta) product on dev tenants — it provides
 * native A/B testing of auth flows with automatic traffic splitting, variant assignment
 * via Actions (`event.experiment`), and results in tenant logs under `details.experiment`.
 * This endpoint simulates that same concept against in-memory signup events, serving as
 * the data layer for the Experiment Center admin UI in this demo.
 */
router.get('/passkey-test', (req, res) => {
  const user = authenticateUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Compute stats from signup events
  const events = store.signupEvents;
  const passkeyEvents = events.filter(e => e.bucket === 'passkey');
  const passwordEvents = events.filter(e => e.bucket === 'password');

  const passkeyCompleted = passkeyEvents.filter(e => e.completed).length;
  const passwordCompleted = passwordEvents.filter(e => e.completed).length;

  const passkeyCompletionRate = passkeyEvents.length > 0 ? (passkeyCompleted / passkeyEvents.length) * 100 : 0;
  const passwordCompletionRate = passwordEvents.length > 0 ? (passwordCompleted / passwordEvents.length) * 100 : 0;

  const stats = {
    experimentName: 'Passkey vs Password Signup',
    experimentId: 'exp_passkey_test_001',
    status: 'active',
    totalSignups: events.length,
    buckets: {
      passkey: {
        totalStarted: passkeyEvents.length,
        totalCompleted: passkeyCompleted,
        completionRate: Math.round(passkeyCompletionRate),
        percentage: events.length > 0 ? Math.round((passkeyEvents.length / events.length) * 100) : 0,
      },
      password: {
        totalStarted: passwordEvents.length,
        totalCompleted: passwordCompleted,
        completionRate: Math.round(passwordCompletionRate),
        percentage: events.length > 0 ? Math.round((passwordEvents.length / events.length) * 100) : 0,
      },
    },
    winner: passkeyCompletionRate > passwordCompletionRate ? 'passkey' : 'password',
    insights: [
      `${events.length} total signups recorded`,
      `Passkey: ${passkeyEvents.length} started (${Math.round((passkeyEvents.length / events.length) * 100)}%), ${Math.round(passkeyCompletionRate)}% completed`,
      `Password: ${passwordEvents.length} started (${Math.round((passwordEvents.length / events.length) * 100)}%), ${Math.round(passwordCompletionRate)}% completed`,
    ],
  };

  res.json(stats);
});

/**
 * GET /api/experiments/auth0
 * Fetches live experiments + feature flags from Auth0 Experiment Center and
 * returns them enriched with variation details for the admin UI.
 */
router.get('/auth0', async (req, res) => {
  if (!isAuth0Configured()) {
    return res.status(503).json({ error: 'Auth0 not configured' });
  }

  try {
    const experiments = await getExperiments();

    const enriched = await Promise.all(
      experiments.map(async (exp) => {
        let featureFlag = null;
        if (exp.feature_flag_id) {
          try { featureFlag = await getFeatureFlag(exp.feature_flag_id); } catch {}
        }

        // Resolve each allocation's segment_id into its actual match rules
        // (browser, platform, client_id, etc.) so the admin UI can show the
        // real targeting conditions instead of just an opaque segment ID.
        const allocations = await Promise.all(
          (exp.allocations ?? []).map(async (alloc) => {
            if (!alloc.segment_id) return alloc;
            try {
              const segment = await getSegment(alloc.segment_id);
              return { ...alloc, segment };
            } catch {
              return alloc;
            }
          })
        );

        return { ...exp, feature_flag: featureFlag, allocations };
      })
    );

    res.json(enriched);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

export default router;
