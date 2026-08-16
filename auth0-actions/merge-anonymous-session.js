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
 *       - destination: string (destination ID, e.g. "rome")
 *       - favorites:   JSON string — array of { id, name, region, color, tagline }
 *   }
 *
 * REQUIRED: Anonymous Sessions beta must be enabled for your tenant.
 *   See: https://auth0.com/docs/manage-users/sessions/anonymous-sessions/configure-anonymous-sessions
 */

const ANON_CLAIM   = 'https://travelzero.demo/anonymous_session';
const FAVS_CLAIM   = 'https://travelzero.demo/favorites';

function extractAnonData(event) {
  const anon = event.anonymous_session;
  if (!anon) return null;

  let favorites = null;
  if (anon.metadata?.favorites) {
    try { favorites = JSON.parse(anon.metadata.favorites); } catch {}
  }

  return {
    destination: anon.metadata?.destination ?? null,
    favorites:   Array.isArray(favorites) ? favorites : null,
    anonUserId:  anon.user_id,
    sessionId:   anon.session_id,
    expiresAt:   anon.expires_at,
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
};
