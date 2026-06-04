import { decide } from "./decide";
import type { ModerationProvider, ModerationResult, NormalizedScores } from "./types";

/**
 * Sightengine adapter. Calls the check.json endpoint with nudity/gore/violence
 * models, normalizes the response, and runs the shared decision.
 *
 * Note: Sightengine covers nudity/gore/violence but not CSAM specifically, so
 * `minor` stays false here. The CSAM decision path in decide() activates when a
 * CSAM-capable provider (e.g. PhotoDNA) sets minor=true — wire that in later.
 */
export class SightengineProvider implements ModerationProvider {
  readonly name = "sightengine";

  constructor(
    private readonly apiUser: string,
    private readonly apiSecret: string,
  ) {}

  async check(imageUrl: string): Promise<ModerationResult> {
    const params = new URLSearchParams({
      url: imageUrl,
      models: "nudity-2.1,gore-2.0,violence",
      api_user: this.apiUser,
      api_secret: this.apiSecret,
    });

    const res = await fetch(`https://api.sightengine.com/1.0/check.json?${params.toString()}`);
    if (!res.ok) throw new Error(`sightengine_http_${res.status}`);
    const data = (await res.json()) as SightengineResponse;
    if (data.status !== "success") {
      throw new Error(`sightengine_${data.error?.message ?? "error"}`);
    }
    return decide(normalize(data));
  }
}

export function normalize(data: SightengineResponse): NormalizedScores {
  const n = data.nudity ?? {};
  const sexual = Math.max(n.sexual_activity ?? 0, n.sexual_display ?? 0, n.erotica ?? 0);
  const suggestive = Math.max(
    n.very_suggestive ?? 0,
    n.suggestive ?? 0,
    n.mildly_suggestive ?? 0,
  );
  return {
    sexual,
    suggestive,
    gore: data.gore?.prob ?? 0,
    violence: data.violence?.prob ?? 0,
    minor: false,
  };
}

interface SightengineResponse {
  status: "success" | "failure";
  error?: { message?: string };
  nudity?: {
    sexual_activity?: number;
    sexual_display?: number;
    erotica?: number;
    very_suggestive?: number;
    suggestive?: number;
    mildly_suggestive?: number;
    none?: number;
  };
  gore?: { prob?: number };
  violence?: { prob?: number };
}
