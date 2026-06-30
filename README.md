## SLOP WARNING
This application was vibe coded with Claude (Sonnet, high reasoning).
I wouldn't trust this to be secure or stable in any way, use at your own risk.

# SSH Device Manager

A self-hosted web GUI for managing SSH devices across environments. Monitor resource usage, open interactive terminals, and manage device inventory — all from a browser.

![Stack](https://img.shields.io/badge/Next.js-16-black) ![Backend](https://img.shields.io/badge/Node.js-Express-green) ![DB](https://img.shields.io/badge/SQLite-WAL-blue)

## Features

- **Device inventory** — add/edit/delete SSH devices organized by environment (prod/staging/dev) and group
- **Live metrics** — CPU, RAM, uptime, OS polled via SSH on a configurable interval
- **Interactive terminal** — full xterm.js PTY over WebSocket, multi-tab, persistent across navigation
- **Bulk operations** — select multiple devices, bulk delete, CSV import/export
- **Encrypted storage** — passwords encrypted with AES-256-GCM; key-based auth supported

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

### Install

```bash
git clone https://github.com/Max-Pare/ssh-manager-gui.git
cd ssh-manager-gui
npm install
```

### Run (development)

```bash
ENCRYPTION_KEY=your-secret-key npm run dev
```

Frontend: [http://localhost:3000](http://localhost:3000)  
Backend API: [http://localhost:3001](http://localhost:3001)

Both start concurrently via `npm run dev` (uses `concurrently`).

### Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ENCRYPTION_KEY` | Yes | Key for AES-256-GCM password encryption |
| `DB_PATH` | No | SQLite file path (default: `backend/data/devices.db`) |
| `PORT` | No | Backend port (default: `3001`) |

## SSH Authentication

Devices support two auth methods:

- **Key** — specify a path to a private key, or leave blank to auto-detect `~/.ssh/id_ed25519`, `~/.ssh/id_rsa`, `~/.ssh/id_ecdsa`
- **Password** — stored encrypted; use for devices where key auth isn't available

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
        ├── index.js       # Express server + WS upgrade
        ├── poller.js      # SSH metrics polling
        ├── db.js          # SQLite + migrations
        ├── crypto.js      # AES-256-GCM helpers
        └── ws/terminal.js # WebSocket → SSH PTY bridge
```
