/**
 * ACUL Screen: signup-id (Signup / identifier step)
 *
 * Experiment: exp_device_segmentation (Device-Segmented Auth Routing)
 *   control   → Password-first: email + password inline signup form
 *   treatment → Passkey-first:  passkey as primary registration method
 *
 * Scoping:
 *   TravelZero → experiment-branched custom UI
 *   All other apps → branded form using the same per-app theme defined in
 *   auth0-templates/universal-login.html.
 */

import SignupId from '@auth0/auth0-acul-js/signup-id';
import { getTheme } from './shared/themes.js';

const TRAVELZERO_CLIENT_ID = 'Sf9FmZInlomeJpEoxnCyKE00s46pmFL2';
const TZ_BG = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1173&auto=format&fit=crop';
const TZ_LOGO = 'https://markvong-o.github.io/openmoji-icons/2708.png';

let screen, ctx, clientId, isTravelZero, experiment, isPasskeyFirst, appTheme;

try {
  screen = new SignupId();
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
  const loginUrl = ctx.screen?.links?.login ?? '#';
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
          <p class="tz-alt">Already have an account? <a href="${loginUrl}">Sign in</a></p>
        </div>
      </div>
      <div class="tz-promo">
        <div class="tz-promo-content">
          <h2>Join TravelZero</h2>
          <p>Create a free account and earn 10,000 loyalty points towards your first trip.</p>
          <ul class="tz-benefits">
            <li>${iconShield()} Secure sign-in with passkeys</li>
            <li>${iconStar()} 10,000 welcome loyalty points</li>
            <li>${iconPlane()} Personalized travel recommendations</li>
          </ul>
        </div>
      </div>
    </div>
  `;
}

function renderPasskeyFirst() {
  return `
    <div class="tz-head">
      <h1>Create account with passkey</h1>
      <p>Skip passwords — use Face ID or Touch ID in under a second</p>
    </div>
    <form id="passkey-signup-form" class="tz-form" novalidate>
      <input type="email" name="username" id="username-passkey" placeholder="your@email.com" autocomplete="username" required />
      <button type="submit" class="tz-btn-primary">${iconKey()} Continue with passkey</button>
    </form>
    <div class="tz-divider"><span>or</span></div>
    <button type="button" class="tz-btn-ghost" id="password-toggle">Sign up with email instead →</button>
    <form id="password-signup-form" class="tz-form tz-hidden" novalidate>
      <input type="email" name="username" id="username-password" placeholder="your@email.com" autocomplete="email" required />
      <button type="submit" class="tz-btn-secondary">Continue with email</button>
    </form>
  `;
}

function renderPasswordFirst() {
  // signup-id only collects the identifier — password is captured on the
  // subsequent signup-password screen. Both variants submit { username } only.
  return `
    <div class="tz-head">
      <h1>Create your account</h1>
      <p>Takes less than a minute</p>
    </div>
    <form id="password-signup-form" class="tz-form" novalidate>
      <input type="email" name="username" id="username-main" placeholder="your@email.com" autocomplete="email" required />
      <button type="submit" class="tz-btn-primary">Continue with email</button>
    </form>
    <div class="tz-divider"><span>or</span></div>
    <button type="button" class="tz-btn-ghost" id="passkey-option">${iconKey()} Sign up with passkey instead</button>
  `;
}

// ─── Branded renderer (all other apps) ───────────────────────────────────────

function renderBranded(theme, ctx) {
  const loginUrl = ctx.screen?.links?.login ?? '#';
  const title = ctx.screen?.texts?.title ?? 'Create your account';
  const subtitle = ctx.screen?.texts?.description ?? `Sign up for ${theme.name}`;

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
          <form id="password-signup-form" class="app-form" novalidate>
            <input type="email" name="username" id="username-main" placeholder="Email address" autocomplete="email" required />
            <button type="submit" class="app-btn-primary">Continue</button>
          </form>
          <p class="app-alt">Already have an account? <a href="${loginUrl}">Sign in</a></p>
        </div>
      </div>
    </div>
  `;
}

// ─── Event wiring ─────────────────────────────────────────────────────────────

function wireHandlers(screen) {
  // TravelZero passkey-first: primary passkey form
  bind('passkey-signup-form', 'submit', async (e) => {
    e.preventDefault();
    await submit(screen, { username: val('username-passkey') });
  });

  // TravelZero passkey-first: password fallback toggle
  const passwordToggle = document.getElementById('password-toggle');
  const passwordSignupForm = document.getElementById('password-signup-form');
  const passkeySignupForm = document.getElementById('passkey-signup-form');
  if (passwordToggle && passwordSignupForm) {
    passwordToggle.addEventListener('click', () => {
      const isHidden = passwordSignupForm.classList.toggle('tz-hidden');
      passwordToggle.textContent = isHidden
        ? 'Sign up with email + password →'
        : '← Back to passkey';
    });
  }

  // signup-id only collects the identifier — password comes on the next screen
  if (passwordSignupForm) {
    passwordSignupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = val('username-main') || val('username-password');
      await submit(screen, { username });
    });
  }

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
    await screen.signup(params);
  } catch (err) {
    showError(err.message ?? 'Sign up failed. Please try again.');
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
function iconShield() {
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
}
function iconStar() {
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
}
function iconPlane() {
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 2c-2-2-4-2-5.5-.5L10 5 1.8 6.2c-.5.1-.9.5-.9 1 0 .3.1.6.3.8L5 11.8l-2 2c-.3.3-.4.7-.4 1.1l.7 2.4c.1.5.6.9 1.1.9h.3l2.4-.7c.4-.1.8-.2 1.1-.4l2 2 3.8 3.8c.2.2.5.3.8.3.5 0 .9-.4 1-.9z"/></svg>`;
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

    .tz-layout { display: flex; min-height: 100vh; align-items: stretch; }
    .tz-panel {
      width: 480px; min-height: 100vh; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      padding: 3rem 2.5rem;
      background: rgba(255,255,255,0.75);
      backdrop-filter: blur(24px) saturate(180%); -webkit-backdrop-filter: blur(24px) saturate(180%);
      border-right: 1px solid rgba(255,255,255,0.45);
      box-shadow: 4px 0 40px -8px rgba(255,159,67,0.12);
    }
    .tz-card { width: 100%; max-width: 340px; }
    .tz-brand { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 2.25rem; }
    .tz-logo { width: 28px; height: 28px; object-fit: contain; }
    .tz-brand-name { font-size: 1rem; font-weight: 700; color: #1A1A2E; letter-spacing: -0.02em; }
    .tz-exp-badge {
      margin-left: auto; font-size: 0.6875rem; font-weight: 600; color: #E8590C;
      background: rgba(255,159,67,0.12); border: 1px solid rgba(255,159,67,0.2);
      border-radius: 999px; padding: 0.15rem 0.6rem;
    }
    .tz-promo {
      flex: 1; display: flex; align-items: center; justify-content: center; padding: 3rem;
    }
    .tz-promo-content { max-width: 380px; }
    .tz-promo-content h2 {
      font-size: 2.5rem; font-weight: 800; color: #fff;
      letter-spacing: -0.04em; line-height: 1.1; margin-bottom: 1rem;
      text-shadow: 0 2px 12px rgba(0,0,0,0.15);
    }
    .tz-promo-content p {
      font-size: 1.0625rem; color: rgba(255,255,255,0.85);
      line-height: 1.6; margin-bottom: 1.75rem; text-shadow: 0 1px 6px rgba(0,0,0,0.1);
    }
    .tz-benefits { list-style: none; display: flex; flex-direction: column; gap: 0.875rem; }
    .tz-benefits li {
      display: flex; align-items: center; gap: 0.625rem;
      font-size: 0.9375rem; font-weight: 500;
      color: rgba(255,255,255,0.9); text-shadow: 0 1px 4px rgba(0,0,0,0.1);
    }
    .tz-head { margin-bottom: 1.75rem; }
    .tz-head h1 { font-size: 1.625rem; font-weight: 800; color: #1A1A2E; letter-spacing: -0.03em; line-height: 1.2; margin-bottom: 0.375rem; }
    .tz-head p { font-size: 0.9rem; color: #6B7280; line-height: 1.5; }
    .tz-form { display: flex; flex-direction: column; gap: 0.625rem; }
    .tz-divider { display: flex; align-items: center; gap: 0.75rem; margin: 1.125rem 0; color: #9CA3AF; font-size: 0.8125rem; }
    .tz-divider::before, .tz-divider::after { content: ''; flex: 1; height: 1px; background: rgba(255,159,67,0.12); }
    .tz-alt { margin-top: 1.75rem; font-size: 0.875rem; color: #6B7280; text-align: center; }
    .tz-alt a { color: #E8590C; font-weight: 600; text-decoration: none; }
    .tz-alt a:hover { color: #C2410C; }
    .tz-btn-primary {
      width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
      padding: 0.9rem 1.5rem; font-size: 0.9375rem; font-weight: 700; font-family: inherit;
      color: #fff; background: linear-gradient(135deg, #FF9F43 0%, #FF6B6B 100%);
      border: none; border-radius: 14px; cursor: pointer;
      box-shadow: 0 0 48px -8px rgba(255,159,67,0.35);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .tz-btn-primary:hover:not(:disabled) { transform: scale(1.02); }
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
      display: flex; min-height: 100vh; align-items: stretch;
      justify-content: ${panelAlign};
    }
    .app-panel {
      width: 440px; min-height: 100vh; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      padding: 3rem 2.5rem;
      background: var(--app-panel-bg);
      backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--app-panel-border);
      box-shadow: 0 8px 32px rgba(0,0,0,0.12);
    }
    .app-card { width: 100%; max-width: 340px; }
    .app-brand { display: flex; align-items: center; gap: 0.625rem; margin-bottom: 2rem; }
    .app-logo { width: 32px; height: 32px; border-radius: 8px; background-size: cover; background-position: center; flex-shrink: 0; }
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
      transition: opacity 0.2s;
    }
    .app-btn-primary:hover:not(:disabled) { opacity: 0.9; }
    .app-btn-primary:disabled { cursor: not-allowed; opacity: 0.7; }

    /* ════════════════════════════════════════════════
       Shared inputs + error
    ════════════════════════════════════════════════ */

    input[type="email"],
    input[type="password"],
    input[type="text"] {
      width: 100%;
      padding: 0.8125rem 1rem;
      font-size: 0.9375rem;
      font-family: inherit;
      background: ${isTravelZero ? 'rgba(255,247,237,0.6)' : 'var(--app-input-bg)'};
      border: 1.5px solid ${isTravelZero ? 'rgba(255,159,67,0.15)' : 'var(--app-input-border)'};
      border-radius: ${isTravelZero ? '12px' : '8px'};
      color: ${isTravelZero ? '#1A1A2E' : 'var(--app-text)'};
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    input::placeholder { color: #9CA3AF; }
    input:focus {
      border-color: ${isTravelZero ? '#FF9F43' : 'var(--app-input-focus)'};
      box-shadow: 0 0 0 3px ${isTravelZero ? 'rgba(255,159,67,0.15)' : 'color-mix(in srgb, var(--app-input-focus) 20%, transparent)'};
    }

    .acul-error {
      background: rgba(255,71,87,0.08); border: 1.5px solid rgba(255,71,87,0.25);
      border-radius: 10px; color: #DC2626; font-size: 0.875rem;
      padding: 0.75rem 1rem; margin-bottom: 1rem; line-height: 1.5;
    }

    .tz-hidden { display: none !important; }
  `;
  document.head.appendChild(style);
}
