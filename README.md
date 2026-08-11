# TravelZero — Auth0 CIAM B2C Demo App

A free-roam clickable product demo showcasing Auth0 CIAM capabilities in a consumer travel-booking app context. All Auth0 behavior is mocked (no real tenant, no real WebAuthn) but behaves convincingly like production features.

## Quick Start

### Prerequisites
- Node.js 16+ and npm

### Install & Run

```bash
npm run install:all   # installs server + client dependencies
npm run dev           # starts server (:4001) and client (:5173) together
```

That's the whole setup — one install command, one dev command. Both processes run in the same terminal (labeled `[server]` / `[client]`); `Ctrl+C` stops both.

<details>
<summary>Run server/client separately instead</summary>

```bash
# Terminal 1
cd server && npm install && npm run dev   # http://localhost:4001

# Terminal 2
cd client && npm install && npm run dev   # http://localhost:5173 (auto-opens)
```
</details>

## What's Inside

### Architecture
- **Server**: Express.js on port 4001 with in-memory state (resets on restart)
- **Client**: Vite + React on port 5173, plain JavaScript (no TypeScript)
- **Styling**: CSS variables theme system, Mediterranean palette (deep ocean primary + terracotta accent)

### Key Features Demoed

1. **Anonymous Sessions** — Browse destinations as a guest with a session ID
2. **Passkey & Password Signup** — Simulated WebAuthn UX with realistic timing
3. **Loyalty Points** — 10K points granted on signup; Platinum tier at 50K
4. **AI Travel Assistant** — Chat interface; mocked itinerary generation with agent scopes
5. **Agentic Commerce** — External agent (Gemini mock) books add-ons on user's behalf; shows Token Vault reference & MCP tool invocation
6. **Security AI Agent** — Flag detection flow with password reset interstitial
7. **Experiment Center** — Real-time passkey vs password signup stats from in-memory events
8. **My Account API** — Get/update user metadata (favorites, itinerary, preferences)

### File Structure

```
travelzero/
├── server/
│   ├── package.json
│   ├── index.js
│   ├── store.js (in-memory state)
│   └── routes/
│       ├── session.js
│       ├── auth.js
│       ├── account.js
│       ├── assistant.js
│       ├── security.js
│       └── experiments.js
├── client/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── api.js (fetch wrapper)
│   │   ├── styles/
│   │   │   ├── theme.css
│   │   │   └── global.css
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ToastContext.jsx
│   │   ├── components/
│   │   │   ├── NavBar.jsx / .css
│   │   │   ├── Modal.jsx / .css
│   │   │   ├── Toast.jsx / .css
│   │   │   ├── Badge.jsx / .css
│   │   │   ├── ScopeChip.jsx / .css
│   │   │   ├── DestinationCard.jsx / .css
│   │   │   └── LoyaltyMeter.jsx / .css
│   │   └── pages/
│   │       ├── Browse.jsx / .css
│   │       ├── SignupModal.jsx / .css
│   │       ├── Login.jsx / .css
│   │       ├── Dashboard.jsx / .css
│   │       ├── Assistant.jsx / .css
│   │       ├── ExperimentCenter.jsx / .css
│   │       └── SecurityInterstitial.jsx / .css
└── README.md
```

## Screens & Flows

- **Browse** (/) — Anonymous destination catalog with favorites & signup modal
- **Login** (/login) — Three methods: passkey, password, email code (passwordless nod)
- **Dashboard** (/dashboard) — Profile, loyalty meter, favorites, itinerary
- **Assistant** (/assistant) — Chat with AI; see agent scopes; simulate external agent booking
- **Experiment Center** (/admin/experiments) — Live passkey vs password signup metrics
- **Security Interstitial** (/security-interstitial) — Password reset screen when breach is detected

## Auth0 Integration Points (Mocked) — researched against real Auth0 docs

Each integration point is clearly commented in code with `// Mock:` prefix, and every
comment cites the real Auth0 feature/endpoint/grant-type it's approximating (or says so
plainly when there isn't one). Summary:

| App endpoint | Real Auth0 mechanism it approximates |
|---|---|
| `POST /api/session` | **Anonymous Sessions** (beta) — `POST /anonymous/token` |
| `POST /api/auth/signup` (passkey) | **Passkeys** — `/passkey/register` WebAuthn registration ceremony |
| `POST /api/auth/login` (passkey / email_code) | `/passkey/challenge` ceremony; Passwordless `/passwordless/start` + `/oauth/token` (grant `http://auth0.com/oauth/grant-type/passwordless/otp`) |
| `GET /api/account/me` | **My Account API** — audience `https://{tenant}.auth0.com/me/`, `/me/v1/authentication-methods` |
| `POST /api/assistant/chat` | Agent scopes modeled as an RFC 8693 actor claim (`act.sub`) on an M2M client — "Agent as Principal" is an Early Access roadmap item, not yet a first-class Auth0 entity |
| `POST /api/assistant/agent-book` | **Token Vault**'s `...token-exchange:federated-connection-access-token` grant + **Auth for MCP** (RFC 8707 `resource` param, RFC 9728 discovery) |
| `POST /api/security/flag` | **Attack Protection** — Breached Password Detection / Security Center (there is no separate "Security AI Agent" product) |
| `GET /api/experiments/passkey-test` | **Not a real Auth0 product** ("Experiment Center" doesn't exist) — shown as a conceptual feature you could build with an Action + custom analytics |

## Notes

- **Real photography** — Destination cards, hero banner, and the sunset cruise add-on use free-to-use Wikimedia Commons photos (`client/public/images/`); member avatars use i.pravatar.cc
- **No database** — All state in-memory; resets on server restart
- **No TypeScript** — Pure JavaScript for simplicity & fast iteration
- **Real counts** — Experiment stats computed from actual signup events, not hardcoded
- **CORS enabled** — Client on 5173 can call server on 4001
- **Realistic timing** — Passkey flow has 1.2s simulated WebAuthn delay

## Demo Tips

1. **Sign up** with passkey (simulated biometric) to see the UX
2. **Plan a trip** with the AI assistant; observe agent scope badges
3. **Simulate agent booking** to see Token Vault reference + MCP tool details
4. **Check Experiment Center** after a few signups to see live A/B stats
5. **Flag security** in the Assistant sidebar, then try sharing your itinerary

---

**Build Date**: August 2026  
**Status**: Demo/Concept (not production code)
