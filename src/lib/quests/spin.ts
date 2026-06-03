import { eligibleTemplates } from "./templates";

/**
 * Weighted-random quest selection for the daily spin (TECH_SPEC §7).
 * Adults never receive kid-only quests. `rng` is injectable (defaults to
 * Math.random) so selection is deterministic in tests.
 */
export interface Spinnable {
  id: string;
  weight: number;
  adult_friendly: boolean;
}

/** Pick one item by weight. Returns null only for an empty pool. */
export function pickWeighted<T extends { weight: number }>(
  pool: T[],
  rng: () => number = Math.random,
): T | null {
  if (pool.length === 0) return null;
  const total = pool.reduce((sum, t) => sum + Math.max(0, t.weight), 0);
  if (total <= 0) return pool[Math.floor(rng() * pool.length)] ?? null;

  let roll = rng() * total;
  for (const item of pool) {
    roll -= Math.max(0, item.weight);
    if (roll < 0) return item;
  }
  return pool[pool.length - 1];
}

/** Select a quest template for a user, honoring the adult/kid filter. */
export function spinQuest(isAdult: boolean, rng: () => number = Math.random) {
  return pickWeighted(eligibleTemplates(isAdult), rng);
}
