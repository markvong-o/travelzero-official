const STORAGE_KEY = 'tz_anon_session_token';
const FAVORITES_KEY = 'tz_anon_favorites';
const DESTINATION_KEY = 'tz_anon_destination';
const BONUS_ELIGIBLE_KEY = 'tz_anon_bonus_eligible';
const LOYALTY_POINTS_KEY = 'tz_anon_loyalty_points';

export function getAnonFavorites() {
  try {
    const raw = sessionStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function setAnonFavorites(favorites) {
  try { sessionStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites)); } catch {}
}

export function clearAnonFavorites() {
  sessionStorage.removeItem(FAVORITES_KEY);
}

export function getAnonDestination() {
  return sessionStorage.getItem(DESTINATION_KEY);
}

export function setAnonDestination(destination) {
  if (destination) {
    sessionStorage.setItem(DESTINATION_KEY, destination);
  } else {
    sessionStorage.removeItem(DESTINATION_KEY);
  }
}

export function getAnonBonusEligible() {
  return sessionStorage.getItem(BONUS_ELIGIBLE_KEY) === 'true';
}

export function setAnonBonusEligible(eligible) {
  if (eligible) {
    sessionStorage.setItem(BONUS_ELIGIBLE_KEY, 'true');
  } else {
    sessionStorage.removeItem(BONUS_ELIGIBLE_KEY);
  }
}

export function getAnonLoyaltyPoints() {
  const raw = sessionStorage.getItem(LOYALTY_POINTS_KEY);
  return raw ? parseInt(raw, 10) : 0;
}

export function setAnonLoyaltyPoints(points) {
  if (points > 0) {
    sessionStorage.setItem(LOYALTY_POINTS_KEY, String(points));
  } else {
    sessionStorage.removeItem(LOYALTY_POINTS_KEY);
  }
}

export function clearAllAnonData() {
  sessionStorage.removeItem(FAVORITES_KEY);
  sessionStorage.removeItem(DESTINATION_KEY);
  sessionStorage.removeItem(BONUS_ELIGIBLE_KEY);
  sessionStorage.removeItem(LOYALTY_POINTS_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
}

// Anonymous token creation MUST be called directly from the browser against the
// Auth0 domain. Auth0 sets an httpOnly session cookie via Set-Cookie; because
// /anonymous/token and /authorize live on the same Auth0 domain, the browser
// sends that cookie automatically on the loginWithRedirect() /authorize navigation,
// which populates event.anonymous_session in Actions.
// credentials: 'include' required; needs travel0.idzero.mvbuilt.com in Allowed
// Web Origins. Public client — no secret sent.
export async function createAnonymousSession(domain, clientId, audience, metadata = {}) {
  console.log('[createAnonymousSession] Called with:', { domain, clientId, audience, metadata });
  try {
    const endpoint = `https://${domain}/anonymous/token`;
    console.log('[createAnonymousSession] Using endpoint:', endpoint);

    const body = {
      client_id: clientId,
      scope: 'anon',
      ...(audience ? { audience } : {}),
      ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    console.log('[createAnonymousSession] Response status:', res.status);

    if (!res.ok) {
      const text = await res.text();
      console.warn(`Anonymous token creation failed (${res.status}):`, text);
      return null;
    }

    const data = await res.json();
    console.log('[createAnonymousSession] Success! Data:', data);
    // Auth0 already set its httpOnly session cookie via Set-Cookie. We keep the
    // returned session_token in sessionStorage for bookkeeping.
    if (data.session_token) {
      sessionStorage.setItem(STORAGE_KEY, data.session_token);
      console.log('[createAnonymousSession] Token stored in sessionStorage; Auth0 cookie set via Set-Cookie');
    }
    return data.session_token ?? null;
  } catch (err) {
    console.error('[createAnonymousSession] Exception:', err);
    return null;
  }
}

export function destroyAnonymousSession(domain, clientId) {
  clearAllAnonData();
  fetch(`https://${domain}/anonymous/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ client_id: clientId }),
  }).catch(() => {});
}

export function getStoredSessionToken() {
  return sessionStorage.getItem(STORAGE_KEY);
}
