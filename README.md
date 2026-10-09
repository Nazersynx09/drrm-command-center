# DRRM Command Center

Executive dashboard for the Iloilo Provincial DRRM Office: live incident figures from SITREPs, an
affected-area map, and external PAGASA / GDACS advisories.

## Stack

Next.js (App Router), React, Tailwind CSS v4, Prisma + PostgreSQL.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL and optionally PAGASA_API_TOKEN
npx prisma generate
npm run dev
```

## Project layout

```
app/
  page.tsx                    # renders <Dashboard />
  api/dashboard/{summary,incidents,map}/route.ts
  api/advisories/route.ts
components/dashboard/         # Dashboard (client shell), Header, ScorecardRow, MapPanel,
                              # LiveMap, AdvisoryPanel, IncidentStream, DetailModals, Modal
hooks/useDashboardData.ts     # fetches and polls the API every 30 s
lib/
  dashboard/queries.ts        # Prisma queries (server only)
  dashboard/types.ts          # response types shared with the client
  advisories/                 # PAGASA and GDACS adapters + aggregator
  format.ts  theme.ts         # formatting helpers, light/dark class tokens
  prisma.ts                   # Prisma client singleton
prisma/schema.prisma
data/                         # source GIS files, not served
```

## API

- `GET /api/dashboard/summary`
- `GET /api/dashboard/incidents?limit=50`
- `GET /api/dashboard/map`
- `GET /api/advisories`

## Scripts

`npm run dev`, `build`, `lint`, `typecheck`, `format`, `format:check`

## Data notes

Internal figures come from PostgreSQL via Prisma. PAGASA and GDACS advisories are fetched at request
time and are not stored. The schema has no "Missing" casualty status and no evacuation-center model, so
the dashboard reports barangay-level evacuation data only.
