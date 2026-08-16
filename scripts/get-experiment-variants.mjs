/**
 * Fetches the Device-Segmented Auth Routing experiment from Auth0
 * and prints the control + treatment variation IDs.
 *
 * Usage: node scripts/get-experiment-variants.mjs
 * Requires AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET in server/.env
 * M2M app must have read:experimentation scope granted.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// Parse server/.env without requiring dotenv
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

const expRes = await fetch(
  `https://${AUTH0_DOMAIN}/api/v2/experimentation/experiments/${EXPERIMENT_ID}`,
  { headers: { Authorization: `Bearer ${access_token}` } }
);

const experiment = await expRes.json();

if (experiment.statusCode) {
  console.error('API error:', JSON.stringify(experiment, null, 2));
  process.exit(1);
}

console.log('\nExperiment:', experiment.name ?? experiment.id);
console.log('Status:', experiment.status);
console.log('\nVariations:');

const variations = experiment.variations ?? experiment.feature_flag?.variations ?? [];
variations.forEach(v => {
  const label = v.is_control ? 'control (password-first)' : 'treatment (passkey-first)';
  console.log(`  ${label}: ${v.id}`);
});

console.log('\nFull response:');
console.log(JSON.stringify(experiment, null, 2));
