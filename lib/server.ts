import { randomInt } from "node:crypto";
import { CATEGORY_KEYS, MEMBER_COLORS, MEMBER_EMOJIS, REACTION_WINDOW_SEC, type CategoryKey } from "./constants";
import type { Sql } from "./db";
import { BadRequest, Conflict, Forbidden, NotFound } from "./http";
import { eventResults, hallOfFame, shuffle, type DrinkInput } from "./scoring";
import type {
  CatalogEntry,
  Comment,
  Drink,
  DrinkDetail,
  DrinkSummary,
  EventResults,
  HallOfFame,
  HomeState,
  Ingredient,
  LiveEvent,
  Member,
  PaloozaEvent,
  Participant,
  Photo,
  Reaction,
  Score,
  ScoreMap,
} from "./types";

// ---------------------------------------------------------------------------
// Members
// ---------------------------------------------------------------------------

export async function listMembers(sql: Sql): Promise<Member[]> {
  return (await sql`SELECT * FROM members ORDER BY created_at`) as Member[];
}

export async function createMember(sql: Sql, name: string, emoji?: string | null): Promise<Member> {
  const existing = await sql`SELECT * FROM members WHERE lower(name) = lower(${name})`;
  if (existing.length) return existing[0] as Member; // "I'm new" on a second phone just signs in
  const [{ n }] = (await sql`SELECT count(*)::int AS n FROM members`) as { n: number }[];
  const rows = await sql`INSERT INTO members (name, emoji, color)
    VALUES (${name}, ${emoji || MEMBER_EMOJIS[n % MEMBER_EMOJIS.length]}, ${MEMBER_COLORS[n % MEMBER_COLORS.length]}) RETURNING *`;
  return rows[0] as Member;
}

export async function updateMember(sql: Sql, id: string, me: string, patch: { name?: string | null; emoji?: string | null }) {
  if (id !== me) throw new Forbidden("You can only edit yourself");
  const rows = await sql`UPDATE members SET
      name = COALESCE(${patch.name ?? null}, name),
      emoji = COALESCE(${patch.emoji ?? null}, emoji)
    WHERE id = ${id} RETURNING *`;
  if (!rows.length) throw new NotFound("No such person");
  return rows[0] as Member;
}

async function requireMember(sql: Sql, id: string) {
  const rows = await sql`SELECT id FROM members WHERE id = ${id}`;
  if (!rows.length) throw new BadRequest("Pick who you are first", 401);
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export async function openEvent(sql: Sql): Promise<PaloozaEvent | null> {
  const rows = await sql`SELECT * FROM events WHERE status <> 'complete' LIMIT 1`;
  return (rows[0] as PaloozaEvent) ?? null;
}

async function getEvent(sql: Sql, id: string): Promise<PaloozaEvent> {
  const rows = await sql`SELECT * FROM events WHERE id = ${id}`;
  if (!rows.length) throw new NotFound("No such palooza");
  return rows[0] as PaloozaEvent;
}

async function participants(sql: Sql, eventId: string): Promise<Participant[]> {
  return (await sql`SELECT member_id, position, joined_at FROM event_participants WHERE event_id = ${eventId}
    ORDER BY position NULLS LAST, joined_at`) as Participant[];
}

async function requireParticipant(sql: Sql, eventId: string, me: string) {
  const rows = await sql`SELECT 1 FROM event_participants WHERE event_id = ${eventId} AND member_id = ${me}`;
  if (!rows.length) throw new Forbidden("Join the palooza first");
}

function requireHost(event: PaloozaEvent, me: string) {
  if (event.host_id !== me) throw new Forbidden("Only the host can do that");
}

export async function createEvent(sql: Sql, me: string, name: string): Promise<PaloozaEvent> {
  await requireMember(sql, me);
  if (await openEvent(sql)) throw new Conflict("A palooza is already open — join that one");
  const rows = await sql`INSERT INTO events (name, host_id) VALUES (${name}, ${me}) RETURNING *`;
  const event = rows[0] as PaloozaEvent;
  await joinEvent(sql, event.id, me);
  return event;
}

export async function joinEvent(sql: Sql, eventId: string, me: string) {
  await requireMember(sql, me);
  const event = await getEvent(sql, eventId);
  if (event.status !== "lobby" && event.status !== "live") throw new Conflict("This palooza isn't taking new bartenders");
  // Late arrivals go to the back of the line once the order is set.
  await sql`INSERT INTO event_participants (event_id, member_id, position)
    VALUES (${eventId}, ${me}, CASE WHEN ${event.order_set} THEN
      (SELECT COALESCE(max(position), 0) + 1 FROM event_participants WHERE event_id = ${eventId}) ELSE NULL END)
    ON CONFLICT DO NOTHING`;
  await sql`INSERT INTO drinks (event_id, member_id) VALUES (${eventId}, ${me}) ON CONFLICT DO NOTHING`;
}

export async function leaveEvent(sql: Sql, eventId: string, me: string) {
  const event = await getEvent(sql, eventId);
  if (event.status !== "lobby") throw new Conflict("The show has started — you're in it now");
  await sql`DELETE FROM drinks WHERE event_id = ${eventId} AND member_id = ${me}`;
  await sql`DELETE FROM event_participants WHERE event_id = ${eventId} AND member_id = ${me}`;
  if (event.host_id === me) {
    const next = await participants(sql, eventId);
    if (!next.length) await sql`DELETE FROM events WHERE id = ${eventId}`;
    else await sql`UPDATE events SET host_id = ${next[0].member_id} WHERE id = ${eventId}`;
  }
}

export async function shuffleOrder(sql: Sql, eventId: string, me: string, random: () => number = () => randomInt(0, 2 ** 32) / 2 ** 32) {
  const event = await getEvent(sql, eventId);
  if (event.status !== "lobby") throw new Conflict("The order is locked once the show starts");
  await requireParticipant(sql, eventId, me);
  const people = shuffle((await participants(sql, eventId)).map((p) => p.member_id), random);
  for (const [i, id] of people.entries()) {
    await sql`UPDATE event_participants SET position = ${i + 1} WHERE event_id = ${eventId} AND member_id = ${id}`;
  }
  await sql`UPDATE events SET order_set = true, order_version = order_version + 1 WHERE id = ${eventId}`;
}

/** The next drink to present: lowest position still upcoming. */
async function nextUpcoming(sql: Sql, eventId: string): Promise<Drink | null> {
  const rows = await sql`SELECT d.* FROM drinks d
    JOIN event_participants p ON p.event_id = d.event_id AND p.member_id = d.member_id
    WHERE d.event_id = ${eventId} AND d.status = 'upcoming'
    ORDER BY p.position NULLS LAST, p.joined_at LIMIT 1`;
  return (rows[0] as Drink) ?? null;
}

export async function startEvent(sql: Sql, eventId: string, me: string) {
  const event = await getEvent(sql, eventId);
  requireHost(event, me);
  if (event.status !== "lobby") throw new Conflict("The show already started");
  const people = await participants(sql, eventId);
  if (people.length < 2) throw new Conflict("You need at least two bartenders");
  if (!event.order_set) await shuffleOrder(sql, eventId, me);
  // Conditional update: a double tap can only start the show once.
  const started = await sql`UPDATE events SET status = 'live', started_at = now() WHERE id = ${eventId} AND status = 'lobby' RETURNING id`;
  if (!started.length) return;
  await putOnStage(sql, eventId);
}

async function putOnStage(sql: Sql, eventId: string) {
  const next = await nextUpcoming(sql, eventId);
  if (next) {
    await sql`UPDATE drinks SET status = 'presenting', started_at = now() WHERE id = ${next.id}`;
    await sql`UPDATE events SET current_drink_id = ${next.id} WHERE id = ${eventId}`;
  } else {
    await sql`UPDATE events SET status = 'lastcall', current_drink_id = NULL WHERE id = ${eventId} AND status = 'live'`;
  }
}

/** "Done presenting" — by the presenter, or the host if they've wandered off. */
export async function advance(sql: Sql, eventId: string, me: string, expectedDrinkId?: string | null) {
  const event = await getEvent(sql, eventId);
  if (event.status !== "live" || !event.current_drink_id) throw new Conflict("Nobody is presenting");
  // Two people tapping "next" at once must not skip a presenter.
  if (expectedDrinkId && expectedDrinkId !== event.current_drink_id) return;
  const [drink] = (await sql`SELECT * FROM drinks WHERE id = ${event.current_drink_id}`) as Drink[];
  if (drink.member_id !== me && event.host_id !== me) throw new Forbidden("Only the presenter or the host can move on");
  const done = await sql`UPDATE drinks SET status = 'done', ended_at = now() WHERE id = ${drink.id} AND status = 'presenting' RETURNING id`;
  if (!done.length) return;
  await putOnStage(sql, eventId);
}

export async function startReveal(sql: Sql, eventId: string, me: string) {
  const event = await getEvent(sql, eventId);
  requireHost(event, me);
  if (event.status !== "lastcall") throw new Conflict("Everyone has to present first");
  await sql`UPDATE events SET status = 'wrapped', wrapped_at = now(), wrap_slide = 0 WHERE id = ${eventId}`;
}

export async function setSlide(sql: Sql, eventId: string, me: string, slide: number) {
  const event = await getEvent(sql, eventId);
  requireHost(event, me);
  if (event.status !== "wrapped") throw new Conflict("The reveal hasn't started");
  if (!Number.isInteger(slide) || slide < 0 || slide > 50) throw new BadRequest("Bad slide");
  await sql`UPDATE events SET wrap_slide = ${slide} WHERE id = ${eventId}`;
}

export async function finishEvent(sql: Sql, eventId: string, me: string) {
  const event = await getEvent(sql, eventId);
  requireHost(event, me);
  if (event.status !== "wrapped") throw new Conflict("Do the reveal first");
  await sql`UPDATE events SET status = 'complete', completed_at = now() WHERE id = ${eventId}`;
}

export async function takeHost(sql: Sql, eventId: string, me: string) {
  const event = await getEvent(sql, eventId);
  if (event.status === "complete") throw new Conflict("That palooza is over");
  await requireParticipant(sql, eventId, me);
  await sql`UPDATE events SET host_id = ${me} WHERE id = ${eventId}`;
}

export async function cancelEvent(sql: Sql, eventId: string, me: string) {
  const event = await getEvent(sql, eventId);
  requireHost(event, me);
  if (event.status !== "lobby") throw new Conflict("Only a palooza that hasn't started can be cancelled");
  await sql`DELETE FROM events WHERE id = ${eventId}`;
}

// ---------------------------------------------------------------------------
// Drinks, recipes, photos
// ---------------------------------------------------------------------------

const HERO_URL = `COALESCE(
  (SELECT url FROM photos WHERE id = d.hero_photo_id),
  (SELECT url FROM photos WHERE drink_id = d.id ORDER BY created_at LIMIT 1))`;

async function drinkSummaries(sql: Sql, eventId: string): Promise<DrinkSummary[]> {
  return (await sql.query(
    `SELECT d.id, d.event_id, d.member_id, d.name, d.status, ${HERO_URL} AS hero_url,
       (jsonb_array_length(d.ingredients) > 0 OR d.method <> '') AS has_recipe
     FROM drinks d JOIN event_participants p ON p.event_id = d.event_id AND p.member_id = d.member_id
     WHERE d.event_id = $1 ORDER BY p.position NULLS LAST, p.joined_at`,
    [eventId],
  )) as DrinkSummary[];
}

async function getDrink(sql: Sql, id: string): Promise<Drink> {
  const rows = await sql`SELECT * FROM drinks WHERE id = ${id}`;
  if (!rows.length) throw new NotFound("No such drink");
  return rows[0] as Drink;
}

export interface DrinkPatch {
  name?: string | null;
  story?: string | null;
  glass?: string | null;
  garnish?: string | null;
  method?: string | null;
  ingredients?: Ingredient[] | null;
}

export function parseIngredients(value: unknown): Ingredient[] {
  if (!Array.isArray(value)) throw new BadRequest("ingredients must be a list");
  if (value.length > 25) throw new BadRequest("That's a lot of ingredients (25 max)");
  return value
    .map((x) => ({
      amount: String((x as Ingredient)?.amount ?? "").trim().slice(0, 30),
      item: String((x as Ingredient)?.item ?? "").trim().slice(0, 60),
    }))
    .filter((x) => x.item);
}

export async function updateDrink(sql: Sql, drinkId: string, me: string, patch: DrinkPatch): Promise<Drink> {
  const drink = await getDrink(sql, drinkId);
  if (drink.member_id !== me) throw new Forbidden("Only the bartender who made it can edit the recipe");
  const rows = await sql`UPDATE drinks SET
      name = COALESCE(${patch.name ?? null}, name),
      story = COALESCE(${patch.story ?? null}, story),
      glass = COALESCE(${patch.glass ?? null}, glass),
      garnish = COALESCE(${patch.garnish ?? null}, garnish),
      method = COALESCE(${patch.method ?? null}, method),
      ingredients = COALESCE(${patch.ingredients ? JSON.stringify(patch.ingredients) : null}::jsonb, ingredients),
      updated_at = now()
    WHERE id = ${drinkId} RETURNING *`;
  return rows[0] as Drink;
}

export async function addPhoto(
  sql: Sql,
  drinkId: string,
  me: string,
  file: { bytes: Uint8Array; mime: string; width: number | null; height: number | null },
  store: (photoId: string, drinkId: string, bytes: Uint8Array, mime: string) => Promise<{ url: string; access: "public" | "private" } | null>,
): Promise<Photo> {
  await requireMember(sql, me);
  const drink = await getDrink(sql, drinkId);
  const id = crypto.randomUUID();
  const blob = await store(id, drinkId, file.bytes, file.mime);
  // Public blobs are served straight from the CDN; private blobs and Postgres
  // fallbacks go through /api/photos/:id.
  const url = blob?.access === "public" ? blob.url : `/api/photos/${id}`;
  const rows = await sql`INSERT INTO photos (id, drink_id, uploader_id, url, width, height, blob_url, blob_access)
    VALUES (${id}, ${drinkId}, ${me}, ${url}, ${file.width}, ${file.height}, ${blob?.url ?? null}, ${blob?.access ?? null}) RETURNING *`;
  if (!blob) {
    await sql`INSERT INTO photo_data (photo_id, mime, data) VALUES (${id}, ${file.mime}, decode(${Buffer.from(file.bytes).toString("hex")}, 'hex'))`;
  }
  // The maker's first photo becomes the hero shot automatically.
  if (!drink.hero_photo_id && me === drink.member_id) await sql`UPDATE drinks SET hero_photo_id = ${id} WHERE id = ${drinkId}`;
  return rows[0] as Photo;
}

/** Where a photo's bytes live: in Postgres, or in a private blob to stream. */
export async function photoSource(
  sql: Sql,
  id: string,
): Promise<{ kind: "bytes"; mime: string; bytes: Buffer } | { kind: "blob"; url: string; access: "public" | "private" } | null> {
  const data = await sql`SELECT mime, encode(data, 'base64') AS b64 FROM photo_data WHERE photo_id = ${id}`;
  if (data.length) return { kind: "bytes", mime: data[0].mime, bytes: Buffer.from(data[0].b64, "base64") };
  const rows = await sql`SELECT blob_url, blob_access FROM photos WHERE id = ${id}`;
  if (rows[0]?.blob_url) return { kind: "blob", url: rows[0].blob_url, access: rows[0].blob_access };
  return null;
}

export async function deletePhoto(sql: Sql, photoId: string, me: string): Promise<Photo & { blob_url: string | null }> {
  const rows = (await sql`SELECT p.*, d.member_id AS owner FROM photos p JOIN drinks d ON d.id = p.drink_id WHERE p.id = ${photoId}`) as (Photo & { owner: string; blob_url: string | null })[];
  if (!rows.length) throw new NotFound("No such photo");
  const photo = rows[0];
  if (photo.uploader_id !== me && photo.owner !== me) throw new Forbidden("Only whoever took it, or the drink's bartender, can remove a photo");
  await sql`UPDATE drinks SET hero_photo_id = NULL WHERE hero_photo_id = ${photoId}`;
  await sql`DELETE FROM photos WHERE id = ${photoId}`;
  return photo;
}

export async function setHero(sql: Sql, drinkId: string, me: string, photoId: string) {
  const drink = await getDrink(sql, drinkId);
  if (drink.member_id !== me) throw new Forbidden("Only the bartender picks the hero shot");
  const ok = await sql`SELECT 1 FROM photos WHERE id = ${photoId} AND drink_id = ${drinkId}`;
  if (!ok.length) throw new NotFound("No such photo");
  await sql`UPDATE drinks SET hero_photo_id = ${photoId} WHERE id = ${drinkId}`;
}

// ---------------------------------------------------------------------------
// Scoring, notes, comments, reactions
// ---------------------------------------------------------------------------

async function drinkInPlay(sql: Sql, drinkId: string, me: string) {
  const drink = await getDrink(sql, drinkId);
  const event = await getEvent(sql, drink.event_id);
  await requireParticipant(sql, event.id, me);
  return { drink, event };
}

export async function pour(sql: Sql, drinkId: string, me: string, category: CategoryKey, score: number) {
  const { drink, event } = await drinkInPlay(sql, drinkId, me);
  if (drink.member_id === me) throw new Forbidden("No pouring for your own drink");
  if (event.status !== "live" && event.status !== "lastcall") throw new Conflict("Scoring is closed");
  if (drink.status === "upcoming") throw new Conflict("They haven't presented yet");
  await sql`INSERT INTO scores (drink_id, member_id, category, score) VALUES (${drinkId}, ${me}, ${category}, ${score})
    ON CONFLICT (drink_id, member_id, category) DO UPDATE SET score = EXCLUDED.score, updated_at = now()`;
}

export async function saveNote(sql: Sql, drinkId: string, me: string, text: string) {
  await drinkInPlay(sql, drinkId, me);
  if (!text) await sql`DELETE FROM notes WHERE drink_id = ${drinkId} AND member_id = ${me}`;
  else
    await sql`INSERT INTO notes (drink_id, member_id, text) VALUES (${drinkId}, ${me}, ${text})
      ON CONFLICT (drink_id, member_id) DO UPDATE SET text = EXCLUDED.text, updated_at = now()`;
}

export async function addComment(sql: Sql, drinkId: string, me: string, text: string): Promise<Comment> {
  await requireMember(sql, me);
  await getDrink(sql, drinkId);
  const rows = await sql`INSERT INTO comments (drink_id, member_id, text) VALUES (${drinkId}, ${me}, ${text}) RETURNING *`;
  return rows[0] as Comment;
}

export async function deleteComment(sql: Sql, id: string, me: string) {
  const rows = await sql`DELETE FROM comments WHERE id = ${id} AND member_id = ${me} RETURNING id`;
  if (!rows.length) throw new Forbidden("Only the author can remove a comment");
}

export async function react(sql: Sql, drinkId: string, me: string, emoji: string) {
  await requireMember(sql, me);
  await getDrink(sql, drinkId);
  // Generous cap so a stuck thumb can't flood the stream.
  const [{ n }] = (await sql`SELECT count(*)::int AS n FROM reactions WHERE drink_id = ${drinkId} AND member_id = ${me}
    AND created_at > now() - interval '10 seconds'`) as { n: number }[];
  if (n >= 15) throw new BadRequest("Easy, tiger", 429);
  await sql`INSERT INTO reactions (drink_id, member_id, emoji) VALUES (${drinkId}, ${me}, ${emoji})`;
}

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

async function resultsFor(sql: Sql, eventId: string): Promise<EventResults> {
  const drinks = (await sql.query(`SELECT d.id, d.member_id, d.name, ${HERO_URL} AS hero_url FROM drinks d WHERE d.event_id = $1`, [eventId])) as DrinkInput[];
  const [scores, comments, reactions] = await Promise.all([
    sql`SELECT s.* FROM scores s JOIN drinks d ON d.id = s.drink_id WHERE d.event_id = ${eventId}`,
    sql`SELECT c.* FROM comments c JOIN drinks d ON d.id = c.drink_id WHERE d.event_id = ${eventId}`,
    sql`SELECT r.* FROM reactions r JOIN drinks d ON d.id = r.drink_id WHERE d.event_id = ${eventId}`,
  ]);
  return eventResults(drinks, scores as Score[], comments as Comment[], reactions as Reaction[]);
}

const revealed = (status: string) => status === "wrapped" || status === "complete";

// ---------------------------------------------------------------------------
// Read models
// ---------------------------------------------------------------------------

export async function loadLive(sql: Sql, event: PaloozaEvent, me: string | null): Promise<LiveEvent> {
  const [people, drinks] = await Promise.all([participants(sql, event.id), drinkSummaries(sql, event.id)]);
  const current = event.current_drink_id ? await getDrink(sql, event.current_drink_id) : null;

  const counts = (await sql`SELECT s.drink_id, s.member_id, count(*)::int AS n FROM scores s
    JOIN drinks d ON d.id = s.drink_id WHERE d.event_id = ${event.id} GROUP BY s.drink_id, s.member_id`) as { drink_id: string; member_id: string; n: number }[];
  const scored_counts: Record<string, number> = {};
  for (const c of counts) if (c.n >= CATEGORY_KEYS.length) scored_counts[c.drink_id] = (scored_counts[c.drink_id] ?? 0) + 1;
  const waiting_on = current
    ? people
        .map((p) => p.member_id)
        .filter((id) => id !== current.member_id && !counts.some((c) => c.drink_id === current.id && c.member_id === id && c.n >= CATEGORY_KEYS.length))
    : [];

  const my_scores: Record<string, ScoreMap> = {};
  const my_notes: Record<string, string> = {};
  if (me) {
    const mine = (await sql`SELECT s.* FROM scores s JOIN drinks d ON d.id = s.drink_id WHERE d.event_id = ${event.id} AND s.member_id = ${me}`) as Score[];
    for (const s of mine) (my_scores[s.drink_id] ??= {})[s.category] = s.score;
    const notes = await sql`SELECT n.drink_id, n.text FROM notes n JOIN drinks d ON d.id = n.drink_id WHERE d.event_id = ${event.id} AND n.member_id = ${me}`;
    for (const n of notes) my_notes[n.drink_id] = n.text;
  }

  const [comments, reactions] = await Promise.all([
    current ? sql`SELECT * FROM comments WHERE drink_id = ${current.id} ORDER BY created_at DESC LIMIT 40` : Promise.resolve([]),
    sql`SELECT r.* FROM reactions r JOIN drinks d ON d.id = r.drink_id WHERE d.event_id = ${event.id}
      AND r.created_at > now() - make_interval(secs => ${REACTION_WINDOW_SEC}) ORDER BY r.created_at`,
  ]);

  return {
    event,
    participants: people,
    drinks,
    current,
    my_scores,
    my_notes,
    waiting_on,
    scored_counts,
    comments: (comments as Comment[]).reverse(),
    reactions: reactions as Reaction[],
    results: revealed(event.status) ? await resultsFor(sql, event.id) : null,
  };
}

export async function loadHomeState(sql: Sql, me: string | null): Promise<HomeState> {
  const [members, event, last] = await Promise.all([
    listMembers(sql),
    openEvent(sql),
    sql`SELECT id, name FROM events WHERE status = 'complete' ORDER BY completed_at DESC LIMIT 1`,
  ]);
  let last_complete: HomeState["last_complete"] = null;
  if (last.length) {
    const results = await resultsFor(sql, last[0].id);
    const top = results.overall.places[0];
    last_complete = {
      id: last[0].id,
      name: last[0].name,
      champion: top ? { member_id: top.member_id, drink_name: top.name, overall: top.value } : null,
    };
  }
  return {
    members,
    event: event ? await loadLive(sql, event, me) : null,
    last_complete,
    server_time: new Date().toISOString(),
  };
}

export async function loadDrinkDetail(sql: Sql, drinkId: string, me: string | null): Promise<DrinkDetail> {
  const drink = await getDrink(sql, drinkId);
  const event = await getEvent(sql, drink.event_id);
  const [photos, comments] = await Promise.all([
    sql`SELECT * FROM photos WHERE drink_id = ${drinkId} ORDER BY created_at`,
    sql`SELECT * FROM comments WHERE drink_id = ${drinkId} ORDER BY created_at`,
  ]);
  const my_scores: ScoreMap = {};
  let my_note = "";
  if (me) {
    for (const s of (await sql`SELECT * FROM scores WHERE drink_id = ${drinkId} AND member_id = ${me}`) as Score[]) my_scores[s.category] = s.score;
    const n = await sql`SELECT text FROM notes WHERE drink_id = ${drinkId} AND member_id = ${me}`;
    my_note = n[0]?.text ?? "";
  }
  const result = revealed(event.status) ? ((await resultsFor(sql, event.id)).drinks.find((d) => d.drink_id === drinkId) ?? null) : null;
  return {
    drink,
    event: { id: event.id, name: event.name, status: event.status },
    photos: photos as Photo[],
    comments: comments as Comment[],
    result,
    my_scores,
    my_note,
  };
}

export async function loadCatalog(sql: Sql): Promise<CatalogEntry[]> {
  const rows = (await sql.query(
    `SELECT d.id, d.event_id, d.member_id, d.name, d.status, d.ingredients, d.created_at, ${HERO_URL} AS hero_url,
       (jsonb_array_length(d.ingredients) > 0 OR d.method <> '') AS has_recipe,
       e.name AS event_name, (e.status = 'complete') AS event_complete
     FROM drinks d JOIN events e ON e.id = d.event_id
     WHERE d.name <> '' OR jsonb_array_length(d.ingredients) > 0 OR EXISTS (SELECT 1 FROM photos p WHERE p.drink_id = d.id)
     ORDER BY e.created_at DESC, d.created_at`,
  )) as (CatalogEntry & { overall?: number | null })[];
  const done = [...new Set(rows.filter((r) => r.event_complete).map((r) => r.event_id))];
  const overall = new Map<string, number | null>();
  for (const id of done) for (const d of (await resultsFor(sql, id)).drinks) overall.set(d.drink_id, d.overall);
  return rows.map((r) => ({ ...r, overall: overall.get(r.id) ?? null }));
}

export async function loadHallOfFame(sql: Sql): Promise<HallOfFame> {
  const events = (await sql`SELECT id, name, completed_at FROM events WHERE status = 'complete'`) as { id: string; name: string; completed_at: string }[];
  const withResults = await Promise.all(events.map(async (e) => ({ ...e, results: await resultsFor(sql, e.id) })));
  return hallOfFame(withResults);
}
