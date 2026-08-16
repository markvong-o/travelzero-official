// Tracks per-destination view counts for the anonymous-conversion banner.
// Client-tracked first (instant, works identically with or without Auth0
// configured) and mirrored to the mock server second (fire-and-forget) so
// mock mode's /signup handler has a genuinely server-authoritative count to
// cross-check against, rather than trusting a client-asserted flag.
const VIEW_COUNT_PREFIX = 'tz_view_count_';
const BANNER_SEEN_KEY = 'tz_banner_seen';

export function getViewCount(destination) {
  try {
    return parseInt(sessionStorage.getItem(`${VIEW_COUNT_PREFIX}${destination}`) || '0', 10);
  } catch {
    return 0;
  }
}

// Increments and returns the new count immediately (optimistic, client-side).
// If a sessionId is available (mock mode), mirrors the view to the server in
// the background — not awaited, since the banner-trigger decision needs to be
// instant either way.
export function trackView(destination, sessionId) {
  const next = getViewCount(destination) + 1;
  try {
    sessionStorage.setItem(`${VIEW_COUNT_PREFIX}${destination}`, String(next));
  } catch {}

  if (sessionId) {
    fetch(`http://localhost:4001/api/session/${sessionId}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination }),
    }).catch(() => {});
  }

  return next;
}

export function meetsViewThreshold(destination = 'london', threshold = 3) {
  return getViewCount(destination) >= threshold;
}

export function hasSeenBanner() {
  try {
    return sessionStorage.getItem(BANNER_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

export function markBannerSeen() {
  try {
    sessionStorage.setItem(BANNER_SEEN_KEY, '1');
  } catch {}
}

// Called on login/logout, mirrors anonymous-sessions.js's cleanup — a fresh
// anonymous visitor (post-logout) should start browsing signal from scratch.
export function clearViewTracking() {
  try {
    Object.keys(sessionStorage)
      .filter((k) => k.startsWith(VIEW_COUNT_PREFIX))
      .forEach((k) => sessionStorage.removeItem(k));
    sessionStorage.removeItem(BANNER_SEEN_KEY);
  } catch {}
}
