/**
 * ACUL Screen: email-identifier-challenge (Email verification / OTP step)
 *
 * Passwordless signup variant only. User verifies their email via a 6-digit
 * OTP that Auth0 mailed to them. After successful verification, the transaction
 * advances to passkey-enrollment (which may be skipped) on the passwordless path.
 *
 * Scoping:
 *   TravelZero → branded OTP entry form
 *   All other apps → branded form using the per-app theme
 */

import EmailIdentifierChallenge from '@auth0/auth0-acul-js/email-identifier-challenge';
import { getTheme } from './shared/themes.js';

const TRAVELZERO_CLIENT_ID = 'Sf9FmZInlomeJpEoxnCyKE00s46pmFL2';
const TZ_BG = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1173&auto=format&fit=crop';
const TZ_LOGO = 'https://markvong-o.github.io/openmoji-icons/2708.png';

let screen, ctx, clientId, isTravelZero, appTheme;

try {
  screen = new EmailIdentifierChallenge();
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
  const backLink = ctx.screen?.links?.back ?? '#';
  const email = ctx.screen?.data?.email ?? 'your email';

  return `
    <div class="tz-layout">
      <div class="tz-panel">
        <div class="tz-card">
          <div class="tz-brand">
            <img src="${TZ_LOGO}" class="tz-logo" alt="" />
            <span class="tz-brand-name">TravelZero</span>
          </div>
          <div class="tz-head">
            <h1>Verify your email</h1>
            <p>We sent a code to <strong>${email}</strong></p>
          </div>
          <form id="otp-form" class="tz-form" novalidate>
            <input type="text" id="otp-code" inputmode="numeric" maxlength="6" placeholder="000000" required />
            <button type="submit" class="tz-btn-primary" id="verify-btn">Verify</button>
          </form>
          <div class="tz-divider"><span>or</span></div>
          <button type="button" class="tz-btn-ghost" id="resend-btn">
            Resend code
            <span id="resend-countdown"></span>
          </button>
          <p class="tz-alt">
            <a href="${backLink}" class="tz-link">← Go back</a>
          </p>
        </div>
      </div>
      <div class="tz-carousel">
        <div class="tz-slide tz-slide--active" style="background-image: url('${TZ_BG}')"></div>
        <div class="tz-scrim"></div>
      </div>
    </div>
  `;
}

// ─── Branded renderer ───────────────────────────────────────────────────────

function renderBranded(theme, ctx) {
  const backLink = ctx.screen?.links?.back ?? '#';
  const email = ctx.screen?.data?.email ?? 'your email';

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
            <h1>Verify your email</h1>
            <p>We sent a code to <strong>${email}</strong></p>
          </div>
          <form id="otp-form" class="app-form" novalidate>
            <input type="text" id="otp-code" inputmode="numeric" maxlength="6" placeholder="000000" required />
            <button type="submit" class="app-btn-primary" id="verify-btn">Verify</button>
          </form>
          <p class="app-alt">
            <button type="button" class="app-btn-resend" id="resend-btn">Resend code<span id="resend-countdown"></span></button>
          </p>
          <p class="app-back">
            <a href="${backLink}">← Go back</a>
          </p>
        </div>
      </div>
    </div>
  `;
}

// ─── Event wiring ──────────────────────────────────────────────────────────

function wireHandlers(screen, ctx) {
  const otpForm = document.getElementById('otp-form');
  const otpInput = document.getElementById('otp-code');
  const verifyBtn = document.getElementById('verify-btn');
  const resendBtn = document.getElementById('resend-btn');
  const countdownEl = document.getElementById('resend-countdown');

  if (otpForm) {
    otpForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const code = (otpInput?.value ?? '').trim();
      if (code.length !== 6 || !/^\d{6}$/.test(code)) {
        showError('Please enter a 6-digit code');
        return;
      }
      setLoading(true);
      try {
        await screen.submitEmailChallenge({ code });
      } catch (err) {
        showError(err.message ?? 'Invalid code. Please try again.');
        setLoading(false);
      }
    });
  }

  if (resendBtn) {
    resendBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      resendBtn.disabled = true;
      try {
        await screen.resendCode();
        // Start countdown if available
        const resend = screen.resendManager({ timeoutSeconds: 60 });
        if (resend && resend.startResend) {
          resend.startResend();
        }
      } catch (err) {
        showError(err.message ?? 'Failed to resend code');
        resendBtn.disabled = false;
      }
    });

    // Check if resend is already limited (pre-existing API state)
    const resendLimitReached = ctx?.screen?.data?.resendLimitReached ?? false;
    if (resendLimitReached) {
      resendBtn.disabled = true;
      if (countdownEl) countdownEl.textContent = ' (Try again in a moment)';
    }
  }
}

// ─── UI utilities ──────────────────────────────────────────────────────────

function setLoading(loading) {
  document.querySelectorAll('#verify-btn, #resend-btn').forEach((btn) => {
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

// ─── Styles ────────────────────────────────────────────────────────────────

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
       TravelZero — passwordless (orange) palette
    ════════════════════════════════════════════════ */

    .tz-layout {
      display: flex; min-height: 100vh; align-items: stretch;
      --tz-accent-1: #FF9F43;
      --tz-accent-2: #FF6B6B;
      --tz-accent-solid: #E8590C;
      --tz-accent-hover: #C2410C;
      --tz-accent-tint: 255, 159, 67;
    }
    .tz-panel {
      flex: 0 0 40%; min-width: 380px; min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      padding: 3rem 3rem;
      background: rgba(255,255,255,0.75);
      backdrop-filter: blur(24px) saturate(180%); -webkit-backdrop-filter: blur(24px) saturate(180%);
      border-right: 1px solid rgba(255,255,255,0.45);
      box-shadow: 4px 0 40px -8px rgba(var(--tz-accent-tint), 0.12);
    }
    .tz-card { width: 100%; max-width: 360px; }
    .tz-brand { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 2.25rem; }
    .tz-logo { width: 28px; height: 28px; object-fit: contain; }
    .tz-brand-name { font-size: 1rem; font-weight: 700; color: #1A1A2E; letter-spacing: -0.02em; }

    /* ── Carousel (right 60%) ── */
    .tz-carousel {
      flex: 1; position: relative; overflow: hidden; min-height: 100vh;
    }
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

    .tz-head { margin-bottom: 1.75rem; }
    .tz-head h1 { font-size: 1.625rem; font-weight: 800; color: #1A1A2E; letter-spacing: -0.03em; line-height: 1.2; margin-bottom: 0.375rem; }
    .tz-head p { font-size: 0.9rem; color: #6B7280; line-height: 1.5; }
    .tz-head strong { font-weight: 600; color: #1A1A2E; }
    .tz-form { display: flex; flex-direction: column; gap: 0.625rem; }
    .tz-divider { display: flex; align-items: center; gap: 0.75rem; margin: 1.125rem 0; color: #9CA3AF; font-size: 0.8125rem; }
    .tz-divider::before, .tz-divider::after { content: ''; flex: 1; height: 1px; background: rgba(var(--tz-accent-tint), 0.12); }
    .tz-alt { margin-top: 1.75rem; font-size: 0.875rem; color: #6B7280; text-align: center; }
    .tz-link { color: var(--tz-accent-solid); font-weight: 600; text-decoration: none; }
    .tz-link:hover { color: var(--tz-accent-hover); }
    .tz-btn-primary {
      width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
      padding: 0.9rem 1.5rem; font-size: 0.9375rem; font-weight: 700; font-family: inherit;
      color: #fff; background: linear-gradient(135deg, var(--tz-accent-1) 0%, var(--tz-accent-2) 100%);
      border: none; border-radius: 14px; cursor: pointer;
      box-shadow: 0 0 48px -8px rgba(var(--tz-accent-tint), 0.35);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .tz-btn-primary:hover:not(:disabled) { transform: scale(1.02); }
    .tz-btn-primary:disabled { cursor: not-allowed; }
    .tz-btn-ghost {
      background: none; border: none; font-size: 0.875rem; font-weight: 600; font-family: inherit;
      color: var(--tz-accent-solid); cursor: pointer; padding: 0.25rem 0;
      display: inline-flex; align-items: center; gap: 0.375rem;
    }
    .tz-btn-ghost:hover:not(:disabled) { color: var(--tz-accent-hover); }
    .tz-btn-ghost:disabled { opacity: 0.5; cursor: not-allowed; }

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
    .app-head strong { font-weight: 600; color: var(--app-text); }
    .app-form { display: flex; flex-direction: column; gap: 0.625rem; }
    .app-alt { margin-top: 1.5rem; font-size: 0.875rem; text-align: center; }
    .app-btn-resend { background: none; border: none; font-size: 0.875rem; font-weight: 600; font-family: inherit; color: var(--app-link); cursor: pointer; padding: 0; }
    .app-btn-resend:hover:not(:disabled) { text-decoration: underline; }
    .app-btn-resend:disabled { opacity: 0.5; cursor: not-allowed; }
    .app-back { margin-top: 1.5rem; font-size: 0.875rem; color: var(--app-muted); text-align: center; }
    .app-back a { color: var(--app-link); font-weight: 600; text-decoration: none; }
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
      border: 1.5px solid ${isTravelZero ? 'rgba(var(--tz-accent-tint), 0.15)' : 'var(--app-input-border)'};
      border-radius: ${isTravelZero ? '12px' : '8px'};
      color: ${isTravelZero ? '#1A1A2E' : 'var(--app-text)'};
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    input::placeholder { color: #9CA3AF; }
    input:focus {
      border-color: ${isTravelZero ? 'var(--tz-accent-1)' : 'var(--app-input-focus)'};
      box-shadow: 0 0 0 3px ${isTravelZero ? 'rgba(var(--tz-accent-tint), 0.15)' : 'color-mix(in srgb, var(--app-input-focus) 20%, transparent)'};
    }

    .acul-error {
      background: rgba(255,71,87,0.08); border: 1.5px solid rgba(255,71,87,0.25);
      border-radius: 10px; color: #DC2626; font-size: 0.875rem;
      padding: 0.75rem 1rem; margin-bottom: 1rem; line-height: 1.5;
    }
  `;
  document.head.appendChild(style);
}
