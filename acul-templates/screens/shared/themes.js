/**
 * Per-application theme map — mirrors the conditional styling in
 * auth0-templates/universal-login.html. When ACUL is in advanced rendering
 * mode it fully replaces Auth0's widget, so non-TravelZero apps need their
 * branding reproduced here rather than inheriting it from the page template.
 *
 * Add a new entry whenever a new application is added to the page template.
 */

export const THEMES = {
  // Admin Portal — Ocean Authority
  hcdbZhVfBel0gNCKIuQvOF1BQq1lj7Pw: {
    name: 'Admin Portal',
    bg: 'https://images.unsplash.com/photo-1563198797-31e0a0dc15c0?q=80&w=1152&auto=format&fit=crop',
    logo: 'https://markvong-o.github.io/openmoji-icons/1F5A5.png',
    align: 'right',
    dark: false,
    primary: '#1A5276',
    primaryHover: '#154360',
    panelBg: 'rgba(255, 255, 255, 0.92)',
    panelBorder: '#AED6F1',
    link: '#2E86C1',
    text: '#1C2833',
    muted: '#566573',
    inputBg: '#FFFFFF',
    inputBorder: 'rgba(174, 214, 241, 0.4)',
    inputFocus: '#2E86C1',
    buttonGradient: null,
    font: null,
  },

  // Patient Portal — Trusted Care
  HwndmOtFBfo9WS0kkZNwlJ5kIXeYm89R: {
    name: 'Patient Portal',
    bg: 'https://images.unsplash.com/photo-1581056771107-24ca5f033842?q=80&w=1170&auto=format&fit=crop',
    logo: 'https://markvong-o.github.io/openmoji-icons/E30A.png',
    align: 'left',
    dark: false,
    primary: '#2471A3',
    primaryHover: '#1A5276',
    panelBg: 'rgba(255, 255, 255, 0.95)',
    panelBorder: '#D4E6F1',
    link: '#2E86C1',
    text: '#1C2833',
    muted: '#5D6D7E',
    inputBg: '#FFFFFF',
    inputBorder: 'rgba(212, 230, 241, 0.5)',
    inputFocus: '#2471A3',
    buttonGradient: null,
    font: null,
  },

  // Provider Portal — Clinical Precision
  Z5WA5rEswuSZQ9DBuIaujhuTcKeUvQ1G: {
    name: 'Provider Portal',
    bg: 'https://images.unsplash.com/photo-1655313719493-16ebe4906441?q=80&w=1171&auto=format&fit=crop',
    logo: 'https://markvong-o.github.io/openmoji-icons/E307.png',
    align: 'right',
    dark: false,
    primary: '#4A235A',
    primaryHover: '#3B1C4A',
    panelBg: 'rgba(255, 255, 255, 0.93)',
    panelBorder: '#E8DAEF',
    link: '#7D3C98',
    text: '#1C2833',
    muted: '#6C3483',
    inputBg: '#FFFFFF',
    inputBorder: 'rgba(232, 218, 239, 0.5)',
    inputFocus: '#7D3C98',
    buttonGradient: null,
    font: null,
  },

  // RxZero — Pharmacy
  YWLp9HeCnSnCoYwDoVWD7ZM4ozuPdiLu: {
    name: 'RxZero',
    bg: 'https://images.unsplash.com/photo-1642055514517-7b52288890ec?q=80&w=3174&auto=format&fit=crop',
    logo: null,
    align: 'right',
    dark: false,
    primary: '#1A1A2E',
    primaryHover: '#16213E',
    panelBg: 'rgba(255, 255, 255, 0.95)',
    panelBorder: '#E5E7EB',
    link: '#1A1A2E',
    text: '#1A1A2E',
    muted: '#6B7280',
    inputBg: '#FFFFFF',
    inputBorder: '#E5E7EB',
    inputFocus: '#1A1A2E',
    buttonGradient: null,
    font: null,
  },

  // Retail0 — Premium DTC Fashion
  WG6rTB9W6alqkbtKgu1LmrQ3RzmVL72C: {
    name: 'Retail0',
    bg: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1170&auto=format&fit=crop',
    logo: 'https://markvong-o.github.io/openmoji-icons/1F45C.png',
    align: 'right',
    dark: false,
    primary: '#1A1A2E',
    primaryHover: '#16213E',
    panelBg: 'rgba(255, 255, 255, 0.95)',
    panelBorder: '#E5E7EB',
    link: '#1A1A2E',
    text: '#1A1A2E',
    muted: '#6B7280',
    inputBg: '#FFFFFF',
    inputBorder: '#E5E7EB',
    inputFocus: '#1A1A2E',
    buttonGradient: null,
    font: null,
  },

  // Care0 Health — Dark teal
  bbghat6Y1HQmni3mFeOZ4sSOpuOqdcRw: {
    name: 'Care0',
    bg: null,
    bgCss: 'linear-gradient(135deg, #0a0a0a 0%, #111111 40%, #0a1a1a 100%)',
    logo: 'https://markvong-o.github.io/openmoji-icons/E30A.png',
    align: 'center',
    dark: true,
    primary: '#0d9488',
    primaryHover: '#0f766e',
    panelBg: 'rgba(23, 23, 23, 0.95)',
    panelBorder: 'rgba(255, 255, 255, 0.08)',
    link: '#2dd4bf',
    text: '#f5f5f5',
    muted: '#a1a1aa',
    inputBg: 'rgba(255, 255, 255, 0.05)',
    inputBorder: 'rgba(255, 255, 255, 0.1)',
    inputFocus: '#0d9488',
    buttonGradient: null,
    font: null,
  },

  // RetailZero — Pastel purple dark
  pPpzuafGUgTFF7Q1dQcZZ6rd1lVbnUZf: {
    name: 'RetailZero',
    bg: 'https://images.unsplash.com/photo-1607082350899-7e105aa886ae?q=80&w=1170&auto=format&fit=crop',
    logo: 'https://markvong-o.github.io/openmoji-icons/1F6D2.png',
    align: 'right',
    dark: true,
    primary: '#4016A0',
    primaryHover: '#341580',
    panelBg: 'rgba(25, 25, 25, 0.8)',
    panelBorder: 'rgba(255, 255, 255, 0.08)',
    link: '#B49BFC',
    text: '#f5f5f5',
    muted: '#a3a3a3',
    inputBg: 'rgba(255, 255, 255, 0.9)',
    inputBorder: 'rgba(200, 200, 200, 0.4)',
    inputFocus: '#B49BFC',
    buttonGradient: 'linear-gradient(135deg, #4016A0 0%, #7C3AED 100%)',
    font: null,
  },
};

export const DEFAULT_THEME = {
  name: 'Default',
  bg: null,
  bgCss: '#F3F4F6',
  logo: null,
  align: 'center',
  dark: false,
  primary: '#111827',
  primaryHover: '#1F2937',
  panelBg: '#FFFFFF',
  panelBorder: '#E5E7EB',
  link: '#4B5563',
  text: '#111827',
  muted: '#6B7280',
  inputBg: '#FFFFFF',
  inputBorder: '#E5E7EB',
  inputFocus: '#111827',
  buttonGradient: null,
  font: null,
};

export function getTheme(clientId) {
  return THEMES[clientId] ?? DEFAULT_THEME;
}
