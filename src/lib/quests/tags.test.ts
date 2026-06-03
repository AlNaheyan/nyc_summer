import { describe, expect, it } from "vitest";
import { normalizeTags, CANONICAL_TAGS } from "./tags";

describe("normalizeTags", () => {
  it("passes through canonical tags", () => {
    expect(normalizeTags(["movie", "free"])).toEqual(["free", "movie"]);
  });

  it("maps synonyms to canonical tags", () => {
    expect(normalizeTags(["Film"])).toEqual(["free", "movie"]);
    expect(normalizeTags(["Outdoor Movie"])).toEqual(["outdoors", "movie"]);
  });

  it("expands a raw value into multiple canonical tags", () => {
    expect(normalizeTags(["beach"])).toEqual(["outdoors", "beach", "waterfront"]);
  });

  it("is case- and whitespace-insensitive", () => {
    expect(normalizeTags(["  FARMERS   MARKET "])).toEqual([
      "outdoors",
      "food",
      "market",
    ]);
  });

  it("drops unknown values", () => {
    expect(normalizeTags(["blockchain", "movie"])).toEqual(["movie"]);
  });

  it("de-duplicates overlapping inputs", () => {
    expect(normalizeTags(["concert", "live music"])).toEqual([
      "music",
      "performance",
    ]);
  });

  it("returns results ordered by the canonical list", () => {
    const result = normalizeTags(["yoga", "park", "free"]);
    const indices = result.map((t) => CANONICAL_TAGS.indexOf(t));
    expect(indices).toEqual([...indices].sort((a, b) => a - b));
  });

  it("returns an empty array for no matches", () => {
    expect(normalizeTags(["", "   ", "nonsense"])).toEqual([]);
  });
});
