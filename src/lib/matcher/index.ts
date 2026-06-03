import type { SupabaseClient } from "@supabase/supabase-js";
import type { Activity } from "@/lib/types";
import { distanceKm } from "@/lib/geo/borough";
import { nycDateString } from "@/lib/time";

/**
 * Options matcher (TECH_SPEC §7). Given a quest's match_tags and an optional
 * user location, return up to N real, still-available, distinct nearby places.
 *
 * The selection logic is pure (`selectOptions`) and unit-tested; `findOptions`
 * is the thin DB query that feeds it candidates.
 */

export interface UserLocation {
  lat: number;
  lng: number;
}

export interface MatchedOption extends Activity {
  /** Distance from the user in km, when a location was supplied. */
  distanceKm: number | null;
}

/** The NY calendar day for an activity's effective (end-or-start) date. */
function effectiveDay(a: Activity): string | null {
  const iso = a.end_date ?? a.start_date;
  return iso ? nycDateString(new Date(iso)) : null;
}

/** Available today = evergreen (no dates) or effective day not yet passed. */
export function isAvailable(a: Activity, today: string): boolean {
  if (!a.start_date && !a.end_date) return true;
  const day = effectiveDay(a);
  return day == null || day >= today;
}

/** Stable key identifying a single place (TECH_SPEC: dedupe recurring sessions). */
function placeKey(a: Activity): string {
  if (a.location_name) return `n:${a.location_name.toLowerCase().trim()}`;
  if (a.lat != null && a.lng != null) return `c:${a.lat.toFixed(4)},${a.lng.toFixed(4)}`;
  return `id:${a.id}`;
}

/** Sort key for choosing the soonest session in a place group (nulls last). */
function startSortKey(a: Activity): string {
  return a.start_date ?? "9999-12-31";
}

/**
 * From raw candidates: drop unavailable, collapse recurring sessions to the
 * soonest upcoming per place, then order (nearest first when a location is
 * given, else soonest first) and take `limit`.
 */
export function selectOptions(
  candidates: Activity[],
  location: UserLocation | null,
  limit = 4,
  now: Date = new Date(),
): MatchedOption[] {
  const today = nycDateString(now);

  // 1. availability
  const available = candidates.filter((a) => isAvailable(a, today));

  // 2. dedupe by place, keep the soonest session
  const byPlace = new Map<string, Activity>();
  for (const a of available) {
    const key = placeKey(a);
    const existing = byPlace.get(key);
    if (!existing || startSortKey(a) < startSortKey(existing)) byPlace.set(key, a);
  }
  const distinct = Array.from(byPlace.values());

  // 3. attach distance + order
  const withDistance: MatchedOption[] = distinct.map((a) => ({
    ...a,
    distanceKm:
      location && a.lat != null && a.lng != null
        ? distanceKm(location, { lat: a.lat, lng: a.lng })
        : null,
  }));

  withDistance.sort((x, y) => {
    if (location) {
      const dx = x.distanceKm ?? Infinity;
      const dy = y.distanceKm ?? Infinity;
      if (dx !== dy) return dx - dy;
    }
    return startSortKey(x).localeCompare(startSortKey(y));
  });

  return withDistance.slice(0, limit);
}

/**
 * Query candidate activities (tag overlap + optional borough) and select the
 * top options. Reads only; safe with the user-scoped client.
 */
export async function findOptions(
  client: SupabaseClient,
  params: {
    matchTags: string[];
    location?: UserLocation | null;
    borough?: string | null;
    limit?: number;
    now?: Date;
  },
): Promise<MatchedOption[]> {
  const { matchTags, location = null, borough = null, limit = 4, now = new Date() } = params;
  if (matchTags.length === 0) return [];

  let query = client
    .from("activities")
    .select("*")
    .overlaps("tags", matchTags)
    .order("start_date", { ascending: true, nullsFirst: false })
    .limit(500);

  if (borough) query = query.eq("borough", borough);

  const { data, error } = await query;
  if (error) throw error;

  return selectOptions((data ?? []) as Activity[], location, limit, now);
}
