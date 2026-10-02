import assert from "node:assert/strict";
import { test } from "node:test";
import { drinkResults, eventResults, hallOfFame, rankOverall, shuffle, weightedOverall } from "../lib/scoring";
import type { Reaction, Score } from "../lib/types";

const S = (drink_id: string, member_id: string, t: number, a: number, c: number, p: number): Score[] => [
  { drink_id, member_id, category: "taste", score: t },
  { drink_id, member_id, category: "appearance", score: a },
  { drink_id, member_id, category: "creativity", score: c },
  { drink_id, member_id, category: "presentation", score: p },
];
const D = (id: string, member_id: string) => ({ id, member_id, name: id.toUpperCase(), hero_url: null });

test("taste counts double in the overall", () => {
  assert.equal(weightedOverall({ taste: 10, appearance: 5, creativity: 5, presentation: 5 }), 7);
  assert.equal(weightedOverall({ taste: 4, appearance: 9, creativity: 9, presentation: 9 }), 7);
});

test("a missing category renormalises instead of counting as zero", () => {
  assert.equal(weightedOverall({ taste: 8 }), 8);
  assert.equal(weightedOverall({ appearance: 6, creativity: 8 }), 7);
  assert.equal(weightedOverall({}), null);
});

test("ties on overall go to the better taste", () => {
  // a: taste 9 others 5 → (18+15)/5 = 6.6 ; b: taste 6, others 7 → (12+21)/5 = 6.6
  const results = drinkResults([D("a", "m1"), D("b", "m2")], [...S("a", "x", 9, 5, 5, 5), ...S("b", "x", 6, 7, 7, 7)], []);
  const ranked = rankOverall(results);
  assert.equal(ranked[0].drink_id, "a");
  assert.ok(Math.abs(ranked[0].overall! - ranked[1].overall!) < 1e-9);
});

test("fair mode cancels out a harsh and a generous critic", () => {
  // Harsh critic scores everything 2–4, generous one 8–10. Both agree b > a,
  // but the generous critic only rated a — raw mean flatters a.
  const scores = [...S("a", "kind", 8, 8, 8, 8), ...S("b", "kind", 10, 10, 10, 10), ...S("b", "harsh", 4, 4, 4, 4), ...S("c", "harsh", 2, 2, 2, 2)];
  const r = eventResults([D("a", "m1"), D("b", "m2"), D("c", "m3")], scores, [], []);
  // Raw: a = 8 (only the generous critic tasted it) beats b = 7.
  assert.equal(r.overall.places[0].drink_id, "a");
  // Fair: b was the top pour of *both* critics.
  assert.equal(r.fair_winner?.drink_id, "b");
  const a = r.drinks.find((d) => d.drink_id === "a")!;
  const c = r.drinks.find((d) => d.drink_id === "c")!;
  assert.ok(a.overall! > c.overall!);
  assert.ok(Math.abs(a.fair! - c.fair!) < 1e-9, "both were their critic's lowest score");
});

test("podiums, superlatives and totals", () => {
  const scores = [
    ...S("a", "m2", 9, 9, 9, 9),
    ...S("a", "m3", 3, 3, 3, 3),
    ...S("b", "m1", 7, 6, 8, 5),
    ...S("b", "m3", 7, 6, 8, 5),
    ...S("c", "m1", 5, 10, 4, 9),
    ...S("c", "m2", 5, 10, 4, 9),
  ];
  const reactions: Reaction[] = [
    { id: "1", drink_id: "c", member_id: "m1", emoji: "🔥", created_at: "" },
    { id: "2", drink_id: "c", member_id: "m2", emoji: "🔥", created_at: "" },
    { id: "3", drink_id: "c", member_id: "m3", emoji: "😍", created_at: "" }, // own drink: not counted for crowd fav
    { id: "4", drink_id: "a", member_id: "m2", emoji: "🔥", created_at: "" },
  ];
  const r = eventResults([D("a", "m1"), D("b", "m2"), D("c", "m3")], scores, [{ id: "c1", drink_id: "a", member_id: "m2", text: "wow", created_at: "" }], reactions);
  assert.equal(r.podiums.find((p) => p.category === "appearance")!.places[0].drink_id, "c");
  assert.equal(r.podiums.find((p) => p.category === "creativity")!.places[0].drink_id, "b");
  assert.deepEqual(
    r.superlatives.map((s) => s.key),
    ["harshest", "generous", "divisive", "crowd", "chatterbox"], // hype needs 3+ reactions sent
  );
  assert.equal(r.superlatives.find((s) => s.key === "divisive")!.member_id, "m1");
  assert.equal(r.superlatives.find((s) => s.key === "crowd")!.member_id, "m3");
  assert.equal(r.drinks.find((d) => d.drink_id === "c")!.reactions, 2);
  assert.equal(r.totals.top_emoji, "🔥");
  assert.equal(r.totals.scores, 24);
});

test("hall of fame: champions newest first, titles, best-evers need two raters", () => {
  const e1 = eventResults([D("a", "m1"), D("b", "m2")], [...S("a", "m2", 9, 9, 9, 9), ...S("a", "m3", 9, 9, 9, 9), ...S("b", "m1", 5, 5, 5, 5)], [], []);
  const e2 = eventResults([D("c", "m1"), D("d", "m2")], [...S("c", "m2", 4, 4, 4, 4), ...S("d", "m1", 6, 6, 6, 6), ...S("d", "m3", 7, 7, 7, 7)], [], []);
  const hof = hallOfFame([
    { id: "e1", name: "Spring", completed_at: "2026-03-01T00:00:00Z", results: e1 },
    { id: "e2", name: "Summer", completed_at: "2026-06-01T00:00:00Z", results: e2 },
  ]);
  assert.deepEqual(hof.champions.map((c) => [c.event_name, c.member_id]), [["Summer", "m2"], ["Spring", "m1"]]);
  assert.deepEqual(
    hof.titles.map((t) => [t.member_id, t.wins, t.podiums]).sort(),
    [["m1", 1, 2], ["m2", 1, 2]],
  );
  const overall = hof.best_ever.find((b) => b.category === "overall")!;
  assert.equal(overall.drink_id, "a");
  assert.equal(hof.personal_bests.find((p) => p.member_id === "m2")!.drink_id, "d");
});

test("shuffle is a permutation and follows its random source", () => {
  const xs = ["a", "b", "c", "d", "e"];
  const out = shuffle(xs, () => 0);
  assert.deepEqual([...out].sort(), xs);
  assert.deepEqual(out, ["b", "c", "d", "e", "a"]);
  assert.deepEqual(xs, ["a", "b", "c", "d", "e"], "input untouched");
});
