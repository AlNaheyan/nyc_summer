/**
 * Pure rules for the daily quest allowance (gameplay update):
 *  - up to MAX_QUESTS_PER_DAY quests per day
 *  - FREE_REROLLS_PER_DAY free re-roll(s) per day, then each costs points
 */
export const MAX_QUESTS_PER_DAY = 3;
export const FREE_REROLLS_PER_DAY = 1;

interface SlotRow {
  spins_used: number;
  completed: boolean;
}

/** Re-rolls used so far today = total spins beyond the initial one per slot. */
export function rerollsUsedToday(rows: SlotRow[]): number {
  const totalSpins = rows.reduce((sum, r) => sum + r.spins_used, 0);
  return Math.max(0, totalSpins - rows.length);
}

/** Is the next re-roll free? */
export function isFreeReroll(rows: SlotRow[]): boolean {
  return rerollsUsedToday(rows) < FREE_REROLLS_PER_DAY;
}

/** How many quests the user has completed today. */
export function completedCount(rows: SlotRow[]): number {
  return rows.filter((r) => r.completed).length;
}

/** Can the user start another quest today (after finishing the current one)? */
export function canStartNewQuest(rows: SlotRow[]): boolean {
  return rows.length < MAX_QUESTS_PER_DAY;
}

/** The slot number for the next quest. */
export function nextSlot(rows: SlotRow[]): number {
  return rows.length + 1;
}

/** Quests still available today after the current one. */
export function questsRemaining(rows: SlotRow[]): number {
  return Math.max(0, MAX_QUESTS_PER_DAY - completedCount(rows));
}
