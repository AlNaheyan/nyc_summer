// Mapbox Static Images API helper (TECH_SPEC §9 palette).
// Renders a location as a plain <img> URL — no GL library, tiny payload, ideal
// for many cards. Returns null when no token is configured or coords are
// missing, so callers can fall back to a styled placeholder.

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

/** True when a public Mapbox token is configured at build time. */
export function hasMapbox(): boolean {
  return Boolean(TOKEN);
}

export interface StaticMapParams {
  lat: number;
  lng: number;
  /** Output pixel width (rendered @2x for retina). */
  width?: number;
  height?: number;
  zoom?: number;
}

/**
 * Build a Mapbox static map URL with a coral pin centered on the point.
 * @returns the URL, or null if unavailable (no token).
 */
export function staticMapUrl({
  lat,
  lng,
  width = 480,
  height = 240,
  zoom = 14,
}: StaticMapParams): string | null {
  if (!TOKEN) return null;
  const style = "streets-v12";
  const pin = `pin-s+ff5e5b(${lng},${lat})`;
  return (
    `https://api.mapbox.com/styles/v1/mapbox/${style}/static/` +
    `${pin}/${lng},${lat},${zoom}/${width}x${height}@2x?access_token=${TOKEN}`
  );
}

/** Google Maps deep link for "open directions / view location". */
export function googleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}
