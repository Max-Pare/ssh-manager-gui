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
- **Token auth** — all API routes and the terminal WebSocket require a shared bearer token
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

Set the required vars in `.env` (see `backend/.env.example`). Generate a token with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

```bash
ENCRYPTION_KEY=your-secret-key \
API_TOKEN=your-random-token \
NEXT_PUBLIC_API_TOKEN=your-random-token \
npm run dev
```

Frontend: [http://localhost:3000](http://localhost:3000)  
Backend API: [http://localhost:3001](http://localhost:3001)

Both start concurrently via `npm run dev` (uses `concurrently`).

> `NEXT_PUBLIC_API_TOKEN` must equal `API_TOKEN`. It is bundled into the client, so this is a single shared secret, not per-user auth — front the app with your own login if you need multi-user access.

### Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ENCRYPTION_KEY` | Yes | Key for AES-256-GCM password encryption |
| `API_TOKEN` | Yes | Shared bearer token; backend rejects requests without it |
| `NEXT_PUBLIC_API_TOKEN` | Yes | Same value as `API_TOKEN`; sent by the frontend |
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
possible MITM. If a host key is legitimately rotated, clear the device's `hostKey` field
(via `PUT /api/devices/:id` with `{"hostKey": null}`) to re-trust on the next connect.

Set `strictHostKeyChecking` to `true` in settings to refuse devices with no recorded key
(they must be provisioned first) instead of trust-on-first-use.

## Authentication

All `/api/*` routes (except `/api/health`) require `Authorization: Bearer <API_TOKEN>`.
The terminal WebSocket validates the `Origin` header against `ALLOWED_ORIGIN` and requires
the token as a `?token=` query parameter (browsers can't set headers on WS handshakes).

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
        ├── auth.js        # Bearer-token middleware + WS origin/token check
        ├── ratelimit.js   # In-memory per-IP rate limiter
        ├── poller.js      # SSH metrics polling
        ├── hostkey.js     # SSH host-key pinning (TOFU) verifier
        ├── keypath.js     # Private-key path resolution + confinement
        ├── db.js          # SQLite + migrations
        ├── crypto.js      # AES-256-GCM helpers (per-record salt)
        └── ws/terminal.js # WebSocket → SSH PTY bridge
```
