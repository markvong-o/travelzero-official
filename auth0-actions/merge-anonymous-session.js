/**
 * Auth0 Action: Merge Anonymous Session
 *
 * DEPLOY THIS TWICE — one Action per trigger:
 *
 *   Instance A  →  Trigger: "Pre User Registration"
 *                  Flow: Pre User Registration
 *                  Handler: onExecutePreUserRegistration (below)
 *
 *   Instance B  →  Trigger: "Login / Post Login"
 *                  Flow: Login Flow
 *                  Handler: onExecutePostLogin (below)
 *
 * event.anonymous_session shape:
 *   {
 *     user_id:    string   — anonymous identifier (e.g. "anon@1234-5678")
 *     session_id: string   — session token ID
 *     created_at: number   — unix timestamp
 *     expires_at: number   — unix timestamp
 *     metadata:   object   — key/value strings set when POST /anonymous/token was called
 *       - destination:    string (destination ID, e.g. "rome")
 *       - favorites:      JSON string — array of { id, name, region, color, tagline }
 *       - bonusEligible:  "true" if the client determined loyalty-points-bonus
 *                         eligibility (destination present OR London
 *                         flight/hotel view threshold met — see
 *                         client/src/context/AuthContext.jsx's signup() and
 *                         client/src/lib/view-tracking.js). Anonymous session
 *                         metadata values are always strings, not booleans.
 *   }
 *
 * REQUIRED: Anonymous Sessions beta must be enabled for your tenant.
 *   See: https://auth0.com/docs/manage-users/sessions/anonymous-sessions/configure-anonymous-sessions
 *
 * Mirrors the mock-mode grant logic in server/routes/auth.js so both modes
 * agree: 10,000 points for demonstrated intent, 0 otherwise — never a
 * universal signup perk.
 */

const ANON_CLAIM    = 'https://travelzero.demo/anonymous_session';
const FAVS_CLAIM     = 'https://travelzero.demo/favorites';
const LOYALTY_CLAIM  = 'https://travelzero.demo/loyalty_points';
const SIGNUP_BONUS_POINTS = 10000;

function extractAnonData(event) {
  const anon = event.anonymous_session;
  if (!anon) return null;

  let favorites = null;
  if (anon.metadata?.favorites) {
    try { favorites = JSON.parse(anon.metadata.favorites); } catch {}
  }

  return {
    destination:   anon.metadata?.destination ?? null,
    favorites:     Array.isArray(favorites) ? favorites : null,
    bonusEligible: anon.metadata?.bonusEligible === 'true' || anon.metadata?.bonusEligible === true,
    anonUserId:    anon.user_id,
    sessionId:     anon.session_id,
    expiresAt:     anon.expires_at,
  };
}

/**
 * Pre User Registration — fires once at account creation.
 * Writes anonymous session data (destination + favorites) to the new user's
 * profile before their first authenticated session.
 */
exports.onExecutePreUserRegistration = async (event, api) => {
  const data = extractAnonData(event);
  if (!data) return;

  if (data.destination) {
    api.user.setAppMetadata('last_anon_destination', data.destination);
  }
  if (data.anonUserId)  api.user.setAppMetadata('anon_user_id',   data.anonUserId);
  if (data.sessionId)   api.user.setAppMetadata('anon_session_id', data.sessionId);

  // Migrate favorites from the anonymous session into the new user's profile.
  // The client reads user_metadata.favorites to populate the Dashboard.
  if (data.favorites?.length > 0) {
    api.user.setUserMetadata('favorites', data.favorites);
  }

  // Grant the loyalty-points signup bonus only when the client determined
  // real intent was demonstrated — not a universal welcome perk. The
  // destination signal is trusted client-side only (no server-side tracking
  // exists for it); the view-threshold signal is genuinely server-tracked
  // (Auth0's own anonymous session), so this is as trustworthy as the
  // mock-mode equivalent that additionally cross-checks a real counter.
  if (data.bonusEligible) {
    api.user.setUserMetadata('loyaltyPoints', SIGNUP_BONUS_POINTS);
  }
};

/**
 * Post Login — fires on every login.
 * For returning users: updates context from any active anonymous session.
 * Always: sets a favorites claim on the ID token so the client can read
 * user_metadata.favorites without a Management API round-trip.
 */
exports.onExecutePostLogin = async (event, api) => {
  const data = extractAnonData(event);

  // Start with whatever is already in user_metadata; may be overwritten below.
  let claimFavorites = event.user.user_metadata?.favorites ?? null;

  if (data) {
    if (data.destination) {
      api.user.setAppMetadata('last_anon_destination', data.destination);
    }
    if (data.anonUserId)  api.user.setAppMetadata('anon_user_id',   data.anonUserId);
    if (data.sessionId)   api.user.setAppMetadata('anon_session_id', data.sessionId);

    // Merge favorites from anonymous session into user_metadata if they're not
    // already there (e.g. returning user who was browsing anonymously).
    // NOTE: api.user.setUserMetadata() is a scheduled write — event.user.user_metadata
    // is NOT updated in place. Capture the merged array separately and use it for
    // the ID token claim so this session gets the fresh data.
    if (data.favorites?.length > 0) {
      const existing = event.user.user_metadata?.favorites ?? [];
      const merged = [
        ...existing,
        ...data.favorites.filter(f => !existing.some(e => e.id === f.id)),
      ];
      api.user.setUserMetadata('favorites', merged);
      claimFavorites = merged;
    }

    api.accessToken.setCustomClaim(ANON_CLAIM, {
      destination: data.destination,
      session_id:  data.sessionId,
      expires_at:  data.expiresAt,
    });
  }

  // Always include user_metadata.favorites in the ID token so AuthContext can
  // read them from auth0User['https://travelzero.demo/favorites'] without a
  // Management API call. This powers the Dashboard favorites list.
  if (Array.isArray(claimFavorites) && claimFavorites.length > 0) {
    api.idToken.setCustomClaim(FAVS_CLAIM, claimFavorites);
  }

  // Same pattern for the loyalty-points bonus granted at signup (see
  // onExecutePreUserRegistration above) — expose it as a claim on every
  // login, not just the first, so AuthContext.jsx never needs a Management
  // API round-trip just to show the balance.
  const loyaltyPoints = event.user.user_metadata?.loyaltyPoints;
  if (typeof loyaltyPoints === 'number') {
    api.idToken.setCustomClaim(LOYALTY_CLAIM, loyaltyPoints);
  }
};
