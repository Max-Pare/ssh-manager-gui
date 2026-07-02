'use strict';

const crypto = require('crypto');

const API_TOKEN = process.env.API_TOKEN || '';

// Constant-time string compare; false on any length/mismatch without leaking timing.
function safeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) {
    // Still run a compare to keep timing uniform.
    crypto.timingSafeEqual(ab, ab);
    return false;
  }
  return crypto.timingSafeEqual(ab, bb);
}

function tokenFromHeader(req) {
  const h = req.headers['authorization'] || '';
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m ? m[1] : null;
}

// Express middleware — rejects requests without a valid Bearer token.
function requireAuth(req, res, next) {
  if (!API_TOKEN) {
    return res.status(503).json({ error: 'Server auth not configured: set API_TOKEN' });
  }
  const tok = tokenFromHeader(req);
  if (!tok || !safeEqual(tok, API_TOKEN)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// One-time, short-lived WebSocket tickets. Browsers cannot set headers on the
// WS handshake, and putting the long-lived API token in the URL leaks it into
// proxy/access logs. Clients POST /api/auth/ws-ticket (Bearer-authed) to get a
// single-use ticket, then connect with ?ticket=<...>.
const TICKET_TTL_MS = 30 * 1000;
const tickets = new Map(); // ticket -> expiresAt

function issueTicket() {
  const ticket = crypto.randomBytes(32).toString('hex');
  tickets.set(ticket, Date.now() + TICKET_TTL_MS);
  return ticket;
}

function redeemTicket(ticket) {
  if (typeof ticket !== 'string') return false;
  const expiresAt = tickets.get(ticket);
  if (expiresAt === undefined) return false;
  tickets.delete(ticket); // single use, even if expired
  return expiresAt > Date.now();
}

// Sweep expired tickets so abandoned ones don't accumulate.
const sweep = setInterval(() => {
  const now = Date.now();
  for (const [t, exp] of tickets) {
    if (exp <= now) tickets.delete(t);
  }
}, 60 * 1000);
if (sweep.unref) sweep.unref();

// Validate a WebSocket upgrade: Origin allowlist + one-time ticket.
function checkWsAuth(req, allowedOrigins) {
  if (!API_TOKEN) return false;

  const allowList = Array.isArray(allowedOrigins) ? allowedOrigins : [allowedOrigins];
  const origin = req.headers['origin'];
  // Reject any cross-origin handshake (CSWSH defense). Missing Origin (non-browser
  // clients) is allowed since those carry no ambient browser credentials/cookies.
  if (origin && !allowList.includes(origin)) return false;

  let ticket = null;
  try {
    const url = new URL(req.url, 'http://localhost');
    ticket = url.searchParams.get('ticket');
  } catch {
    return false;
  }
  return redeemTicket(ticket);
}

module.exports = { requireAuth, checkWsAuth, issueTicket, API_TOKEN };
