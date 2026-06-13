import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Per-endpoint rate limiting backed by Postgres (the check_rate_limit function
 * from migration 0007). Reuses the existing Supabase service-role connection —
 * no extra infrastructure.
 *
 * Design choices:
 *   - Fail OPEN. If the DB call errors (or the migration hasn't been applied),
 *     the request is allowed — rate limiting must never take down the app.
 *   - Authenticated routes key by user.id; the public feed keys by IP.
 *   - Fixed window, incremented atomically server-side to avoid races.
 */

type LimiterName = "completions" | "feed" | "options" | "spin" | "report";

// Generous enough for real use, tight enough to stop a script loop.
//   completions — expensive (upload + paid moderation API); also daily-capped.
//   feed        — public, unauthenticated; keyed by IP, allows normal scroll.
//   options     — heaviest DB read; keyed by user.
//   spin        — quest spin/reroll; reroll spends points, so cap the loop.
//   report      — abuse surface (auto-hide griefing); keep tight, keyed by user.
const CONFIG: Record<LimiterName, { limit: number; windowSeconds: number }> = {
  completions: { limit: 10, windowSeconds: 60 },
  feed: { limit: 60, windowSeconds: 60 },
  options: { limit: 30, windowSeconds: 60 },
  spin: { limit: 30, windowSeconds: 60 },
  report: { limit: 10, windowSeconds: 60 },
};

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  reset: number; // epoch ms when the window resets
}

interface CheckRow {
  allowed: boolean;
  remaining: number;
  reset_at: string;
}

/**
 * Check a request against a named limiter. Returns `ok: true` (allow) when the
 * DB call fails — fail open.
 */
export async function rateLimit(name: LimiterName, key: string): Promise<RateLimitResult> {
  const { limit, windowSeconds } = CONFIG[name];
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("check_rate_limit", {
      p_key: `${name}:${key}`,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error) throw error;

    const row = (Array.isArray(data) ? data[0] : data) as CheckRow | undefined;
    if (!row) return { ok: true, limit, remaining: limit, reset: 0 };

    return {
      ok: row.allowed,
      limit,
      remaining: row.remaining,
      reset: new Date(row.reset_at).getTime(),
    };
  } catch (err) {
    console.error(`[rate-limit] ${name} check failed, allowing request:`, err);
    return { ok: true, limit, remaining: limit, reset: 0 };
  }
}

/**
 * Best-effort client IP for rate-limit keying. Prefers the platform-set,
 * non-spoofable headers: on Vercel `x-real-ip` (and `x-vercel-forwarded-for`)
 * are set by the edge and override any client-supplied value, so a caller
 * can't rotate them to evade the limit. The leftmost `x-forwarded-for` hop is
 * a last-resort fallback for non-Vercel/local dev only — never trust it as the
 * sole source in production. Routes on NextRequest should prefer `request.ip`.
 */
export function clientIp(request: Request): string {
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const vercel = request.headers.get("x-vercel-forwarded-for");
  if (vercel) return vercel.split(",")[0]?.trim() || "anonymous";
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
