import express from 'express';
import store from '../store.js';

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
 * POST /api/security/flag
 * Flags a user's account for security review (demo/simulation).
 *
 * Mock: There is no distinct "Security AI Agent" product in Auth0 today — this
 * demo-narrative label maps onto real Attack Protection features: Breached Password
 * Detection (blocks logins whose credentials appear in known breach dumps, real test
 * values are prefixed `AUTH0-TEST-`) and the broader threat monitoring surfaced in
 * Auth0's Security Center dashboard. Both work by detecting a risk signal and forcing
 * remediation (a password reset) before the account can be used again, which is what
 * this flag simulates.
 * Docs: https://auth0.com/docs/secure/attack-protection,
 *       https://auth0.com/docs/secure/security-center
 * This is used to trigger the Security Interstitial flow in the UI.
 */
router.post('/flag', (req, res) => {
  const user = authenticateUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Set security flag
  store.securityFlags[user.id] = true;

  res.json({
    success: true,
    signal: 'breached_password_detection',
    message: 'Security flag set for demo purposes.',
    flaggedAt: new Date().toISOString(),
  });
});

/**
 * GET /api/security/status
 * Checks if the user's account has a security flag.
 */
router.get('/status', (req, res) => {
  const user = authenticateUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const flagged = store.securityFlags[user.id] || false;

  res.json({
    flagged,
    message: flagged ? 'Your account has been flagged for security review.' : 'Your account is secure.',
  });
});

export default router;
