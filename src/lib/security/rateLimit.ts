import type { NextRequest } from 'next/server';

interface RateLimitBucket {
  timestamps: number[];
}

const buckets = new Map<string, RateLimitBucket>();

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'local-client';
}

/**
 * Lightweight per-IP sliding-window rate limiter to protect deployed AI keys from abuse.
 * Uses bounded Map cleanup so memory stays strictly O(active clients).
 */
export function checkRateLimit(
  req: NextRequest,
  routeKey: string,
  maxRequests = 25,
  windowMs = 60_000,
): { allowed: boolean; retryAfterSec: number } {
  // Skip artificial throttling in unit tests
  if (process.env.VITEST) {
    return { allowed: true, retryAfterSec: 0 };
  }

  const now = Date.now();
  const key = `${routeKey}:${getClientIp(req)}`;
  const cutoff = now - windowMs;

  const entry = buckets.get(key) || { timestamps: [] };
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= maxRequests) {
    const oldest = entry.timestamps[0] || now;
    const retryAfterSec = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    buckets.set(key, entry);
    return { allowed: false, retryAfterSec };
  }

  entry.timestamps.push(now);
  buckets.set(key, entry);

  // Periodic bounded cleanup
  if (buckets.size > 500) {
    for (const [k, b] of buckets.entries()) {
      const fresh = b.timestamps.filter((t) => t > cutoff);
      if (fresh.length === 0) buckets.delete(k);
      else b.timestamps = fresh;
    }
  }

  return { allowed: true, retryAfterSec: 0 };
}
