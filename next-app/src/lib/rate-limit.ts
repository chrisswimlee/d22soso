type Bucket = number[];

// Best-effort in-memory limiter. Sufficient for basic spam protection on a
// single instance; it resets on redeploy and is not shared across instances.
// For distributed/serverless production, back this with Redis (e.g. Upstash).
const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function rateLimit(
  key: string,
  { limit = 5, windowMs = 10 * 60 * 1000 }: { limit?: number; windowMs?: number } = {},
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  const hits = (buckets.get(key) ?? []).filter((ts) => ts > windowStart);

  if (hits.length >= limit) {
    const oldest = hits[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    buckets.set(key, hits);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  hits.push(now);
  buckets.set(key, hits);

  // Opportunistic cleanup to keep the map from growing unbounded.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      const fresh = v.filter((ts) => ts > windowStart);
      if (fresh.length === 0) buckets.delete(k);
      else buckets.set(k, fresh);
    }
  }

  return { allowed: true, remaining: limit - hits.length, retryAfterSeconds: 0 };
}
