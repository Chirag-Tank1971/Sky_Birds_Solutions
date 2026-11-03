const jwt = require("jsonwebtoken");

function clientKey(req) {
  return req.ip || req.socket?.remoteAddress || "unknown";
}

// Signed-in visitors get their own counter, so students sharing college or mobile network IPs don't
// block each other. The token is verified, not just read, so a forged ID can't spread one person's
// requests across many counters; anything else falls back to the IP address.
function userOrIpKey(req) {
  const header = req.headers?.authorization || "";
  if (header.startsWith("Bearer ")) {
    try {
      const { id } = jwt.verify(header.slice(7), process.env.JWT_SECRET, { issuer: "skybirds-api", audience: "skybirds-client" });
      if (id) return `user:${id}`;
    } catch {
      // Invalid or expired: counted by IP like any anonymous request.
    }
  }
  return clientKey(req);
}

// Each limiter keeps its own counters, keyed by client (IP by default) rather
// than by request path, so a limit applies to the visitor across every URL it covers.
function rateLimit({ windowMs = 15 * 60 * 1000, max = 100, message = "Too many requests. Please try again later.", keyGenerator = clientKey } = {}) {
  const buckets = new Map();
  let nextSweep = Date.now() + windowMs;

  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();
    let entry = buckets.get(key);
    if (!entry || entry.resetAt <= now) entry = { count: 0, resetAt: now + windowMs };
    entry.count += 1;
    buckets.set(key, entry);
    res.set("RateLimit-Limit", String(max));
    res.set("RateLimit-Remaining", String(Math.max(0, max - entry.count)));
    res.set("RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));
    if (entry.count > max) {
      res.set("Retry-After", String(Math.max(1, Math.ceil((entry.resetAt - now) / 1000))));
      return res.status(429).json({ success: false, message });
    }
    // Remove expired buckets at most once per window so the map stays bounded.
    if (now >= nextSweep) {
      nextSweep = now + windowMs;
      for (const [bucketKey, value] of buckets) if (value.resetAt <= now) buckets.delete(bucketKey);
    }
    next();
  };
}

module.exports = rateLimit;
module.exports.userOrIpKey = userOrIpKey;
