'use strict';

/**
 * Minimal dependency-free fixed-window rate limiter keyed by client IP.
 * Good enough for a self-hosted single-instance app; swap for a Redis-backed
 * limiter if you run multiple instances.
 */
function rateLimit({ windowMs = 15 * 60 * 1000, max = 300 } = {}) {
  const hits = new Map(); // ip -> { count, resetAt }

  // Periodic sweep so the map doesn't grow unbounded.
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [ip, rec] of hits) {
      if (rec.resetAt <= now) hits.delete(ip);
    }
  }, windowMs);
  if (sweep.unref) sweep.unref();

  return function (req, res, next) {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();
    let rec = hits.get(ip);
    if (!rec || rec.resetAt <= now) {
      rec = { count: 0, resetAt: now + windowMs };
      hits.set(ip, rec);
    }
    rec.count++;
    if (rec.count > max) {
      const retry = Math.ceil((rec.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retry));
      return res.status(429).json({ error: 'Too many requests' });
    }
    next();
  };
}

module.exports = { rateLimit };
