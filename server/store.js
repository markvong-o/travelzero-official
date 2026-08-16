/**
 * In-memory store for all application state.
 * This is a simple, stateless-restart-safe store.
 * In production, this would be replaced with a real database.
 */

const store = {
  // Sessions: { [sessionId]: { id, createdAt, userId, isAnonymous, favorites, securityFlag, viewCounts } }
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
      // Per-destination view counts for the anonymous-conversion signup banner
      // — server-authoritative so /signup can cross-check a client-asserted
      // eligibility flag against real tracked behavior.
      viewCounts: {},
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

// Pre-seed the demo user so Google login works on a fresh server start.
// Emma's favorites give the Dashboard a non-empty state out of the box.
{
  const demoUser = store.createUser('emma@demo.travelzero.com', 'passkey');
  demoUser.loyaltyPoints = 10000;
  demoUser.user_metadata.favorites = [
    { id: 'rome',    name: 'Rome',        region: 'Lazio',    color: 'rome',    tagline: 'The Eternal City' },
    { id: 'amalfi',  name: 'Amalfi Coast',region: 'Campania', color: 'amalfi',  tagline: 'Cliff-Hanging Views' },
    { id: 'tuscany', name: 'Tuscany',     region: 'Toscana',  color: 'tuscany', tagline: 'Rolling Hills & Wine' },
  ];
  // London browsing history — used by the Gemini agentic commerce demo to show
  // personalized recommendations based on what Emma was already considering.
  demoUser.user_metadata.recentlyViewed = {
    flights: {
      route: 'JFK → LHR',
      outbound: 'Sep 5, 2026',
      inbound: 'Sep 9, 2026',
      priceUSD: 420,
      airline: 'British Airways',
      flightNumber: 'BA 178',
      nights: 4,
    },
    hotel: {
      name: 'The Curtain Hotel',
      location: 'Shoreditch, London',
      pricePerNightUSD: 160,
      nights: 4,
      totalUSD: 640,
      checkIn: '2026-09-05',
      checkOut: '2026-09-09',
    },
  };
  demoUser.user_metadata.birthday = '2026-09-11';
}

// Partner registry for Token Vault demo. Thames Cruises Ltd is a TravelZero partner
// whose API credential was stored once at integration time — no per-booking consent.
store.partners = {
  'thames-cruises': {
    id: 'thames-cruises',
    name: 'Thames Cruises Ltd',
    type: 'experience_partner',
    apiEndpoint: 'https://api.thamescruises.example.com/v1',
  },
};

export default store;
