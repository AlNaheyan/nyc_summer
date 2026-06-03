/**
 * CSV → activities ingest (TECH_SPEC §5 / Phase 0.5).
 *
 * Pure transform (`transformActivityRow`, `parseActivitiesCsv`) is separated
 * from DB I/O (`upsertActivities`) so the normalization logic is unit-testable
 * without a database.
 *
 * Expected CSV columns (header names are lowercased; aliases accepted):
 *   id | objectid            required, numeric source ObjectID
 *   source                   required (nypl, bkpl, psal, parks, dycd, ...)
 *   title | name             required
 *   url | link               required outbound link
 *   categories | tags        raw category list, delimited by ; | or ,
 *   start_date | start        ISO-ish date; blank = evergreen
 *   end_date | end           ISO-ish date; past = expired (dropped)
 *   location_name | venue
 *   address
 *   lat | latitude
 *   lng | lon | longitude
 *   borough                  used if valid, else derived from lat/lng
 *   min_age, max_age
 *   icon
 */
import { readFile } from "node:fs/promises";
import { z } from "zod";
import { parse } from "csv-parse/sync";
import type { Client } from "pg";
import { normalizeTags } from "@/lib/quests/tags";
import { boroughFromCoords, BOROUGHS } from "@/lib/geo/borough";
import type { Activity } from "@/lib/types";

const RawRow = z.record(z.string(), z.string().optional());
type RawRow = Record<string, string | undefined>;

/** First non-empty value among the given header aliases. */
function pick(row: RawRow, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = row[k];
    if (v != null && v.trim() !== "") return v.trim();
  }
  return undefined;
}

function toNumber(v: string | undefined): number | null {
  if (v == null || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toIso(v: string | undefined): string | null {
  if (v == null || v.trim() === "") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function splitRawTags(v: string | undefined): string[] {
  if (!v) return [];
  return v
    .split(/[;|,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export type TransformResult =
  | { ok: true; activity: Activity }
  | { ok: false; reason: "expired" | "invalid"; detail?: string };

/**
 * Validate + normalize a single raw CSV record into an Activity insert.
 * `now` is injected for deterministic expiry handling in tests.
 */
export function transformActivityRow(raw: RawRow, now = new Date()): TransformResult {
  const parsed = RawRow.safeParse(raw);
  if (!parsed.success) return { ok: false, reason: "invalid", detail: "not a string record" };
  const row = parsed.data;

  const id = toNumber(pick(row, "id", "objectid", "object_id"));
  const source = pick(row, "source");
  const title = pick(row, "title", "name");
  const url = pick(row, "url", "link");

  if (id == null || !source || !title || !url) {
    return { ok: false, reason: "invalid", detail: "missing id/source/title/url" };
  }

  const start_date = toIso(pick(row, "start_date", "start", "start_datetime"));
  const end_date = toIso(pick(row, "end_date", "end", "end_datetime"));

  if (end_date && new Date(end_date) < now) {
    return { ok: false, reason: "expired" };
  }

  const lat = toNumber(pick(row, "lat", "latitude"));
  const lng = toNumber(pick(row, "lng", "lon", "longitude"));

  const providedBorough = pick(row, "borough");
  const borough =
    providedBorough && (BOROUGHS as string[]).includes(providedBorough)
      ? providedBorough
      : lat != null && lng != null
        ? boroughFromCoords(lat, lng)
        : null;

  const activity: Activity = {
    id,
    source,
    title,
    tags: normalizeTags(splitRawTags(pick(row, "categories", "tags", "category"))),
    start_date,
    end_date,
    location_name: pick(row, "location_name", "venue", "location") ?? null,
    address: pick(row, "address") ?? null,
    lat,
    lng,
    borough,
    url,
    min_age: toNumber(pick(row, "min_age", "minage")),
    max_age: toNumber(pick(row, "max_age", "maxage")),
    icon: pick(row, "icon") ?? null,
  };

  return { ok: true, activity };
}

export interface ParseSummary {
  activities: Activity[];
  expired: number;
  invalid: number;
  errors: string[];
}

/** Parse a CSV string into validated activities, dropping expired/invalid rows. */
export function parseActivitiesCsv(content: string, now = new Date()): ParseSummary {
  const records = parse(content, {
    columns: (header: string[]) => header.map((h) => h.toLowerCase().trim()),
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  }) as RawRow[];

  const summary: ParseSummary = { activities: [], expired: 0, invalid: 0, errors: [] };
  for (const rec of records) {
    const result = transformActivityRow(rec, now);
    if (result.ok) {
      summary.activities.push(result.activity);
    } else if (result.reason === "expired") {
      summary.expired += 1;
    } else {
      summary.invalid += 1;
      if (result.detail) summary.errors.push(result.detail);
    }
  }
  return summary;
}

/** Upsert activities by primary key (id). Batched to keep statements small. */
export async function upsertActivities(
  client: Client,
  activities: Activity[],
  batchSize = 200,
): Promise<number> {
  let written = 0;
  for (let i = 0; i < activities.length; i += batchSize) {
    const batch = activities.slice(i, i + batchSize);
    const cols = 15;
    const values: unknown[] = [];
    const tuples = batch.map((a, n) => {
      const b = n * cols;
      values.push(
        a.id, a.source, a.title, a.tags, a.start_date, a.end_date,
        a.location_name, a.address, a.lat, a.lng, a.borough, a.url,
        a.min_age, a.max_age, a.icon,
      );
      return `($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7},$${b + 8},$${b + 9},$${b + 10},$${b + 11},$${b + 12},$${b + 13},$${b + 14},$${b + 15})`;
    });
    await client.query(
      `insert into public.activities
         (id, source, title, tags, start_date, end_date, location_name,
          address, lat, lng, borough, url, min_age, max_age, icon)
       values ${tuples.join(",")}
       on conflict (id) do update set
         source = excluded.source,
         title = excluded.title,
         tags = excluded.tags,
         start_date = excluded.start_date,
         end_date = excluded.end_date,
         location_name = excluded.location_name,
         address = excluded.address,
         lat = excluded.lat,
         lng = excluded.lng,
         borough = excluded.borough,
         url = excluded.url,
         min_age = excluded.min_age,
         max_age = excluded.max_age,
         icon = excluded.icon`,
      values,
    );
    written += batch.length;
  }
  return written;
}

/**
 * Read src/data/activities.csv (if present) and upsert it. Returns a summary;
 * a missing CSV is not an error (the file is supplied out of band).
 */
export async function seedActivitiesFromFile(
  client: Client,
  csvPath: string,
): Promise<ParseSummary & { written: number; missing?: boolean }> {
  let content: string;
  try {
    content = await readFile(csvPath, "utf8");
  } catch {
    return { activities: [], expired: 0, invalid: 0, errors: [], written: 0, missing: true };
  }
  const summary = parseActivitiesCsv(content);
  const written = await upsertActivities(client, summary.activities);
  return { ...summary, written };
}
