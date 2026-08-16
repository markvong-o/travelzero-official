/**
 * Auth0 Action: Assign Experiment Variant
 * Trigger: Login / Post Login
 *
 * SETUP:
 *   1. Auth0 Dashboard → Actions → Library → Build Custom
 *   2. Choose trigger: "Login / Post Login"
 *   3. Paste this file, deploy, and drag it into the Login Flow
 *
 * WHAT IT DOES:
 *   Auth0 injects event.experiment when an active Experiment Center experiment
 *   assigns the current user to a variation. This Action maps that assignment to
 *   TravelZero's internal experiment IDs, persists it to app_metadata so it
 *   survives across logins, and adds it as a custom ID token claim so the client
 *   reads it immediately after login.
 *
 * Auth0 experiment IDs → TravelZero app experiment IDs:
 *   exp_wPe1df6nVSsqtNvxAUkr7P  →  exp_passkey_enrollment   (Passkey Broad Rollout, active)
 *   exp_uMP2ccYnKbSXPPNF8q1jsh  →  exp_device_segmentation  (Device-Segmented Auth Routing, draft)
 *
 * Feature flags:
 *   flg_sxHxHsKYByqbLVYFt1gVTo  Passkey Enrollment Nudge    param: show_nudge (boolean)
 *   flg_2BJjgQ8xRWng4VhyKPHpij  Device Auth Cohort          param: target_cohort (string)
 *
 * REQUIRED: Experiment Center beta must be enabled for your dev tenant.
 *   See: https://auth0.com/docs/customize/experiment-center/overview
 */

const EXPERIMENT_MAP = {
  'exp_wPe1df6nVSsqtNvxAUkr7P': 'exp_passkey_enrollment',
  'exp_uMP2ccYnKbSXPPNF8q1jsh': 'exp_device_segmentation',
};

// Must match the namespace used in client/src/context/AuthContext.jsx
const CLAIM_NAMESPACE = 'https://travelzero.demo/experiments';

// Scope experiments to TravelZero only. Experiment Center is tenant-wide —
// the segment handles this for Experiment 2 (segment-based), but percentage
// experiments have no native client filter, so we guard here for Experiment 1.
const TRAVELZERO_CLIENT_ID = 'Sf9FmZInlomeJpEoxnCyKE00s46pmFL2';

exports.onExecutePostLogin = async (event, api) => {
  if (event.client.client_id !== TRAVELZERO_CLIENT_ID) return;

  const experiment = event.experiment;
  if (!experiment) return;

  const appExperimentId = EXPERIMENT_MAP[experiment.experiment_id];
  if (!appExperimentId) return;

  // event.experiment.is_control is always available — use it rather than
  // reading from variation override params, which requires variation-name coupling.
  const variant = experiment.is_control ? 'control' : 'treatment';

  // Accumulate across experiments: preserve any prior assignments, only update
  // the current experiment so concurrent/sequential experiments coexist cleanly.
  const prior = event.user.app_metadata?.experiments ?? {};
  const updated = { ...prior, [appExperimentId]: variant };

  api.user.setAppMetadata('experiments', updated);

  // Custom ID token claim — client reads auth0User['https://travelzero.demo/experiments']
  // to seed ExperimentContext on login without a Management API round-trip.
  api.idToken.setCustomClaim(CLAIM_NAMESPACE, updated);

  // For the device segmentation experiment: also stamp the actual cohort label
  // so the analytics pipeline can read it without decoding the variation ID.
  if (appExperimentId === 'exp_device_segmentation') {
    const cohort = experiment.config?.target_cohort?.value ?? 'otp_primary';
    api.accessToken.setCustomClaim('https://travelzero.demo/auth_cohort', cohort);
  }
};
