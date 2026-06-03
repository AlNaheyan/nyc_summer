/**
 * Canonical flat tag vocabulary for activities and quest templates.
 *
 * `activities.tags` (normalized at ingest) and `quest_templates.match_tags`
 * both draw from this set so the matcher can do a clean array overlap.
 * Raw source categories (DYCD / NYPL / Parks / PSAL taxonomies) are messy and
 * inconsistent — `normalizeTags()` maps them onto this vocabulary.
 */
export const CANONICAL_TAGS = [
  // setting
  "outdoors",
  "indoors",
  "free",
  // screen / stage
  "movie",
  "music",
  "performance",
  "theater",
  "dance",
  "comedy",
  // arts
  "art",
  "museum",
  // active
  "sports",
  "fitness",
  "yoga",
  "swimming",
  "beach",
  "cycling",
  "running",
  // nature
  "nature",
  "park",
  "garden",
  "hiking",
  "waterfront",
  "water-activity",
  // social / food
  "food",
  "market",
  "festival",
  // learning
  "workshop",
  "class",
  "tech",
  "science",
  "reading",
  "library",
  "history",
  "tour",
  // community
  "volunteer",
  "community",
  "games",
] as const;

export type CanonicalTag = (typeof CANONICAL_TAGS)[number];

const CANONICAL_SET = new Set<string>(CANONICAL_TAGS);

/**
 * Synonym / raw-category → canonical tag map. Keys are compared after
 * lowercasing and trimming. A raw value may expand to multiple canonical tags.
 */
const RAW_TAG_MAP: Record<string, CanonicalTag[]> = {
  // setting
  outdoor: ["outdoors"],
  outdoors: ["outdoors"],
  "open air": ["outdoors"],
  indoor: ["indoors"],
  indoors: ["indoors"],
  "no cost": ["free"],
  "no charge": ["free"],
  free: ["free"],
  "free admission": ["free"],
  // screen / stage
  film: ["movie", "free"],
  films: ["movie"],
  movie: ["movie"],
  movies: ["movie"],
  "outdoor movie": ["movie", "outdoors"],
  cinema: ["movie"],
  music: ["music"],
  concert: ["music", "performance"],
  concerts: ["music", "performance"],
  "live music": ["music", "performance"],
  performance: ["performance"],
  "performing arts": ["performance"],
  theater: ["theater", "performance"],
  theatre: ["theater", "performance"],
  shakespeare: ["theater", "performance"],
  dance: ["dance", "performance"],
  comedy: ["comedy", "performance"],
  // arts
  art: ["art"],
  arts: ["art"],
  "visual arts": ["art"],
  "arts & culture": ["art"],
  museum: ["museum", "indoors"],
  museums: ["museum", "indoors"],
  exhibit: ["museum"],
  exhibition: ["museum"],
  gallery: ["art", "indoors"],
  // active
  sport: ["sports"],
  sports: ["sports"],
  athletics: ["sports"],
  fitness: ["fitness"],
  "fitness & wellness": ["fitness"],
  workout: ["fitness"],
  yoga: ["yoga", "fitness"],
  swim: ["swimming"],
  swimming: ["swimming"],
  pool: ["swimming"],
  beach: ["beach", "outdoors", "waterfront"],
  "bike": ["cycling"],
  cycling: ["cycling"],
  biking: ["cycling"],
  run: ["running"],
  running: ["running"],
  "5k": ["running"],
  // nature
  nature: ["nature", "outdoors"],
  park: ["park", "outdoors"],
  parks: ["park", "outdoors"],
  garden: ["garden", "outdoors"],
  gardens: ["garden", "outdoors"],
  gardening: ["garden"],
  hike: ["hiking", "outdoors"],
  hiking: ["hiking", "outdoors"],
  trail: ["hiking", "outdoors"],
  waterfront: ["waterfront", "outdoors"],
  kayak: ["water-activity", "outdoors"],
  kayaking: ["water-activity", "outdoors"],
  canoe: ["water-activity", "outdoors"],
  boating: ["water-activity", "outdoors"],
  fishing: ["water-activity", "outdoors"],
  // food / social
  food: ["food"],
  "food & drink": ["food"],
  market: ["market"],
  "farmers market": ["market", "food", "outdoors"],
  "flea market": ["market"],
  festival: ["festival", "outdoors"],
  fair: ["festival", "outdoors"],
  "street fair": ["festival", "outdoors"],
  // learning
  workshop: ["workshop"],
  workshops: ["workshop"],
  class: ["class"],
  classes: ["class"],
  course: ["class"],
  tech: ["tech"],
  technology: ["tech"],
  coding: ["tech", "class"],
  stem: ["science", "tech"],
  science: ["science"],
  reading: ["reading", "library"],
  "story time": ["reading", "library"],
  storytime: ["reading", "library"],
  books: ["reading"],
  "book club": ["reading", "library"],
  library: ["library", "indoors"],
  history: ["history"],
  historical: ["history"],
  tour: ["tour"],
  "walking tour": ["tour", "outdoors"],
  // community
  volunteer: ["volunteer", "community"],
  "volunteering": ["volunteer", "community"],
  community: ["community"],
  "games": ["games"],
  "board games": ["games"],
};

/** Lowercase, trim, collapse whitespace. */
function clean(raw: string): string {
  return raw.toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Map a list of raw source categories/keywords onto the canonical vocabulary.
 * - Unknown raw values are dropped.
 * - A raw value already in the canonical set passes through.
 * - Result is de-duplicated and stable-ordered by CANONICAL_TAGS.
 */
export function normalizeTags(raw: string[]): CanonicalTag[] {
  const out = new Set<CanonicalTag>();
  for (const value of raw) {
    const key = clean(value);
    if (!key) continue;
    // Expansion map wins (so canonical inputs like "beach" still infer
    // "outdoors"/"waterfront"); otherwise pass a canonical tag through.
    const mapped = RAW_TAG_MAP[key];
    if (mapped) {
      for (const t of mapped) out.add(t);
    } else if (CANONICAL_SET.has(key)) {
      out.add(key as CanonicalTag);
    }
  }
  // stable order
  return CANONICAL_TAGS.filter((t) => out.has(t));
}
