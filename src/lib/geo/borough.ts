import type { Borough } from "@/lib/types";

/**
 * Haversine distance in kilometers between two lat/lng points.
 * Used by the matcher to sort options nearest-first (TECH_SPEC §5/§7).
 */
export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export const BOROUGHS: Borough[] = [
  "Manhattan",
  "Brooklyn",
  "Queens",
  "Bronx",
  "Staten Island",
];

// Simplified borough outlines as [lng, lat] rings. Approximate — good enough to
// label an activity's borough for filtering (the matcher sorts by true
// distance). Border points may be imprecise; interior points are reliable.
type Ring = [number, number][];

const NYC_BBOX = { minLat: 40.48, maxLat: 40.93, minLng: -74.28, maxLng: -73.68 };

const STATEN_ISLAND: Ring = [
  [-74.26, 40.49],
  [-74.05, 40.49],
  [-74.05, 40.652],
  [-74.26, 40.652],
];

const MANHATTAN: Ring = [
  [-74.019, 40.7],
  [-74.012, 40.758],
  [-73.985, 40.8],
  [-73.946, 40.835],
  [-73.918, 40.872],
  [-73.929, 40.808],
  [-73.943, 40.775],
  [-73.965, 40.748],
  [-73.972, 40.711],
];

const BRONX: Ring = [
  [-73.935, 40.808],
  [-73.915, 40.873],
  [-73.9, 40.905],
  [-73.765, 40.905],
  [-73.77, 40.8],
  [-73.86, 40.8],
];

const BROOKLYN: Ring = [
  [-73.955, 40.739],
  [-73.9, 40.7],
  [-73.87, 40.67],
  [-73.88, 40.63],
  [-73.93, 40.575],
  [-73.96, 40.57],
  [-74.0, 40.572],
  [-74.042, 40.63],
  [-74.02, 40.68],
  [-73.995, 40.703],
];

const QUEENS: Ring = [
  [-73.962, 40.74],
  [-73.93, 40.785],
  [-73.85, 40.8],
  [-73.78, 40.795],
  [-73.7, 40.76],
  [-73.7, 40.66],
  [-73.745, 40.62],
  [-73.86, 40.64],
  [-73.9, 40.7],
  [-73.92, 40.72],
];

/** Ray-casting point-in-polygon. point = [lng, lat]. */
function pointInRing(lng: number, lat: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

/**
 * Best-effort borough for a coordinate. Returns null for points outside the
 * NYC area. Used at ingest to populate activities.borough.
 */
export function boroughFromCoords(lat: number, lng: number): Borough | null {
  if (
    lat < NYC_BBOX.minLat ||
    lat > NYC_BBOX.maxLat ||
    lng < NYC_BBOX.minLng ||
    lng > NYC_BBOX.maxLng
  ) {
    return null;
  }
  // Bronx before Manhattan: the simplified Manhattan ring would otherwise
  // claim points just across the Harlem River (e.g. Yankee Stadium).
  if (pointInRing(lng, lat, STATEN_ISLAND)) return "Staten Island";
  if (pointInRing(lng, lat, BRONX)) return "Bronx";
  if (pointInRing(lng, lat, MANHATTAN)) return "Manhattan";
  if (pointInRing(lng, lat, BROOKLYN)) return "Brooklyn";
  if (pointInRing(lng, lat, QUEENS)) return "Queens";
  return null;
}
