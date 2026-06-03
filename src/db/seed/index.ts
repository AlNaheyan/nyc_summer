/**
 * Seed entry point. Run with: pnpm db:seed
 *
 * Phase 0.5 will implement:
 *   - ingest-activities.ts: parse src/data/activities.csv → normalize tags →
 *     derive borough from lat/lng → drop expired rows → upsert `activities`.
 *   - quest_templates + badges seeding.
 *
 * Phase 0 ships this as a wired-but-empty stub so the script and DB connection
 * are verified end to end before real data lands.
 */
import "dotenv/config";

async function main() {
  if (!process.env.SUPABASE_DB_URL) {
    throw new Error("SUPABASE_DB_URL is not set (see .env.example)");
  }
  console.log("· seed: nothing to do yet (implemented in Phase 0.5)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
