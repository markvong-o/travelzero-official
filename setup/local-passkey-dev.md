# Local Passkey Dev Setup

WebAuthn enforces a hard security constraint: the passkey RP ID must be a parent domain of the page you're on. `localhost` doesn't qualify, so passkey enrollment and My Account API access won't work in local development without additional setup.

The solution is to map a custom subdomain of your tenant's RP ID to `127.0.0.1` via `/etc/hosts`, generate a locally-trusted TLS certificate with mkcert, and run Caddy as a reverse proxy in front of Vite. The browser sees a valid HTTPS domain, WebAuthn validation passes, and Vite remains unchanged.

---

## Prerequisites

- [mkcert](https://github.com/FiloSottile/mkcert) — generates locally-trusted certificates
- [Caddy](https://caddyserver.com) — reverse proxy with built-in TLS support

```bash
brew install mkcert caddy
```

---

## 1. Add the host entry

Edit `/etc/hosts`:

```bash
sudo nano /etc/hosts
```

Add this line:

```
127.0.0.1 travel0.idzero.mvbuilt.com
```

---

## 2. Generate the TLS certificate

Install the mkcert root CA into your system trust store (one-time operation):

```bash
mkcert -install
```

Generate the certificate for the dev domain. Run this from the `client/` directory:

```bash
cd client
mkcert travel0.idzero.mvbuilt.com
```

This produces two files in `client/`:
- `travel0.idzero.mvbuilt.com.pem`
- `travel0.idzero.mvbuilt.com-key.pem`

Both files are gitignored and should not be committed.

---

## 3. Caddy configuration

The `client/Caddyfile` is already present in the repo. It proxies HTTPS traffic on port 443 to Vite on port 5173, using the mkcert certificate:

```
travel0.idzero.mvbuilt.com {
    tls travel0.idzero.mvbuilt.com.pem travel0.idzero.mvbuilt.com-key.pem
    reverse_proxy localhost:5173
}
```

When you run `npm run dev` from the project root, Caddy starts as a third process alongside the server and client. You'll be prompted for your sudo password once at startup.

---

## 4. Configure Auth0 Dashboard allowed URLs

In the Auth0 Dashboard, navigate to **Applications → your SPA → Settings** and add the following URL to each list:

- **Allowed Callback URLs**: `https://travel0.idzero.mvbuilt.com/callback`
- **Allowed Logout URLs**: `https://travel0.idzero.mvbuilt.com`
- **Allowed Web Origins**: `https://travel0.idzero.mvbuilt.com`

---

## 5. Set the passkey Relying Party ID

In the Auth0 Dashboard, go to **Security → Attack Protection → Passkeys → Relying Party**. Set the RP ID to `idzero.mvbuilt.com` (the apex domain, not a subdomain like `login.idzero.mvbuilt.com`). This permits any subdomain of `idzero.mvbuilt.com` to serve as a valid origin for passkey enrollment.

---

## 6. Configure MRRT policy for My Account API access

The My Account API endpoint at `https://{domain}/me/` is configured to skip user consent. To enable silent token exchange without a popup, configure the MRRT policy on your SPA client via the Management API:

```bash
curl -X PATCH "https://YOUR_DOMAIN/api/v2/clients/YOUR_SPA_CLIENT_ID" \
  -H "Authorization: Bearer YOUR_MGMT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": {
      "policies": [
        {
          "audience": "https://YOUR_DOMAIN/me/",
          "scope": ["openid", "profile", "email", "read:me:authentication_methods"]
        }
      ]
    }
  }'
```

Also verify that **Refresh Token Rotation** is enabled for your SPA in the Dashboard (Applications → your SPA → Refresh Token Rotation).

---

## Running

From the project root:

```bash
npm run dev
```

Navigate to `https://travel0.idzero.mvbuilt.com`.

Passkey enrollment and My Account API access require this HTTPS domain. They will not function on `localhost`.
