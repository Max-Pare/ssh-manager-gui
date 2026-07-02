## SLOP WARNING
This application was vibe coded with Claude (Sonnet, high reasoning, Fable 5 high reasoning for security scans).
I wouldn't trust this to be secure or stable in any way, use at your own risk.
I recommend firewalling this application very tightly and not exposing it to the internet without a tunnel like Tailscale or Wireguard.

# SSH Device Manager

A self-hosted web GUI for managing SSH devices across environments. Monitor resource usage, open interactive terminals, and manage device inventory — all from a browser.

![Stack](https://img.shields.io/badge/Next.js-16-black) ![Backend](https://img.shields.io/badge/Node.js-Express-green) ![DB](https://img.shields.io/badge/SQLite-WAL-blue)

## Features

- **Device inventory** — add/edit/delete SSH devices organized by environment (prod/staging/dev) and group
- **Live metrics** — CPU, RAM, uptime, OS polled via SSH on a configurable interval
- **Interactive terminal** — full xterm.js PTY over WebSocket, multi-tab, persistent across navigation
- **Bulk operations** — select multiple devices, bulk delete, CSV import/export
- **Encrypted storage** — passwords encrypted with AES-256-GCM; key-based auth supported
- **Token auth** — all API routes require a shared bearer token (entered at a login screen, never bundled); the terminal WebSocket uses single-use short-lived tickets
- **Host-key verification** — SSH host keys are pinned (trust-on-first-use) to defend against MITM

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16, React 19, Tailwind v4, xterm.js |
| Backend | Node.js, Express, `ws`, `ssh2` |
| Storage | SQLite (`better-sqlite3`, WAL mode) |

## Setup

### Requirements

- Node.js 20+
- An `ENCRYPTION_KEY` env var (any string; used to derive the AES key for stored passwords)
- An `API_TOKEN` env var (random 32+ char string; clients must send it to reach the API)

### Install

```bash
git clone https://github.com/Max-Pare/ssh-manager-gui.git
cd ssh-manager-gui
npm install
```

### Run (development)

Set the required vars in `.env` (see `.env.example`). Generate a token with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

```bash
ENCRYPTION_KEY=your-secret-key \
API_TOKEN=your-random-token \
npm run dev
```

Frontend: [http://localhost:3000](http://localhost:3000)  
Backend API: [http://localhost:3001](http://localhost:3001)

Both start concurrently via `npm run dev` (uses `concurrently`).

Open the frontend and paste `API_TOKEN` into the login screen. The token is kept in the
browser's localStorage — it is never baked into the JS bundle. It's still a single shared
secret, not per-user auth — front the app with your own login if you need multi-user access.

### Run (production)

```bash
./run.sh    # builds the frontend, then starts both processes under pm2
```

Requires `pm2` (`npm i -g pm2`). `NEXT_PUBLIC_API_URL` is baked from `.env` at build
time — rebuild after changing it.

**Use TLS.** Without it, the API token and any SSH passwords you enter cross the network
in cleartext. Copy `Caddyfile.example` to `Caddyfile`, point `NEXT_PUBLIC_API_URL` and
`ALLOWED_ORIGIN` at the `https://` origin, rebuild, and firewall ports 3000/3001 so only
the proxy reaches them.

### Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ENCRYPTION_KEY` | Yes | Key for AES-256-GCM password encryption |
| `API_TOKEN` | Yes | Shared bearer token; backend rejects requests without it. Entered on the frontend login screen |
| `NEXT_PUBLIC_API_URL` | No | Where the browser reaches the backend (default: `http://localhost:3001`). Baked at build time |
| `ALLOWED_ORIGIN` | No | Comma-separated allowlist of Origins for CORS + the terminal WebSocket (default: `http://localhost:3000`) |
| `SSH_KEY_DIR` | No | Directory device private keys must live in (default: `~/.ssh`) |
| `PORT` | No | Backend port (default: `3001`) |

## SSH Authentication

Devices support two auth methods:

- **Key** — specify a path to a private key, or leave blank to auto-detect `id_ed25519`, `id_rsa`, `id_ecdsa`. Key paths are confined to `SSH_KEY_DIR` (default `~/.ssh`); paths outside it are rejected.
- **Password** — stored encrypted (AES-256-GCM with a per-record random salt); use for devices where key auth isn't available

### Host-key verification

On the first successful connection to a device, its SSH host key fingerprint (sha256) is
recorded. Every later connection must present the same key — a mismatch is refused as a
possible MITM. The pinned key cannot be overwritten through the device update API; if a
host key is legitimately rotated, clear it with `DELETE /api/devices/:id/hostkey` to
re-trust on the next connect.

Set `strictHostKeyChecking` to `true` in settings to refuse devices with no recorded key
(they must be provisioned first) instead of trust-on-first-use.

## Authentication

All `/api/*` routes (except `/api/health`) require `Authorization: Bearer <API_TOKEN>`.
The frontend asks for the token once on a login screen and stores it in localStorage;
any 401 drops back to that screen.

The terminal WebSocket validates the `Origin` header against `ALLOWED_ORIGIN`. Since
browsers can't set headers on WS handshakes, the client first calls
`POST /api/auth/ws-ticket` (Bearer-authed) and connects with the returned single-use,
30-second ticket (`?ticket=`) — the long-lived token never appears in URLs or logs.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+\` | Toggle terminal panel |

## Project Structure

```
ssh-device-manager/
├── app/                  # Next.js frontend
│   ├── _components/ssh-manager/   # UI components
│   └── _lib/             # API client, types, helpers
└── backend/
    └── src/
        ├── index.js       # Express server + WS upgrade + auth/CORS/rate-limit
        ├── auth.js        # Bearer-token middleware + WS origin/ticket check
        ├── ratelimit.js   # In-memory per-IP rate limiter
        ├── poller.js      # SSH metrics polling
        ├── hostkey.js     # SSH host-key pinning (TOFU) verifier
        ├── keypath.js     # Private-key path resolution + confinement
        ├── db.js          # SQLite + migrations
        ├── crypto.js      # AES-256-GCM helpers (per-record salt)
        └── ws/terminal.js # WebSocket → SSH PTY bridge
```
