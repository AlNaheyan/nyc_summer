# Summer Quest NYC

A seasonal web app that gives you one real, doable NYC summer activity each day.
Spin for a quest, see real nearby options, mark it done (optionally with a
photo), and share it to a public feed.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Supabase (Postgres, Auth, Storage)

## Getting started

```bash
pnpm install
cp .env.example .env.local   # fill in your keys
pnpm db:migrate
pnpm dev                     # http://localhost:3000
```
