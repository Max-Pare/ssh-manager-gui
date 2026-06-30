'use strict';

require('dotenv').config();

if (!process.env.ENCRYPTION_KEY) {
  console.error('');
  console.error('  ERROR: ENCRYPTION_KEY is not set.');
  console.error('  Copy .env.example to .env and set ENCRYPTION_KEY to a random 32+ character string.');
  console.error('');
  process.exit(1);
}

if (!process.env.API_TOKEN) {
  console.error('');
  console.error('  ERROR: API_TOKEN is not set.');
  console.error('  Set API_TOKEN in .env to a random 32+ character string. Clients must send it as');
  console.error('  "Authorization: Bearer <token>" (REST) or "?token=<token>" (terminal WebSocket).');
  console.error('');
  process.exit(1);
}

const http = require('http');
const express = require('express');
const WebSocket = require('ws');

const devicesRouter = require('./routes/devices');
const settingsRouter = require('./routes/settings');
const { handleTerminal } = require('./ws/terminal');
const { requireAuth, checkWsAuth } = require('./auth');
const { rateLimit } = require('./ratelimit');
const poller = require('./poller');

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
// Comma-separated allowlist; no wildcard, in any environment.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const app = express();

// Security headers (hand-rolled; swap for `helmet` if you add the dep).
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  next();
});

// CORS — echo the request Origin only if it's on the allowlist. Never '*'.
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Rate limit all API traffic.
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

app.use(express.json({ limit: '256kb' }));

// Health
app.get('/api/health', (req, res) => {
  res.json({ ok: true, version: '1.0.0' });
});

// Routes (all require a valid API token)
app.use('/api/devices', requireAuth, devicesRouter);
app.use('/api/settings', requireAuth, settingsRouter);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler — log full detail server-side, return a generic message in
// production to avoid leaking internals (paths, stack info) to clients.
app.use((err, req, res, _next) => {
  console.error(err);
  const message = NODE_ENV === 'production'
    ? 'Internal server error'
    : (err.message || 'Internal server error');
  res.status(500).json({ error: message });
});

const server = http.createServer(app);

// WebSocket — SSH terminal
const wss = new WebSocket.Server({ noServer: true });

server.on('upgrade', (req, socket, head) => {
  // Match path only; query string (e.g. ?token=) is parsed separately.
  const pathname = req.url.split('?')[0];
  const match = pathname.match(/^\/ws\/terminal\/(\d+)$/);
  if (!match) { socket.destroy(); return; }

  // Origin allowlist + token check (CSWSH + auth defense).
  if (!checkWsAuth(req, ALLOWED_ORIGINS)) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    handleTerminal(ws, parseInt(match[1], 10));
  });
});

// Start
server.listen(PORT, () => {
  console.log(`ssh-mgr backend listening on :${PORT}`);
  poller.start();
});

// Graceful shutdown
function shutdown() {
  console.log('\nShutting down...');
  poller.stop();
  server.close(() => process.exit(0));
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
