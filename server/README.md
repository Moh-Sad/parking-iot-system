# Parking IoT — Backend

Node.js + Express + TypeScript + Prisma (Postgres). Powers the Next.js client in `../client`.

## Quick start

```bash
# 1. Start Postgres + MailHog
cd ..
docker compose up -d

# 2. Install
cd server
pnpm install

# 3. Configure env
cp .env.example .env

# 4. Run migrations + seed
pnpm prisma:migrate
pnpm prisma:seed

# 5. Dev
pnpm dev
```

Server: http://localhost:4000
MailHog UI: http://localhost:8025

## Seed credentials

- Admin: `admin@parking-iot.local` / `Admin123!`
- Supervisors: `elena@parking-iot.local`, `kenji@parking-iot.local` / `Super123!`
- Invited supervisor: `invited@parking-iot.local` (must complete profile)

## Scripts

- `pnpm dev` — watch mode (tsx)
- `pnpm build` — compile to `dist/`
- `pnpm start` — run compiled server
- `pnpm prisma:migrate` — run dev migrations
- `pnpm prisma:seed` — seed demo data
- `pnpm prisma:studio` — Prisma Studio
- `pnpm db:reset` — drop and recreate DB
- `pnpm test` — vitest

## API base

`http://localhost:4000/api/v1`

See the plan file at `../.claude/plans/hi-there-we-will-shiny-crescent.md` for the full endpoint contract.
