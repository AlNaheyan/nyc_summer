import { describe, expect, it } from "vitest";
import { distanceKm } from "./borough";

describe("distanceKm", () => {
  it("is zero for the same point", () => {
    const p = { lat: 40.7128, lng: -74.006 };
    expect(distanceKm(p, p)).toBeCloseTo(0, 5);
  });

  it("matches a known NYC distance (Times Sq → Prospect Park ≈ 8.7km)", () => {
    const timesSq = { lat: 40.758, lng: -73.9855 };
    const prospect = { lat: 40.6602, lng: -73.969 };
    expect(distanceKm(timesSq, prospect)).toBeGreaterThan(10);
    expect(distanceKm(timesSq, prospect)).toBeLessThan(12);
  });
});
