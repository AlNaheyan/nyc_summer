import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Per-endpoint rate limiting backed by Upstash Redis (durable + shared across
 * serverless instances). Configured via UPSTASH_REDIS_REST_URL / _TOKEN.
 *
 * Design choices:
 *   - Fail OPEN. If Upstash isn't configured (local dev) or is unreachable,
 *     requests are allowed — a Redis blip must never take down the app.
 *   - Authenticated routes key by user.id; the public feed keys by IP.
 *   - Sliding window: smooth, no thundering herd at window boundaries.
 */

type LimiterName = "completions" | "feed" | "options";

// Generous enough for real use, tight enough to stop a script loop.
//   completions — expensive (upload + paid moderation API); also daily-capped.
//   feed        — public, unauthenticated; keyed by IP, allows normal scroll.
//   options     — heaviest DB read; keyed by user.
const CONFIG: Record<LimiterName, { limit: number; window: `${number} ${"s" | "m" | "h"}` }> = {
  completions: { limit: 10, window: "1 m" },
  feed: { limit: 60, window: "1 m" },
  options: { limit: 30, window: "1 m" },
};

let redis: Redis | null = null;
function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null; // not configured → limiting disabled
  redis = new Redis({ url, token });
  return redis;
}

const limiters = new Map<LimiterName, Ratelimit>();
function getLimiter(name: LimiterName): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;
  let limiter = limiters.get(name);
  if (!limiter) {
    const { limit, window } = CONFIG[name];
    limiter = new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(limit, window),
      prefix: `rl:${name}`,
      analytics: false,
    });
    limiters.set(name, limiter);
  }
  return limiter;
}

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  reset: number; // epoch ms when the window resets
}

/**
 * Check a request against a named limiter. Returns `ok: true` (allow) when
 * Upstash isn't configured or errors — fail open.
 */
export async function rateLimit(name: LimiterName, key: string): Promise<RateLimitResult> {
  const limiter = getLimiter(name);
  if (!limiter) return { ok: true, limit: 0, remaining: 0, reset: 0 };
  try {
    const { success, limit, remaining, reset } = await limiter.limit(key);
    return { ok: success, limit, remaining, reset };
  } catch (err) {
    console.error(`[rate-limit] ${name} check failed, allowing request:`, err);
    return { ok: true, limit: 0, remaining: 0, reset: 0 };
  }
}

/** First hop of X-Forwarded-For (the real client on Vercel), or a fallback. */
export function clientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  return xff?.split(",")[0]?.trim() || "anonymous";
}

/** 429 response with Retry-After + standard RateLimit headers. */
export function rateLimitResponse(result: RateLimitResult): NextResponse {
  const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
  return NextResponse.json(
    { error: "rate_limited" },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "RateLimit-Limit": String(result.limit),
        "RateLimit-Remaining": String(result.remaining),
        "RateLimit-Reset": String(retryAfter),
      },
    },
  );
}
