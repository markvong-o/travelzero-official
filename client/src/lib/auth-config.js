// Dual-mode Auth0 switch: with no VITE_AUTH0_* env vars set (the default), the app
// talks to the mock server exactly as before. Set real values to talk to an actual
// Auth0 tenant instead — no other code changes required.
export function isAuth0Configured() {
  return Boolean(import.meta.env.VITE_AUTH0_DOMAIN && import.meta.env.VITE_AUTH0_CLIENT_ID);
}

export function getAuth0Config() {
  return {
    domain: import.meta.env.VITE_AUTH0_DOMAIN,
    clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
    audience: import.meta.env.VITE_AUTH0_AUDIENCE || undefined,
  };
}
