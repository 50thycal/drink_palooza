# 🍸 Drink Palooza — Product Spec

A private, mobile-first app for a group of friends who each make a cocktail,
present it to the group, and get scored. At the end, a Spotify-Wrapped-style
reveal crowns the winners. A Hall of Fame keeps the results across events
(roughly four a year, often fewer).

Built on the same foundation as [MovieTime](https://github.com/50thycal/movietime).

---

## Decisions log

| # | Decision | Status |
|---|----------|--------|
| 1 | **Score scale: 1–10**, entered with a slider per category (whole numbers) | ✅ decided |
| 2 | **Presentation order is random.** The server shuffles once, saves the order, and every phone plays the same reveal animation. Re-rolls are allowed until the first presentation starts; late joiners go to the end. | ✅ decided |
| 3 | **Advancing to the next presenter:** the presenter taps "Done presenting". The host can override if someone wanders off. | ⚙️ default (change if wanted) |
| 4 | **Taste counts double** in the overall: `overall = (2·Taste + Appearance + Creativity + Presentation) / 5` | ✅ decided |
| 5 | Categories: **Taste, Appearance, Creativity** (creativity and originality are one category), **Presentation** (how you pitch and serve it to the group) | ✅ decided |
| 6 | **Secret ingredient / theme challenge**: an *optional* event setting, **off** for the first event. Built later. | ✅ decided — later phase |
| 7 | ~~Prep planner / shared shopping list~~ | ❌ dropped |
| 8 | **Hall of Fame**: yes. **Seasons**: no, because each event stands on its own. | ✅ decided |
| 9 | **Visual theme: bar.** The direction is being brainstormed (see "Theme" below). | 🟡 in progress |
| 10 | No rating your own drink (enforced on the server) | ✅ decided |
| 11 | Scores stay hidden until Wrapped. Comments and reactions are visible live. | ✅ decided |
| 12 | Scores stay editable until Wrapped starts, with a "My scores" side-by-side view to recalibrate and counter order bias | ⚙️ default |

---

## Stack (mirrors MovieTime)

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 App Router + React 19 + TypeScript |
| Styling | Tailwind CSS v4, with design tokens in `app/globals.css` |
| Data | Postgres (Neon) via `@neondatabase/serverless`; idempotent schema created lazily on cold start |
| Photos | Vercel Blob, uploaded directly from the client after resizing in the browser (~1600px JPEG, which also converts HEIC) |
| Sync | SWR. A 2s poll of `/api/live?since=` on the live screen; 8s polls everywhere else |
| Identity | No password. Tap your name or "+ I'm new"; the phone remembers you in `localStorage` (the only local state); switch from Settings |
| Tests | `node --test` + PGlite running the full lifecycle in-process |
| Host | Vercel |

## Event lifecycle

```
LOBBY ──randomize──▶ ORDER SET ──start──▶ LIVE (presenter 1 → … → N) ──▶ WRAPPED ──▶ COMPLETE
 join, prep drink     re-roll ok          rate · notes · comments · 🍋🔥      host-driven, phones in sync   → catalog + Hall of Fame
```

## Data model (draft)

```
members              id, name, emoji, color
events               id, name, date, host_id, status, current_drink_id, wrap_slide, options jsonb (theme/secret ingredient)
event_participants   event_id, member_id, position
categories           event_id, key, label, description, weight, position     (Taste weight = 2)
drinks               event_id, member_id, name, story, glass, garnish, ingredients jsonb [{amount,unit,item}], method,
                     status (upcoming|presenting|done), started_at, ended_at
photos               drink_id, uploader_id, blob_url, width, height, is_hero
scores               drink_id, member_id, category_id, score 1–10     UNIQUE(drink_id, member_id, category_id)
notes                drink_id, member_id, text                         private to the author
comments             drink_id, member_id, text, created_at
reactions            drink_id, member_id, emoji, created_at
settings             key/value jsonb
```

## Wrapped (end-of-event reveal)

The slides advance in sync on every phone; the host taps to continue.

1. Intro: number of drinks, comments, and the most-used emoji
2. Category winners: Taste, Appearance, Creativity, Presentation (3rd → 2nd → 1st)
3. Superlatives: Harshest Critic, Most Generous, Most Divisive Drink (largest score spread), Crowd Favorite (most reactions), Chatterbox
4. 🏆 Overall Champion, with confetti and a shareable image card

Tie-break: higher Taste, then more ratings received. An optional "fair mode"
normalizes each person's scores against their own average, so you can compare raw and fair winners.

## Hall of Fame

All-time champions by event, the best drink ever in each category, a
champion's belt (the reigning winner holds it), head-to-head records,
personal bests, and the highest single score ever.

## Screens

Home · Lobby (randomizer) · Live · Wrapped · Catalog (photo grid, filter by
person/spirit/ingredient, sort by score) · Drink page · Hall of Fame · Settings

## Build phases

1. Scaffold from MovieTime infra → identity, events, lobby, randomizer
2. Live screen: scoring, private notes, "waiting on…"
3. Photos (Blob), recipe entry, catalog
4. Comments + reactions
5. Wrapped
6. Hall of Fame
7. (Later) Theme / secret ingredient option

## Theme

A bar. See the brainstorm in the conversation. The chosen direction will be recorded here.
