import assert from "node:assert/strict";
import { test } from "node:test";
import { directionOnMyScreen, pickTarget, screenToTable, seatFrame, seatPoint } from "../lib/seating";

const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;
const seated = (n: number) => Array.from({ length: n }, (_, i) => ({ member_id: `m${i}`, seat: i }));
const flick = (shape: "round" | "long", n: number, me: number, dx: number, dy: number, strength = 0) =>
  pickTarget(shape, seated(n), me, screenToTable(shape, n, me, dx, dy), strength);

test("round table of four: seat 0 at the bottom, then round the table", () => {
  const p = [0, 1, 2, 3].map((i) => seatPoint("round", 4, i));
  assert.ok(near(p[0].y, 1) && near(p[2].y, -1));
  assert.ok(near(p[1].x, -1) && near(p[3].x, 1));
});

test("everyone faces the middle; right hand is to their right", () => {
  const f0 = seatFrame("round", 4, 0); // bottom seat looks up the table
  assert.ok(near(f0.forward.y, -1) && near(f0.right.x, 1));
  const f2 = seatFrame("round", 4, 2); // top seat looks down: their right is our left
  assert.ok(near(f2.forward.y, 1) && near(f2.right.x, -1));
});

test("flicks land on whoever sits that way, from any seat", () => {
  assert.equal(flick("round", 4, 0, 0, -100), "m2"); // straight across
  assert.equal(flick("round", 4, 0, 100, 0), "m3"); // to my right
  assert.equal(flick("round", 4, 0, -100, 0), "m1"); // to my left
  assert.equal(flick("round", 4, 2, 100, 0), "m1"); // top seat's right is the left side
  assert.equal(flick("round", 4, 0, 0, 100), null); // flicked at myself: nobody
});

test("long table: across is across, and a harder flick reaches further down the side", () => {
  // 6 seats: 0,1,2 along the top (left→right); 3,4,5 along the bottom (right→left)
  assert.equal(flick("long", 6, 4, 0, -100), "m1"); // bottom-middle flicks straight across
  assert.equal(flick("long", 6, 4, 0, -100, 1), "m1"); // hard, but still straight across
  assert.equal(flick("long", 6, 3, -100, 0, 0), "m4"); // bottom-right flicks to their left: next seat
  assert.equal(flick("long", 6, 3, -100, 0, 1), "m5"); // ...harder: to the far end
});

test("an incoming napkin enters from the sender's side of my screen", () => {
  const fromRight = directionOnMyScreen("round", 4, 0, 3);
  assert.ok(fromRight.x > 0, "seat 3 is on my right");
  const fromAcross = directionOnMyScreen("round", 4, 0, 2);
  assert.ok(near(fromAcross.x, 0) && fromAcross.y < 0, "across the table = top of my screen");
});
