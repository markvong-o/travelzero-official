const STORAGE_KEY = 'tz_anon_session_token';
const FAVORITES_KEY = 'tz_anon_favorites';

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

// Anonymous token creation is proxied through the local Express server so the
// Auth0 client secret never has to live in the browser bundle.
export async function createAnonymousSession(domain, clientId, audience, metadata = {}) {
  try {
    const res = await fetch('http://localhost:4001/api/auth/anonymous-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audience, metadata }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (data.session_token) {
      sessionStorage.setItem(STORAGE_KEY, data.session_token);
    }
    return data.session_token ?? null;
  } catch {
    return null;
  }
}

export function destroyAnonymousSession(domain, clientId) {
  sessionStorage.removeItem(STORAGE_KEY);
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
