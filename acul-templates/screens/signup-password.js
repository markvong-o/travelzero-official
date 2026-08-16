/**
 * ACUL Screen: signup-password (Signup / password step)
 *
 * Same reasoning as login-password.js: Auth0's Identifier-First architecture
 * always splits identifier and password entry into two screens for signup too,
 * with no supported way to merge them into signup-id. The email collected on
 * signup-id is carried forward via screen.screen.data.email — this screen only
 * needs the password.
 *
 * No experiment branching here — always the same "password mode" look, blue
 * accent + carousel on the left, matching login-password.js and signup-id's
 * password-first variant regardless of which path led here.
 *
 * Scoping:
 *   TravelZero → branded password entry
 *   All other apps → branded form using the same per-app theme defined in
 *   auth0-templates/universal-login.html.
 */

import SignupPassword from '@auth0/auth0-acul-js/signup-password';
import { getTheme } from './shared/themes.js';
import { WORKZERO_CLIENT_ID, getWorkZeroCss } from './shared/workzero-styles.js';

const TRAVELZERO_CLIENT_ID = 'Sf9FmZInlomeJpEoxnCyKE00s46pmFL2';
const TZ_BG = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1173&auto=format&fit=crop';
const TZ_LOGO = 'https://markvong-o.github.io/openmoji-icons/2708.png';

const SLIDES = [
  { src: 'https://images.unsplash.com/photo-1534308143481-c55f00be8bd7?w=1920&q=80', label: 'Italy', caption: 'Your next Italian adventure awaits' },
  { src: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1920&q=80', label: 'Rome', caption: 'Explore the Eternal City' },
  { src: 'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=1920&q=80', label: 'Amalfi Coast', caption: 'Cliff-hanging views, Mediterranean bliss' },
];

let screen, ctx, clientId, isTravelZero, isWorkZero, appTheme;

try {
  screen = new SignupPassword();
  ctx = window.universal_login_context;
  clientId = ctx.client?.id;
  isTravelZero = clientId === TRAVELZERO_CLIENT_ID;
  isWorkZero = clientId === WORKZERO_CLIENT_ID;
  appTheme = getTheme(clientId);
} catch (err) {
  console.error('[ACUL] Failed to initialize screen context:', err);
}

injectStyles(isTravelZero, isWorkZero, appTheme ?? getTheme(null));

const root = document.getElementById('custom-screen-content') ?? document.body;
root.innerHTML = isTravelZero
  ? renderTravelZero(screen)
  : isWorkZero
  ? renderWorkZero(screen, ctx)
  : renderBranded(appTheme ?? getTheme(null), screen);

wireHandlers(isTravelZero, isWorkZero, screen);
if (isTravelZero) initCarousel();

// ─── TravelZero renderer ───────────────────────────────────────────────────

function renderWorkZero(screen, ctx) {
  return `
    <div class="wz-layout">
      <div class="wz-panel">
        <div class="wz-card">
          <div class="wz-brand">
            <span class="wz-brand-name">WorkZero</span>
          </div>
          <div class="wz-head">
            <h1>Create a password</h1>
            <p>Secure your account</p>
          </div>
          <form id="password-form" class="wz-form" novalidate>
            <input type="password" name="password" id="password-workzero" placeholder="••••••••••" autocomplete="new-password" required />
            <button type="submit" class="wz-btn-primary">Complete signup</button>
          </form>
        </div>
      </div>
    </div>
  `;
}

function renderTravelZero(screen) {
  const email = screen?.screen?.data?.email ?? '';
  const editLink = screen?.screen?.editLink ?? '#';
  const loginLink = screen?.screen?.loginLink ?? '#';
  return `
    <div class="tz-layout">
      <div class="tz-panel">
        <div class="tz-card">
          <div class="tz-brand">
            <img src="${TZ_LOGO}" class="tz-logo" alt="" />
            <span class="tz-brand-name">TravelZero</span>
          </div>
          <div class="tz-head">
            <h1>Create a password</h1>
            <p>Signing up as <strong>${email}</strong> · <a href="${editLink}">Not you?</a></p>
          </div>
          <form id="password-form" class="tz-form" novalidate>
            <input type="password" name="password" id="password-main" placeholder="Password" autocomplete="new-password" required autofocus />
            <button type="submit" class="tz-btn-primary">Create account</button>
          </form>
          <p class="tz-alt">Already have an account? <a href="${loginLink}">Sign in</a></p>
        </div>
      </div>
      ${renderCarousel()}
    </div>
  `;
}

// ─── Carousel ───────────────────────────────────────────────────────────────

function renderCarousel() {
  return `
    <div class="tz-carousel">
      ${SLIDES.map((s, i) => `
        <div class="tz-slide ${i === 0 ? 'tz-slide--active' : ''}"
             style="background-image: url('${s.src}')"></div>
      `).join('')}
      <div class="tz-scrim"></div>
      <div class="tz-carousel-content">
        <div class="tz-caption">
          <p class="tz-caption-label">${SLIDES[0].label}</p>
          <p class="tz-caption-text">${SLIDES[0].caption}</p>
        </div>
        <div class="tz-dots">
          ${SLIDES.map((_, i) => `
            <button class="tz-dot ${i === 0 ? 'tz-dot--active' : ''}"
                    data-index="${i}" aria-label="Slide ${i + 1}"></button>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function initCarousel() {
  let active = 0;
  const slides = Array.from(document.querySelectorAll('.tz-slide'));
  const dots   = Array.from(document.querySelectorAll('.tz-dot'));
  const label  = document.querySelector('.tz-caption-label');
  const text   = document.querySelector('.tz-caption-text');
  if (!slides.length) return;

  function goTo(index) {
    slides[active].classList.remove('tz-slide--active');
    dots[active].classList.remove('tz-dot--active');
    active = index;
    slides[active].classList.add('tz-slide--active');
    dots[active].classList.add('tz-dot--active');
    if (label) label.textContent = SLIDES[active].label;
    if (text)  text.textContent  = SLIDES[active].caption;
  }

  dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));
  setInterval(() => goTo((active + 1) % SLIDES.length), 10000);
}

// ─── Branded renderer (all other apps) ─────────────────────────────────────

function renderBranded(theme, screen) {
  const email = screen?.screen?.data?.email ?? '';
  const loginLink = screen?.screen?.loginLink ?? '#';

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
            <h1>Create a password</h1>
            <p>Signing up as ${email}</p>
          </div>
          <form id="password-form" class="app-form" novalidate>
            <input type="password" name="password" id="password-main" placeholder="Password" autocomplete="new-password" required autofocus />
            <button type="submit" class="app-btn-primary">Create account</button>
          </form>
          <p class="app-alt">Already have an account? <a href="${loginLink}">Sign in</a></p>
        </div>
      </div>
    </div>
  `;
}

// ─── Event wiring ───────────────────────────────────────────────────────────

function wireHandlers(isTravelZero, isWorkZero, screen) {
  if (isWorkZero) {
    bind('password-form', 'submit', async (e) => {
      e.preventDefault();
      await submit(screen, { email: screen?.screen?.data?.email ?? '', password: val('password-workzero') });
    });
  } else {
    bind('password-form', 'submit', async (e) => {
      e.preventDefault();
      await submit(screen, { email: screen?.screen?.data?.email ?? '', password: val('password-main') });
    });
  }
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
  document.querySelectorAll('.tz-btn-primary, .app-btn-primary').forEach((btn) => {
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

// ─── Styles ─────────────────────────────────────────────────────────────────

function injectStyles(isTravelZero, isWorkZero, theme) {
  const style = document.createElement('style');

  const bgCss = theme.bg
    ? `background-image: url('${isTravelZero ? TZ_BG : theme.bg}'); background-size: cover; background-position: center; background-repeat: no-repeat;`
    : `background: ${theme.bgCss ?? '#F3F4F6'};`;

  const panelAlign = theme.align === 'right' ? 'flex-end' : theme.align === 'center' ? 'center' : 'flex-start';

  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    html, body {
      height: 100%;
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      ${bgCss}
    }

    /* ════════════════════════════════════════════════
       TravelZero — always "password mode": blue accent,
       carousel on the left.
    ════════════════════════════════════════════════ */

    .tz-layout {
      display: flex;
      min-height: 100vh;
      align-items: stretch;
      flex-direction: row-reverse;
      --tz-accent-1: #4F86F7;
      --tz-accent-2: #6C5CE7;
      --tz-accent-solid: #3B5FE0;
      --tz-accent-hover: #2F4EC7;
      --tz-accent-tint: 79, 134, 247;
    }
    .tz-panel {
      flex: 0 0 40%;
      min-width: 380px;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem 3rem;
      background: rgba(255, 255, 255, 0.75);
      backdrop-filter: blur(24px) saturate(180%);
      -webkit-backdrop-filter: blur(24px) saturate(180%);
      border-left: 1px solid rgba(255, 255, 255, 0.45);
      box-shadow: -4px 0 40px -8px rgba(var(--tz-accent-tint), 0.12);
    }

    /* ── Carousel (left 60%) ── */
    .tz-carousel { flex: 1; position: relative; overflow: hidden; min-height: 100vh; }
    .tz-slide {
      position: absolute; inset: 0; background-size: cover; background-position: center;
      opacity: 0; transition: opacity 0.6s ease;
    }
    .tz-slide--active { opacity: 1; }
    .tz-scrim {
      position: absolute; inset: 0;
      background: linear-gradient(to top, rgba(2,6,23,0.88) 0%, rgba(2,6,23,0.35) 45%, transparent 100%);
      pointer-events: none;
    }
    .tz-carousel-content { position: absolute; bottom: 0; left: 0; right: 0; padding: 3rem; display: flex; flex-direction: column; gap: 1.25rem; }
    .tz-caption-label { font-size: 0.8125rem; font-weight: 600; color: rgba(255,255,255,0.6); letter-spacing: 0.08em; text-transform: uppercase; margin: 0; }
    .tz-caption-text { font-size: 1.375rem; font-weight: 700; color: #fff; letter-spacing: -0.02em; line-height: 1.3; margin: 0; }
    .tz-dots { display: flex; gap: 0.5rem; }
    .tz-dot { width: 0.375rem; height: 0.375rem; border-radius: 999px; border: none; background: rgba(255,255,255,0.35); cursor: pointer; transition: background 0.2s, width 0.3s; padding: 0; }
    .tz-dot:hover { background: rgba(255,255,255,0.6); }
    .tz-dot--active { background: #fff; width: 1.25rem; }

    .tz-card { width: 100%; max-width: 340px; }
    .tz-brand { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 2.25rem; }
    .tz-logo { width: 28px; height: 28px; object-fit: contain; }
    .tz-brand-name { font-size: 1rem; font-weight: 700; color: #1A1A2E; letter-spacing: -0.02em; }
    .tz-head { margin-bottom: 1.75rem; }
    .tz-head h1 { font-size: 1.75rem; font-weight: 800; color: #1A1A2E; letter-spacing: -0.03em; line-height: 1.15; margin-bottom: 0.375rem; }
    .tz-head p { font-size: 0.9rem; color: #6B7280; line-height: 1.5; }
    .tz-head p strong { color: #1A1A2E; }
    .tz-head p a { color: var(--tz-accent-solid); font-weight: 600; text-decoration: none; }
    .tz-head p a:hover { color: var(--tz-accent-hover); }
    .tz-form { display: flex; flex-direction: column; gap: 0.625rem; }
    .tz-alt { margin-top: 1.75rem; font-size: 0.875rem; color: #6B7280; text-align: center; }
    .tz-alt a { color: var(--tz-accent-solid); font-weight: 600; text-decoration: none; }
    .tz-alt a:hover { color: var(--tz-accent-hover); }
    .tz-btn-primary {
      width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
      padding: 0.9rem 1.5rem; font-size: 0.9375rem; font-weight: 700; font-family: inherit;
      color: #fff; background: linear-gradient(135deg, var(--tz-accent-1) 0%, var(--tz-accent-2) 100%);
      border: none; border-radius: 14px; cursor: pointer;
      box-shadow: 0 0 48px -8px rgba(var(--tz-accent-tint), 0.35);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .tz-btn-primary:hover:not(:disabled) { transform: scale(1.02); box-shadow: 0 12px 48px -8px rgba(var(--tz-accent-tint), 0.4); }
    .tz-btn-primary:disabled { cursor: not-allowed; }

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

    .app-layout { display: flex; min-height: 100vh; align-items: stretch; justify-content: ${panelAlign}; }
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
      transition: opacity 0.2s ease;
    }
    .app-btn-primary:hover:not(:disabled) { opacity: 0.9; }
    .app-btn-primary:disabled { cursor: not-allowed; opacity: 0.7; }

    /* ════════════════════════════════════════════════
       Shared inputs + error (both TravelZero and branded)
    ════════════════════════════════════════════════ */

    input[type="password"] {
      width: 100%;
      padding: 0.8125rem 1rem;
      font-size: 0.9375rem;
      font-family: inherit;
      background: ${isTravelZero ? 'rgba(247, 249, 255, 0.6)' : 'var(--app-input-bg)'};
      border: 1.5px solid ${isTravelZero ? 'rgba(var(--tz-accent-tint), 0.15)' : 'var(--app-input-border)'};
      border-radius: ${isTravelZero ? '12px' : '8px'};
      color: ${isTravelZero ? '#1A1A2E' : 'var(--app-text)'};
      outline: none;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    input::placeholder { color: #9CA3AF; }
    input:focus {
      border-color: ${isTravelZero ? 'var(--tz-accent-1)' : 'var(--app-input-focus)'};
      box-shadow: 0 0 0 3px ${isTravelZero ? 'rgba(var(--tz-accent-tint), 0.15)' : 'color-mix(in srgb, var(--app-input-focus) 20%, transparent)'};
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
  `;

  style.textContent += getWorkZeroCss(isTravelZero, isWorkZero, theme);

  document.head.appendChild(style);
}
