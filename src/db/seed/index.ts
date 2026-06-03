/**
 * Seeds reference data into Supabase. Run with: pnpm db:seed
 *
 *   1. quest_templates  (from src/lib/quests/templates.ts)
 *   2. badges           (from src/lib/gamification/badges.ts)
 *   3. activities        (from src/data/activities.csv, if present)
 *
 * Idempotent: everything upserts by primary key. A missing activities.csv is
 * not fatal — templates and badges still seed.
 *
 * Requires SUPABASE_DB_URL (see .env.example).
 */
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import "dotenv/config";
import { QUEST_TEMPLATES } from "@/lib/quests/templates";
import { BADGES } from "@/lib/gamification/badges";
import { seedActivitiesFromFile } from "./ingest-activities";

const here = dirname(fileURLToPath(import.meta.url));
const csvPath = join(here, "..", "..", "data", "activities.csv");

async function seedQuestTemplates(client: Client) {
  for (const t of QUEST_TEMPLATES) {
    await client.query(
      `insert into public.quest_templates
         (id, title, description, icon, match_tags, adult_friendly, weight)
       values ($1,$2,$3,$4,$5,$6,$7)
       on conflict (id) do update set
         title = excluded.title,
         description = excluded.description,
         icon = excluded.icon,
         match_tags = excluded.match_tags,
         adult_friendly = excluded.adult_friendly,
         weight = excluded.weight`,
      [t.id, t.title, t.description, t.icon, t.match_tags, t.adult_friendly, t.weight],
    );
  }
  console.log(`✓ quest_templates: ${QUEST_TEMPLATES.length}`);
}

async function seedBadges(client: Client) {
  for (const b of BADGES) {
    await client.query(
      `insert into public.badges (id, name, description, icon, rule_key)
       values ($1,$2,$3,$4,$5)
       on conflict (id) do update set
         name = excluded.name,
         description = excluded.description,
         icon = excluded.icon,
         rule_key = excluded.rule_key`,
      [b.id, b.name, b.description, b.icon, b.rule_key],
    );
  }
  console.log(`✓ badges: ${BADGES.length}`);
}

async function main() {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) throw new Error("SUPABASE_DB_URL is not set (see .env.example)");

  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    await seedQuestTemplates(client);
    await seedBadges(client);

    const a = await seedActivitiesFromFile(client, csvPath);
    if (a.missing) {
      console.log("· activities: src/data/activities.csv not found — skipped");
    } else {
      console.log(
        `✓ activities: ${a.written} upserted (expired ${a.expired}, invalid ${a.invalid})`,
      );
    }
  } finally {
    await client.end();
  }
  console.log("✓ seed complete");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
