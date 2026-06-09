# ⚽ World Cup Legends Draft

A browser-based fantasy draft app where you pick a formation, fill 11 position slots from real World Cup player cards, and share your completed squad via a URL. No accounts, no installs — just pick and share.

## What it does

- Choose a formation (4-3-3, 4-4-2, 4-2-3-1, 3-4-3, 3-5-2)
- Search and draft real players from every men's World Cup (1930–2022)
- Each player has a precomputed rating based on goals, appearances, tournament finishes, and awards (Golden Ball, Golden Boot, Golden Glove, Best Young Player)
- Share your completed squad as a read-only URL (base64 encoded)
- Browse the full player database filtered by tournament, team, and position

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router, RSC) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Database | Turso (libSQL / SQLite) |
| Fonts | Anybody · Hanken Grotesk (Google Fonts) |

## Routes

| Route | Description |
|-------|-------------|
| `/` | Formation selector with animated flag scene |
| `/draft?formation=<id>` | Interactive pitch — search players, fill slots, share squad |
| `/players?tournament=&team=&position=&search=` | Player database browser |
| `/view?d=<base64>` | Read-only shared squad view |
| `/api/players` | JSON API for draft slot player search |

## Database

Player data sourced from [jfjelstul/worldcup](https://github.com/jfjelstul/worldcup) — all 30 men's tournaments from 1930 to 2022, hosted on Turso.

A `player_ratings` table stores precomputed ratings so queries are fast indexed lookups rather than full table scans at request time.

### Rating formula

```
base 62
+ goals × weight by position (capped at 21)
+ team finish bonus scaled by participation (champion → +9, finalist → +6, top 4 → +4, QF → +2)
+ penalty shootout contributions (capped at 3)
+ defensive stats for GK/DF (clean sheets, knockout clean sheets)
+ upset wins (capped at 8)
+ awards × 8 (Golden Ball, Golden Boot, Golden Glove, Best Young Player)
→ clamped to [62, 99]
```

## Setup

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local` with your Turso credentials:
   ```
   TURSO_DATABASE_URL=libsql://your-db.turso.io
   TURSO_AUTH_TOKEN=your-token
   ```

3. Seed the ratings table (one-time):
   ```bash
   npm run seed-ratings
   ```

4. Run the dev server:
   ```bash
   npm run dev
   ```
