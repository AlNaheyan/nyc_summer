# Summer Quest NYC — Technical Specification

> Working title. Seasonal web app for summer 2026. Built by a solo developer, intended to be handed to a coding agent and built phase by phase.

-----

## 1. Summary

- **Elevator pitch:** A web app that gives you one real, doable NYC summer activity each day, lets you mark it done (optionally with a photo), and shares that photo to a public feed of everyone else exploring the city.
- **Problem:** NYC publishes huge amounts of free summer programming, but it lives in flat, filterable lists that are easy to scroll past and hard to act on. The lists tell you what exists; they don't push you out the door.
- **Target user:** Anyone in NYC, broad audience, primarily on a phone, planning their day and wanting something to do in the next few hours without research.
- **Core value:** Turns a static directory into a daily nudge plus a social proof loop — exploring the city becomes a habit and a shared game, not a research project.

## 2. Goals & Non-Goals

### Goals (in priority order)

1. **Virality / spread.** The explicit success metric. Every design choice should favor sharing and reach (public feed, shareable cards).
2. Drive the user to do **one real NYC activity per day** with a sense of progress (streaks, points, badges).
3. Surface **real, still-upcoming, nearby** options behind each quest — never a dead end, never an expired event.
4. Be fun: spin mechanic, lightweight gamification.

### Non-Goals (explicitly out of scope)

- Outliving summer 2026. Seasonal app; data ends **July 29, 2026**.
- Native mobile apps. Web only (mobile-responsive).
- Booking, ticketing, payments, monetization.
- Friend graph / following / DMs. The feed is a single public stream in v1.
- Human pre-moderation pipelines. Auto-filter + report only.
- Comments on feed posts (stretch goal, not v1).

## 3. Success Criteria

- **Primary (virality):** % of completions that get shared out (feed post or exported share-card). Week-1 retention: % of users completing a quest on ≥3 distinct days in week one.
- **Secondary:** daily active spinners; feed posts/day; median quests completed per active user per week.
- **MVP definition:** A signed-in user can spin once a day, see real matching activities near them, mark a quest done with an optional photo, earn points + a streak, and (if a photo was added) see it appear in a moderated public feed. Phase 1 (no social) is independently shippable to yourself.

## 4. Tech Stack & Dependencies

| Layer | Choice | Version | Reason |
|-------|--------|---------|--------|
| Language | TypeScript | 5.x | Type safety across full stack; one language end to end. |
| Framework | Next.js (App Router) | 14.x | SSR + API routes in one deployable; great Vercel story for a solo dev. |
| Database | Supabase (Postgres) | current | `❓ NEEDS DECISION:` default Supabase — it bundles Postgres + auth + storage + row-level security, removing most v1 plumbing. Firebase is the alternative if you prefer NoSQL. |
| Auth | Supabase Auth (OAuth) | current | Native Google + Apple providers, no password flows to build. |
| Hosting/Deploy | Vercel | current | Zero-config Next.js deploys; preview branches. |
| Key libraries | See below | — | — |

Key libraries:
- `@supabase/supabase-js` + `@supabase/ssr` — DB, auth, storage client.
- `tailwindcss` — styling (mobile-first utility CSS).
- `framer-motion` — the spin/wheel animation.
- `zod` — runtime validation of inputs and CSV ingest rows.
- `@turf/distance` (or a small haversine util) — distance sorting of options.
- A hosted **image moderation API** client — `❓ NEEDS DECISION:` default to a managed vision-moderation API (e.g. a cloud provider's content-moderation endpoint). Do NOT build a classifier. Must cover nudity/violence and CSAM-class detection.

- **Package manager:** `pnpm` (fast, disk-efficient). `❓ NEEDS DECISION:` npm is fine if preferred; pick one and stay consistent.
- **Runtime version:** Node 20 LTS.
- **Environment variables needed (keys only):**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (server-side only; never exposed to client)
  - `MODERATION_API_KEY`
  - `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET`
  - `APPLE_OAUTH_*` (service ID, team ID, key ID, private key)
  - `NEXT_PUBLIC_APP_URL`

## 5. Architecture

### High-level diagram

```
┌─────────────────────────────────────────────────────────┐
│  Browser (Next.js client, mobile-first)                  │
│  - Spin wheel UI   - Options list   - Feed   - Journal    │
└───────────────┬───────────────────────────┬──────────────┘
                │ (server actions / route handlers)
                ▼                             ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│ Next.js server (Vercel)  │   │ Supabase                  │
│ - quest selection logic  │──▶│ - Postgres (RLS)          │
│ - options matcher        │   │ - Auth (Google/Apple)     │
│ - point/streak/badge calc│   │ - Storage (photos)        │
│ - moderation orchestration│  └──────────────────────────┘
└──────────┬───────────────┘
           │ (on photo upload)
           ▼
┌──────────────────────────┐
│ Image Moderation API     │  → block / flag / allow
└──────────────────────────┘

Offline (one-time / periodic): CSV ingest script →
normalize tags, derive borough from lat/long, drop expired
rows → seed `activities` table.
```

### Folder/module structure

```
/src
  /app
    /(auth)            # login, callback routes
    /spin              # today's quest + wheel
    /feed              # public feed
    /journal           # my completed quests
    /admin             # reported/flagged post review (gated)
    /api               # route handlers (moderation webhook, etc.)
  /components          # WheelSpinner, QuestCard, OptionCard, FeedPost, BadgeGrid
  /lib
    /supabase          # client + server clients
    /quests            # quest templates + matching rules
    /matcher           # options query + distance sort + date filter
    /gamification      # points, streak, badge logic
    /moderation        # moderation API wrapper
    /geo               # geolocation + borough-from-coords
  /db
    /migrations        # SQL schema
    /seed              # ingest-activities.ts (CSV → activities table)
  /data
    activities.csv     # the source feed (seed input, not served directly)
```

### Data flow (a daily spin, start to finish)

1. User opens `/spin`. Server checks for an existing `daily_quest` row for `(user, today)` in America/New_York. If present, return it (locked).
2. If none, server picks a quest template (weighted random, age-filtered for adults), creates the locked `daily_quest` row, returns it.
3. Client requests matching options. Server runs the matcher: rows where category tags overlap the template, `start_date >= today`, optionally within user's borough/radius; sorts by distance; returns top 2–4.
4. User marks done (± photo + caption). Server: writes `completion`, awards points, recomputes streak, checks badge unlocks.
5. If photo present and not marked private: upload to Storage → call moderation API → on `allow`, create `feed_post`; on `flag`, hold; on `block`, reject + handle CSAM path.

### External services / APIs

- Supabase (DB, auth, storage).
- Image moderation API.
- Browser Geolocation API.
- (Optional, Phase 3) a map tile provider for the map view.

## 6. Data Models

```
Entity: profiles            # extends Supabase auth.users
- id: uuid (PK, = auth.users.id)
- display_name: string, required
- avatar_url: string, nullable
- is_adult: boolean, default true        # drives age filtering of quests
- points: int, default 0
- current_streak: int, default 0
- longest_streak: int, default 0
- last_completion_date: date, nullable    # for streak math
- created_at: timestamp
Relationships: profile has many completions, has many feed_posts, has many user_badges
```

```
Entity: activities          # seeded from CSV, read-only at runtime
- id: bigint (PK, = source ObjectID)
- source: string                          # nypl, bkpl, psal, etc.
- title: string, required
- tags: string[]                          # NORMALIZED flat tags (indexed, GIN)
- start_date: timestamptz, nullable (indexed)
- end_date: timestamptz, nullable
- location_name: string, nullable
- address: string, nullable
- lat: double precision (indexed)
- lng: double precision (indexed)
- borough: string, nullable               # derived from lat/lng at ingest
- url: string                             # outbound link to official source
- min_age: int, nullable
- max_age: int, nullable
- icon: string, nullable
Indexes: GIN(tags), btree(start_date), btree(borough)
```

```
Entity: quest_templates     # hand-authored, ~20-40, can live in code or table
- id: string (PK, slug e.g. "free-outdoor-movie")
- title: string                           # "Catch a free outdoor movie"
- description: string
- icon: string
- match_tags: string[]                    # tags that map to activities
- adult_friendly: boolean                 # excludes kid-only quests from adults
- weight: int, default 1                  # spin probability weighting
```

```
Entity: daily_quests        # the locked quest-of-the-day
- id: uuid (PK)
- user_id: uuid (FK → profiles)
- quest_template_id: string (FK)
- quest_date: date                        # America/New_York
- spins_used: int, default 1
- created_at: timestamp
Constraints: UNIQUE(user_id, quest_date)
```

```
Entity: completions
- id: uuid (PK)
- user_id: uuid (FK → profiles)
- quest_template_id: string (FK)
- activity_id: bigint (FK → activities, nullable)   # the real option they did, if any
- photo_url: string, nullable
- caption: string, nullable
- is_private: boolean, default false
- completed_at: timestamp
Relationships: completion optionally has one feed_post
```

```
Entity: feed_posts          # only created for non-private completions WITH a photo that passed moderation
- id: uuid (PK)
- completion_id: uuid (FK, unique)
- user_id: uuid (FK → profiles)
- photo_url: string, required
- caption: string, nullable
- quest_title: string                     # denormalized for cheap feed reads
- location_name: string, nullable
- moderation_status: enum(allowed, flagged, blocked, removed)
- report_count: int, default 0
- created_at: timestamp (indexed desc)
```

```
Entity: badges              # static definitions
- id: string (PK, slug)
- name: string
- description: string
- icon: string
- rule_key: string                        # interpreted by gamification logic

Entity: user_badges
- user_id: uuid (FK)
- badge_id: string (FK)
- earned_at: timestamp
Constraints: UNIQUE(user_id, badge_id)
```

```
Entity: reports
- id: uuid (PK)
- feed_post_id: uuid (FK)
- reporter_id: uuid (FK)
- reason: string, nullable
- created_at: timestamp
Constraints: UNIQUE(feed_post_id, reporter_id)   # one report per user per post
```

**RLS:** profiles/completions/daily_quests readable+writable only by owner; feed_posts publicly readable when `moderation_status = allowed` and `report_count < threshold`; activities/quest_templates/badges public read; reports insert-only by authed users; admin role can read/update all.

## 7. Features & Requirements

### Feature: Auth (social login)

- **User story:** As a visitor, I want to sign in with Google or Apple so that I can save my progress and post.
- **Description:** OAuth via Supabase Auth. First sign-in prompts for a display name and an "I'm an adult" toggle, creating a `profiles` row.
- **UI/UX notes:** Single "Continue with Google / Apple" screen. Post-auth onboarding: display name + adult toggle + one-time explainer that photos post publicly.
- **Acceptance criteria:**
  - [ ] Given a new user completes OAuth, when they land, then a `profiles` row exists with their chosen display name.
  - [ ] Given a returning user, when they sign in, then their points/streak/journal load.
  - [ ] Edge case: OAuth cancelled → return to login with a non-blocking message.
  - [ ] Error handling: provider error → friendly retry, no stack trace leaked.
- **Dependencies:** none (build first).

### Feature: Daily spin + quest lock

- **User story:** As a user, I want one daily spin that lands on a quest so that I have a clear thing to do today.
- **Description:** Weighted-random selection from `quest_templates`, age-filtered, persisted per `(user, day)`.
- **UI/UX notes:** Animated wheel (framer-motion). After landing, quest card stays locked for the day. Re-roll button shows point cost when first free spin is used.
- **Acceptance criteria:**
  - [ ] Given no quest for today, when the user spins, then a `daily_quests` row is created and the result is shown.
  - [ ] Given a quest already exists for today, when the user reloads, then the same quest shows (no re-randomize).
  - [ ] Given the free spin is used, when the user re-rolls, then points are debited by the configured cost and `spins_used` increments; blocked if insufficient points.
  - [ ] Edge case: adult user never receives a kid-only quest (`adult_friendly = false`).
  - [ ] Day boundary computed in America/New_York, not UTC or browser TZ.
- **Dependencies:** Auth, quest_templates seeded.

### Feature: Real-options matcher

- **User story:** As a user, I want to see real nearby places that satisfy my quest so that I can actually go.
- **Description:** Query `activities` where `tags && template.match_tags` AND `start_date >= now()` (or evergreen), optionally within user's borough/radius; sort by distance; return top 2–4.
- **UI/UX notes:** Cards under the quest: title, location, address, date/time, distance, outbound link to official `url`. "Use my location" prompt with borough-picker fallback.
- **Acceptance criteria:**
  - [ ] Given a quest and a user location, when options load, then only non-expired, tag-matching rows appear, nearest first.
  - [ ] Given no location permission, when options load, then the user can pick a borough and still get results.
  - [ ] Edge case: zero matches → show the quest as evergreen ("just go do it") OR offer a free re-roll. Never show an empty broken state.
  - [ ] Error handling: matcher failure degrades to the quest with no options, not a crash.
- **Dependencies:** Daily spin, activities seeded.

### Feature: Completion + journal

- **User story:** As a user, I want to mark a quest done (optionally with a photo) so that I get credit and keep a record.
- **Description:** Writes a `completion`, awards points, updates streak, checks badges. Photo optional; honor-system completion allowed.
- **UI/UX notes:** "Mark done" → optional photo (camera/library) + caption + public/private toggle (default public). Journal = grid of past completions.
- **Acceptance criteria:**
  - [ ] Given the active quest, when the user marks done, then a `completion` exists and points increase.
  - [ ] Given a completion on a new consecutive day, when saved, then `current_streak` increments; a gap resets it.
  - [ ] Given a photo + public, when moderation passes, then a `feed_post` is created.
  - [ ] Edge case: completing twice in one day does not double the streak.
- **Dependencies:** Spin, matcher, gamification.

### Feature: Public feed + moderation

- **User story:** As a user, I want to see others' photos so that exploring feels social and I'm motivated to share.
- **Description:** Reverse-chron public stream of allowed photo posts. Auto image moderation on upload; report button; auto-hide past report threshold; admin review screen.
- **UI/UX notes:** Card: photo, display name, quest title, caption, location (optional), timestamp, report (⋯) action. Optional single 👍 reaction.
- **Acceptance criteria:**
  - [ ] Given a photo upload, when moderation returns `block`, then it never becomes a public post and the CSAM-handling path runs if so classified.
  - [ ] Given an allowed post, when any user reports it, then `report_count` increments (one per user); at threshold the post auto-hides pending admin review.
  - [ ] Given the admin screen, when an admin removes a post, then it disappears from the feed and the user can be banned.
  - [ ] Rate limit: a user cannot create more than N posts/day (default 10).
- **Dependencies:** Completion, Storage, moderation API.

### Feature: Gamification (points, streaks, badges)

- **User story:** As a user, I want points, streaks, and badges so that I keep coming back.
- **Description:** Points per completion (+ photo bonus + streak-milestone bonus). Streak = consecutive days with ≥1 completion. ~10–15 badges (breadth + milestones).
- **Acceptance criteria:**
  - [ ] Given a completion, when saved, then points increase by the configured amount.
  - [ ] Given a badge rule is satisfied, when re-evaluated, then a `user_badges` row is created exactly once.
  - [ ] Edge case: badge never awarded twice (unique constraint).
- **Dependencies:** Completion.

## 8. API / Interface Contracts

> Implemented as Next.js server actions / route handlers. Auth required unless noted.

```
POST /api/spin
Request:  {}                              # day + user derived server-side
Response: 200 { questTemplate, dailyQuestId, spinsUsed } | 4xx { error }
Auth:     required

POST /api/spin/reroll
Request:  {}
Response: 200 { questTemplate, pointsRemaining } | 402 { error: "insufficient_points" }
Auth:     required

GET  /api/options?questTemplateId=&lat=&lng=&borough=
Response: 200 { options: Activity[] }     # 0-4 items, distance-sorted
Auth:     required

POST /api/completions
Request:  { questTemplateId, activityId?, photo?(multipart), caption?, isPrivate }
Response: 201 { completion, pointsAwarded, streak, newBadges[] } | 4xx { error }
Auth:     required

GET  /api/feed?cursor=
Response: 200 { posts: FeedPost[], nextCursor }   # allowed posts only
Auth:     public (read)

POST /api/feed/:id/report
Request:  { reason? }
Response: 200 { reported: true } | 409 { error: "already_reported" }
Auth:     required

POST /api/admin/feed/:id/remove
Request:  { ban?: boolean }
Response: 200 { removed: true } | 403
Auth:     admin only
```

## 9. UI / Design

- **Pages/screens:** Login, Onboarding, Spin (home), Quest+Options detail, Mark-done modal, Feed, Journal, Profile (points/streak/badges), Admin.
- **Navigation flow:** Bottom tab bar (mobile-first): **Spin · Feed · Journal · Profile**. Admin is a hidden gated route.
- **Design system:** `❓ NEEDS DECISION:` default to a bright, summery palette (warm sun/coral + sky blue accents), large rounded cards, one display font for quest titles + a clean sans for body. Tailwind tokens; reuse the official summer page's energetic tone without copying its assets.
- **Responsive / accessibility:** Mobile-first; must work one-handed on a phone. WCAG AA contrast; all interactive elements keyboard-reachable and labeled; respect `prefers-reduced-motion` for the wheel.
- **Reference inspiration:** NYC's "Summer of Possibility" page (tone, not assets); BeReal/Strava-style activity feeds; gamified habit apps for the spin + streak feel.

## 10. Conventions & Constraints

- **Code style:** ESLint + Prettier, TypeScript strict mode. Components PascalCase, hooks `useX`, server utilities camelCase.
- **Patterns to follow:** All data access through `/lib` service modules (never raw Supabase calls in components). Server-only secrets never imported into client components. Validate every external input with zod (API inputs AND CSV ingest rows).
- **Patterns to avoid:** No business logic in components. No trusting client-supplied user IDs (always derive from session). No serving `activities.csv` directly — it's a seed only. Never store the service-role key client-side.
- **Performance budgets:** Feed first paint < 2s on 4G; feed images lazy-loaded + thumbnailed; matcher query < 200ms (rely on tag GIN index + date index).
- **Security:** RLS on every user-owned table. Moderation runs server-side before any photo is public. Rate-limit posting and reporting. CSAM detection + reporting obligation is a hard requirement, not optional.

## 11. Testing Strategy

- **What to test:**
  - Unit: streak math (consecutive/gap/same-day), point calc, badge rules, borough-from-coords, tag normalization, distance sort.
  - Integration: spin lock (one quest/day), matcher filters out expired rows, moderation gates feed creation, report threshold auto-hides.
  - E2E (happy path): login → spin → see options → mark done with photo → appears in feed.
- **Framework:** Vitest (unit/integration) + Playwright (e2e).
- **Definition of done per feature:** acceptance criteria in §7 pass as automated tests; streak and moderation logic require explicit edge-case tests.

## 12. Build Plan (Phased)

- **Phase 0 — Setup:** Next.js + TS + Tailwind + Supabase project, env wired, "hello world" deploys to Vercel. Schema migrations applied.
- **Phase 0.5 — Data prep:** `ingest-activities.ts` — parse CSV, normalize categories → flat tags, derive borough from lat/lng, drop/flag expired rows, seed `activities`. Author the ~20–40 `quest_templates` + match rules.
- **Phase 1 — Core loop (no social):** Auth + onboarding, daily spin + lock + re-roll, options matcher, mark-done (photo optional), points + streak, journal. Shippable to yourself.
- **Phase 2 — Social + moderation:** Photo upload to Storage, moderation gate, public feed, report button + auto-hide, admin review screen, rate limits. **Do not ship the feed before moderation works.**
- **Phase 3 — Polish for spread:** Badges, exportable share-cards (often a bigger virality driver than the in-app feed), optional map view of options, reactions, end-of-season screen.

> Stop for review between phases.

## 13. Open Questions & Decisions Log

| Question | Options | Decision | Date |
|----------|---------|----------|------|
| Photo-optional vs proof | Honor system / require photo / require check-in | Honor system (photo optional) — points are "soft", accepted for v1 | 2026-06-02 |
| Public-by-default vs opt-in posting | Default public / default private | Default public WITH per-post toggle + one-time explainer | 2026-06-02 |
| Re-roll economics | Cosmetic cost / gate on photo completions | `❓ NEEDS DECISION:` start at 50 pts flat; revisit if gamed | open |
| Anonymity vs real names | Real name / handle only | `❓ NEEDS DECISION:` display name (handle) shown, real name never public | open |
| Geofencing completion | Require proximity / trust user | Trust user for v1 (far simpler) | 2026-06-02 |
| End-of-season (Aug 1) behavior | Freeze feed / archive / "see you next summer" | `❓ NEEDS DECISION:` freeze feed as read-only memory + farewell screen | open |
| BaaS choice | Supabase / Firebase | Supabase (Postgres + tag arrays + RLS fit this data) | 2026-06-02 |
| Moderation provider | which API | `❓ NEEDS DECISION:` pick a managed vision-moderation API with CSAM coverage before Phase 2 | open |

## 14. Setup & Run Instructions

```bash
# 1. Clone & install
git clone <repo> && cd summer-quest-nyc
pnpm install

# 2. Configure environment
cp .env.example .env.local      # fill in Supabase, OAuth, moderation keys

# 3. Database
#    - create a Supabase project, paste URL + keys into .env.local
pnpm db:migrate                 # applies /src/db/migrations
pnpm db:seed                    # runs ingest-activities.ts + quest_templates + badges

# 4. Run locally
pnpm dev                        # http://localhost:3000

# 5. Tests
pnpm test                       # vitest
pnpm test:e2e                   # playwright

# 6. Deploy
#    push to main → Vercel auto-deploys; set the same env vars in Vercel project settings
```

The coding agent should generate a matching `README.md` from this section and keep `.env.example` in sync with §4's env list.

-----

## Agent Working Agreement

- Build phase by phase (Section 12); don't jump ahead. Stop for review between phases.
- If a requirement is ambiguous, check Section 13, then make a documented assumption rather than stalling.
- Match the conventions in Section 10 exactly — service-layer data access, zod validation, no secrets client-side.
- Every feature is done only when its acceptance criteria (Section 7) pass as automated tests.
- Treat moderation (Section 8 feature + §10 security) as a hard gate: no user photo becomes public before it passes moderation, and the CSAM path is mandatory.
- Keep a running changelog of files created/modified.
