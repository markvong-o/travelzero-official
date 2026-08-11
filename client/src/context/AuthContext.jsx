import React, { createContext, useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import api from '../api.js';
import { isAuth0Configured } from '../lib/auth-config';

export const AuthContext = createContext();

// Today's fully-mocked flow — talks only to the local mock server. Untouched by
// the dual-mode split below; this is exactly what ran before real Auth0 support existed.
function useMockAuth() {
  const [user, setUser] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [loading, setLoading] = useState(true);

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
    const response = await api.signup(email, method, password, sessionId);
    api.setToken(response.token);
    setUser({
      userId: response.userId,
      email: response.email,
      loyaltyPoints: response.loyaltyPoints,
      user_metadata: { favorites: [] },
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
    setUser(null);
    setIsAnonymous(true);
    api.createSession().then((session) => {
      setSessionId(session.sessionId);
    });
  };

  const addFavorite = async (destination) => {
    if (isAnonymous && sessionId) {
      return;
    }
    const result = await api.addFavorite(destination);
    setUser((prev) => ({
      ...prev,
      user_metadata: { ...prev.user_metadata, favorites: result.favorites },
    }));
  };

  const removeFavorite = async (id) => {
    if (isAnonymous) return;
    const result = await api.removeFavorite(id);
    setUser((prev) => ({
      ...prev,
      user_metadata: { ...prev.user_metadata, favorites: result.favorites },
    }));
  };

  return { user, sessionId, isAnonymous, loading, signup, login, logout, addFavorite, removeFavorite };
}

// Real Auth0 flow — same context shape as useMockAuth() above, so pages never know
// which mode is active. Favorites have no real backend counterpart in this pass
// (see plan §E), so they're tracked as local-only optimistic state here.
function useRealAuth0() {
  const {
    user: auth0User,
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    logout: auth0Logout,
  } = useAuth0();
  const [localFavorites, setLocalFavorites] = useState([]);

  const user = isAuthenticated && auth0User
    ? {
        userId: auth0User.sub,
        email: auth0User.email,
        loyaltyPoints: 0,
        user_metadata: { favorites: localFavorites },
      }
    : null;

  const signup = (email) =>
    loginWithRedirect({
      authorizationParams: { screen_hint: 'signup', login_hint: email || undefined },
    });

  const login = () => loginWithRedirect();

  const logout = () => auth0Logout({ logoutParams: { returnTo: window.location.origin } });

  const addFavorite = async (destination) => {
    setLocalFavorites((prev) => [...prev, destination]);
  };

  const removeFavorite = async (id) => {
    setLocalFavorites((prev) => prev.filter((f) => f.id !== id));
  };

  return {
    user,
    sessionId: null,
    isAnonymous: !isAuthenticated,
    loading: isLoading,
    signup,
    login,
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
