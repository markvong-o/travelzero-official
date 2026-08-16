# Local Custom Domain Setup

Running your app at `localhost:5173` works until you hit OAuth callbacks, browser security policies, or CORS restrictions that expect a real hostname. This guide sets up a custom local domain with HTTPS so your dev environment behaves like production without changing your app code.

The approach: map a hostname to `127.0.0.1` via `/etc/hosts`, generate a locally-trusted TLS certificate with mkcert, and run Caddy as a reverse proxy in front of your dev server.

---

## Prerequisites

- [mkcert](https://github.com/FiloSottile/mkcert) — generates locally-trusted certificates
- [Caddy](https://caddyserver.com) — reverse proxy with built-in TLS support

```bash
brew install mkcert caddy
```

---

## 1. Choose your local domain

Pick any hostname that fits your project. A few examples:

- `app.myproject.local`
- `myapp.dev.example.com` (if you own `example.com`)
- `travel0.idzero.mvbuilt.com` (any subdomain of a domain you control)

For OAuth and browser security features like WebAuthn, using a subdomain of a real domain you control is the most reliable choice.

---

## 2. Add the host entry

Edit `/etc/hosts`:

```bash
sudo nano /etc/hosts
```

Add:

```
127.0.0.1 your-chosen-hostname
```

---

## 3. Generate the TLS certificate

First, install the mkcert root CA into your system trust store (this is a one-time step):

```bash
mkcert -install
```

Generate the certificate by running this from your project's directory where you want the cert files to live:

```bash
mkcert your-chosen-hostname
```

This produces two files:

- `your-chosen-hostname.pem`
- `your-chosen-hostname-key.pem`

Don't commit these to version control — add them to `.gitignore`.

---

## 4. Create a Caddyfile

Create a `Caddyfile` in your project root (or wherever you'll run Caddy from):

```
your-chosen-hostname {
    tls your-chosen-hostname.pem your-chosen-hostname-key.pem
    reverse_proxy localhost:PORT
}
```

Replace `PORT` with the port your dev server runs on (e.g., `5173` for Vite, `3000` for Next.js, `8080` for others).

---

## 5. Run Caddy alongside your dev server

In one terminal, start Caddy:

```bash
sudo caddy run --config Caddyfile
```

In another terminal, start your dev server as normal:

```bash
npm run dev
```

If your dev server blocks requests from unexpected hostnames (Vite 5+ does this by default), add the hostname to your dev server config:

**Vite (`vite.config.js`)**
```js
server: {
  allowedHosts: ['your-chosen-hostname'],
}
```

**webpack-dev-server**
```js
devServer: {
  allowedHosts: ['your-chosen-hostname'],
}
```

---

## Using concurrently

If you want a single `npm run dev` command to orchestrate everything, add Caddy as a parallel process using `concurrently`:

```bash
npm install -D concurrently
```

```json
"dev": "concurrently \"npm run dev:server\" \"sudo caddy run --config Caddyfile\""
```

You'll be prompted for your sudo password once at startup.

---

## Result

Navigate to `https://your-chosen-hostname` in your browser. You now have a valid HTTPS connection with a trusted certificate and no port in the URL. Caddy proxies all requests to your dev server, which means you can test OAuth flows, WebAuthn interactions, and any other features that require a proper hostname and HTTPS without leaving your local environment.
