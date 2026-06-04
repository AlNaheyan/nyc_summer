import { describe, expect, it } from "vitest";
import {
  rerollsUsedToday,
  isFreeReroll,
  completedCount,
  canStartNewQuest,
  nextSlot,
  questsRemaining,
} from "./day-rules";

const slot = (spins_used: number, completed = false) => ({ spins_used, completed });

describe("day-rules", () => {
  it("counts re-rolls as spins beyond the first per slot", () => {
    expect(rerollsUsedToday([])).toBe(0);
    expect(rerollsUsedToday([slot(1)])).toBe(0); // just the initial spin
    expect(rerollsUsedToday([slot(2)])).toBe(1); // one re-roll
    expect(rerollsUsedToday([slot(2), slot(1)])).toBe(1); // re-roll shared across slots
  });

  it("gives one free re-roll per day", () => {
    expect(isFreeReroll([slot(1)])).toBe(true); // no re-roll yet → free
    expect(isFreeReroll([slot(2)])).toBe(false); // already used the free one
    expect(isFreeReroll([slot(1), slot(2)])).toBe(false);
  });

  it("tracks completed count and remaining quests", () => {
    const rows = [slot(1, true), slot(1, false)];
    expect(completedCount(rows)).toBe(1);
    expect(questsRemaining(rows)).toBe(2);
  });

  it("allows up to 3 quests per day", () => {
    expect(canStartNewQuest([])).toBe(true);
    expect(canStartNewQuest([slot(1, true), slot(1, true)])).toBe(true);
    expect(canStartNewQuest([slot(1, true), slot(1, true), slot(1, true)])).toBe(false);
  });

  it("assigns the next slot sequentially", () => {
    expect(nextSlot([])).toBe(1);
    expect(nextSlot([slot(1, true)])).toBe(2);
    expect(nextSlot([slot(1, true), slot(1, true)])).toBe(3);
  });
});
