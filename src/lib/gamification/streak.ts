/**
 * Streak math (TECH_SPEC §7). A streak is consecutive calendar days with at
 * least one completion. Dates are `YYYY-MM-DD` strings already resolved to
 * America/New_York by the caller (see src/lib/time).
 *
 * Pure and timezone-agnostic: dates are compared as calendar days via UTC
 * midnight, so no local-offset drift.
 */

export interface StreakState {
  current_streak: number;
  longest_streak: number;
  last_completion_date: string | null;
}

export interface StreakResult extends StreakState {
  /** True when the completion was on a day already counted (no streak change). */
  sameDay: boolean;
}

/** Whole-day difference b - a for two YYYY-MM-DD strings. */
export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000);
}

/**
 * Recompute streak state after a completion on `date`.
 * - first ever completion → streak 1
 * - same day as last → unchanged (sameDay = true)
 * - exactly the next day → increment
 * - any gap → reset to 1
 */
export function applyCompletion(prev: StreakState, date: string): StreakResult {
  if (!prev.last_completion_date) {
    return { current_streak: 1, longest_streak: Math.max(1, prev.longest_streak), last_completion_date: date, sameDay: false };
  }

  const diff = daysBetween(prev.last_completion_date, date);

  if (diff === 0) {
    return { ...prev, sameDay: true };
  }

  // diff < 0 (a backdated completion) shouldn't happen in v1; treat as no-op.
  if (diff < 0) {
    return { ...prev, sameDay: true };
  }

  const current = diff === 1 ? prev.current_streak + 1 : 1;
  return {
    current_streak: current,
    longest_streak: Math.max(prev.longest_streak, current),
    last_completion_date: date,
    sameDay: false,
  };
}
