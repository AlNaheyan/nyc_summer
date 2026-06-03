import { describe, expect, it } from "vitest";
import { QUEST_TEMPLATES, eligibleTemplates, getTemplate } from "./templates";
import { CANONICAL_TAGS } from "./tags";

const canonical = new Set<string>(CANONICAL_TAGS);

describe("quest templates", () => {
  it("has a healthy number of templates (~20-40)", () => {
    expect(QUEST_TEMPLATES.length).toBeGreaterThanOrEqual(20);
    expect(QUEST_TEMPLATES.length).toBeLessThanOrEqual(40);
  });

  it("has unique slugs", () => {
    const ids = QUEST_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("uses only canonical match_tags and never an empty set", () => {
    for (const t of QUEST_TEMPLATES) {
      expect(t.match_tags.length).toBeGreaterThan(0);
      for (const tag of t.match_tags) {
        expect(canonical.has(tag), `${t.id} → ${tag}`).toBe(true);
      }
    }
  });

  it("has positive weights", () => {
    for (const t of QUEST_TEMPLATES) expect(t.weight).toBeGreaterThan(0);
  });

  it("excludes kid-only quests from adults", () => {
    const adult = eligibleTemplates(true);
    expect(adult.every((t) => t.adult_friendly)).toBe(true);
    expect(eligibleTemplates(false).length).toBeGreaterThan(adult.length);
  });

  it("looks up by id", () => {
    expect(getTemplate("museum-day")?.title).toBe("Wander a museum");
    expect(getTemplate("nope")).toBeUndefined();
  });
});
