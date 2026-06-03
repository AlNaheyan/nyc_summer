import { describe, expect, it } from "vitest";
import { BADGES } from "./badges";

describe("badges", () => {
  it("defines 10-15 badges", () => {
    expect(BADGES.length).toBeGreaterThanOrEqual(10);
    expect(BADGES.length).toBeLessThanOrEqual(15);
  });

  it("has unique ids", () => {
    const ids = BADGES.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has complete fields and a well-formed rule_key", () => {
    for (const b of BADGES) {
      expect(b.name.length).toBeGreaterThan(0);
      expect(b.description.length).toBeGreaterThan(0);
      expect(b.rule_key).toMatch(/^[a-zA-Z]+:\d+$/);
    }
  });
});
