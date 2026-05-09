<<<<<<< HEAD
# Hackathon
=======
# Marketplace AI Agent MVP

Chat-based requirement collection app for marketplace products using OpenAI.

## Features

- User-friendly chat interface for product requirement intake
- Limited/allowed products controlled from a config file
- Product-specific instruction context for the AI agent
- Requirement completion in 3 sections:
  - `characteristics`
  - `logoSpecifications`
  - `packingSpecifications`
- Save finalized requirement JSON as one row in PostgreSQL

## Stack

- Next.js (App Router) + TypeScript
- OpenAI SDK (`gpt-4o-mini` by default, configurable via env)
- PostgreSQL (Neon-compatible) via Prisma
- Zod for schema validation

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
cp .env.example .env.local
```

3. Update `.env.local`:

```env
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4o-mini
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require&pgbouncer=true
DIRECT_URL=postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require
```

4. Run Prisma setup:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

5. Start app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How it works

1. User selects an allowed product.
2. User chats with the AI agent.
3. Agent gathers complete details for all required sections.
4. Agent outputs finalized JSON.
5. Finalized `requirements.json` is auto-saved as a single database row.

## Vercel + Neon deployment

1. Create a Neon Postgres database.
2. In Vercel Project Settings -> Environment Variables, add:
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL` (optional)
   - `DATABASE_URL` (pooled Neon URL)
   - `DIRECT_URL` (direct Neon URL)
3. Run Prisma migration against Neon (locally or CI):

```bash
npx prisma migrate deploy
```

4. Deploy to Vercel.

## Important files

- `src/config/products.ts` - allowed products and system context
- `src/app/api/chat/route.ts` - OpenAI streaming integration
- `src/app/api/requirements/route.ts` - requirement validation + DB persistence
- `src/lib/schemas.ts` - finalized requirement schema
>>>>>>> 40f3d6f (initialize project)
