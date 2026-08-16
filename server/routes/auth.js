import express from 'express';
import store from '../store.js';
import { isAuth0Configured, createManagementUser } from '../lib/auth0-management.js';

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
 * POST /api/auth/signup
 * Registers a new user via passkey or password.
 *
 * Mock: A real passkey signup is a two-step WebAuthn *registration ceremony* against
 * Auth0's `/passkey/register` endpoint: (1) the client requests registration options
 * (an RP ID bound to your Auth0 custom domain, a random `challenge`, `pubKeyCredParams`,
 * and a `user.id` handle), (2) the browser's `navigator.credentials.create()` produces an
 * attestation which is POSTed back for verification before Auth0 issues tokens. Auth0
 * distinguishes "synced" passkeys (iCloud Keychain / Google Password Manager — convenient,
 * cross-device) from "device-bound" passkeys (hardware-tied — stronger, less portable);
 * we default to synced below, same as most consumer signups. Requires a custom domain in
 * production since the RP ID must match it.
 *
 * Body:
 * {
 *   method: 'passkey' | 'password',
 *   email: string,
 *   password?: string (for password method),
 *   sessionId?: string (to migrate favorites from anonymous session)
 * }
 */
/**
 * POST /api/auth/anonymous-token
 * Proxies Auth0 anonymous session token creation so the SPA client secret
 * never needs to live in the browser bundle. The SPA is now a public client
 * (token_endpoint_auth_method: none), so no secret is sent to Auth0 from here
 * either — but keeping this server-side means we can add one later without
 * touching the client.
 */
router.post('/anonymous-token', async (req, res) => {
  const domain = process.env.AUTH0_DOMAIN;
  const clientId = process.env.AUTH0_SPA_CLIENT_ID || process.env.AUTH0_CLIENT_ID;

  if (!domain || !clientId) {
    return res.status(503).json({ error: 'Auth0 not configured' });
  }

  const { audience, metadata = {} } = req.body;

  try {
    const auth0Res = await fetch(`https://${domain}/anonymous/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        scope: 'anon',
        ...(audience ? { audience } : {}),
        ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
      }),
    });

    const data = await auth0Res.json();
    if (!auth0Res.ok) {
      return res.status(auth0Res.status).json({ error: data.error_description || data.error || 'Anonymous token failed' });
    }

    res.json({ session_token: data.session_token });
  } catch (err) {
    res.status(502).json({ error: 'Failed to reach Auth0' });
  }
});

router.post('/signup', async (req, res) => {
  const { method, email, password, sessionId, favorites, syncOnly } = req.body;

  if (!email || !method) {
    return res.status(400).json({ error: 'Missing email or method' });
  }

  // syncOnly: called by AuthContext.syncMockSession after Auth0 login to create a shadow
  // session on the mock server. The Auth0 user already exists — skip Management API.
  // If the shadow user already exists in the mock store, return their token immediately.
  const existing = store.findUserByEmail(email);
  if (existing) {
    if (syncOnly) {
      const token = store.issueToken(existing.id);
      return res.json({ success: true, userId: existing.id, email: existing.email, token, loyaltyPoints: existing.loyaltyPoints, favorites: existing.user_metadata?.favorites ?? [] });
    }
    return res.status(400).json({ error: 'User already exists' });
  }

  // With real AUTH0_* env vars set, actually create the user via the Management API
  // instead of the in-memory store. Same response shape either way.
  if (isAuth0Configured() && !syncOnly) {
    try {
      await createManagementUser({ email, password });
    } catch (err) {
      return res.status(502).json({ error: `Auth0 user creation failed: ${err.message}` });
    }
  }

  // Create user
  // Mock: In real Auth0, password would be hashed by Auth0, not stored client-side.
  const passwordHash = method === 'password' ? Buffer.from(password || '').toString('base64') : null;
  const user = store.createUser(email, method, passwordHash);

  // Migrate favorites: prefer directly-passed array (anon sessionStorage), fall back to session
  if (Array.isArray(favorites) && favorites.length > 0) {
    user.user_metadata.favorites = favorites;
  } else if (sessionId && store.sessions[sessionId]) {
    store.migrateFavorites(sessionId, user.id);
  }

  // Grant loyalty points
  user.loyaltyPoints = 10000;

  // Record signup event for experiment tracking
  // Determine bucket: 50/50 split between passkey and password
  const bucket = Math.random() < 0.5 ? 'passkey' : 'password';
  store.signupEvents.push({
    userId: user.id,
    bucket,
    method,
    completed: true,
    timestamp: new Date().toISOString(),
  });

  // Update session if provided
  if (sessionId && store.sessions[sessionId]) {
    store.sessions[sessionId].userId = user.id;
    store.sessions[sessionId].isAnonymous = false;
  }

  // Issue mock token
  // Mock: Real Auth0 would issue a proper JWT with claims and signature.
  const token = store.issueToken(user.id);

  res.json({
    success: true,
    userId: user.id,
    email: user.email,
    token,
    loyaltyPoints: user.loyaltyPoints,
    favorites: user.user_metadata.favorites ?? [],
    // Mock: shape approximates what a verified WebAuthn registration ceremony implies.
    ...(method === 'passkey' && {
      passkey: { credentialType: 'public-key', syncedToPlatform: true, rpId: 'travelzero.auth0.com' },
    }),
    message: 'Sign up successful! You have been granted 10,000 loyalty points.',
  });
});

/**
 * POST /api/auth/login
 * Logs in a user via passkey, password, or an emailed one-time code.
 *
 * Mock:
 * - passkey: real flow hits `/passkey/challenge` for a login challenge, then the
 *   browser's `navigator.credentials.get()` signs it with the device's stored private key.
 * - email_code: real Auth0 Passwordless connections use `POST /passwordless/start`
 *   (connection=email) to send the code, then `POST /oauth/token` with grant type
 *   `http://auth0.com/oauth/grant-type/passwordless/otp` to redeem it.
 * - password: standard database connection grant, included here only as a fallback —
 *   Auth0's own guidance is to prefer passkeys/passwordless over passwords where possible.
 *
 * Body:
 * {
 *   method: 'passkey' | 'password' | 'email_code',
 *   email: string,
 *   password?: string (for password method),
 *   code?: string (for email_code method, ignored in mock)
 * }
 */
router.post('/login', (req, res) => {
  const { method, email, password } = req.body;

  if (!email || !method) {
    return res.status(400).json({ error: 'Missing email or method' });
  }

  const user = store.findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  // Validate credentials based on method
  // Mock: Real Auth0 would perform actual cryptographic verification.
  if (method === 'password') {
    const passwordHash = Buffer.from(password || '').toString('base64');
    if (passwordHash !== user.passwordHash) {
      return res.status(401).json({ error: 'Invalid password' });
    }
  }
  // For passkey and email_code, just trust the method (mock)

  const token = store.issueToken(user.id);

  res.json({
    success: true,
    userId: user.id,
    email: user.email,
    token,
    message: 'Login successful',
  });
});

/**
 * POST /api/auth/reset-password
 * Resets user password and clears security flag.
 * Mock: Real Auth0 would validate a password reset token/link, and the flag being
 * cleared here approximates Auth0's real Breached Password Detection (part of Attack
 * Protection) — it blocks/flags logins with credentials found in known breach dumps and
 * requires a reset before the account can be used again. See routes/security.js.
 *
 * Body:
 * {
 *   email: string,
 *   newPassword: string,
 *   token: string (optional, mock accepts anything)
 * }
 */
router.post('/reset-password', (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Missing email or newPassword' });
  }

  const user = store.findUserByEmail(email);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Update password
  user.passwordHash = Buffer.from(newPassword).toString('base64');

  // Clear security flag
  store.securityFlags[user.id] = false;

  res.json({
    success: true,
    message: 'Password reset successful. Your account is secure.',
  });
});

export default router;
