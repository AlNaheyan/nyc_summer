import { nycDateString } from "./time";

/**
 * Season window (TECH_SPEC §2 / §13). Data ends July 29, 2026. After the last
 * day, the spin stops and the feed freezes read-only with a farewell screen.
 */
export const SEASON_START = "2026-05-27";
export const SEASON_END = "2026-07-29";

/** True once the season's final day has passed (NY calendar). */
export function seasonEnded(now: Date = new Date()): boolean {
  return nycDateString(now) > SEASON_END;
}

/** Whole days remaining in the season (0 once ended). */
export function daysLeft(now: Date = new Date()): number {
  const today = nycDateString(now);
  if (today > SEASON_END) return 0;
  const [ty, tm, td] = today.split("-").map(Number);
  const [ey, em, ed] = SEASON_END.split("-").map(Number);
  return Math.round((Date.UTC(ey, em - 1, ed) - Date.UTC(ty, tm - 1, td)) / 86_400_000);
}
