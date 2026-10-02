import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { db, type Sql } from "../lib/db";
import * as s from "../lib/server";
import { makeTestDb } from "./helpers/pglite";

let sql: Sql;
let close: () => Promise<void>;
const ids: Record<string, string> = {};

before(async () => {
  ({ close } = await makeTestDb());
  sql = await db(); // applies the schema
});
after(() => close());

const rejects = (p: Promise<unknown>, status: number) =>
  assert.rejects(p, (err: { status?: number }) => {
    assert.equal(err.status, status);
    return true;
  });

test("sign in: no password, same name = same person", async () => {
  const cal = await s.createMember(sql, "Cal");
  const again = await s.createMember(sql, "cal");
  assert.equal(again.id, cal.id);
  ids.cal = cal.id;
  ids.zoe = (await s.createMember(sql, "Zoe")).id;
  ids.sam = (await s.createMember(sql, "Sam")).id;
  ids.max = (await s.createMember(sql, "Max")).id;
  assert.equal((await s.listMembers(sql)).length, 4);
});

test("only one open palooza at a time", async () => {
  const e = await s.createEvent(sql, ids.cal, "Fall Palooza");
  ids.event = e.id;
  assert.equal(e.host_id, ids.cal);
  await rejects(s.createEvent(sql, ids.zoe, "Rival"), 409);
});

test("lobby: join, shuffle, and the start rules", async () => {
  await s.joinEvent(sql, ids.event, ids.zoe);
  await s.joinEvent(sql, ids.event, ids.zoe); // idempotent
  await s.joinEvent(sql, ids.event, ids.sam);
  await rejects(s.startEvent(sql, ids.event, ids.zoe), 403); // host only
  let n = 0;
  await s.shuffleOrder(sql, ids.event, ids.sam, () => [0.9, 0.1, 0.5][n++ % 3]);
  const live = await s.loadLive(sql, (await s.openEvent(sql))!, ids.cal);
  assert.equal(live.event.order_set, true);
  assert.equal(live.event.order_version, 1);
  assert.deepEqual(live.participants.map((p) => p.position), [1, 2, 3]);
  assert.equal(live.drinks.length, 3);
  ids.order = JSON.stringify(live.participants.map((p) => p.member_id));
});

test("bartenders edit only their own recipe", async () => {
  const live = await s.loadLive(sql, (await s.openEvent(sql))!, ids.cal);
  const calDrink = live.drinks.find((d) => d.member_id === ids.cal)!;
  ids.calDrink = calDrink.id;
  const d = await s.updateDrink(sql, calDrink.id, ids.cal, {
    name: "Smoky Paloma",
    ingredients: s.parseIngredients([{ amount: "2 oz", item: "Mezcal" }, { amount: "", item: "" }, { amount: "4 oz", item: "Grapefruit soda" }]),
    method: "Build over ice.",
  });
  assert.equal(d.name, "Smoky Paloma");
  assert.equal(d.ingredients.length, 2, "blank rows dropped");
  await rejects(s.updateDrink(sql, calDrink.id, ids.zoe, { name: "Hijacked" }), 403);
});

test("start: first in the shuffled order presents; late joiners go last", async () => {
  await s.startEvent(sql, ids.event, ids.cal);
  await s.startEvent(sql, ids.event, ids.cal).catch(() => {}); // double tap is harmless
  await s.joinEvent(sql, ids.event, ids.max);
  const live = await s.loadLive(sql, (await s.openEvent(sql))!, ids.cal);
  const order = JSON.parse(ids.order) as string[];
  assert.equal(live.event.status, "live");
  assert.equal(live.current!.member_id, order[0]);
  assert.equal(live.participants.at(-1)!.member_id, ids.max);
  assert.equal(live.participants.at(-1)!.position, 4);
  await rejects(s.shuffleOrder(sql, ids.event, ids.cal), 409);
});

test("pouring rules: not your own, not before they present, whole numbers via the DB too", async () => {
  const live = await s.loadLive(sql, (await s.openEvent(sql))!, ids.cal);
  const cur = live.current!;
  const presenter = cur.member_id;
  const others = [ids.cal, ids.zoe, ids.sam, ids.max].filter((x) => x !== presenter);
  await rejects(s.pour(sql, cur.id, presenter, "taste", 9), 403);
  const upcoming = live.drinks.find((d) => d.status === "upcoming" && d.member_id !== others[0])!;
  await rejects(s.pour(sql, upcoming.id, others[0], "taste", 9), 409);
  await assert.rejects(sql`INSERT INTO scores (drink_id, member_id, category, score) VALUES (${cur.id}, ${others[0]}, 'taste', 11)`);
  await s.pour(sql, cur.id, others[0], "taste", 7);
  await s.pour(sql, cur.id, others[0], "taste", 8); // re-pour replaces
  const after = await s.loadLive(sql, (await s.openEvent(sql))!, others[0]);
  assert.equal(after.my_scores[cur.id].taste, 8);
  assert.equal(after.waiting_on.length, 3, "partial set still owes");
  // Scores stay hidden from everyone else until the reveal.
  const theirs = await s.loadLive(sql, (await s.openEvent(sql))!, others[1]);
  assert.equal(theirs.my_scores[cur.id], undefined);
  assert.equal(theirs.results, null);
});

test("notes are private; comments and reactions are public", async () => {
  const live = await s.loadLive(sql, (await s.openEvent(sql))!, ids.cal);
  const cur = live.current!;
  await s.saveNote(sql, cur.id, ids.zoe, "Too much lime?");
  await s.addComment(sql, cur.id, ids.sam, "That garnish!");
  await s.react(sql, cur.id, ids.sam, "🔥");
  const zoe = await s.loadLive(sql, (await s.openEvent(sql))!, ids.zoe);
  const sam = await s.loadLive(sql, (await s.openEvent(sql))!, ids.sam);
  assert.equal(zoe.my_notes[cur.id], "Too much lime?");
  assert.equal(sam.my_notes[cur.id], undefined);
  assert.equal(sam.comments[0].text, "That garnish!");
  assert.equal(zoe.reactions[0].emoji, "🔥");
  await s.saveNote(sql, cur.id, ids.zoe, "");
  assert.equal((await s.loadLive(sql, (await s.openEvent(sql))!, ids.zoe)).my_notes[cur.id], undefined);
});

test("advance: presenter or host only, never skips on a double tap, then last call", async () => {
  const everyone = [ids.cal, ids.zoe, ids.sam, ids.max];
  for (let round = 0; round < 4; round++) {
    const live = await s.loadLive(sql, (await s.openEvent(sql))!, ids.cal);
    const cur = live.current!;
    for (const m of everyone.filter((x) => x !== cur.member_id)) {
      const base = m === ids.sam ? 3 : m === ids.zoe ? 8 : 6; // Sam harsh, Zoe generous
      const bump = cur.member_id === ids.cal ? 2 : 0; // everyone loves Cal's drink
      for (const c of ["taste", "appearance", "creativity", "presentation"] as const) await s.pour(sql, cur.id, m, c, base + bump);
    }
    const stranger = everyone.find((x) => x !== cur.member_id && x !== ids.cal)!;
    await rejects(s.advance(sql, ids.event, stranger), 403);
    await s.advance(sql, ids.event, cur.member_id, cur.id);
    await s.advance(sql, ids.event, cur.member_id, cur.id).catch(() => {}); // stale double tap: no skip
  }
  const live = await s.loadLive(sql, (await s.openEvent(sql))!, ids.cal);
  assert.equal(live.event.status, "lastcall");
  assert.equal(live.current, null);
  assert.ok(live.drinks.every((d) => d.status === "done"));
});

test("reveal → slides → complete; results crown Cal; Hall of Fame and catalog", async () => {
  await rejects(s.startReveal(sql, ids.event, ids.zoe), 403);
  await s.startReveal(sql, ids.event, ids.cal);
  await s.setSlide(sql, ids.event, ids.cal, 3);
  const live = await s.loadLive(sql, (await s.openEvent(sql))!, ids.zoe);
  assert.equal(live.event.wrap_slide, 3);
  const r = live.results!;
  assert.equal(r.overall.places[0].member_id, ids.cal);
  assert.equal(r.superlatives.find((x) => x.key === "harshest")!.member_id, ids.sam);
  assert.equal(r.superlatives.find((x) => x.key === "generous")!.member_id, ids.zoe);
  await rejects(s.pour(sql, ids.calDrink, ids.zoe, "taste", 1), 409); // scoring closed
  await s.finishEvent(sql, ids.event, ids.cal);
  assert.equal(await s.openEvent(sql), null);

  const hof = await s.loadHallOfFame(sql);
  assert.equal(hof.champions[0].member_id, ids.cal);
  assert.equal(hof.champions[0].drink_name, "Smoky Paloma");
  const home = await s.loadHomeState(sql, ids.cal);
  assert.equal(home.last_complete!.champion!.member_id, ids.cal);
  const cat = await s.loadCatalog(sql);
  assert.equal(cat.length, 1, "only drinks with something to show");
  assert.ok(cat[0].overall! > 6);
  const detail = await s.loadDrinkDetail(sql, ids.calDrink, ids.zoe);
  assert.equal(detail.result!.raters, 3);
  assert.equal(detail.my_scores.taste, 10);
});

test("photos fall back to Postgres without a Blob store, and the maker's first is the hero", async () => {
  const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 0, 255]);
  const photo = await s.addPhoto(sql, ids.calDrink, ids.cal, { bytes, mime: "image/jpeg", width: 10, height: 20 }, async () => null);
  assert.equal(photo.url, `/api/photos/${photo.id}`);
  const back = await s.photoSource(sql, photo.id);
  assert.equal(back?.kind, "bytes");
  assert.deepEqual(new Uint8Array((back as { bytes: Buffer }).bytes), bytes);
  const detail = await s.loadDrinkDetail(sql, ids.calDrink, ids.cal);
  assert.equal(detail.drink.hero_photo_id, photo.id);
  await rejects(s.deletePhoto(sql, photo.id, ids.sam), 403);
  await s.deletePhoto(sql, photo.id, ids.cal);
  assert.equal((await s.loadDrinkDetail(sql, ids.calDrink, ids.cal)).drink.hero_photo_id, null);
});

test("a host can cancel an unstarted palooza; leaving hands off hosting", async () => {
  const e = await s.createEvent(sql, ids.zoe, "Winter");
  await s.joinEvent(sql, e.id, ids.sam);
  await s.leaveEvent(sql, e.id, ids.zoe);
  assert.equal((await s.openEvent(sql))!.host_id, ids.sam);
  await s.cancelEvent(sql, e.id, ids.sam);
  assert.equal(await s.openEvent(sql), null);
});

test("private Blob photos are served through the app; public ones straight from the CDN", async () => {
  const bytes = new Uint8Array([1, 2, 3]);
  const priv = await s.addPhoto(sql, ids.calDrink, ids.zoe, { bytes, mime: "image/jpeg", width: 1, height: 1 }, async (id) => ({
    url: `https://store.private.blob.vercel-storage.com/drinks/${id}.jpg`,
    access: "private",
  }));
  assert.equal(priv.url, `/api/photos/${priv.id}`);
  assert.deepEqual(await s.photoSource(sql, priv.id), { kind: "blob", url: `https://store.private.blob.vercel-storage.com/drinks/${priv.id}.jpg`, access: "private" });
  const pub = await s.addPhoto(sql, ids.calDrink, ids.zoe, { bytes, mime: "image/jpeg", width: 1, height: 1 }, async () => ({
    url: "https://store.public.blob.vercel-storage.com/x.jpg",
    access: "public",
  }));
  assert.equal(pub.url, "https://store.public.blob.vercel-storage.com/x.jpg");
  const gone = await s.deletePhoto(sql, priv.id, ids.zoe);
  assert.equal(gone.blob_url, `https://store.private.blob.vercel-storage.com/drinks/${priv.id}.jpg`);
});
