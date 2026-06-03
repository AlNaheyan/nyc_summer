import { describe, expect, it } from "vitest";
import { evaluateBadges, type UserStats } from "./evaluate-badges";

const zero: UserStats = {
  completions: 0,
  streak: 0,
  points: 0,
  distinctTags: 0,
  boroughs: 0,
  shares: 0,
};

describe("evaluateBadges", () => {
  it("awards the first-quest badge on completion 1", () => {
    expect(evaluateBadges({ ...zero, completions: 1 })).toContain("first-quest");
  });

  it("awards multiple thresholds at once", () => {
    const earned = evaluateBadges({ ...zero, completions: 5, streak: 3 });
    expect(earned).toEqual(expect.arrayContaining(["first-quest", "five-quests", "streak-3"]));
  });

  it("does not re-award already-held badges", () => {
    const earned = evaluateBadges({ ...zero, completions: 1 }, ["first-quest"]);
    expect(earned).not.toContain("first-quest");
  });

  it("awards nothing below any threshold", () => {
    expect(evaluateBadges(zero)).toEqual([]);
  });

  it("awards the all-boroughs badge at 5 boroughs", () => {
    expect(evaluateBadges({ ...zero, boroughs: 5 })).toContain("all-boroughs");
  });
});
