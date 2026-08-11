/**
 * In-memory store for all application state.
 * This is a simple, stateless-restart-safe store.
 * In production, this would be replaced with a real database.
 */

const store = {
  // Sessions: { [sessionId]: { id, createdAt, userId, isAnonymous, favorites, securityFlag } }
  sessions: {},

  // Users: { [userId]: { id, email, method, passwordHash, user_metadata, loyaltyPoints, createdAt } }
  users: {},

  // Signup events for experiment tracking: [{ userId, bucket, method, completed, timestamp }]
  signupEvents: [],

  // User itineraries: { [userId]: { id, days, totalCost, loyaltyPointsApplied, bookings } }
  itineraries: {},

  // Security flags per user (to simulate breach detection)
  securityFlags: {},

  // Helper: generate UUID-like IDs
  generateId: () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),

  // Helper: get or create a session
  getOrCreateSession: (sessionId = null) => {
    if (sessionId && store.sessions[sessionId]) {
      return store.sessions[sessionId];
    }
    const id = store.generateId();
    const session = {
      id,
      createdAt: new Date().toISOString(),
      userId: null,
      isAnonymous: true,
      favorites: [],
      securityFlag: false,
    };
    store.sessions[id] = session;
    return session;
  },

  // Helper: create a user
  createUser: (email, method, passwordHash = null) => {
    const id = store.generateId();
    const user = {
      id,
      email,
      method, // 'passkey' or 'password'
      passwordHash, // only for password method
      user_metadata: {
        preferences: {
          travelStyle: 'leisurely',
          budget: 'moderate',
          climate: 'warm',
          pace: 'slow',
          interests: ['culture', 'outdoor_activities', 'local_cuisine'],
        },
        profile: {
          name: email.split('@')[0],
          avatar: null,
        },
      },
      loyaltyPoints: 0,
      createdAt: new Date().toISOString(),
    };
    store.users[id] = user;
    return user;
  },

  // Helper: issue a mock token (in production this would be a real JWT)
  issueToken: (userId) => {
    const payload = { userId, iat: Math.floor(Date.now() / 1000) };
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  },

  // Helper: verify and decode a mock token
  verifyToken: (token) => {
    try {
      const payload = JSON.parse(Buffer.from(token, 'base64').toString());
      return payload;
    } catch {
      return null;
    }
  },

  // Helper: find user by email
  findUserByEmail: (email) => {
    return Object.values(store.users).find(u => u.email === email);
  },

  // Helper: migrate session favorites to user
  migrateFavorites: (sessionId, userId) => {
    const session = store.sessions[sessionId];
    const user = store.users[userId];
    if (session && user) {
      user.user_metadata.favorites = session.favorites || [];
    }
  },
};

export default store;
