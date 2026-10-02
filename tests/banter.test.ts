import assert from "node:assert/strict";
import { test } from "node:test";
import { gameLine, listNames, sceneExchanges, type BanterCtx, type GameEvent } from "../lib/banter";
import { CATEGORIES } from "../lib/constants";
import type { LiveEvent } from "../lib/types";

const NAMES: Record<string, string> = { a: "Cal", b: "Zoe", c: "Sam" };

function live(status: LiveEvent["event"]["status"], over: Partial<LiveEvent> = {}): LiveEvent {
  return {
    event: { id: "e", name: "Friday Palooza", status, host_id: "a" },
    participants: ["a", "b", "c"].map((id, i) => ({ member_id: id, position: i, seat: i, joined_at: "" })),
    drinks: [
      { id: "d1", event_id: "e", member_id: "a", name: "Smoky Paloma", status: "waiting", hero_url: null, has_recipe: true },
      { id: "d2", event_id: "e", member_id: "b", name: "Lavender Fizz", status: "waiting", hero_url: null, has_recipe: false },
      { id: "d3", event_id: "e", member_id: "c", name: "Old Pal", status: "waiting", hero_url: "x", has_recipe: true },
    ],
    current: status === "live" ? ({ id: "d2", member_id: "b", name: "Lavender Fizz" } as LiveEvent["current"]) : null,
    my_scores: {},
    my_notes: {},
    waiting_on: status === "live" ? ["c"] : [],
    scored_counts: {},
    comments: [],
    reactions: [],
    napkins: [],
    results: null,
    ...over,
  } as unknown as LiveEvent;
}

const ctx = (l: LiveEvent | null, over: Partial<BanterCtx> = {}): BanterCtx => ({
  me: { id: "a", name: "Cal" },
  live: l,
  joined: true,
  nameOf: (id) => (id ? (NAMES[id] ?? null) : null),
  wins: {},
  ...over,
});

const clean = (text: string) => assert.ok(text && !/undefined|null|NaN|\$\{/.test(text), `bad line: ${text}`);

test("every scene line resolves, in every state, many times over", () => {
  const states = [null, live("lobby"), live("live"), live("lastcall"), live("wrapped")];
  for (const l of states)
    for (let i = 0; i < 60; i++)
      for (const ex of sceneExchanges(ctx(l, { wins: { b: 2 } })))
        for (const line of ex) {
          assert.ok(line.who === "mabel" || line.who === "jasper");
          clean(line.text);
        }
});

test("the lobby calls people out by name", () => {
  const all = Array.from({ length: 40 }, () => sceneExchanges(ctx(live("lobby"))))
    .flat(2)
    .map((l) => l.text)
    .join("\n");
  assert.match(all, /Zoe/); // no recipe yet
  assert.match(all, /Cal/); // me
  assert.match(all, /3 at the bar/);
});

test("the first beat is what you need to hear", () => {
  const notJoined = sceneExchanges(ctx(live("lobby"), { joined: false }))[0][0].text;
  assert.match(notJoined, /Cal/);
  assert.match(notJoined, /Friday Palooza/);
  const signedOut = sceneExchanges(ctx(null, { me: null }));
  assert.equal(signedOut.length, 1);
  const onStage = sceneExchanges(ctx(live("live", { current: { id: "d1", member_id: "a", name: "Smoky Paloma" } as LiveEvent["current"] })))[0][0].text;
  assert.match(onStage, /Cal/);
});

test("a game line exists for every moment and every pour", () => {
  const events: GameEvent[] = [
    { kind: "stage", presenter: "Zoe", drink: "Lavender Fizz", ingredient: "Gin", isMe: false },
    { kind: "stage", presenter: "Cal", drink: "Smoky Paloma", isMe: true },
    { kind: "finished", name: "Sam", left: 1, presenterIsMe: false },
    { kind: "finished", name: "Sam", left: 1, presenterIsMe: true },
    { kind: "lastOne", name: "Sam", isMe: false },
    { kind: "lastOne", name: "Cal", isMe: true },
    { kind: "allIn", presenter: "Zoe", isMe: false },
    { kind: "allIn", presenter: "Cal", isMe: true },
    { kind: "hype", emoji: "🔥", presenter: "Zoe", isMe: false },
    { kind: "napkin", name: "Sam", text: "This tastes like a candle in the best way possible" },
    { kind: "idle", presenter: "Zoe", someone: "Sam", me: "Cal" },
  ];
  for (const c of CATEGORIES) for (let s = 1; s <= 10; s++) events.push({ kind: "pour", category: c.key, score: s, presenter: "Zoe", me: "Cal" });
  for (const e of events)
    for (let i = 0; i < 25; i++) {
      const line = gameLine(e);
      clean(line.text);
    }
});

test("names read naturally", () => {
  assert.equal(listNames(["Sam"]), "Sam");
  assert.equal(listNames(["Sam", "Zoe"]), "Sam and Zoe");
  assert.equal(listNames(["Sam", "Zoe", "Cal"]), "Sam, Zoe and Cal");
});
