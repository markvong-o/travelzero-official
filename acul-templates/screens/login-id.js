/**
 * ACUL Screen: login-id (Login / identifier step)
 *
 * Experiment: exp_device_segmentation (Device-Segmented Auth Routing)
 *   control   → Password-first: standard email → continue flow
 *   treatment → Passkey-first:  passkey as primary CTA, password secondary
 *
 * Scoping:
 *   TravelZero → experiment-branched custom UI
 *   All other apps → branded form using the same per-app theme defined in
 *   auth0-templates/universal-login.html, reproduced here so ACUL doesn't
 *   strip their branding (ACUL advanced mode replaces the widget entirely).
 */

import LoginId from '@auth0/auth0-acul-js/login-id';
import { getTheme } from './shared/themes.js';

const TRAVELZERO_CLIENT_ID = 'Sf9FmZInlomeJpEoxnCyKE00s46pmFL2';
const TZ_BG = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1173&auto=format&fit=crop';
const TZ_LOGO = 'https://markvong-o.github.io/openmoji-icons/2708.png';

let screen, ctx, clientId, isTravelZero, experiment, isPasskeyFirst, appTheme;

try {
  screen = new LoginId();
  ctx = window.universal_login_context;
  clientId = ctx.client?.id;
  isTravelZero = clientId === TRAVELZERO_CLIENT_ID;
  experiment = ctx.experiment;
  isPasskeyFirst = isTravelZero && experiment ? !experiment.is_control : false;
  appTheme = getTheme(clientId);
} catch (err) {
  console.error('[TravelZero ACUL] Failed to initialize screen context:', err);
}

injectStyles(isTravelZero, appTheme ?? getTheme(null));

const root = document.getElementById('custom-screen-content') ?? document.body;
root.innerHTML = isTravelZero
  ? renderTravelZero(isPasskeyFirst, ctx)
  : renderBranded(appTheme ?? getTheme(null), ctx ?? {});

wireHandlers(screen);

// ─── TravelZero renderers ─────────────────────────────────────────────────────

function renderTravelZero(passkeyFirst, ctx) {
  const signupUrl = ctx.screen?.links?.signup ?? '#';
  return `
    <div class="tz-layout">
      <div class="tz-panel">
        <div class="tz-card">
          <div class="tz-brand">
            <img src="${TZ_LOGO}" class="tz-logo" alt="" />
            <span class="tz-brand-name">TravelZero</span>
            ${experiment ? `<span class="tz-exp-badge">${passkeyFirst ? 'Passkey-first' : 'Password-first'}</span>` : ''}
          </div>
          ${passkeyFirst ? renderPasskeyFirst() : renderPasswordFirst()}
          <p class="tz-alt">Don't have an account? <a href="${signupUrl}">Sign up</a></p>
        </div>
      </div>
    </div>
  `;
}

function renderPasskeyFirst() {
  return `
    <div class="tz-head">
      <h1>Sign in with passkey</h1>
      <p>Use Face ID or Touch ID — no password needed</p>
    </div>
    <form id="passkey-form" class="tz-form" novalidate>
      <input type="email" name="username" id="username-passkey" placeholder="your@email.com" autocomplete="username webauthn" required />
      <button type="submit" class="tz-btn-primary">
        ${iconKey()} Continue with passkey
      </button>
    </form>
    <div class="tz-divider"><span>or</span></div>
    <button type="button" class="tz-btn-ghost" id="password-toggle">Use password instead →</button>
    <form id="password-fallback-form" class="tz-form tz-hidden" novalidate>
      <input type="email" name="username" id="username-password" placeholder="your@email.com" autocomplete="email" required />
      <button type="submit" class="tz-btn-secondary">Continue with email</button>
    </form>
  `;
}

function renderPasswordFirst() {
  return `
    <div class="tz-head">
      <h1>Welcome back</h1>
      <p>Sign in to TravelZero</p>
    </div>
    <form id="login-form" class="tz-form" novalidate>
      <input type="email" name="username" id="username-main" placeholder="your@email.com" autocomplete="email" required />
      <button type="submit" class="tz-btn-primary">Continue</button>
    </form>
    <div class="tz-divider"><span>or</span></div>
    <button type="button" class="tz-btn-ghost" id="passkey-option">
      ${iconKey()} Use passkey instead
    </button>
  `;
}

// ─── Branded renderer (all other apps) ───────────────────────────────────────

function renderBranded(theme, ctx) {
  const signupUrl = ctx.screen?.links?.signup ?? '#';
  const title = ctx.screen?.texts?.title ?? 'Sign in';
  const subtitle = ctx.screen?.texts?.description ?? `Sign in to ${theme.name}`;

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
            <h1>${title}</h1>
            <p>${subtitle}</p>
          </div>
          <form id="login-form" class="app-form" novalidate>
            <input type="email" name="username" id="username-main" placeholder="Email address" autocomplete="email" required />
            <button type="submit" class="app-btn-primary">Continue</button>
          </form>
          <p class="app-alt">Don't have an account? <a href="${signupUrl}">Sign up</a></p>
        </div>
      </div>
    </div>
  `;
}

// ─── Event wiring ─────────────────────────────────────────────────────────────

function wireHandlers(screen) {
  // TravelZero passkey-first: primary form
  bind('passkey-form', 'submit', async (e) => {
    e.preventDefault();
    await submit(screen, { username: val('username-passkey') });
  });

  // TravelZero passkey-first: password fallback toggle
  const passwordToggle = document.getElementById('password-toggle');
  const passwordFallbackForm = document.getElementById('password-fallback-form');
  if (passwordToggle && passwordFallbackForm) {
    passwordToggle.addEventListener('click', () => {
      const isHidden = passwordFallbackForm.classList.toggle('tz-hidden');
      passwordToggle.textContent = isHidden ? 'Use password instead →' : '← Back to passkey';
    });
    bind('password-fallback-form', 'submit', async (e) => {
      e.preventDefault();
      await submit(screen, { username: val('username-password') });
    });
  }

  // TravelZero password-first / branded: primary login form
  bind('login-form', 'submit', async (e) => {
    e.preventDefault();
    await submit(screen, { username: val('username-main') });
  });

  // TravelZero password-first: passkey alternative
  bind('passkey-option', 'click', async () => {
    await submit(screen, { username: val('username-main') ?? '' });
  });
}

function bind(id, event, handler) {
  document.getElementById(id)?.addEventListener(event, handler);
}

function val(id) {
  return document.getElementById(id)?.value ?? '';
}

async function submit(screen, params) {
  setLoading(true);
  try {
    await screen.login(params);
  } catch (err) {
    showError(err.message ?? 'Sign in failed. Please try again.');
    setLoading(false);
  }
}

function setLoading(loading) {
  document.querySelectorAll('.tz-btn-primary, .tz-btn-secondary, .app-btn-primary').forEach((btn) => {
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
    const card = document.querySelector('.tz-card') ?? document.querySelector('.app-card');
    card?.prepend(el);
  }
  el.textContent = msg;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function iconKey() {
  return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15" r="4"/><path d="M15 7l-1 5H8"/><path d="M19 7h-4"/><path d="M19 11h-2"/></svg>`;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function injectStyles(isTravelZero, theme) {
  const style = document.createElement('style');

  const bgCss = theme.bg
    ? `background-image: url('${isTravelZero ? TZ_BG : theme.bg}'); background-size: cover; background-position: center; background-repeat: no-repeat;`
    : `background: ${theme.bgCss ?? '#F3F4F6'};`;

  const panelAlign = isTravelZero ? 'flex-start' : (
    theme.align === 'right' ? 'flex-end' : theme.align === 'center' ? 'center' : 'flex-start'
  );

  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    html, body {
      height: 100%;
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      ${bgCss}
    }

    /* ════════════════════════════════════════════════
       TravelZero — experiment variants
    ════════════════════════════════════════════════ */

    .tz-layout {
      display: flex;
      min-height: 100vh;
      align-items: stretch;
    }
    .tz-panel {
      width: 480px;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem 2.5rem;
      background: rgba(255, 255, 255, 0.75);
      backdrop-filter: blur(24px) saturate(180%);
      -webkit-backdrop-filter: blur(24px) saturate(180%);
      border-right: 1px solid rgba(255, 255, 255, 0.45);
      box-shadow: 4px 0 40px -8px rgba(255, 159, 67, 0.12);
      flex-shrink: 0;
    }
    .tz-card { width: 100%; max-width: 340px; }
    .tz-brand { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 2.25rem; }
    .tz-logo { width: 28px; height: 28px; object-fit: contain; }
    .tz-brand-name { font-size: 1rem; font-weight: 700; color: #1A1A2E; letter-spacing: -0.02em; }
    .tz-exp-badge {
      margin-left: auto; font-size: 0.6875rem; font-weight: 600; color: #E8590C;
      background: rgba(255, 159, 67, 0.12); border: 1px solid rgba(255, 159, 67, 0.2);
      border-radius: 999px; padding: 0.15rem 0.6rem;
    }
    .tz-head { margin-bottom: 1.75rem; }
    .tz-head h1 { font-size: 1.75rem; font-weight: 800; color: #1A1A2E; letter-spacing: -0.03em; line-height: 1.15; margin-bottom: 0.375rem; }
    .tz-head p { font-size: 0.9rem; color: #6B7280; line-height: 1.5; }
    .tz-form { display: flex; flex-direction: column; gap: 0.625rem; }
    .tz-divider { display: flex; align-items: center; gap: 0.75rem; margin: 1.125rem 0; color: #9CA3AF; font-size: 0.8125rem; }
    .tz-divider::before, .tz-divider::after { content: ''; flex: 1; height: 1px; background: rgba(255, 159, 67, 0.12); }
    .tz-alt { margin-top: 1.75rem; font-size: 0.875rem; color: #6B7280; text-align: center; }
    .tz-alt a { color: #E8590C; font-weight: 600; text-decoration: none; }
    .tz-alt a:hover { color: #C2410C; }
    .tz-btn-primary {
      width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
      padding: 0.9rem 1.5rem; font-size: 0.9375rem; font-weight: 700; font-family: inherit;
      color: #fff; background: linear-gradient(135deg, #FF9F43 0%, #FF6B6B 100%);
      border: none; border-radius: 14px; cursor: pointer;
      box-shadow: 0 0 48px -8px rgba(255, 159, 67, 0.35);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .tz-btn-primary:hover:not(:disabled) { transform: scale(1.02); box-shadow: 0 12px 48px -8px rgba(255, 159, 67, 0.4); }
    .tz-btn-primary:disabled { cursor: not-allowed; }
    .tz-btn-secondary {
      width: 100%; padding: 0.875rem 1.5rem; font-size: 0.9375rem; font-weight: 600; font-family: inherit;
      color: #1A1A2E; background: rgba(255,255,255,0.5); backdrop-filter: blur(12px);
      border: 1.5px solid rgba(255,255,255,0.45); border-radius: 12px; cursor: pointer;
      transition: background 0.2s, border-color 0.2s;
    }
    .tz-btn-secondary:hover:not(:disabled) { background: rgba(255,255,255,0.7); border-color: rgba(255,159,67,0.25); }
    .tz-btn-ghost {
      background: none; border: none; font-size: 0.875rem; font-weight: 600; font-family: inherit;
      color: #E8590C; cursor: pointer; padding: 0.25rem 0;
      display: inline-flex; align-items: center; gap: 0.375rem;
    }
    .tz-btn-ghost:hover { color: #C2410C; }

    /* ════════════════════════════════════════════════
       Branded apps — per-app theme via CSS variables
    ════════════════════════════════════════════════ */

    :root {
      --app-primary:       ${theme.primary};
      --app-primary-hover: ${theme.primaryHover};
      --app-panel-bg:      ${theme.panelBg};
      --app-panel-border:  ${theme.panelBorder};
      --app-link:          ${theme.link};
      --app-text:          ${theme.text};
      --app-muted:         ${theme.muted};
      --app-input-bg:      ${theme.inputBg};
      --app-input-border:  ${theme.inputBorder};
      --app-input-focus:   ${theme.inputFocus};
      --app-btn-bg:        ${theme.buttonGradient ?? theme.primary};
    }

    .app-layout {
      display: flex;
      min-height: 100vh;
      align-items: stretch;
      justify-content: ${panelAlign};
    }
    .app-panel {
      width: 440px;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem 2.5rem;
      background: var(--app-panel-bg);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--app-panel-border);
      box-shadow: 0 8px 32px rgba(0,0,0,0.12);
      flex-shrink: 0;
    }
    .app-card { width: 100%; max-width: 340px; }
    .app-brand { display: flex; align-items: center; gap: 0.625rem; margin-bottom: 2rem; }
    .app-logo {
      width: 32px; height: 32px; border-radius: 8px;
      background-size: cover; background-position: center; flex-shrink: 0;
    }
    .app-name { font-size: 1rem; font-weight: 700; color: var(--app-text); letter-spacing: -0.02em; }
    .app-head { margin-bottom: 1.5rem; }
    .app-head h1 { font-size: 1.625rem; font-weight: 800; color: var(--app-text); letter-spacing: -0.03em; margin-bottom: 0.375rem; }
    .app-head p { font-size: 0.9rem; color: var(--app-muted); line-height: 1.5; }
    .app-form { display: flex; flex-direction: column; gap: 0.625rem; }
    .app-alt { margin-top: 1.5rem; font-size: 0.875rem; color: var(--app-muted); text-align: center; }
    .app-alt a { color: var(--app-link); font-weight: 600; text-decoration: none; }
    .app-btn-primary {
      width: 100%; padding: 0.875rem 1.5rem;
      font-size: 0.9375rem; font-weight: 700; font-family: inherit;
      color: #fff; background: var(--app-btn-bg);
      border: none; border-radius: 8px; cursor: pointer;
      transition: opacity 0.2s ease;
    }
    .app-btn-primary:hover:not(:disabled) { opacity: 0.9; }
    .app-btn-primary:disabled { cursor: not-allowed; opacity: 0.7; }

    /* ════════════════════════════════════════════════
       Shared inputs + error (both TravelZero and branded)
    ════════════════════════════════════════════════ */

    input[type="email"],
    input[type="password"],
    input[type="text"] {
      width: 100%;
      padding: 0.8125rem 1rem;
      font-size: 0.9375rem;
      font-family: inherit;
      background: ${isTravelZero ? 'rgba(255, 247, 237, 0.6)' : 'var(--app-input-bg)'};
      border: 1.5px solid ${isTravelZero ? 'rgba(255, 159, 67, 0.15)' : 'var(--app-input-border)'};
      border-radius: ${isTravelZero ? '12px' : '8px'};
      color: ${isTravelZero ? '#1A1A2E' : 'var(--app-text)'};
      outline: none;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    input::placeholder { color: #9CA3AF; }
    input:focus {
      border-color: ${isTravelZero ? '#FF9F43' : 'var(--app-input-focus)'};
      box-shadow: 0 0 0 3px ${isTravelZero ? 'rgba(255, 159, 67, 0.15)' : 'color-mix(in srgb, var(--app-input-focus) 20%, transparent)'};
    }

    .acul-error {
      background: rgba(255, 71, 87, 0.08);
      border: 1.5px solid rgba(255, 71, 87, 0.25);
      border-radius: 10px;
      color: #DC2626;
      font-size: 0.875rem;
      padding: 0.75rem 1rem;
      margin-bottom: 1rem;
      line-height: 1.5;
    }

    .tz-hidden { display: none !important; }
  `;
  document.head.appendChild(style);
}
