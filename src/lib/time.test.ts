import { describe, expect, it } from "vitest";
import { nycDateString } from "./time";

describe("nycDateString", () => {
  it("formats as YYYY-MM-DD", () => {
    expect(nycDateString(new Date("2026-07-15T16:00:00Z"))).toBe("2026-07-15");
  });

  it("uses the NY calendar day across the UTC midnight boundary", () => {
    // 2026-07-16 02:00 UTC is still 2026-07-15 22:00 in New York (EDT, -4).
    expect(nycDateString(new Date("2026-07-16T02:00:00Z"))).toBe("2026-07-15");
  });

  it("rolls to the next day at NY midnight", () => {
    // 2026-07-16 04:00 UTC == 2026-07-16 00:00 EDT.
    expect(nycDateString(new Date("2026-07-16T04:00:00Z"))).toBe("2026-07-16");
  });
});
