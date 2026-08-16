import express from 'express';
import store from '../store.js';
import { isAuth0Configured, patchUserMetadata } from '../lib/auth0-management.js';

const router = express.Router();

/**
 * Helper: Extract user from token in Authorization header
 * Mock: In production, this would validate a real Auth0 access token.
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
 * GET /api/account/me
 * Returns the current user's profile and metadata.
 *
 * Mock: Auth0's real My Account API is a distinct, self-service-scoped API — not the
 * Management API — reachable at audience `https://{tenant}.auth0.com/me/` under paths
 * like `/me/v1/authentication-methods` and `/me/v1/connected-accounts` (the latter is
 * where Token Vault-backed federated connections live). Its access tokens are
 * intentionally short-lived (10 minutes) and scope-restricted, and sensitive operations
 * require re-authentication. We fold that model down to a single `user_metadata`-shaped
 * payload here for simplicity, and add an `authentication_methods` list to reflect what
 * the real API actually manages.
 * Docs: https://auth0.com/docs/manage-users/my-account-api
 */
router.get('/me', (req, res) => {
  const user = authenticateUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Fetch or create itinerary
  const itinerary = store.itineraries[user.id] || null;

  res.json({
    userId: user.id,
    email: user.email,
    createdAt: user.createdAt,
    user_metadata: user.user_metadata,
    loyaltyPoints: user.loyaltyPoints,
    favorites: user.user_metadata.favorites || [],
    itinerary,
    // Mock: approximates GET /me/v1/authentication-methods
    authentication_methods: [
      { type: user.method === 'passkey' ? 'webauthn-platform' : 'password', enrolled_at: user.createdAt },
      { type: 'email', enrolled_at: user.createdAt },
    ],
  });
});

/**
 * PATCH /api/account/me
 * Updates user metadata (favorites, itinerary, preferences, etc.)
 * Mock: In production, this would use Auth0's Management API.
 */
router.patch('/me', (req, res) => {
  const user = authenticateUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { user_metadata, favorites, itinerary } = req.body;

  // Update user_metadata if provided
  if (user_metadata) {
    user.user_metadata = { ...user.user_metadata, ...user_metadata };
  }

  // Update favorites if provided
  if (favorites) {
    user.user_metadata.favorites = favorites;
  }

  // Update itinerary if provided
  if (itinerary) {
    store.itineraries[user.id] = {
      id: store.generateId(),
      ...itinerary,
    };
  }

  res.json({
    success: true,
    user_metadata: user.user_metadata,
    loyaltyPoints: user.loyaltyPoints,
    itinerary: store.itineraries[user.id] || null,
  });
});

/**
 * POST /api/account/favorites
 * Adds or updates favorites for the user.
 */
router.post('/favorites', (req, res) => {
  const user = authenticateUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { destination } = req.body;
  if (!destination) {
    return res.status(400).json({ error: 'Missing destination' });
  }

  if (!user.user_metadata.favorites) {
    user.user_metadata.favorites = [];
  }

  const exists = user.user_metadata.favorites.some(fav => fav.id === destination.id);
  if (!exists) {
    user.user_metadata.favorites.push(destination);
  }

  res.json({
    success: true,
    favorites: user.user_metadata.favorites,
  });
});

/**
 * DELETE /api/account/favorites/:id
 * Removes a destination from favorites.
 */
router.delete('/favorites/:id', (req, res) => {
  const user = authenticateUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.params;
  user.user_metadata.favorites = (user.user_metadata.favorites || []).filter(fav => fav.id !== id);

  res.json({
    success: true,
    favorites: user.user_metadata.favorites,
  });
});

/**
 * POST /api/account/share-itinerary
 * Shares the user's itinerary (blocked if security flag is set).
 * Demonstrates a Breached Password Detection-style interstitial (see routes/security.js
 * for the real Auth0 feature this is modeled on — Attack Protection, not a distinct
 * "AI agent" product).
 */
/**
 * PUT /api/account/favorites/sync
 * Writes the full favorites array to Auth0 user_metadata for real Auth0 users.
 * Called after every add/remove so the post-login Action can always read the
 * latest favorites from user_metadata and stamp them into the ID token claim.
 *
 * Body: { userId: string (Auth0 sub), favorites: Destination[] }
 */
router.put('/favorites/sync', async (req, res) => {
  const { userId, favorites } = req.body;

  if (!userId || !Array.isArray(favorites)) {
    return res.status(400).json({ error: 'userId and favorites array required' });
  }

  if (!isAuth0Configured()) {
    return res.status(503).json({ error: 'Auth0 not configured' });
  }

  try {
    await patchUserMetadata(userId, { favorites });
    res.json({ success: true, favorites });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

router.post('/share-itinerary', (req, res) => {
  const user = authenticateUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Check security flag
  if (store.securityFlags[user.id]) {
    return res.status(403).json({
      error: 'Account security issue detected',
      reason: 'We detected unusual activity on your account. Please reset your password to continue.',
      action: 'require_password_reset',
    });
  }

  const itinerary = store.itineraries[user.id];
  if (!itinerary) {
    return res.status(400).json({ error: 'No itinerary to share' });
  }

  // Mock: Generate a shareable link
  const shareCode = store.generateId().substring(0, 8).toUpperCase();

  res.json({
    success: true,
    shareCode,
    shareUrl: `https://travelzero.example.com/shared/${shareCode}`,
    message: 'Itinerary shared! Send this link to your travel companions.',
  });
});

export default router;
