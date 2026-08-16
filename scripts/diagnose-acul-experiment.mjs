/**
 * Diagnoses why forced experiment variations might render identically in ACUL.
 * Checks:
 *   1. Live rendering config for the login-id screen (context_configuration, script src)
 *   2. The exp_device_segmentation experiment's current state + variation IDs
 *
 * Usage: node scripts/diagnose-acul-experiment.mjs
 * Requires AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET in server/.env
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(process.cwd(), 'server/.env');
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => l.split('=').map(s => s.trim()))
);

const { AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET } = env;
const EXPERIMENT_ID = 'exp_uMP2ccYnKbSXPPNF8q1jsh';

const tokenRes = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    client_id: AUTH0_CLIENT_ID,
    client_secret: AUTH0_CLIENT_SECRET,
    audience: `https://${AUTH0_DOMAIN}/api/v2/`,
    grant_type: 'client_credentials',
  }),
});
const { access_token, error } = await tokenRes.json();
if (!access_token) { console.error('Token error:', error); process.exit(1); }
const headers = { Authorization: `Bearer ${access_token}` };

console.log('\n=== 1. login-id screen rendering config ===');
const renderRes = await fetch(`https://${AUTH0_DOMAIN}/api/v2/prompts/login-id/screen/login-id/rendering`, { headers });
const renderData = await renderRes.json();
console.log(JSON.stringify(renderData, null, 2));

if (!renderData.context_configuration?.includes('experiment')) {
  console.log('\n⚠️  context_configuration is missing "experiment" — window.universal_login_context.experiment will be undefined, and the screen will always fall back to the default (password-first) branch regardless of the forced variation_id.');
}

console.log('\n=== 2. exp_device_segmentation experiment ===');
const expRes = await fetch(`https://${AUTH0_DOMAIN}/api/v2/experimentation/experiments/${EXPERIMENT_ID}`, { headers });
const expData = await expRes.json();
console.log(JSON.stringify(expData, null, 2));

if (expData.is_valid === false) {
  console.log('\n⚠️  Experiment is_valid: false — this may prevent Auth0 from evaluating/injecting experiment context at all, even with a forced variation_id.');
}
