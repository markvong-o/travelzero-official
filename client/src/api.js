/**
 * API wrapper for TravelZero backend
 * Handles all communication with the Express server on port 4001
 */

const API_BASE_URL = 'http://localhost:4001/api';

class APIClient {
  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw {
        status: response.status,
        ...data,
      };
    }

    return data;
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  // Session endpoints
  createSession() {
    return this.request('/session', { method: 'POST' });
  }

  getSession(sessionId) {
    return this.request(`/session/${sessionId}`, { method: 'GET' });
  }

  // Auth endpoints
  signup(email, method, password = null, sessionId = null, favorites = null, syncOnly = false, destination = null) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, method, password, sessionId, favorites, syncOnly, destination }),
    });
  }

  login(email, method, password = null) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, method, password }),
    });
  }

  resetPassword(email, newPassword) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, newPassword }),
    });
  }

  // Account endpoints
  getMe() {
    return this.request('/account/me', { method: 'GET' });
  }

  updateMe(updates) {
    return this.request('/account/me', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  addFavorite(destination) {
    return this.request('/account/favorites', {
      method: 'POST',
      body: JSON.stringify({ destination }),
    });
  }

  removeFavorite(id) {
    return this.request(`/account/favorites/${id}`, {
      method: 'DELETE',
    });
  }

  syncFavorites(userId, favorites) {
    return this.request('/account/favorites/sync', {
      method: 'PUT',
      body: JSON.stringify({ userId, favorites }),
    });
  }

  shareItinerary() {
    return this.request('/account/share-itinerary', {
      method: 'POST',
    });
  }

  // Assistant endpoints
  chat(message) {
    return this.request('/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  agentBook(externalAgentId, booking) {
    return this.request('/assistant/agent-book', {
      method: 'POST',
      body: JSON.stringify({ externalAgentId, booking }),
    });
  }

  // Security endpoints
  flagSecurity() {
    return this.request('/security/flag', {
      method: 'POST',
    });
  }

  getSecurityStatus() {
    return this.request('/security/status', {
      method: 'GET',
    });
  }

  // Experiment endpoints
  getPasskeyTestStats() {
    return this.request('/experiments/passkey-test', {
      method: 'GET',
    });
  }

  getAuth0Experiments() {
    return this.request('/experiments/auth0', { method: 'GET' });
  }

  getUcpProfile() {
    return this.request('/assistant/ucp-profile', { method: 'GET' });
  }

  agentBookLondon() {
    return this.request('/assistant/agent-book-london', {
      method: 'POST',
      body: JSON.stringify({ externalAgentId: 'gemini' }),
    });
  }
}

export default new APIClient();
