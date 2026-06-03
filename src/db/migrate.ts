/**
 * Applies SQL files in src/db/migrations in lexical order against the
 * Supabase Postgres database. Idempotent: tracks applied files in a
 * schema_migrations table. Run with: pnpm db:migrate
 *
 * Requires SUPABASE_DB_URL (the project's Postgres connection string,
 * found in Supabase → Project Settings → Database → Connection string).
 */
import { readdir, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import "dotenv/config";

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, "migrations");

async function main() {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) {
    throw new Error("SUPABASE_DB_URL is not set (see .env.example)");
  }

  const client = new Client({ connectionString: url });
  await client.connect();

  await client.query(`
    create table if not exists public.schema_migrations (
      filename text primary key,
      applied_at timestamptz not null default now()
    );
  `);

  const files = (await readdir(migrationsDir))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const already = await client.query(
      "select 1 from public.schema_migrations where filename = $1",
      [file],
    );
    if (already.rowCount) {
      console.log(`· skip   ${file}`);
      continue;
    }
    const sql = await readFile(join(migrationsDir, file), "utf8");
    console.log(`▶ apply  ${file}`);
    await client.query("begin");
    try {
      await client.query(sql);
      await client.query(
        "insert into public.schema_migrations (filename) values ($1)",
        [file],
      );
      await client.query("commit");
    } catch (err) {
      await client.query("rollback");
      throw err;
    }
  }

  await client.end();
  console.log("✓ migrations up to date");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
