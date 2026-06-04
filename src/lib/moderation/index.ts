import type { ModerationProvider, ModerationResult } from "./types";
import { SightengineProvider } from "./sightengine";

export type { ModerationResult, ModerationVerdict } from "./types";

/**
 * Safe fallback provider: holds EVERY photo for review (never auto-allows).
 * Used when no real provider is configured so nothing unsafe can reach the feed
 * (TECH_SPEC §10: moderation is a hard gate).
 */
class HoldEverythingProvider implements ModerationProvider {
  readonly name = "hold-stub";
  async check(): Promise<ModerationResult> {
    return { verdict: "flag", reason: "no_moderation_provider", csam: false };
  }
}

let cached: ModerationProvider | null = null;

/** The configured moderation provider (Sightengine if keyed, else the safe stub). */
export function getModerationProvider(): ModerationProvider {
  if (cached) return cached;
  const user = process.env.SIGHTENGINE_API_USER;
  const secret = process.env.SIGHTENGINE_API_SECRET;
  cached = user && secret ? new SightengineProvider(user, secret) : new HoldEverythingProvider();
  return cached;
}

/**
 * Moderate an image URL. Any provider error fails closed to "flag" (held), so a
 * provider outage can never auto-publish an unreviewed photo.
 */
export async function moderateImage(imageUrl: string): Promise<ModerationResult> {
  try {
    return await getModerationProvider().check(imageUrl);
  } catch {
    return { verdict: "flag", reason: "moderation_error", csam: false };
  }
}
