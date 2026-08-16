# TravelZero ACUL Screens

Custom Universal Login screens for the `exp_device_segmentation` experiment. Each screen branches between two variants based on `window.universal_login_context.experiment`:

| Variant | `login-id` | `signup-id` |
|---|---|---|
| **Control** (password-first) | Email input → Continue | Email input → Continue |
| **Treatment** (passkey-first) | Email input → Continue with passkey (primary), password toggle | Passkey CTA (primary), password fallback |

Both screens check `client.client_id` before rendering. Non-TravelZero applications on the same tenant receive a minimal standard form so the ACUL configuration doesn't affect them.

`login-id`/`signup-id` only ever collect the identifier — Auth0's Identifier-First
architecture routes password entry to a separate screen (`login-password`,
`signup-password`) with no supported way to merge the two (confirmed by Auth0
staff on their community forum: https://community.auth0.com/t/link-to-custom-prompt-acul-screen/184126).
`login-password.js` and `signup-password.js` build that password step as its own
branded ACUL screen instead of falling back to classic Universal Login. They
don't branch on the experiment — by the time a user reaches password entry
they've already committed to that path, so both always render in the same
"password mode" look (blue accent, carousel on the left). The identifier
collected on the previous screen carries forward automatically via
`screen.screen.data.username` / `screen.screen.data.email`.

---

## Build and deploy

Screens are built with Vite and deployed to GitHub Pages automatically on every push to `main` that touches `acul-templates/`. The workflow is at `.github/workflows/deploy-acul.yml`.

**Enable GitHub Pages first** (one-time):
Repository → Settings → Pages → Source → **GitHub Actions**

After the first successful workflow run the screens are live at:
```
https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPO_NAME/login-id.js
https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPO_NAME/signup-id.js
```

The build also outputs a shared chunk (`themes.js`) in the same directory. Because the screens are ES modules the browser fetches the chunk automatically — no extra configuration needed.

**To build locally:**
```bash
cd acul-templates
npm install
npm run build
# outputs to acul-templates/dist/
```

---

## Deploy via Management API

### 1. Enable ACUL rendering on each screen

Replace `YOUR_DOMAIN`, `YOUR_MGMT_TOKEN`, and `YOUR_PAGES_URL` with real values.
`YOUR_PAGES_URL` is your GitHub Pages base URL, e.g. `https://markvong-o.github.io/travelzero`.

The screens are built as ES modules, so the script tag uses `type: "module"`. The browser
fetches the shared `themes.js` chunk automatically from the same directory.

**Login identifier screen:**

```bash
curl -X PATCH "https://YOUR_DOMAIN/api/v2/prompts/login-id/screen/login-id/rendering" \
  -H "Authorization: Bearer YOUR_MGMT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rendering_mode": "advanced",
    "context_configuration": ["experiment"],
    "head_tags": [
      {
        "tag": "script",
        "attributes": {
          "src": "YOUR_PAGES_URL/login-id.js",
          "type": "module"
        }
      }
    ]
  }'
```

**Signup identifier screen:**

```bash
curl -X PATCH "https://YOUR_DOMAIN/api/v2/prompts/signup-id/screen/signup-id/rendering" \
  -H "Authorization: Bearer YOUR_MGMT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rendering_mode": "advanced",
    "context_configuration": ["experiment"],
    "head_tags": [
      {
        "tag": "script",
        "attributes": {
          "src": "YOUR_PAGES_URL/signup-id.js",
          "type": "module"
        }
      }
    ]
  }'
```

The `"context_configuration": ["experiment"]` opt-in is required for `window.universal_login_context.experiment` to be populated inside the screen.

**Login password screen:**

No `context_configuration` needed — this screen doesn't branch on the experiment.

```bash
curl -X PATCH "https://YOUR_DOMAIN/api/v2/prompts/login-password/screen/login-password/rendering" \
  -H "Authorization: Bearer YOUR_MGMT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rendering_mode": "advanced",
    "head_tags": [
      {
        "tag": "script",
        "attributes": {
          "src": "YOUR_PAGES_URL/login-password.js",
          "type": "module"
        }
      }
    ]
  }'
```

**Signup password screen:**

```bash
curl -X PATCH "https://YOUR_DOMAIN/api/v2/prompts/signup-password/screen/signup-password/rendering" \
  -H "Authorization: Bearer YOUR_MGMT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rendering_mode": "advanced",
    "head_tags": [
      {
        "tag": "script",
        "attributes": {
          "src": "YOUR_PAGES_URL/signup-password.js",
          "type": "module"
        }
      }
    ]
  }'
```

### 2. Reset ACUL (revert to standard ULP)

```bash
curl -X PATCH "https://YOUR_DOMAIN/api/v2/prompts/login-id/screen/login-id/rendering" \
  -H "Authorization: Bearer YOUR_MGMT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "rendering_mode": "standard" }'
```

---

## Scoping to TravelZero only

ACUL rendering is configured per-screen at the **tenant level** — there is no native per-client-ID rendering configuration in the Management API. The `client_id` guard in both screen files handles this:

```js
const isTravelZero = ctx.client?.client_id === 'Sf9FmZInlomeJpEoxnCyKE00s46pmFL2';
// Non-TravelZero clients get a minimal standard form
```

For a cleaner solution in a multi-app production tenant, create a separate dev tenant scoped to TravelZero only, or submit a feature request for per-client ACUL rendering configuration.

---

## Testing before activating the experiment

Force a specific variant using query parameters on the `/authorize` call — no experiment activation required:

```js
// In AuthContext.jsx login() / signup(), add to authorizationParams:
{
  experiment_id: 'exp_uMP2ccYnKbSXPPNF8q1jsh',   // exp_device_segmentation
  variation_id: 'YOUR_TREATMENT_VARIATION_ID',   // from Experiment Center dashboard
}
```

Or append directly to the authorize URL:
```
https://YOUR_DOMAIN/authorize?...&experiment_id=exp_uMP2ccYnKbSXPPNF8q1jsh&variation_id=VARIATION_ID
```

This triggers the treatment variant for your session without affecting other users.

---

## Screens covered

| Prompt | Screen | File |
|---|---|---|
| `login-id` | Login identifier | `screens/login-id.js` |
| `signup-id` | Signup identifier | `screens/signup-id.js` |
| `login-password` | Login password | `screens/login-password.js` |
| `signup-password` | Signup password | `screens/signup-password.js` |

`login-passkey` (the WebAuthn challenge screen) doesn't need an ACUL build —
`passkeyLogin()` on the `login-id` screen triggers the WebAuthn ceremony
directly via `navigator.credentials.get()` without ever navigating there.
