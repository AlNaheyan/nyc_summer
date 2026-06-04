/**
 * Moderation contract (TECH_SPEC §5/§7/§10). A photo is gated before it can
 * ever become public: allow → feed post; flag → held for admin review; block →
 * rejected (and the CSAM path runs when so classified).
 */
export type ModerationVerdict = "allow" | "flag" | "block";

export interface ModerationResult {
  verdict: ModerationVerdict;
  /** Human-readable reason (worst category), for logs/admin. */
  reason: string | null;
  /** True when classified as CSAM-class — triggers the mandatory report path. */
  csam: boolean;
}

/** Normalized 0–1 category scores any provider maps its response into. */
export interface NormalizedScores {
  sexual: number; // explicit sexual content
  suggestive: number; // suggestive / partial nudity
  gore: number;
  violence: number;
  /** A minor appears to be present in the image. */
  minor: boolean;
}

export interface ModerationProvider {
  readonly name: string;
  /** Inspect an image by its (publicly reachable) URL. */
  check(imageUrl: string): Promise<ModerationResult>;
}
