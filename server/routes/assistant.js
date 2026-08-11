import express from 'express';
import store from '../store.js';

const router = express.Router();

/**
 * Helper: Extract user from token
 */
const authenticateUser = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  const payload = store.verifyToken(token);
  if (!payload || !payload.userId) {
    return null;
  }
  return store.users[payload.userId];
};

/**
 * Mock itinerary generator
 * In production, this would call an actual LLM or travel API.
 */
const generateItinerary = (prompt, userPreferences, loyaltyPoints) => {
  // Simple mock: parse the prompt to determine budget and duration
  const budgetMatch = prompt.match(/\$(\d+)/);
  const budget = budgetMatch ? parseInt(budgetMatch[1]) : 2000;
  const weekendMatch = prompt.match(/weekend|3\s*days?|long\s*weekend/i);
  const duration = weekendMatch ? 3 : 5;

  // Calculate loyalty points to apply (try to use up to 50% of available)
  const loyaltyToUse = Math.min(Math.floor(loyaltyPoints * 0.5), Math.floor(budget * 0.2));

  const days = [];
  const activities = [
    'Visit the Colosseum',
    'Explore Roman Forum',
    'Hike to Positano viewpoint',
    'Sunset boat tour in Amalfi',
    'Wine tasting in Chianti',
    'Tuscan countryside tour',
    'Lake Como sunset cruise',
    'Bellagio market exploration',
    'Local trattoria dinner',
    'Museum of Roman Civilization',
  ];

  for (let i = 0; i < duration; i++) {
    days.push({
      day: i + 1,
      title: ['Rome adventure', 'Amalfi Coast', 'Tuscany wine country', 'Lake Como retreat', 'Farewell day'][i] || `Day ${i + 1}`,
      activities: [activities[i * 2], activities[i * 2 + 1]],
      estimatedCost: Math.round(budget / duration),
    });
  }

  return {
    title: 'Your Italian Getaway',
    duration,
    totalCost: budget,
    loyaltyPointsApplied: loyaltyToUse,
    estimatedNetCost: budget - loyaltyToUse * 0.01, // 1 point = 0.01 USD
    days,
  };
};

/**
 * POST /api/assistant/chat
 * Chat with the travel assistant to generate an itinerary.
 * Demonstrates scoped access to user preferences.
 *
 * Mock: "Agent as Principal" isn't a shipped, first-class Auth0 entity yet (it's an
 * Early Access roadmap item as of this writing) — today, an agent like this is really
 * registered as a Machine-to-Machine application authenticating via the Client
 * Credentials grant, and the *delegation* (the agent acting for this specific user,
 * with only a slice of their data) is modeled with an actor claim per RFC 8693 token
 * exchange: `{ sub: <user>, act: { sub: <agent_client_id> } }`. The upcoming Auth0
 * feature is expected to add first-class fields (agent_id, agent_type, publisher) on
 * top of that same claim. Scopes below follow Auth0's real `verb:resource` naming
 * convention (e.g. how Management API scopes like `read:users` are formed) applied to
 * a custom API.
 */
router.post('/chat', (req, res) => {
  const user = authenticateUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Missing message' });
  }

  // Generate itinerary based on user message and preferences
  const itinerary = generateItinerary(
    message,
    user.user_metadata.preferences,
    user.loyaltyPoints
  );

  // Mock: Agent identity and scope info
  // In production, this would come from the actual agent context/token.
  const agentClientId = 'agent_travelzero_assistant';
  const agentResponse = {
    message: `I've crafted a ${itinerary.duration}-day Italian itinerary for you! Based on your preferences for ${user.user_metadata.preferences.interests.join(', ')}, I've selected experiences that match your travel style. I've also applied ${itinerary.loyaltyPointsApplied.toLocaleString()} loyalty points to reduce your cost.`,
    itinerary,
    agentMetadata: {
      agentPrincipal: 'travelzero-assistant',
      // Mock: RFC 8693 actor claim — the agent (M2M client) acting for this user.
      actorClaim: { sub: user.id, act: { sub: agentClientId } },
      agentId: agentClientId,
      scopesUsed: ['read:travel_preferences', 'read:user_metadata'],
      accessLog: [
        { resource: 'user_metadata.preferences.interests', action: 'read' },
        { resource: 'user_metadata.preferences.travelStyle', action: 'read' },
        { resource: 'loyaltyPoints', action: 'read' },
      ],
    },
  };

  res.json(agentResponse);
});

/**
 * POST /api/assistant/agent-book
 * Demonstrates an external agent (e.g., Gemini) proactively booking an add-on.
 * This showcases the frictionless, delegated booking flow backed by Token Vault +
 * Auth for MCP — both real, currently-documented Auth0 features.
 *
 * Mock, grounded in the real mechanisms:
 * - Token Vault's actual token-exchange grant type is
 *   `urn:auth0:params:oauth:grant-type:token-exchange:federated-connection-access-token`,
 *   redeemed at `POST https://{tenant}.auth0.com/oauth/token` with a `connection`
 *   parameter (e.g. `google-oauth2`) and the user's Auth0 access token as `subject_token`.
 *   It always returns a short-lived (~1hr) downstream token — Auth0 refreshes it behind
 *   the scenes. The "Privileged Worker" pattern layers standard RFC 8693 token exchange
 *   on top (subject_token = user, actor_token = the worker/agent), returning a token
 *   whose JWT carries an `act` claim identifying the worker — that's what's reflected in
 *   `bookingReceipt.actorClaim` below, not a literal "tv_ref" string.
 * - Auth for MCP scopes the resulting token to a specific MCP server via the `resource`
 *   parameter (RFC 8707); the MCP server itself is discoverable via RFC 9728 protected
 *   resource metadata at `/.well-known/oauth-protected-resource`. `mcp.resource` and
 *   `mcp.audience` below approximate that.
 * Docs: https://auth0.com/docs/secure/tokens/token-vault,
 *       Auth0 "Auth for MCP" (auth0.com/ai)
 *
 * Body:
 * {
 *   externalAgentId: string,
 *   booking: { name, description, cost, type }
 * }
 */
router.post('/agent-book', (req, res) => {
  const user = authenticateUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { externalAgentId, booking } = req.body;
  if (!externalAgentId || !booking) {
    return res.status(400).json({ error: 'Missing externalAgentId or booking' });
  }

  // Verify booking details
  const { name, description, cost, type } = booking;
  if (!name || !cost) {
    return res.status(400).json({ error: 'Invalid booking details' });
  }

  // Create or update itinerary with the new booking
  if (!store.itineraries[user.id]) {
    store.itineraries[user.id] = {
      id: store.generateId(),
      title: 'Italian Adventure',
      duration: 3,
      totalCost: 0,
      days: [],
      addOns: [],
    };
  }

  if (!store.itineraries[user.id].addOns) {
    store.itineraries[user.id].addOns = [];
  }

  const addOn = {
    id: store.generateId(),
    name,
    description,
    cost,
    type,
    bookedBy: externalAgentId,
    bookedAt: new Date().toISOString(),
  };

  store.itineraries[user.id].addOns.push(addOn);
  store.itineraries[user.id].totalCost += cost;

  // Mock: masked downstream token as Token Vault would return from its
  // federated-connection-access-token exchange grant (real tokens are never
  // returned to the calling client in full — only used server-side).
  const tokenVaultRef = 'tv_' + store.generateId().substring(0, 8);

  const receipt = {
    success: true,
    booking: addOn,
    bookingReceipt: {
      id: store.generateId(),
      externalAgentId,
      agentIdentity: externalAgentId === 'gemini' ? 'Google Gemini Travel Agent' : externalAgentId,
      delegatedScope: ['create:bookings'],
      // Mock: RFC 8693 actor claim from the Token Vault "privileged worker" exchange.
      actorClaim: { sub: user.id, act: { sub: externalAgentId } },
      tokenVault: {
        grantType: 'urn:auth0:params:oauth:grant-type:token-exchange:federated-connection-access-token',
        tokenReference: tokenVaultRef,
        expiresIn: 3600,
      },
      mcp: {
        toolInvoked: 'travelzero.bookings.create',
        resource: 'https://mcp.travelzero.example.com',
        toolParams: {
          user_id: user.id,
          booking_name: name,
          booking_cost: cost,
        },
      },
      timestamp: new Date().toISOString(),
      message: `Booked on your behalf by ${externalAgentId}`,
    },
  };

  res.json(receipt);
});

export default router;
