import express from 'express';
import store from '../store.js';

const router = express.Router();

/**
 * POST /api/session
 * Creates or retrieves an anonymous session for a guest user.
 *
 * Mock: Auth0 has a real (beta, as of this writing) "Anonymous Sessions" feature for
 * exactly this — stateless sessions for unauthenticated users, created/refreshed via
 * `POST https://{tenant}.auth0.com/anonymous/token`. It returns a short-lived anonymous
 * access token; when the user later signs up/logs in, the anonymous session's data
 * (cart, favorites, etc.) is linked into their authenticated profile — which is what
 * `store.migrateFavorites()` approximates below on signup. Session length and per-client/
 * per-API enablement are configured in the Auth0 Dashboard.
 * Docs: https://auth0.com/docs (Anonymous Sessions, beta)
 */
router.post('/', (req, res) => {
  const session = store.getOrCreateSession();
  res.json({
    sessionId: session.id,
    access_token: `anon_${session.id}`,
    token_type: 'Bearer',
    expires_in: 3600,
    isAnonymous: true,
    createdAt: session.createdAt,
  });
});

/**
 * GET /api/session/:sessionId
 * Retrieves session details.
 */
router.get('/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = store.sessions[sessionId];

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.json({
    sessionId: session.id,
    isAnonymous: session.isAnonymous,
    userId: session.userId,
    favorites: session.favorites,
    createdAt: session.createdAt,
    viewCounts: session.viewCounts || {},
  });
});

/**
 * POST /api/session/:sessionId/view
 * Increments the server-authoritative view count for a destination (e.g.
 * 'london') on this session — powers the anonymous-conversion signup banner.
 * Tracked here rather than trusted purely client-side so /signup can verify
 * eligibility against real behavior instead of a client-asserted flag.
 *
 * Body: { destination: string }
 */
router.post('/:sessionId/view', (req, res) => {
  const { sessionId } = req.params;
  const { destination } = req.body;

  if (!destination) {
    return res.status(400).json({ error: 'Missing destination' });
  }

  const session = store.getOrCreateSession(sessionId);
  if (!session.viewCounts) session.viewCounts = {};
  session.viewCounts[destination] = (session.viewCounts[destination] || 0) + 1;

  res.json({
    sessionId: session.id,
    destination,
    count: session.viewCounts[destination],
  });
});

export default router;
