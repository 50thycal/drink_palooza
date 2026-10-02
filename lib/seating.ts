import type { TableShape } from "./types";

/**
 * Table geometry for napkin passing. Everything is in table coordinates seen
 * from above (SVG-style: x right, y down, table centred on the origin, about
 * one unit across).
 *
 * The idea: each person holds their phone facing the table, so "up" on their
 * screen points across the table and "right" points to their right-hand
 * neighbour's side. A flick on the screen is turned into a direction at the
 * real table, and the napkin goes to whoever sits that way.
 */

export interface Pt {
  x: number;
  y: number;
}

const len = (p: Pt) => Math.hypot(p.x, p.y);
const norm = (p: Pt): Pt => {
  const l = len(p) || 1;
  return { x: p.x / l, y: p.y / l };
};
const dot = (a: Pt, b: Pt) => a.x * b.x + a.y * b.y;
const sub = (a: Pt, b: Pt): Pt => ({ x: a.x - b.x, y: a.y - b.y });

/** Where seat `i` of `n` sits. */
export function seatPoint(shape: TableShape, n: number, i: number): Pt {
  if (shape === "round") {
    // seat 0 at the bottom, then clockwise as seen from above
    const a = Math.PI / 2 + (i / Math.max(n, 1)) * Math.PI * 2;
    return { x: Math.cos(a), y: Math.sin(a) };
  }
  // long table: first half along the top edge left→right, the rest along the
  // bottom edge right→left, so seat order still walks round the table
  const top = Math.ceil(n / 2);
  const bottom = n - top;
  if (i < top) return { x: top === 1 ? 0 : -1 + (2 * i) / (top - 1), y: -0.6 };
  const j = i - top;
  return { x: bottom === 1 ? 0 : 1 - (2 * j) / (bottom - 1), y: 0.6 };
}

/** Which way a seated person faces (forward) and their right hand, in table coordinates. */
export function seatFrame(shape: TableShape, n: number, i: number): { forward: Pt; right: Pt } {
  const p = seatPoint(shape, n, i);
  const forward = shape === "round" ? norm({ x: -p.x, y: -p.y }) : { x: 0, y: p.y < 0 ? 1 : -1 };
  // Facing `forward` in a y-down plane, your right hand points this way.
  const right = { x: -forward.y, y: forward.x };
  return { forward, right };
}

/** A screen gesture (x right, y down, in px) as a direction at the table. */
export function screenToTable(shape: TableShape, n: number, mySeat: number, dx: number, dy: number): Pt {
  const { forward, right } = seatFrame(shape, n, mySeat);
  // swiping up the screen (negative dy) sends it across the table
  return norm({ x: dx * right.x - dy * forward.x, y: dx * right.y - dy * forward.y });
}

export interface Seated {
  member_id: string;
  seat: number;
}

/**
 * Who a flick lands on: the seat closest to the flick's direction. Seats
 * lined up in that same direction (within 12° of the best one, such as down
 * one side of a long table) are reachable by flicking harder: `strength`
 * (0 to 1) picks nearest through farthest. Nobody within 80° → null.
 */
export function pickTarget(shape: TableShape, seated: Seated[], mySeat: number, dir: Pt, strength: number): string | null {
  const n = seated.length;
  const me = seatPoint(shape, n, mySeat);
  const options = seated
    .filter((s) => s.seat !== mySeat)
    .map((s) => {
      const v = sub(seatPoint(shape, n, s.seat), me);
      const angle = Math.acos(Math.max(-1, Math.min(1, dot(norm(v), dir))));
      return { id: s.member_id, angle, dist: len(v) };
    });
  if (!options.length) return null;
  const best = Math.min(...options.map((o) => o.angle));
  if (best > (80 * Math.PI) / 180) return null;
  const line = options.filter((o) => o.angle <= best + (12 * Math.PI) / 180).sort((a, b) => a.dist - b.dist);
  const idx = Math.round(Math.max(0, Math.min(1, strength)) * (line.length - 1));
  return line[idx].id;
}

/**
 * Where someone else sits relative to me, as a screen direction (x right,
 * y down, unit length), so their napkin can slide in from their side.
 */
export function directionOnMyScreen(shape: TableShape, n: number, mySeat: number, theirSeat: number): Pt {
  const { forward, right } = seatFrame(shape, n, mySeat);
  const rel = sub(seatPoint(shape, n, theirSeat), seatPoint(shape, n, mySeat));
  return norm({ x: dot(rel, right), y: -dot(rel, forward) });
}
