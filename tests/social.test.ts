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
  sql = await db();
  for (const n of ["Cal", "Zoe", "Sam", "Max"]) ids[n] = (await s.createMember(sql, n)).id;
  ids.event = (await s.createEvent(sql, ids.Cal, "Social Palooza")).id;
  for (const n of ["Zoe", "Sam", "Max"]) await s.joinEvent(sql, ids.event, ids[n]);
});
after(() => close());

const live = async (me: string) => s.loadLive(sql, (await s.openEvent(sql))!, me);
const rejects = (p: Promise<unknown>, status: number) =>
  assert.rejects(p, (err: { status?: number }) => (assert.equal(err.status, status), true));

test("everyone gets a seat as they join; leaving closes the gap", async () => {
  let l = await live(ids.Cal);
  assert.deepEqual(l.participants.map((p) => p.seat).sort(), [0, 1, 2, 3]);
  assert.equal(l.event.seating_set, false);
  assert.equal(l.event.table_shape, "round");
  await s.leaveEvent(sql, ids.event, ids.Zoe);
  l = await live(ids.Cal);
  assert.deepEqual(l.participants.map((p) => p.seat).sort(), [0, 1, 2]);
  await s.joinEvent(sql, ids.event, ids.Zoe);
  l = await live(ids.Cal);
  assert.equal(l.participants.find((p) => p.member_id === ids.Zoe)!.seat, 3);
});

test("seating is saved as an order round the table, and must list everyone", async () => {
  const order = [ids.Max, ids.Cal, ids.Zoe, ids.Sam];
  await s.setSeating(sql, ids.event, ids.Sam, "long", order);
  const l = await live(ids.Cal);
  assert.equal(l.event.table_shape, "long");
  assert.equal(l.event.seating_set, true);
  for (const [i, id] of order.entries()) assert.equal(l.participants.find((p) => p.member_id === id)!.seat, i);
  await rejects(s.setSeating(sql, ids.event, ids.Sam, "round", [ids.Max, ids.Cal]), 409);
  await rejects(s.setSeating(sql, ids.event, ids.Sam, "round", [ids.Max, ids.Max, ids.Zoe, ids.Sam]), 409);
});

test("passed napkins are private between sender and recipient, with read receipts", async () => {
  const n = await s.passNapkin(sql, ids.event, ids.Cal, ids.Zoe, "Sam's drink is just vodka soda");
  await s.passNapkin(sql, ids.event, ids.Zoe, ids.Cal, "lol shh");
  await rejects(s.passNapkin(sql, ids.event, ids.Cal, ids.Cal, "me"), 400);
  const zoe = await live(ids.Zoe);
  const sam = await live(ids.Sam);
  assert.equal(zoe.napkins.length, 2);
  assert.equal(sam.napkins.length, 0, "Sam never sees it");
  assert.equal(zoe.napkins.find((x) => x.id === n.id)!.read_at, null);
  await s.readNapkin(sql, n.id, ids.Sam); // not the recipient: no effect
  assert.equal((await live(ids.Zoe)).napkins.find((x) => x.id === n.id)!.read_at, null);
  await s.readNapkin(sql, n.id, ids.Zoe);
  assert.ok((await live(ids.Zoe)).napkins.find((x) => x.id === n.id)!.read_at);
});

test("the reveal hands out The Postman and Secret Pen Pals", async () => {
  await s.passNapkin(sql, ids.event, ids.Cal, ids.Zoe, "again");
  await s.startEvent(sql, ids.event, ids.Cal);
  for (let round = 0; round < 4; round++) {
    const l = await live(ids.Cal);
    const cur = l.current!;
    for (const m of [ids.Cal, ids.Zoe, ids.Sam, ids.Max].filter((x) => x !== cur.member_id)) {
      for (const c of ["taste", "appearance", "creativity", "presentation"] as const) await s.pour(sql, cur.id, m, c, 7);
    }
    await s.advance(sql, ids.event, cur.member_id, cur.id);
  }
  await s.startReveal(sql, ids.event, ids.Cal);
  const r = (await live(ids.Cal)).results!;
  assert.equal(r.totals.passes, 3);
  const postman = r.superlatives.find((x) => x.key === "postman")!;
  assert.equal(postman.member_id, ids.Cal);
  const pals = r.superlatives.find((x) => x.key === "penpals")!;
  assert.deepEqual([pals.member_id, pals.partner_id].sort(), [ids.Cal, ids.Zoe].sort());
});

test("the chalkboard: anyone writes, only the author wipes, tagged to the open palooza", async () => {
  const note = await s.addChalk(sql, ids.Max, "Max was here", "pink");
  assert.equal(note.event_id, ids.event);
  await rejects(s.eraseChalk(sql, note.id, ids.Cal), 403);
  await s.addChalk(sql, ids.Cal, "Last call is a lie", "white");
  assert.equal((await s.listChalk(sql)).length, 2);
  await s.eraseChalk(sql, note.id, ids.Max);
  assert.deepEqual((await s.listChalk(sql)).map((c) => c.text), ["Last call is a lie"]);
});

test("the bar remembers: rings, bottle caps, an overheard napkin, the tab", async () => {
  const before = await s.loadMemory(sql);
  assert.equal(before.rings.length, 0, "nothing until a palooza finishes");
  const l = await live(ids.Cal);
  await s.addComment(sql, l.drinks[0].id, ids.Sam, "Best rim of the night, no contest");
  await s.finishEvent(sql, ids.event, ids.Cal);
  const m = await s.loadMemory(sql);
  assert.equal(m.rings.length, 4);
  assert.equal(m.caps.length, 1);
  assert.equal(m.tally.paloozas, 1);
  assert.equal(m.tally.pours, 48);
  assert.equal(m.tally.napkins, 4); // 3 passes + 1 comment
  assert.equal(m.overheard?.text, "Best rim of the night, no contest");
  assert.equal(Object.values(m.wins).reduce((a, b) => a + b, 0), 1);
});
