# Summer Quest NYC

A seasonal web app that gives you one real, doable NYC summer activity each day,
lets you mark it done (optionally with a photo), and shares that photo to a
public feed of everyone else exploring the city.

> Seasonal app for summer 2026. Data ends **July 29, 2026**. Full design in
> [`TECH_SPEC_summer_quest_nyc.md`](./TECH_SPEC_summer_quest_nyc.md).

## Stack

- **Next.js 14** (App Router) + **TypeScript** (strict)
- **Tailwind CSS** (mobile-first)
- **Supabase** — Postgres + Auth (Google/Apple) + Storage + RLS
- **Vitest** for unit/integration tests
- Package manager: **pnpm**, Node 20+

## Setup & run

```bash
# 1. Install
pnpm install

# 2. Configure environment
cp .env.example .env.local      # fill in Supabase, OAuth, moderation keys

# 3. Database (needs a Supabase project + SUPABASE_DB_URL)
pnpm db:migrate                 # applies src/db/migrations
pnpm db:seed                    # ingest activities + quest_templates + badges (Phase 0.5)

# 4. Run locally
pnpm dev                        # http://localhost:3000

# 5. Tests
pnpm test                       # vitest
pnpm typecheck                  # tsc --noEmit
pnpm lint
```

## Deploy

Push to `main` → Vercel auto-deploys. Set the same env vars (see `.env.example`)
in the Vercel project settings.

## Project layout

```
src/
  app/            # routes: (auth), spin, feed, journal, admin, api
  components/     # WheelSpinner, QuestCard, OptionCard, FeedPost, BadgeGrid
  lib/
    supabase/     # browser + server (+ admin/service-role) clients
    quests/       # quest templates + matching rules
    matcher/      # options query + distance sort + date filter
    gamification/ # points, streak, badge logic
    moderation/   # moderation API wrapper
    geo/          # geolocation + borough-from-coords + distance
  db/
    migrations/   # SQL schema
    seed/         # ingest-activities.ts (CSV → activities table)
  data/
    activities.csv  # source feed (seed input, not served directly)
```

## Conventions

- All data access goes through `/lib` service modules — never raw Supabase
  calls in components.
- Server-only secrets (service role, moderation key) never imported into client
  components. Use `serverEnv()` / `createAdminClient()`.
- Validate every external input with zod (API inputs **and** CSV ingest rows).
- No business logic in components. Always derive `user_id` from the session,
  never trust client-supplied ids.

## Build phases

Built phase by phase (TECH_SPEC §12); review between phases.

- **Phase 0 — Setup** ✅ scaffold, schema, clients, theme, hello-world.
- **Phase 0.5 — Data prep** — CSV ingest + quest templates + badges.
- **Phase 1 — Core loop** — auth, spin, matcher, mark-done, points/streak, journal.
- **Phase 2 — Social + moderation** — upload, moderation gate, feed, reports, admin.
- **Phase 3 — Polish** — badges, share-cards, map, reactions, end-of-season.
