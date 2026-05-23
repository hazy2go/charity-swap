// Dirt-simple in-memory rate limiter. Per-instance only — won't survive
// Vercel cold starts and won't share state across serverless instances.
// Good enough to deter casual spam; not a serious DDoS defense.
// For production-grade rate limiting, swap in Upstash Redis or Vercel
// Edge Config — this file is the single integration point.

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

const MAX_BUCKETS = 5_000; // memory cap

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

export function rateLimit(
  key: string,
  opts: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();

  // Periodic eviction so the map doesn't grow without bound.
  if (buckets.size > MAX_BUCKETS) {
    for (const [k, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(k);
    }
  }

  let b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    b = { count: 0, resetAt: now + opts.windowMs };
    buckets.set(key, b);
  }
  b.count += 1;
  const allowed = b.count <= opts.limit;
  return {
    allowed,
    remaining: Math.max(0, opts.limit - b.count),
    resetAt: b.resetAt,
  };
}

/**
 * Best-effort client IP for rate-limit keying. Trusts the
 * `x-forwarded-for` Vercel sets (Vercel strips spoofed XFF on its edge).
 */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}
