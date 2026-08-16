/**
 * ACUL Screen: passkey-enrollment (Passkey setup step)
 *
 * Passwordless signup variant only. After email verification, users are invited
 * to enroll a passkey. This screen is optional — they can skip it and come back
 * to the dashboard with email+password login, or set up a passkey now for a
 * seamless future experience.
 *
 * The SDK handles the full WebAuthn credential creation ceremony internally.
 * The only jobs of this screen are: (1) render the enrollment prompt, (2) wire
 * the buttons to the SDK, (3) handle WebAuthn errors gracefully.
 *
 * Scoping:
 *   TravelZero → branded passkey enrollment card
 *   All other apps → branded form using the per-app theme
 */

import PasskeyEnrollment from '@auth0/auth0-acul-js/passkey-enrollment';
import { getTheme } from './shared/themes.js';

const TRAVELZERO_CLIENT_ID = 'Sf9FmZInlomeJpEoxnCyKE00s46pmFL2';
const TZ_LOGO = 'https://markvong-o.github.io/openmoji-icons/2708.png';

let screen, ctx, clientId, isTravelZero, appTheme;

try {
  screen = new PasskeyEnrollment();
  ctx = window.universal_login_context;
  clientId = ctx.client?.id;
  isTravelZero = clientId === TRAVELZERO_CLIENT_ID;
  appTheme = getTheme(clientId);
} catch (err) {
  console.error('[TravelZero ACUL] Failed to initialize screen context:', err);
}

injectStyles(isTravelZero, appTheme ?? getTheme(null));

const root = document.getElementById('custom-screen-content') ?? document.body;
root.innerHTML = isTravelZero
  ? renderTravelZero(ctx)
  : renderBranded(appTheme ?? getTheme(null), ctx ?? {});

wireHandlers(screen, ctx);

// ─── TravelZero renderer ────────────────────────────────────────────────────

function renderTravelZero(ctx) {
  return `
    <div class="tz-enrollment-layout">
      <div class="tz-enrollment-panel">
        <div class="tz-enrollment-card">
          <div class="tz-enrollment-icon">${iconFingerprint()}</div>
          <div class="tz-enrollment-head">
            <h1>Set up your passkey</h1>
            <p>Use Face ID, Touch ID, or your security key to sign in faster next time</p>
          </div>
          <button type="button" class="tz-btn-primary" id="enroll-btn">
            Set up passkey
          </button>
          <button type="button" class="tz-btn-ghost" id="skip-btn">
            Skip for now
          </button>
        </div>
      </div>
    </div>
  `;
}

// ─── Branded renderer ───────────────────────────────────────────────────────

function renderBranded(theme, ctx) {
  return `
    <div class="app-layout">
      <div class="app-panel">
        <div class="app-card">
          ${theme.logo ? `
            <div class="app-brand">
              <div class="app-logo" style="background-image: url('${theme.logo}')"></div>
              <span class="app-name">${theme.name}</span>
            </div>
          ` : ''}
          <div class="app-head">
            <h1>Set up your passkey</h1>
            <p>Use Face ID, Touch ID, or your security key to sign in faster next time</p>
          </div>
          <button type="button" class="app-btn-primary" id="enroll-btn">
            Set up passkey
          </button>
          <p class="app-alt">
            <button type="button" class="app-btn-skip" id="skip-btn">Skip for now</button>
          </p>
        </div>
      </div>
    </div>
  `;
}

// ─── Event wiring ──────────────────────────────────────────────────────────

function wireHandlers(screen, ctx) {
  const enrollBtn = document.getElementById('enroll-btn');
  const skipBtn = document.getElementById('skip-btn');

  if (enrollBtn) {
    enrollBtn.addEventListener('click', async () => {
      setLoading(true);
      try {
        // SDK handles the entire WebAuthn ceremony: shows the browser prompt,
        // captures the credential, validates it, and advances the transaction.
        await screen.continuePasskeyEnrollment();
      } catch (err) {
        // User cancelled the browser WebAuthn dialog, or the ceremony failed.
        // Show error but leave button enabled so they can retry.
        showError(err.message ?? 'Passkey setup failed. Please try again.');
        setLoading(false);
      }
    });
  }

  if (skipBtn) {
    skipBtn.addEventListener('click', async () => {
      setLoading(true);
      try {
        // Auto-advance without enrolling. The transaction continues to the
        // next step (usually the dashboard or post-signup page).
        await screen.abortPasskeyEnrollment();
      } catch (err) {
        showError(err.message ?? 'Failed to skip passkey setup');
        setLoading(false);
      }
    });
  }
}

// ─── UI utilities ──────────────────────────────────────────────────────────

function setLoading(loading) {
  document.querySelectorAll('#enroll-btn, #skip-btn').forEach((btn) => {
    btn.disabled = loading;
    btn.style.opacity = loading ? '0.7' : '1';
  });
}

function showError(msg) {
  let el = document.getElementById('acul-error');
  if (!el) {
    el = document.createElement('p');
    el.id = 'acul-error';
    el.className = 'acul-error';
    const card = document.querySelector('.tz-enrollment-card') ?? document.querySelector('.app-card');
    card?.prepend(el);
  }
  el.textContent = msg;
}

// ─── Icons ─────────────────────────────────────────────────────────────────

function iconFingerprint() {
  return `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" color="#FF9F43"><path d="M12 10a2 2 0 0 0-2 2c0 1.02-.9 2-2 2-1.1 0-2-.9-2-2 0-1 .088-1.987 1-2.981M19.07 4.93a10 10 0 0 0-14.14 0m11.1 2.98a6 6 0 0 0-8.49 0m5.48 2.99a2 2 0 0 0-2.83 0c-.55.55-.55 1.43 0 1.98l5.66 5.66c1.57 1.57 4.13 1.57 5.7 0 1.57-1.57 1.57-4.13 0-5.7l-5.53-5.54"/></svg>`;
}

// ─── Styles ────────────────────────────────────────────────────────────────

function injectStyles(isTravelZero, theme) {
  const style = document.createElement('style');

  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    html, body {
      height: 100%;
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: linear-gradient(135deg, #f5f3ff 0%, #fffaf0 100%);
    }

    /* ════════════════════════════════════════════════
       TravelZero — enrollment centered card
    ════════════════════════════════════════════════ */

    .tz-enrollment-layout {
      display: flex; min-height: 100vh; align-items: center; justify-content: center;
      padding: 2rem;
    }
    .tz-enrollment-panel {
      width: 100%; max-width: 420px;
    }
    .tz-enrollment-card {
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(255,159,67,0.2);
      border-radius: 20px;
      padding: 3rem 2.5rem;
      box-shadow: 0 8px 40px rgba(232,89,12,0.1);
    }
    .tz-enrollment-icon {
      display: flex; justify-content: center; margin-bottom: 1.5rem;
      color: #FF9F43;
    }
    .tz-enrollment-head { text-align: center; margin-bottom: 2rem; }
    .tz-enrollment-head h1 {
      font-size: 1.625rem; font-weight: 800; color: #1A1A2E;
      letter-spacing: -0.03em; margin-bottom: 0.5rem;
    }
    .tz-enrollment-head p {
      font-size: 0.9rem; color: #6B7280; line-height: 1.6;
    }
    .tz-btn-primary {
      width: 100%; padding: 0.9rem 1.5rem; font-size: 0.9375rem; font-weight: 700;
      font-family: inherit; color: #fff;
      background: linear-gradient(135deg, #FF9F43 0%, #FF6B6B 100%);
      border: none; border-radius: 14px; cursor: pointer;
      box-shadow: 0 0 48px -8px rgba(255,159,67,0.35);
      transition: transform 0.2s, box-shadow 0.2s;
      margin-bottom: 1rem;
    }
    .tz-btn-primary:hover:not(:disabled) { transform: scale(1.02); }
    .tz-btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
    .tz-btn-ghost {
      width: 100%; background: none; border: none; font-size: 0.875rem; font-weight: 600;
      font-family: inherit; color: #E8590C; cursor: pointer; padding: 0.5rem;
      border-radius: 8px; transition: background 0.2s;
    }
    .tz-btn-ghost:hover:not(:disabled) { background: rgba(232,89,12,0.08); }
    .tz-btn-ghost:disabled { opacity: 0.5; cursor: not-allowed; }

    /* ════════════════════════════════════════════════
       Branded apps — per-app theme
    ════════════════════════════════════════════════ */

    :root {
      --app-primary:       ${theme.primary};
      --app-primary-hover: ${theme.primaryHover};
      --app-panel-bg:      ${theme.panelBg};
      --app-panel-border:  ${theme.panelBorder};
      --app-link:          ${theme.link};
      --app-text:          ${theme.text};
      --app-muted:         ${theme.muted};
      --app-btn-bg:        ${theme.buttonGradient ?? theme.primary};
    }

    .app-layout {
      display: flex; min-height: 100vh; align-items: center; justify-content: center;
      padding: 2rem;
    }
    .app-panel {
      width: 100%; max-width: 420px;
      background: var(--app-panel-bg);
      border: 1px solid var(--app-panel-border);
      border-radius: 16px;
      padding: 3rem 2.5rem;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12);
    }
    .app-card { width: 100%; }
    .app-brand { display: flex; align-items: center; gap: 0.625rem; margin-bottom: 2rem; }
    .app-logo { width: 32px; height: 32px; border-radius: 8px; background-size: cover; flex-shrink: 0; }
    .app-name { font-size: 1rem; font-weight: 700; color: var(--app-text); letter-spacing: -0.02em; }
    .app-head { text-align: center; margin-bottom: 2rem; }
    .app-head h1 {
      font-size: 1.625rem; font-weight: 800; color: var(--app-text);
      letter-spacing: -0.03em; margin-bottom: 0.5rem;
    }
    .app-head p { font-size: 0.9rem; color: var(--app-muted); line-height: 1.6; }
    .app-btn-primary {
      width: 100%; padding: 0.875rem 1.5rem; font-size: 0.9375rem; font-weight: 700;
      font-family: inherit; color: #fff; background: var(--app-btn-bg);
      border: none; border-radius: 8px; cursor: pointer;
      transition: opacity 0.2s; margin-bottom: 1rem;
    }
    .app-btn-primary:hover:not(:disabled) { opacity: 0.9; }
    .app-btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
    .app-alt { text-align: center; margin-top: 1rem; }
    .app-btn-skip {
      background: none; border: none; font-size: 0.875rem; font-weight: 600;
      font-family: inherit; color: var(--app-link); cursor: pointer; padding: 0.5rem;
      border-radius: 8px; transition: background 0.2s;
    }
    .app-btn-skip:hover:not(:disabled) { opacity: 0.8; }
    .app-btn-skip:disabled { opacity: 0.5; cursor: not-allowed; }

    .acul-error {
      background: rgba(255,71,87,0.08); border: 1.5px solid rgba(255,71,87,0.25);
      border-radius: 10px; color: #DC2626; font-size: 0.875rem;
      padding: 0.75rem 1rem; margin-bottom: 1rem; line-height: 1.5;
    }
  `;
  document.head.appendChild(style);
}
