/**
 * WorkZero — mid-century modern styling utilities for ACUL screens
 * Applies the WorkZero palette (walnut primary, teal accent, warm gray) when
 * the clientId matches WORKZERO_CLIENT_ID.
 */

export const WORKZERO_CLIENT_ID = 'MLfvRUlc13Zt85k2D3wNJR21bUODGknA';

export function getWorkZeroCss(isTravelZero, isWorkZero, theme) {
  if (isTravelZero || !isWorkZero) return '';

  // WorkZero mid-century modern theme variables
  return `
    /* ════════════════════════════════════════════════
       WorkZero — mid-century modern
    ════════════════════════════════════════════════ */

    :root {
      --wz-primary-950: #1f1712;
      --wz-primary-900: #2c211a;
      --wz-primary-800: #3e2e23;
      --wz-primary-700: #6b4f3a;
      --wz-primary-600: #7d5e45;
      --wz-primary-500: #8f6e52;
      --wz-primary-400: #a88a6e;
      --wz-accent-900: #16302c;
      --wz-accent-700: #2e544c;
      --wz-accent-500: #3e6b63;
      --wz-accent-300: #7ba39b;
      --wz-gray-950: #1a1917;
      --wz-gray-900: #2b2a27;
      --wz-gray-700: #554c43;
      --wz-gray-600: #6e6357;
      --wz-gray-500: #8a7d6b;
      --wz-gray-400: #a79a85;
      --wz-gray-300: #c6baa6;
      --wz-gray-100: #ede6da;
      --wz-paper-raised: #fdfbf7;
      --wz-shadow-md: 0 2px 8px rgba(43, 42, 39, 0.1);
      --wz-shadow-lg: 0 4px 14px rgba(43, 42, 39, 0.14);
    }

    .wz-layout {
      display: flex;
      min-height: 100vh;
      align-items: stretch;
      background: var(--wz-gray-50, #f4efe6);
    }

    .wz-panel {
      flex: 0 0 40%;
      min-width: 380px;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      background: var(--wz-paper-raised);
      border-right: 1px solid var(--wz-gray-200, #ddd4c4);
      box-shadow: 4px 0 24px rgba(43, 42, 39, 0.08);
    }

    .wz-card { width: 100%; max-width: 340px; }

    .wz-brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 2.25rem;
    }

    .wz-logo { width: 28px; height: 28px; object-fit: contain; }

    .wz-brand-name {
      font-size: 1rem;
      font-weight: 700;
      color: var(--wz-gray-950);
      letter-spacing: -0.02em;
    }

    .wz-head { margin-bottom: 1.75rem; }

    .wz-head h1 {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--wz-gray-950);
      letter-spacing: -0.03em;
      line-height: 1.15;
      margin-bottom: 0.375rem;
    }

    .wz-head p {
      font-size: 0.9rem;
      color: var(--wz-gray-600);
      line-height: 1.5;
    }

    .wz-form { display: flex; flex-direction: column; gap: 0.625rem; }

    .wz-divider {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin: 1.125rem 0;
      color: var(--wz-gray-500);
      font-size: 0.8125rem;
    }

    .wz-divider::before, .wz-divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--wz-gray-200, #ddd4c4);
    }

    .wz-alt {
      margin-top: 1.75rem;
      font-size: 0.875rem;
      color: var(--wz-gray-600);
      text-align: center;
    }

    .wz-alt a {
      color: var(--wz-accent-500);
      font-weight: 600;
      text-decoration: none;
    }

    .wz-alt a:hover { color: var(--wz-accent-700); }

    .wz-btn-primary {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.9rem 1.5rem;
      font-size: 0.9375rem;
      font-weight: 700;
      font-family: inherit;
      color: #fff;
      background: var(--wz-primary-600);
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s ease;
      box-shadow: var(--wz-shadow-md);
    }

    .wz-btn-primary:hover:not(:disabled) {
      background: var(--wz-primary-700);
      box-shadow: var(--wz-shadow-lg);
    }

    .wz-btn-primary:disabled { cursor: not-allowed; opacity: 0.7; }

    .wz-btn-ghost {
      background: none;
      border: none;
      font-size: 0.875rem;
      font-weight: 600;
      font-family: inherit;
      color: var(--wz-accent-500);
      cursor: pointer;
      padding: 0.25rem 0;
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
    }

    .wz-btn-ghost:hover { color: var(--wz-accent-700); }

    /* Input styling for WorkZero */
    .wz-layout input[type="email"],
    .wz-layout input[type="password"],
    .wz-layout input[type="text"] {
      background: var(--wz-paper-raised);
      border: 1.5px solid var(--wz-gray-200, #ddd4c4);
      color: var(--wz-gray-950);
    }

    .wz-layout input:focus {
      border-color: var(--wz-accent-500);
      box-shadow: 0 0 0 3px rgba(62, 107, 99, 0.1);
    }
  `;
}
