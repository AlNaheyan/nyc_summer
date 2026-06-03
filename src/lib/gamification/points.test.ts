import { describe, expect, it } from "vitest";
import { computePoints, POINTS } from "./points";

describe("computePoints", () => {
  it("awards base points for a plain completion", () => {
    const r = computePoints({ hasPhoto: false, newStreak: 1, countsForStreak: true });
    expect(r.total).toBe(POINTS.base);
  });

  it("adds the photo bonus", () => {
    const r = computePoints({ hasPhoto: true, newStreak: 1, countsForStreak: true });
    expect(r.total).toBe(POINTS.base + POINTS.photoBonus);
    expect(r.photo).toBe(POINTS.photoBonus);
  });

  it("adds a milestone bonus every 7th streak day", () => {
    const r = computePoints({ hasPhoto: false, newStreak: 7, countsForStreak: true });
    expect(r.streakMilestone).toBe(POINTS.streakMilestoneBonus);
    expect(r.total).toBe(POINTS.base + POINTS.streakMilestoneBonus);
  });

  it("gives no milestone bonus off the cadence", () => {
    expect(computePoints({ hasPhoto: false, newStreak: 8, countsForStreak: true }).streakMilestone).toBe(0);
  });

  it("gives no milestone bonus for a same-day repeat", () => {
    const r = computePoints({ hasPhoto: true, newStreak: 14, countsForStreak: false });
    expect(r.streakMilestone).toBe(0);
    expect(r.total).toBe(POINTS.base + POINTS.photoBonus);
  });
});
