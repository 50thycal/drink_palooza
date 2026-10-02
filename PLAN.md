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
| 9 | **Visual theme: Art Deco Prohibition speakeasy.** Camera-driven scenes: bar top → bartenders → neon wall (see "Theme" below) | ✅ decided |
| 10 | No rating your own drink (enforced on the server) | ✅ decided |
| 11 | Scores stay hidden until Wrapped. Comments and reactions are visible live. | ✅ decided |
| 12 | Scores stay editable until Wrapped starts, with a "My scores" side-by-side view to recalibrate and counter order bias | ⚙️ default |
| 13 | **Scoring is pouring.** One glass per category; empty glass = 1, full glass = 10. Hold to pour, swipe up/down to adjust, tap Next to move on (no auto-advance) | ✅ decided |
| 14 | **Presenter soundboard** with 6 sounds: womp womp, rimshot, applause, rap air horn, drumroll, explosion. Optional real recordings in `public/sounds/` | ✅ decided |
| 15 | **Hosting: Vercel**; everyone plays on their own phone (portrait, mobile-first) | ✅ decided |
| 17 | **Seating map + flick-to-pass napkins** (private, direction from your real seat); **social chalkboard**; **the bar remembers** (rings, champion caps, overheard napkin, the tab) | ✅ built |
| 16 | After the last presenter, a **"Last Call"** state lets everyone finish or adjust scores; then the host starts the reveal | ⚙️ default |

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
drinks               event_id, member_id, name, story, glass, garnish, ingredients jsonb [{amount,unit,item}], method,
                     status (upcoming|presenting|done), started_at, ended_at
photos               drink_id, uploader_id, blob_url, width, height, is_hero
scores               drink_id, member_id, category, score 1–10        PK(drink_id, member_id, category)
                     (categories + weights live in lib/constants.ts; Taste weight = 2)
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

## Status

Phases 1–6 are built (see README). Remaining: the optional theme / secret-ingredient mode (phase 7).

## Theme — "The Gilded Pour" (Art Deco Prohibition speakeasy)

Great Gatsby / 1920s speakeasy. The app is one continuous **place**, not a
stack of pages. Every navigation is a **camera move** through that place, so
moving around always tells you where you are.

### The world map (camera positions)

```
                 ┌──────────────────────────────┐
                 │  THE NEON WALL  (back wall)   │   Hall of Fame · Presenter stage · Wrapped
                 └──────────────▲───────────────┘
                                │  pan up, past the bartenders
                 ┌──────────────┴───────────────┐
                 │  THE BARTENDERS (eye level)   │   Mabel & Jasper: who's drinking, join, order, start
                 └──────────────▲───────────────┘
                                │  tilt up from the bar
 ┌───────────────┐  slide  ┌────┴─────────────────────────┐
 │ THE RECIPE    │◀────────│  THE BAR TOP  (looking down)  │   HOME. Scroll the bar; coasters are the menu
 │ BOOK (catalog)│         │  ○ Tonight's Palooza           │
 └───────────────┘         │  ○ Hall of Fame                │
                           │  ○ The Recipe Book             │
                           │  ○ Settings (coaster flips)    │
                           └────┬─────────────────────────┘
                                │  tilt down to your spot at the bar
                           ┌────┴─────────────────────────┐
                           │  THE POUR STATION             │   Watchers score the drink being presented
                           └──────────────────────────────┘
```

| Move | Camera | Feel |
|------|--------|------|
| Bar → Bartenders | **Tilt up** (rotateX from looking down to eye level) | You look up from your drink to order |
| Bartenders → Neon Wall | **Pan up** past the bartenders' heads | The wall lights up |
| Bar → Hall of Fame | Tilt up + pan up in one move | |
| Bar → Recipe Book | **Slide** along the bar to the leather-bound book at the far end | |
| Bar → Settings | The coaster **flips over** | |
| Any → back | The same move reversed. The phone's back gesture also works. | |

### Scenes

**The Bar Top (home).** A long mahogany bar seen from above, with a brass rail,
ring stains, a scattered bottle cap, and a lime wedge. Scroll down it. The
sections are **Art Deco coasters**:
- *Tonight's Palooza* (shows the event status live, e.g. "Sam is presenting")
- *Hall of Fame*
- *The Recipe Book*
- *Settings*

Tapping a coaster drives the camera there.

**The Bartenders.** Two illustrated Art Deco bartenders behind the bar:
- **Mabel**, a flapper: finger-wave bob, beaded headband with a feather, pearls.
- **Jasper**, a dapper gentleman: slicked hair, bow tie, vest, sleeve garters.

Each visit, one of them speaks ("What'll it be, Cal?"). The choices are a
cocktail-menu card, not a row of buttons: join tonight's palooza, shake up the
order, prep my drink (name, recipe, photo), start the show. First-time
sign-in also happens here ("Evening! Who's drinking tonight?").

**The Neon Wall.** The back-bar wall: dark wood, backlit bottle shelves,
and neon tubes in pink, teal, and gold.
- **Hall of Fame:** neon signs for the reigning champion (the belt), the best ever in each category, all-time wins.
- **Presenter stage:** when it's your turn, *your* camera pans up to the wall automatically.
  A neon "NOW SERVING" sign shows your name and drink, with the soundboard below and "Done presenting" at the bottom.
- **Wrapped:** each category winner's sign flickers on in turn, then the champion's sign buzzes to full brightness, with confetti.

**The Pour Station (scoring).** While someone presents, everyone else's camera
tilts down to their spot at the bar. There are four glasses, one per category,
and you swipe between them. Hold the **mixer bottle** to tilt and pour; the
liquid level is the score. Empty = 1, full to the rim = 10, and it snaps to
whole numbers. Drag the glass level to fine-tune.

| Category | Glass | Character |
|----------|-------|-----------|
| **Taste** (×2) | **The Stoic**: a heavy rocks glass, one big clear cube, amber pour | Serious, no nonsense. Counts double, marked with a ×2 medallion |
| **Appearance** | **The Showpiece**: a gold-rimmed coupe, rose-pink, a cherry on a pick | The fanciest glass on the bar |
| **Creativity** | **The Wild Card**: a curvy hurricane glass, emerald, a paper umbrella | Unexpected |
| **Presentation** | **The Showstopper**: a champagne flute, rising gold bubbles | **A sparkler ignites at 10** |

Docked at the bottom: the **bar tray**, a rubber bar mat that stays put while
the glass gets the rest of the screen. Its top row is the emoji reactions
(they float up on every phone); under that, napkins (comments), a private
notepad, a photo button and the chalkboard. The glass is sized to whatever
height is left, so pouring, adjusting and Next never need a scroll. The
presenter's stage uses the same tray with the soundboard and "Done
presenting" on top and the recipe editor in place of notes.

**Now Serving ribbon.** Anyone who wanders off mid-show (the bar, the book,
the hall) gets a thin neon ribbon pinned to the top of the screen: who's
presenting, how many have poured, how many of your glasses are left. Tap it
to go straight back.

**Lobby stools.** Under the palooza name in the lobby, every participant
sits on a bar stool with a recipe pip and a photo pip, plus "N of M ready"
and whether the table's been seated. After your first visit the bartenders
shrink to a compact strip so the menu is in reach (tap them to grow back).

**The Soundboard (presenter only).** Five sounds synthesized in the browser
with Web Audio (no audio files, no licensing):

| Button | Sound | Emotion |
|--------|-------|---------|
| 🎺 | Womp womp (sad trombone) | Sad |
| 🥁 | Ba-dum-tss (rimshot) | Joke landed |
| 👏 | Applause | Happy |
| 📯 | Air horn | Hype |
| 🪘 | Drumroll + cymbal | Suspense / the big reveal |

The sound plays on the presenter's phone (it's in the room). It also posts
a matching emoji to the reaction stream, so everyone sees it.

### Art Deco design system

| Token | Value | Use |
|-------|-------|-----|
| Onyx | `#0d0b09` | Background |
| Mahogany | `#4a2416 → #2a130b` | Bar top wood |
| Gold | `#d4af37`, champagne `#e9d7a5` | Linework, borders, headings |
| Emerald | `#0f3d33` | Panels, menu cards |
| Cream | `#f4ead5` | Paper (menus, napkins, recipe pages) |
| Oxblood | `#6d1f2a` | Accents |
| Neon pink / teal / amber | `#ff4fa3` / `#3ff2e0` / `#ffb547` | Neon signs (glow via layered text-shadow) |

- **Fonts:** *Limelight* (display), *Poiret One* (deco labels), *Josefin Sans* (body), *Neonderthaw* (neon signs), *Caveat* (chalk). All OFL, self-hosted from `app/fonts/` via `next/font/local`, so there's no flash of fallback fonts on a slow bar Wi-Fi.
- **Motifs:** sunburst fans, stepped chevrons, double-rule gold frames, a keystone diamond on dividers.

### Technical approach
- **Single-page app.** Scenes are routed by hash, so the browser back button works and a drink page can be deep-linked.
- **`SceneStage`** decides the camera move from the two scenes' world positions (up/down/side/flip) and animates with `motion`, using CSS 3D transforms and perspective. No WebGL.
- **Art** is hand-built inline SVG: bartenders, glasses, the shaker, coasters, neon. That means no image downloads, it stays crisp on every screen, and the liquid level is just an SVG clip.
- **Tilt** to slosh the liquid uses DeviceOrientation, behind a one-time "step up to the bar" permission tap on iOS. The app works fine without it.
- **Respects `prefers-reduced-motion`:** camera moves become crossfades.
