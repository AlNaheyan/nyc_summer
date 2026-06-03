import { describe, expect, it } from "vitest";
import { transformActivityRow, parseActivitiesCsv } from "./ingest-activities";

const NOW = new Date("2026-07-01T00:00:00Z");

describe("transformActivityRow", () => {
  it("normalizes a valid future row", () => {
    const r = transformActivityRow(
      {
        id: "42",
        source: "nypl",
        title: "Outdoor Movie Night",
        url: "https://example.org/e/42",
        categories: "Outdoor Movie; Free",
        start_date: "2026-07-10",
        end_date: "2026-07-10",
        lat: "40.758",
        lng: "-73.9855",
      },
      NOW,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.activity.id).toBe(42);
    expect(r.activity.tags).toEqual(["outdoors", "free", "movie"]);
    expect(r.activity.borough).toBe("Manhattan");
  });

  it("drops expired rows", () => {
    const r = transformActivityRow(
      { id: "1", source: "x", title: "Old", url: "u", end_date: "2026-06-01" },
      NOW,
    );
    expect(r).toEqual({ ok: false, reason: "expired" });
  });

  it("rejects rows missing required fields", () => {
    const r = transformActivityRow({ id: "1", title: "No source" }, NOW);
    expect(r.ok).toBe(false);
  });

  it("prefers a valid provided borough over coords", () => {
    const r = transformActivityRow(
      { id: "2", source: "x", title: "T", url: "u", borough: "Queens", lat: "40.758", lng: "-73.9855" },
      NOW,
    );
    expect(r.ok && r.activity.borough).toBe("Queens");
  });

  it("derives borough from coords when none provided", () => {
    const r = transformActivityRow(
      { id: "3", source: "x", title: "T", url: "u", lat: "40.5755", lng: "-73.9876" },
      NOW,
    );
    expect(r.ok && r.activity.borough).toBe("Brooklyn");
  });

  it("accepts header aliases (objectid/name/link/latitude)", () => {
    const r = transformActivityRow(
      { objectid: "7", source: "parks", name: "Yoga", link: "https://u", latitude: "40.7", longitude: "-74.0" },
      NOW,
    );
    expect(r.ok && r.activity.id).toBe(7);
    expect(r.ok && r.activity.title).toBe("Yoga");
  });
});

describe("parseActivitiesCsv", () => {
  it("parses, counts expired/invalid, and keeps valid rows", () => {
    const csv = [
      "id,source,title,url,categories,end_date,lat,lng",
      "1,nypl,Movie,https://a,Film,2026-07-30,40.758,-73.9855",
      "2,nypl,Expired,https://b,Music,2026-06-01,40.7,-74.0",
      ",nypl,NoId,https://c,Art,,40.7,-74.0",
    ].join("\n");
    const s = parseActivitiesCsv(csv, NOW);
    expect(s.activities).toHaveLength(1);
    expect(s.activities[0].title).toBe("Movie");
    expect(s.expired).toBe(1);
    expect(s.invalid).toBe(1);
  });
});
