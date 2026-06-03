/**
 * Point awards for a completion (TECH_SPEC §7). Base award, a photo bonus, and
 * a streak-milestone bonus. Values are centralized so the spin re-roll cost and
 * awards stay consistent and easy to tune.
 */
export const POINTS = {
  base: 10,
  photoBonus: 5,
  streakMilestoneEvery: 7, // every Nth streak day
  streakMilestoneBonus: 20,
  rerollCost: 50, // mirrors app_config.reroll_cost (TECH_SPEC §13)
} as const;

export interface PointInput {
  hasPhoto: boolean;
  /** New current streak AFTER applying the completion. */
  newStreak: number;
  /** Whether this completion counted as a new day (false = repeat same-day). */
  countsForStreak: boolean;
}

export interface PointBreakdown {
  base: number;
  photo: number;
  streakMilestone: number;
  total: number;
}

/**
 * Points for a single completion. A same-day repeat (countsForStreak = false)
 * earns the base + photo award but no milestone bonus.
 */
export function computePoints(input: PointInput): PointBreakdown {
  const base = POINTS.base;
  const photo = input.hasPhoto ? POINTS.photoBonus : 0;
  const milestone =
    input.countsForStreak &&
    input.newStreak > 0 &&
    input.newStreak % POINTS.streakMilestoneEvery === 0
      ? POINTS.streakMilestoneBonus
      : 0;
  return { base, photo, streakMilestone: milestone, total: base + photo + milestone };
}
