/**
 * Day-boundary helpers. The daily quest lock and streak math run on the
 * America/New_York calendar day (TECH_SPEC §7), never UTC or browser TZ.
 */
const NY_TZ = "America/New_York";

const nyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: NY_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** The current America/New_York calendar date as `YYYY-MM-DD`. */
export function nycDateString(at: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return nyFormatter.format(at);
}

export const NEW_YORK_TZ = NY_TZ;
