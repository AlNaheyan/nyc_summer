import type { ModerationResult, NormalizedScores } from "./types";

/**
 * Pure decision from normalized scores → verdict. Provider adapters normalize
 * their API response into NormalizedScores and call this, so the thresholds
 * live in one tested place.
 */
export const THRESHOLDS = {
  block: 0.5, // explicit/gore/violence at or above → block
  flag: 0.3, // moderate signal → hold for review
  suggestiveFlag: 0.6, // strongly suggestive → hold
  minorSexual: 0.2, // any real sexual signal + a minor → CSAM-class block
} as const;

export function decide(scores: NormalizedScores): ModerationResult {
  // CSAM-class: sexual content involving an apparent minor. Hard block + report.
  if (scores.minor && scores.sexual >= THRESHOLDS.minorSexual) {
    return { verdict: "block", reason: "csam_suspected", csam: true };
  }

  if (scores.sexual >= THRESHOLDS.block) return block("explicit_nudity");
  if (scores.gore >= THRESHOLDS.block) return block("gore");
  if (scores.violence >= THRESHOLDS.block) return block("violence");

  if (
    scores.sexual >= THRESHOLDS.flag ||
    scores.suggestive >= THRESHOLDS.suggestiveFlag ||
    scores.gore >= THRESHOLDS.flag ||
    scores.violence >= THRESHOLDS.flag
  ) {
    return { verdict: "flag", reason: "needs_review", csam: false };
  }

  return { verdict: "allow", reason: null, csam: false };
}

function block(reason: string): ModerationResult {
  return { verdict: "block", reason, csam: false };
}
