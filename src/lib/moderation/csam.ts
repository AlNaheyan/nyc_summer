/**
 * CSAM handling path (TECH_SPEC §10 — mandatory, not optional).
 *
 * When moderation classifies an upload as CSAM-class, the image is destroyed
 * and this path runs. A production deployment MUST file a report with NCMEC
 * (CyberTipline) and preserve the legally required evidence per its provider's
 * obligations. This function centralizes that responsibility so the obligation
 * is explicit and auditable.
 *
 * TODO(before production): integrate NCMEC CyberTipline reporting and secure
 * evidence preservation. Until then this records the event loudly server-side.
 */
export interface CsamEvent {
  userId: string;
  completionId: string | null;
  storagePath: string | null;
  detectedBy: string;
}

export async function reportCsamSuspicion(event: CsamEvent): Promise<void> {
  // Intentionally high-visibility. Do not swallow.
  console.error("[CSAM-PATH] suspected CSAM upload — image destroyed, report required", {
    ...event,
    at: new Date().toISOString(),
  });
  // TODO: NCMEC CyberTipline report + evidence preservation.
}
