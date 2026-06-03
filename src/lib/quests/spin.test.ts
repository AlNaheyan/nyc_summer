import { describe, expect, it } from "vitest";
import { pickWeighted, spinQuest } from "./spin";

describe("pickWeighted", () => {
  it("returns null for an empty pool", () => {
    expect(pickWeighted([])).toBeNull();
  });

  it("respects weights deterministically with an injected rng", () => {
    const pool = [
      { id: "a", weight: 1 },
      { id: "b", weight: 3 },
    ];
    // total = 4; roll 0.0 → first bucket (a); roll 0.5 (=2.0) → b
    expect(pickWeighted(pool, () => 0.0)?.id).toBe("a");
    expect(pickWeighted(pool, () => 0.5)?.id).toBe("b");
    expect(pickWeighted(pool, () => 0.99)?.id).toBe("b");
  });

  it("approximates the weight distribution over many draws", () => {
    const pool = [
      { id: "a", weight: 1 },
      { id: "b", weight: 9 },
    ];
    let bCount = 0;
    let seed = 0.123;
    const rng = () => (seed = (seed * 9301 + 49297) % 233280 / 233280);
    for (let i = 0; i < 2000; i++) if (pickWeighted(pool, rng)?.id === "b") bCount++;
    expect(bCount / 2000).toBeGreaterThan(0.8); // ~0.9 expected
  });
});

describe("spinQuest", () => {
  it("never returns a kid-only quest for an adult", () => {
    for (let i = 0; i < 50; i++) {
      const q = spinQuest(true, () => i / 50);
      expect(q?.adult_friendly).toBe(true);
    }
  });

  it("returns a quest for kids too", () => {
    expect(spinQuest(false, () => 0.99)).not.toBeNull();
  });
});
