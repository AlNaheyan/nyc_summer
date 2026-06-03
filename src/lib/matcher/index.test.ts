import { describe, expect, it } from "vitest";
import { selectOptions, isAvailable } from "./index";
import type { Activity } from "@/lib/types";

const NOW = new Date("2026-07-01T12:00:00Z"); // NY: 2026-07-01

function act(p: Partial<Activity>): Activity {
  return {
    id: Math.floor(Math.random() * 1e9),
    source: "test",
    title: "Thing",
    tags: ["sports"],
    start_date: null,
    end_date: null,
    location_name: null,
    address: null,
    lat: null,
    lng: null,
    borough: null,
    url: "https://x",
    min_age: null,
    max_age: null,
    icon: null,
    ...p,
  };
}

describe("isAvailable", () => {
  const today = "2026-07-01";
  it("keeps evergreen rows", () => {
    expect(isAvailable(act({}), today)).toBe(true);
  });
  it("keeps upcoming and ongoing rows", () => {
    expect(isAvailable(act({ start_date: "2026-07-10T00:00:00-04:00" }), today)).toBe(true);
    expect(isAvailable(act({ start_date: "2026-06-01T00:00:00-04:00", end_date: "2026-08-01T00:00:00-04:00" }), today)).toBe(true);
  });
  it("drops single-day past rows", () => {
    expect(isAvailable(act({ start_date: "2026-06-20T00:00:00-04:00" }), today)).toBe(false);
  });
});

describe("selectOptions", () => {
  it("dedupes recurring sessions at one place, keeping the soonest", () => {
    const rows = [
      act({ id: 1, location_name: "Rugby Library", start_date: "2026-07-10T00:00:00-04:00" }),
      act({ id: 2, location_name: "Rugby Library", start_date: "2026-07-03T00:00:00-04:00" }),
      act({ id: 3, location_name: "Rugby Library", start_date: "2026-07-17T00:00:00-04:00" }),
    ];
    const out = selectOptions(rows, null, 4, NOW);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe(2); // soonest
  });

  it("sorts by distance when a location is given", () => {
    const near = act({ id: 1, location_name: "Near", lat: 40.7128, lng: -74.006 });
    const far = act({ id: 2, location_name: "Far", lat: 40.9, lng: -73.8 });
    const out = selectOptions([far, near], { lat: 40.71, lng: -74.0 }, 4, NOW);
    expect(out.map((o) => o.id)).toEqual([1, 2]);
    expect(out[0].distanceKm).toBeLessThan(out[1].distanceKm!);
  });

  it("limits the number of options", () => {
    const rows = Array.from({ length: 10 }, (_, i) =>
      act({ id: i, location_name: `Place ${i}`, start_date: "2026-07-05T00:00:00-04:00" }),
    );
    expect(selectOptions(rows, null, 4, NOW)).toHaveLength(4);
  });

  it("excludes expired rows entirely", () => {
    const rows = [
      act({ id: 1, location_name: "Old", start_date: "2026-06-01T00:00:00-04:00" }),
      act({ id: 2, location_name: "New", start_date: "2026-07-09T00:00:00-04:00" }),
    ];
    const out = selectOptions(rows, null, 4, NOW);
    expect(out.map((o) => o.id)).toEqual([2]);
  });
});
