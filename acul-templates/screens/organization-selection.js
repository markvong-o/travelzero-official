/**
 * ACUL Screen: organization-selection
 *
 * Allows users to select which organization to continue with during login flow.
 * Supports both TravelZero and WorkZero branding, plus default branded fallback.
 */

import OrganizationSelection from '@auth0/auth0-acul-js/organization-selection';
import { getTheme } from './shared/themes.js';
import { WORKZERO_CLIENT_ID, getWorkZeroCss } from './shared/workzero-styles.js';

const TRAVELZERO_CLIENT_ID = 'Sf9FmZInlomeJpEoxnCyKE00s46pmFL2';
const TZ_BG = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=2070&auto=format&fit=crop';

let screen, ctx, clientId, isTravelZero, isWorkZero, appTheme;

try {
  screen = new OrganizationSelection();
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
  ? renderTravelZero(ctx)
  : isWorkZero
  ? renderWorkZero(ctx)
  : renderBranded(appTheme ?? getTheme(null), ctx ?? {});

wireHandlers(isTravelZero, isWorkZero, screen);

function renderTravelZero(ctx) {
  const orgs = ctx?.screen?.data?.organizations ?? [];
  const orgListHtml = orgs.map((org, idx) => `
    <button class="tz-org-btn" data-org-index="${idx}">
      <span class="tz-org-name">${org.display_name || org.name || 'Organization'}</span>
      <span class="tz-org-arrow">→</span>
    </button>
  `).join('');

  return `
    <div class="tz-layout">
      <div class="tz-carousel">
        <div class="tz-slide tz-slide-active">
          <div class="tz-panel">
            <div class="tz-card">
              <div class="tz-badge tz-badge-org">ORGANIZATION</div>
              <h1 class="tz-head">Select Your Organization</h1>
              <p class="tz-subhead">Choose which organization you'd like to access</p>
              <div id="org-list" class="tz-org-list">
                ${orgListHtml}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderWorkZero(ctx) {
  const orgs = ctx?.screen?.data?.organizations ?? [];
  const orgListHtml = orgs.map((org, idx) => `
    <button class="wz-org-btn" data-org-index="${idx}">
      <span>${org.display_name || org.name || 'Organization'}</span>
    </button>
  `).join('');

  return `
    <div class="wz-layout">
      <div class="wz-panel">
        <div class="wz-card">
          <div class="wz-brand">
            <span class="wz-brand-name">WorkZero</span>
          </div>
          <div class="wz-head">
            <h1>Select Your Organization</h1>
            <p>Choose which organization to access</p>
          </div>
          <div id="org-list" class="wz-org-list">
            ${orgListHtml}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderBranded(theme, ctx) {
  const orgs = ctx?.screen?.data?.organizations ?? [];
  const orgListHtml = orgs.map((org, idx) => `
    <button class="branded-org-btn" data-org-index="${idx}" style="color: ${theme.text};">
      ${org.display_name || org.name || 'Organization'}
    </button>
  `).join('');

  const panelAlign = theme.align === 'right' ? 'flex-end' : theme.align === 'center' ? 'center' : 'flex-start';

  return `
    <div class="app-layout" style="background: ${theme.bgCss ?? '#F3F4F6'};">
      <div class="app-panel" style="align-items: ${panelAlign};">
        <div class="app-card">
          <h2 style="color: ${theme.text}; margin-bottom: 1rem;">Select Your Organization</h2>
          <div id="org-list" class="org-list">
            ${orgListHtml}
          </div>
        </div>
      </div>
    </div>
  `;
}

function injectStyles(isTravelZero, isWorkZero, theme) {
  const style = document.createElement('style');

  const bgCss = theme.bg
    ? `background-image: url('${isTravelZero ? TZ_BG : theme.bg}'); background-size: cover; background-position: center; background-repeat: no-repeat;`
    : `background: ${theme.bgCss ?? '#F3F4F6'};`;

  const panelAlign = isTravelZero ? 'flex-start' : (
    theme.align === 'right' ? 'flex-end' : theme.align === 'center' ? 'center' : 'flex-start'
  );

  style.textContent = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif; }

    .tz-layout {
      display: flex;
      min-height: 100vh;
      align-items: stretch;
      ${bgCss}
    }

    .tz-carousel {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      padding: 3rem;
    }

    .tz-slide {
      flex: 0 0 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .tz-panel {
      flex: 0 0 380px;
      background: rgba(247, 249, 255, 0.98);
      border-radius: 16px;
      padding: 2.5rem;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    }

    .tz-card { width: 100%; }

    .tz-badge {
      display: inline-block;
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      color: var(--tz-accent-1);
      margin-bottom: 1rem;
    }

    .tz-head {
      font-size: 1.75rem;
      font-weight: 800;
      color: #1A1A2E;
      margin-bottom: 0.375rem;
    }

    .tz-subhead {
      font-size: 0.9rem;
      color: #6B7280;
      margin-bottom: 1.75rem;
      line-height: 1.5;
    }

    .tz-org-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .tz-org-btn {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      background: white;
      border: 1.5px solid rgba(var(--tz-accent-tint), 0.15);
      border-radius: 12px;
      cursor: pointer;
      font-size: 0.95rem;
      font-weight: 600;
      color: #1A1A2E;
      transition: all 0.2s ease;
    }

    .tz-org-btn:hover {
      border-color: var(--tz-accent-1);
      background: rgba(var(--tz-accent-tint), 0.04);
      transform: translateX(4px);
    }

    .tz-org-name { flex: 1; text-align: left; }
    .tz-org-arrow { color: var(--tz-accent-1); margin-left: 0.75rem; }

    /* WorkZero organization selection */
    .wz-org-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .wz-org-btn {
      width: 100%;
      padding: 0.9rem 1.5rem;
      font-size: 0.9375rem;
      font-weight: 600;
      font-family: inherit;
      color: #fff;
      background: var(--wz-primary-600);
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s ease;
      box-shadow: var(--wz-shadow-md);
    }

    .wz-org-btn:hover {
      background: var(--wz-primary-700);
      box-shadow: var(--wz-shadow-lg);
    }

    /* Branded organization selection */
    .app-layout {
      display: flex;
      min-height: 100vh;
      align-items: stretch;
    }

    .app-panel {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem;
    }

    .app-card {
      max-width: 400px;
      width: 100%;
    }

    .org-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .branded-org-btn {
      width: 100%;
      padding: 0.875rem 1.25rem;
      font-size: 0.9rem;
      font-weight: 600;
      font-family: inherit;
      border: 1.5px solid #E5E7EB;
      border-radius: 8px;
      background: white;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .branded-org-btn:hover {
      border-color: #D1D5DB;
      background: #F9FAFB;
    }
  `;

  style.textContent += getWorkZeroCss(isTravelZero, isWorkZero, theme);

  document.head.appendChild(style);
}

function wireHandlers(isTravelZero, isWorkZero, screen) {
  const orgList = document.getElementById('org-list');
  if (!orgList) return;

  orgList.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-org-index]');
    if (!btn) return;

    const orgs = ctx?.screen?.data?.organizations ?? [];
    const idx = parseInt(btn.dataset.orgIndex, 10);
    const org = orgs[idx];

    if (org?.name) {
      try {
        await screen.continueWithOrganizationName({ organizationName: org.name });
      } catch (err) {
        console.error('Failed to select organization:', err);
      }
    }
  });
}
