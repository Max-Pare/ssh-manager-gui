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

// Validate a WebSocket upgrade: Origin allowlist + token (query param, since
// browsers cannot set headers on WebSocket handshakes).
function checkWsAuth(req, allowedOrigins) {
  if (!API_TOKEN) return false;

  const allowList = Array.isArray(allowedOrigins) ? allowedOrigins : [allowedOrigins];
  const origin = req.headers['origin'];
  // Reject any cross-origin handshake (CSWSH defense). Missing Origin (non-browser
  // clients) is allowed since those carry no ambient browser credentials/cookies.
  if (origin && !allowList.includes(origin)) return false;

  let token = null;
  try {
    const url = new URL(req.url, 'http://localhost');
    token = url.searchParams.get('token');
  } catch {
    return false;
  }
  return !!token && safeEqual(token, API_TOKEN);
}

module.exports = { requireAuth, checkWsAuth, API_TOKEN };
