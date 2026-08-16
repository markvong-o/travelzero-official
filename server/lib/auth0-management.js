// Dual-mode Auth0 Management API client. With no AUTH0_* env vars set (the
// default), isAuth0Configured() is false and callers fall back to the in-memory
// mock store — zero network calls attempted. Set real values to create actual
// Auth0 users via the Management API instead.
let cachedToken = null;
let cachedTokenExpiresAt = 0;

export function isAuth0Configured() {
  return Boolean(process.env.AUTH0_DOMAIN && process.env.AUTH0_CLIENT_ID && process.env.AUTH0_CLIENT_SECRET);
}

async function getManagementToken() {
  const now = Date.now();
  if (cachedToken && now < cachedTokenExpiresAt - 30_000) {
    return cachedToken;
  }

  const response = await fetch(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: process.env.AUTH0_CLIENT_ID,
      client_secret: process.env.AUTH0_CLIENT_SECRET,
      audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to obtain Auth0 Management API token: ${response.status}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  cachedTokenExpiresAt = now + data.expires_in * 1000;
  return cachedToken;
}

// Patches user_metadata for an existing Auth0 user via PATCH /api/v2/users/{id}.
// Merges the provided fields into the existing user_metadata (Auth0 does a shallow merge).
export async function patchUserMetadata(userId, user_metadata) {
  const token = await getManagementToken();

  const response = await fetch(`https://${process.env.AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ user_metadata }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Auth0 user_metadata patch failed: ${response.status}`);
  }

  return data;
}

// Creates a real Auth0 user via POST /api/v2/users.
// https://auth0.com/docs/api/management/v2/users/post-users
export async function createManagementUser({ email, password, connection = 'Username-Password-Authentication' }) {
  const token = await getManagementToken();

  const response = await fetch(`https://${process.env.AUTH0_DOMAIN}/api/v2/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      email,
      password: password || crypto.randomUUID(),
      connection,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Auth0 Management API user creation failed: ${response.status}`);
  }

  return data;
}
