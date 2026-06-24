# Munda

AI crop advisory platform for Zimbabwean smallholder farmers and agricultural extension workers. Farmers describe their crop conditions in plain language and get instant agronomic recommendations, disease diagnosis, and yield guidance powered by the Anthropic Claude API.

**Live demo:** https://munda-eight.vercel.app

## How it works

Each advisory request goes through a structured Claude call with a typed JSON response schema covering diagnosis, recommended actions, expected yield impact, and urgency level. The response schema is enforced at the TypeScript layer — Claude returns structured data, not free text, so every field is type-safe and testable.

Multi-tenant data model with row-level security in PostgreSQL. Each farmer or extension worker only sees their own records and advisory history.

## Stack

| | |
|---|---|
| Framework | Next.js 16, TypeScript strict mode |
| Database | PostgreSQL via Supabase |
| ORM | Drizzle ORM |
| Auth | Supabase Auth + row-level security |
| AI | Anthropic Claude API with typed JSON response parsing |
| Testing | 170 passing tests |

## Run locally

```bash
git clone https://github.com/anesuruzvidzo1/munda.git
cd munda
cp .env.example .env.local
bun install
bun run dev
```

Set these in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=...
ANTHROPIC_API_KEY=sk-ant-...
```

## Built by

[Anesu Ruzvidzo](https://github.com/anesuruzvidzo1)
