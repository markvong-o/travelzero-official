import React, { createContext, useState, useEffect, useMemo } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import api from '../api.js';
import { isAuth0Configured, getAuth0Config } from '../lib/auth-config';
import {
  createAnonymousSession,
  destroyAnonymousSession,
  getStoredSessionToken,
  getAnonFavorites,
  setAnonFavorites,
  clearAnonFavorites,
} from '../lib/anonymous-sessions';
import { useExperimentContext } from './ExperimentContext';

// Custom ID token claim namespace — must match assign-experiment-variant.js Action.
const EXPERIMENT_CLAIM = 'https://travelzero.demo/experiments';

export const AuthContext = createContext();

// Today's fully-mocked flow — talks only to the local mock server.
function useMockAuth() {
  const [user, setUser] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [loading, setLoading] = useState(true);
  const [anonFavorites, setAnonFavoritesState] = useState(() => getAnonFavorites());

  useEffect(() => {
    const initSession = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          api.setToken(token);
          const userData = await api.getMe();
          setUser(userData);
          setIsAnonymous(false);
        } else {
          const session = await api.createSession();
          setSessionId(session.sessionId);
          setIsAnonymous(true);
        }
      } catch (error) {
        console.error('Failed to initialize session:', error);
        try {
          const session = await api.createSession();
          setSessionId(session.sessionId);
        } catch (e) {
          console.error('Failed to create session:', e);
        }
      } finally {
        setLoading(false);
      }
    };

    initSession();
  }, []);

  const signup = async (email, method, password = null) => {
    const favorites = getAnonFavorites();
    const response = await api.signup(email, method, password, sessionId, favorites);
    api.setToken(response.token);
    clearAnonFavorites();
    setAnonFavoritesState([]);
    setUser({
      userId: response.userId,
      email: response.email,
      loyaltyPoints: response.loyaltyPoints,
      user_metadata: { favorites: response.favorites ?? favorites },
    });
    setIsAnonymous(false);
    return response;
  };

  const login = async (email, method, password = null) => {
    const response = await api.login(email, method, password);
    api.setToken(response.token);
    const userData = await api.getMe();
    setUser(userData);
    setIsAnonymous(false);
    return response;
  };

  const logout = () => {
    api.clearToken();
    clearAnonFavorites();
    setAnonFavoritesState([]);
    setUser(null);
    setIsAnonymous(true);
    api.createSession().then((session) => {
      setSessionId(session.sessionId);
    });
  };

  const addFavorite = async (destination) => {
    if (isAnonymous) {
      const updated = [...getAnonFavorites().filter(f => f.id !== destination.id), destination];
      setAnonFavorites(updated);
      setAnonFavoritesState(updated);
      return;
    }
    const result = await api.addFavorite(destination);
    setUser((prev) => ({
      ...prev,
      user_metadata: { ...prev.user_metadata, favorites: result.favorites },
    }));
  };

  const removeFavorite = async (id) => {
    if (isAnonymous) {
      const updated = getAnonFavorites().filter(f => f.id !== id);
      setAnonFavorites(updated);
      setAnonFavoritesState(updated);
      return;
    }
    const result = await api.removeFavorite(id);
    setUser((prev) => ({
      ...prev,
      user_metadata: { ...prev.user_metadata, favorites: result.favorites },
    }));
  };

  return { user, sessionId, isAnonymous, loading, anonFavorites, signup, login, loginWithVariant: () => {}, logout, addFavorite, removeFavorite };
}

// Real Auth0 flow — same context shape as useMockAuth() above, so pages never know
// which mode is active. Favorites are tracked as local-only optimistic state.
// Anonymous Sessions: creates a real /anonymous/token on mount (beta feature — degrades
// gracefully to isAnonymous: !isAuthenticated if the tenant doesn't have it enabled).
// Experiment Center: reads custom token claims set by the assign-experiment-variant Action
// and seeds ExperimentContext so variant-driven UI reflects real Auth0 assignment.
function useRealAuth0() {
  const {
    user: auth0User,
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    logout: auth0Logout,
  } = useAuth0();
  const [localFavorites, setLocalFavorites] = useState(() => getAnonFavorites());
  const [anonSessionToken, setAnonSessionToken] = useState(() => getStoredSessionToken());
  const { domain, clientId, audience } = getAuth0Config();
  const { setVariant } = useExperimentContext();

  // Create an anonymous session on first load only if the user is not already
  // authenticated. Auth0 anonymous sessions are pre-auth only — once the user
  // has identified themselves the session is consumed. The next anon session is
  // created by logout(), so there is never a gap for anonymous visitors.
  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) return;
    if (!anonSessionToken) {
      createAnonymousSession(domain, clientId, audience, {}).then(setAnonSessionToken);
    }
  }, [isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // When the user completes login: sync a mock server session so all Express
  // routes (Assistant, Gemini, Security, etc.) keep working without per-page
  // guards. Uses the Auth0 email to create-or-login a shadow mock user and
  // stores the mock token on the api client.
  useEffect(() => {
    if (!isAuthenticated || !auth0User?.email) return;

    const syncMockSession = async () => {
      try {
        // syncOnly=true: skip Management API — Auth0 user already exists, we just
        // need a shadow session token for the mock Express routes.
        const res = await api.signup(auth0User.email, 'passkey', null, null, null, true);
        api.setToken(res.token);
      } catch { /* mock server unavailable — pages degrade gracefully */ }
    };
    syncMockSession();

    // Merge anon favorites (collected before login) with any token-claim favorites
    // written by the post-login Action. Fall back to localStorage backup when
    // sessionStorage was cleared by a cross-origin redirect (Safari ITP, etc.).
    const sessionFavs = getAnonFavorites();
    const pendingRaw = localStorage.getItem('tz_pending_favorites');
    const pendingFavs = pendingRaw ? (() => { try { return JSON.parse(pendingRaw); } catch { return []; } })() : [];
    localStorage.removeItem('tz_pending_favorites');
    const anonFavs = sessionFavs.length > 0 ? sessionFavs : pendingFavs;
    const tokenFavs = auth0User?.['https://travelzero.demo/favorites'] ?? [];
    const merged = [...tokenFavs, ...anonFavs.filter(a => !tokenFavs.some(t => t.id === a.id))];
    if (merged.length > 0) setLocalFavorites(merged);
    if (anonFavs.length > 0 && auth0User?.sub) {
      api.syncFavorites(auth0User.sub, merged).catch(() => {});
    }

    clearAnonFavorites();

    if (anonSessionToken) {
      destroyAnonymousSession(domain, clientId);
      setAnonSessionToken(null);
    }
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Seed experiment variants from the custom ID token claim written by the
  // assign-experiment-variant Action.
  useEffect(() => {
    if (!isAuthenticated || !auth0User) return;
    const claims = auth0User[EXPERIMENT_CLAIM];
    if (!claims || typeof claims !== 'object') return;
    Object.entries(claims).forEach(([experimentId, variant]) => {
      if (variant === 'control' || variant === 'treatment') {
        setVariant(experimentId, variant);
      }
    });
  }, [isAuthenticated, auth0User]); // eslint-disable-line react-hooks/exhaustive-deps

  // localFavorites is the mutable source of truth for the current session.
  // The isAuthenticated effect seeds it from the token claim on login, so it
  // already reflects user_metadata.favorites. Using the token claim directly
  // here would make it immutable — add/remove wouldn't update the UI.
  const user = useMemo(
    () => isAuthenticated && auth0User
      ? {
          userId: auth0User.sub,
          email: auth0User.email,
          loyaltyPoints: 0,
          user_metadata: { favorites: localFavorites },
        }
      : null,
    [isAuthenticated, auth0User?.sub, auth0User?.email, localFavorites] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // On signup: create a fresh anonymous token with the current favorites and
  // destination baked into the metadata so the pre-user-registration Action
  // can write them to the new user's profile.
  const signup = async (email, _method, _password, metadata = {}) => {
    const favorites = getAnonFavorites();
    const sessionMetadata = {
      ...(metadata.destination ? { destination: metadata.destination } : {}),
      ...(favorites.length > 0 ? { favorites: JSON.stringify(favorites) } : {}),
    };
    const freshToken = await createAnonymousSession(
      domain, clientId, audience, sessionMetadata
    );
    const token = freshToken ?? anonSessionToken;
    if (freshToken) setAnonSessionToken(freshToken);

    return loginWithRedirect({
      appState: { returnTo: metadata.returnTo || '/dashboard' },
      authorizationParams: {
        screen_hint: 'signup',
        login_hint: email || undefined,
        ...(token ? { 'Auth0-Anonymous-Session': token } : {}),
      },
    });
  };

  const loginWithVariant = (variant) => loginWithRedirect({
    authorizationParams: {
      prompt: 'login',
      experiment_id: 'exp_uMP2ccYnKbSXPPNF8q1jsh',
      variation_id: variant === 'passkey'
        ? 'var_qK6ZV13YwmWpm8L4ugaKhu'  // treatment: passkey-first
        : 'var_3hZCybt6ajZWeXZfQkkhHM', // control: password-first
    },
  });

  const login = async (returnTo = '/dashboard') => {
    const favorites = getAnonFavorites();
    let token = anonSessionToken;
    // Bake current favorites into a fresh anon session so the post-login Action
    // can read event.anonymous_session.metadata.favorites and merge them.
    if (favorites.length > 0) {
      // localStorage backup: some browsers (Safari ITP, Firefox strict) clear
      // sessionStorage on cross-origin redirects, which would lose the anon favorites.
      localStorage.setItem('tz_pending_favorites', JSON.stringify(favorites));
      const freshToken = await createAnonymousSession(domain, clientId, audience, {
        favorites: JSON.stringify(favorites),
      });
      if (freshToken) { setAnonSessionToken(freshToken); token = freshToken; }
    }
    return loginWithRedirect({
      appState: { returnTo },
      authorizationParams: {
        ...(token ? { 'Auth0-Anonymous-Session': token } : {}),
      },
    });
  };

  const logout = () => {
    clearAnonFavorites();
    setLocalFavorites([]);
    api.clearToken(); // remove stale mock token so the Dashboard fast-path is used on next login
    destroyAnonymousSession(domain, clientId);
    setAnonSessionToken(null);
    auth0Logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const addFavorite = async (destination) => {
    // Post-login: sessionStorage is cleared, use localFavorites state as the base.
    // Pre-login: keep sessionStorage in sync for the anon→login carry-through.
    const base = isAuthenticated ? localFavorites : getAnonFavorites();
    const updated = [...base.filter(f => f.id !== destination.id), destination];
    if (!isAuthenticated) setAnonFavorites(updated);
    setLocalFavorites(updated);
    if (isAuthenticated && auth0User?.sub) {
      api.syncFavorites(auth0User.sub, updated).catch(() => {});
    }
  };

  const removeFavorite = async (id) => {
    const base = isAuthenticated ? localFavorites : getAnonFavorites();
    const updated = base.filter(f => f.id !== id);
    if (!isAuthenticated) setAnonFavorites(updated);
    setLocalFavorites(updated);
    if (isAuthenticated && auth0User?.sub) {
      api.syncFavorites(auth0User.sub, updated).catch(() => {});
    }
  };

  return {
    user,
    sessionId: anonSessionToken ?? null,
    isAnonymous: !isAuthenticated,
    loading: isLoading,
    anonFavorites: isAuthenticated ? [] : localFavorites,
    signup,
    login,
    loginWithVariant,
    logout,
    addFavorite,
    removeFavorite,
  };
}

export function AuthProvider({ children }) {
  // eslint-disable-next-line react-hooks/rules-of-hooks -- isAuth0Configured() is static for the process lifetime
  const auth = isAuth0Configured() ? useRealAuth0() : useMockAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
