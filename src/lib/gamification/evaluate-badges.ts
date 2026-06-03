import { BADGES } from "./badges";

/**
 * Badge evaluation (TECH_SPEC §7). Each badge `rule_key` is "<metric>:<threshold>";
 * a badge is earned when the user's stat for that metric meets the threshold.
 * Returns only NEWLY earned badge ids (not already held), so the caller inserts
 * each user_badge exactly once.
 */
export interface UserStats {
  completions: number;
  streak: number; // longest streak achieved
  points: number;
  distinctTags: number;
  boroughs: number;
  shares: number;
}

const METRIC_KEYS: (keyof UserStats)[] = [
  "completions",
  "streak",
  "points",
  "distinctTags",
  "boroughs",
  "shares",
];

function isMetric(key: string): key is keyof UserStats {
  return (METRIC_KEYS as string[]).includes(key);
}

export function evaluateBadges(
  stats: UserStats,
  alreadyEarned: Iterable<string> = [],
): string[] {
  const held = new Set(alreadyEarned);
  const earned: string[] = [];

  for (const badge of BADGES) {
    if (held.has(badge.id)) continue;
    const [metric, thresholdRaw] = badge.rule_key.split(":");
    const threshold = Number(thresholdRaw);
    if (!isMetric(metric) || !Number.isFinite(threshold)) continue;
    if (stats[metric] >= threshold) earned.push(badge.id);
  }

  return earned;
}
