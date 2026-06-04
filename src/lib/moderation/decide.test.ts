import { describe, expect, it } from "vitest";
import { decide } from "./decide";
import type { NormalizedScores } from "./types";

const clean: NormalizedScores = { sexual: 0.01, suggestive: 0.05, gore: 0.0, violence: 0.0, minor: false };

describe("decide", () => {
  it("allows a clean image", () => {
    expect(decide(clean)).toMatchObject({ verdict: "allow", csam: false });
  });

  it("blocks explicit nudity", () => {
    expect(decide({ ...clean, sexual: 0.8 }).verdict).toBe("block");
  });

  it("blocks gore and violence", () => {
    expect(decide({ ...clean, gore: 0.6 }).verdict).toBe("block");
    expect(decide({ ...clean, violence: 0.7 }).verdict).toBe("block");
  });

  it("flags moderate signals for review", () => {
    expect(decide({ ...clean, sexual: 0.35 }).verdict).toBe("flag");
    expect(decide({ ...clean, suggestive: 0.7 }).verdict).toBe("flag");
  });

  it("flags CSAM-class (minor + sexual) and sets the csam path", () => {
    const r = decide({ ...clean, minor: true, sexual: 0.4 });
    expect(r.verdict).toBe("block");
    expect(r.csam).toBe(true);
    expect(r.reason).toBe("csam_suspected");
  });

  it("does not csam-flag a clothed minor", () => {
    const r = decide({ ...clean, minor: true, sexual: 0.02 });
    expect(r.csam).toBe(false);
    expect(r.verdict).toBe("allow");
  });
});
