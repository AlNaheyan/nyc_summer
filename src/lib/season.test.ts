import { describe, expect, it } from "vitest";
import { seasonEnded, daysLeft, SEASON_END } from "./season";

describe("season", () => {
  it("is not ended mid-season", () => {
    expect(seasonEnded(new Date("2026-07-01T12:00:00Z"))).toBe(false);
  });

  it("is not ended on the final day", () => {
    expect(seasonEnded(new Date("2026-07-29T12:00:00Z"))).toBe(false);
  });

  it("is ended the day after", () => {
    expect(seasonEnded(new Date("2026-07-30T12:00:00Z"))).toBe(true);
  });

  it("counts days left and floors at zero", () => {
    expect(daysLeft(new Date("2026-07-27T12:00:00Z"))).toBe(2);
    expect(daysLeft(new Date("2026-07-29T12:00:00Z"))).toBe(0);
    expect(daysLeft(new Date("2026-08-15T12:00:00Z"))).toBe(0);
  });

  it("SEASON_END is the documented date", () => {
    expect(SEASON_END).toBe("2026-07-29");
  });
});
