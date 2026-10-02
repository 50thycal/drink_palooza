"use client";

import { AnimatePresence, motion, useAnimationControls } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { eventAction, refreshAll, send } from "@/lib/api";
import { directionOnMyScreen, pickTarget, screenToTable, seatFrame, seatPoint, type Pt } from "@/lib/seating";
import { paperSlide } from "@/lib/sounds";
import type { LiveEvent, Member, NapkinPass, TableShape } from "@/lib/types";
import { useApp } from "./AppContext";
import { Avatar, Portal, Sheet, toast, useBusy } from "./ui";

// ---------------------------------------------------------------------------
// The table, seen from above
// ---------------------------------------------------------------------------

interface SeatChip {
  member: Member | null;
  memberId: string;
  seat: number;
}

/**
 * A top-down table with everyone at their seat. With `viewFrom`, the drawing
 * turns so that seat is at the bottom, facing up: then "up" on the screen is
 * "across the table" for whoever is holding the phone.
 */
export function TableDiagram({
  shape,
  chips,
  viewFrom = null,
  highlight = null,
  selected = null,
  meId = null,
  onTap,
  className = "",
}: {
  shape: TableShape;
  chips: SeatChip[];
  viewFrom?: number | null;
  highlight?: string | null;
  selected?: string | null;
  meId?: string | null;
  onTap?: (memberId: string) => void;
  className?: string;
}) {
  const n = chips.length;
  // Map table coordinates into the viewer's frame.
  const view = useMemo(() => {
    if (viewFrom == null) return (p: Pt) => p;
    // Rotate so the viewer's "forward" points up the screen and their right
    // hand points right. The table centre stays at the centre.
    const { forward, right } = seatFrame(shape, n, viewFrom);
    return (p: Pt) => ({ x: p.x * right.x + p.y * right.y, y: -(p.x * forward.x + p.y * forward.y) });
  }, [shape, n, viewFrom]);

  const tableCenter = view({ x: 0, y: 0 });
  return (
    <svg viewBox="-1.55 -1.4 3.1 2.88" className={className} role="img" aria-label="Seating around the table">
      <defs>
        <radialGradient id="tbl" cx="0.4" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#7a4128" />
          <stop offset="1" stopColor="#3b1c10" />
        </radialGradient>
      </defs>
      {shape === "round" ? (
        <circle cx={tableCenter.x} cy={tableCenter.y} r={0.7} fill="url(#tbl)" stroke="#d4af37" strokeWidth={0.025} />
      ) : (
        // long tables only ever turn 180°, so the table stays landscape
        <rect
          x={tableCenter.x - 1.18}
          y={tableCenter.y - 0.36}
          width={2.36}
          height={0.72}
          rx={0.08}
          fill="url(#tbl)"
          stroke="#d4af37"
          strokeWidth={0.025}
        />
      )}
      {chips.map((c) => {
        const raw = seatPoint(shape, n, c.seat);
        // pull seats a little outside the table edge
        const p = view(shape === "round" ? { x: raw.x * 1.0, y: raw.y * 1.0 } : { x: raw.x * 0.95, y: raw.y * 1.45 });
        const hot = highlight === c.memberId;
        const sel = selected === c.memberId;
        const me = meId === c.memberId;
        return (
          <g key={c.memberId} transform={`translate(${p.x} ${p.y})`} onClick={() => onTap?.(c.memberId)} style={{ cursor: onTap ? "pointer" : undefined }}>
            {hot && (
              <circle r={0.3} fill="none" stroke="#ff4fa3" strokeWidth={0.05} style={{ filter: "drop-shadow(0 0 0.06px #ff4fa3)" }}>
                <animate attributeName="r" values="0.27;0.32;0.27" dur="0.8s" repeatCount="indefinite" />
              </circle>
            )}
            <circle r={0.21} fill="#0d0b09" stroke={sel ? "#3ff2e0" : me ? "#d4af37" : (c.member?.color ?? "#777")} strokeWidth={sel || me ? 0.05 : 0.03} />
            <text y={0.075} textAnchor="middle" fontSize={0.22}>
              {c.member?.emoji ?? "?"}
            </text>
            <text y={0.36} textAnchor="middle" fontSize={0.13} fill="#e9d7a5" fontFamily="Josefin Sans" fontWeight={700}>
              {me ? "you" : c.member?.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function chipsFor(live: LiveEvent, memberById: (id: string) => Member | null): SeatChip[] {
  return [...live.participants]
    .sort((a, b) => (a.seat ?? 99) - (b.seat ?? 99))
    .map((p, i) => ({ memberId: p.member_id, member: memberById(p.member_id), seat: p.seat ?? i }));
}

// ---------------------------------------------------------------------------
// Seating editor
// ---------------------------------------------------------------------------

export function SeatingSheet({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved?: () => void }) {
  const { live, memberById, meId } = useApp();
  const [shape, setShape] = useState<TableShape>("round");
  const [order, setOrder] = useState<string[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const { busy, run } = useBusy();

  useEffect(() => {
    if (open && live) {
      setShape(live.event.table_shape);
      setOrder(chipsFor(live, memberById).map((c) => c.memberId));
      setPicked(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!live) return null;
  const chips: SeatChip[] = order.map((id, seat) => ({ memberId: id, member: memberById(id), seat }));
  const tap = (id: string) => {
    if (!picked) return setPicked(id);
    if (picked === id) return setPicked(null);
    setOrder((o) => o.map((x) => (x === picked ? id : x === id ? picked : x)));
    setPicked(null);
  };

  return (
    <Sheet open={open} onClose={onClose} title="Seat the Table">
      <p className="text-sm leading-snug">
        Set this up like you&apos;re actually sitting, going round the table, so a napkin flicked across lands on whoever is across from you.
        <b> Tap two people to swap their seats.</b>
      </p>
      <div className="mt-3 flex justify-center gap-2">
        {(["round", "long"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setShape(s)}
            className={`rounded-full border px-4 py-1.5 font-deco text-sm font-bold ${shape === s ? "border-ink bg-ink text-cream" : "border-ink/30"}`}
          >
            {s === "round" ? "◯ Round table" : "▭ Long table"}
          </button>
        ))}
      </div>
      <div className="mt-3 rounded-lg bg-onyx p-2">
        <TableDiagram shape={shape} chips={chips} selected={picked} meId={meId} onTap={tap} className="mx-auto block w-full max-w-sm" />
      </div>
      <p className="mt-2 text-center font-deco text-xs font-bold opacity-70">{picked ? `Now tap who ${memberById(picked)?.name} swaps with` : "Tap someone to move them"}</p>
      <button
        disabled={busy}
        onClick={() =>
          run(async () => {
            await eventAction(live.event.id, "seating", { shape, order });
            toast("🪑 Seats saved: napkins will fly true");
            onSaved?.();
            onClose();
          })
        }
        className="btn-gold mt-4 mb-2 w-full rounded-full py-3 text-lg"
      >
        {busy ? "Saving…" : "These are our seats"}
      </button>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Passing a napkin
// ---------------------------------------------------------------------------

const FLICK_MIN_PX = 60;

/**
 * Write on a napkin, then flick it toward someone at the table. The little
 * table above turns so you're at the bottom; whoever the flick is aimed at
 * lights up before you let go.
 */
export function PassNapkin({ open, onClose, to = null }: { open: boolean; onClose: () => void; to?: string | null }) {
  const { live, meId, memberById } = useApp();
  const [text, setText] = useState("");
  const [aim, setAim] = useState<string | null>(null);
  const [seating, setSeating] = useState(false);
  const controls = useAnimationControls();
  const drag = useRef<{ x: number; y: number } | null>(null);
  const sending = useRef(false);

  useEffect(() => {
    if (open) {
      setText("");
      setAim(to);
      void controls.set({ x: 0, y: 0, rotate: -2, opacity: 1, scale: 1 });
    }
  }, [open, to, controls]);

  if (!live || !meId) return null;
  const chips = chipsFor(live, memberById);
  const mine = chips.find((c) => c.memberId === meId);
  if (!mine) return null;
  const shape = live.event.table_shape;
  const n = chips.length;
  const seated = chips.map((c) => ({ member_id: c.memberId, seat: c.seat }));

  async function pass(target: string, flyTo: Pt) {
    if (sending.current) return;
    if (!text.trim()) {
      toast("Write something on it first");
      void controls.start({ x: 0, y: 0, transition: { type: "spring", damping: 15 } });
      return;
    }
    sending.current = true;
    paperSlide();
    void controls.start({ x: flyTo.x * 600, y: flyTo.y * 700, rotate: flyTo.x * 40, opacity: 0, transition: { duration: 0.45, ease: "easeIn" } });
    try {
      await send("POST", `/api/events/${live!.event.id}/pass`, { to_id: target, text: text.trim() });
      toast(`📨 Passed to ${memberById(target)?.name}`);
      void refreshAll();
      setTimeout(onClose, 350);
    } catch (err) {
      toast((err as Error).message);
      void controls.start({ x: 0, y: 0, rotate: -2, opacity: 1 });
    } finally {
      sending.current = false;
    }
  }

  const onDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("textarea")) return;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY };
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    void controls.set({ x: dx, y: dy, rotate: -2 + dx / 20 });
    const dist = Math.hypot(dx, dy);
    if (dist < 20) return setAim(to);
    setAim(pickTarget(shape, seated, mine.seat, screenToTable(shape, n, mine.seat, dx, dy), Math.min(1, dist / 260)));
  };
  const onUp = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    drag.current = null;
    const dist = Math.hypot(dx, dy);
    if (dist >= FLICK_MIN_PX && aim) return void pass(aim, { x: dx / dist, y: dy / dist });
    void controls.start({ x: 0, y: 0, rotate: -2, transition: { type: "spring", damping: 15 } });
  };

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-50 flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="wood absolute inset-0" />
            <div className="absolute inset-0 bg-black/45" />
            <div className="relative flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))]">
              <button onClick={onClose} className="btn-ghost rounded-full bg-black/55 px-3.5 py-1.5 text-xs">
                ✕ Keep it
              </button>
              <button onClick={() => setSeating(true)} className="btn-ghost rounded-full bg-black/55 px-3.5 py-1.5 text-xs">
                🪑 Seats
              </button>
            </div>
            <div className="relative px-4">
              <TableDiagram
                shape={shape}
                chips={chips}
                viewFrom={mine.seat}
                highlight={aim}
                meId={meId}
                onTap={(id) => id !== meId && void pass(id, directionOnMyScreen(shape, n, mine.seat, chips.find((c) => c.memberId === id)!.seat))}
                className="mx-auto block w-full max-w-xs"
              />
              <p className="text-center font-deco text-sm font-bold tracking-wide text-champagne/85">
                {aim ? `Aiming at ${memberById(aim)?.name}` : live.event.seating_set ? "Flick the napkin toward someone" : "Seats aren't set: tap 🪑 Seats so flicks land right"}
              </p>
            </div>
            <div className="relative flex flex-1 items-center justify-center px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]" style={{ touchAction: "none" }}>
              <motion.div
                animate={controls}
                onPointerDown={onDown}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerCancel={onUp}
                className="paper relative aspect-square w-full max-w-[300px] cursor-grab rounded-sm p-5 shadow-[0_18px_40px_rgba(0,0,0,0.55)]"
                style={{ backgroundImage: "repeating-linear-gradient(45deg, rgb(43 29 18 / 0.035) 0 6px, transparent 6px 12px)" }}
              >
                <div className="pointer-events-none absolute inset-2 border border-dashed border-ink/25" />
                <div className="pointer-events-none text-center font-display text-sm tracking-[0.3em] opacity-50">DP</div>
                <textarea
                  value={text}
                  maxLength={200}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Psst…"
                  className="chalk mt-1 h-[70%] w-full resize-none bg-transparent text-[26px] leading-tight text-ink outline-none placeholder:text-ink/30"
                  style={{ textShadow: "none" }}
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-2 text-center font-deco text-[11px] font-bold tracking-widest opacity-50">
                  DRAG ME · FLICK TO PASS · OR TAP A FACE
                </div>
              </motion.div>
            </div>
            <SeatingSheet open={seating} onClose={() => setSeating(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}

// ---------------------------------------------------------------------------
// A napkin arriving
// ---------------------------------------------------------------------------

/**
 * Anywhere in the app: when someone passes you a napkin it slides in from
 * the side of the table they're sitting on. Pocket it, or write back and
 * slide it straight back to them.
 */
export function NapkinArrivals() {
  const { live, meId, memberById } = useApp();
  const [seen, setSeen] = useState<Set<string>>(() => new Set());
  const [reply, setReply] = useState("");
  const [leaving, setLeaving] = useState<Pt | null>(null);
  const { busy, run } = useBusy();

  const incoming: NapkinPass | undefined = live?.napkins
    .filter((n) => n.to_id === meId && !n.read_at && !seen.has(n.id))
    .sort((a, b) => a.created_at.localeCompare(b.created_at))[0];

  useEffect(() => {
    if (incoming) {
      paperSlide();
      setReply("");
      setLeaving(null);
    }
  }, [incoming?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!live || !meId) return null;
  const chips = chipsFor(live, memberById);
  const mySeat = chips.find((c) => c.memberId === meId)?.seat;
  const fromSeat = incoming ? chips.find((c) => c.memberId === incoming.from_id)?.seat : undefined;
  const from: Pt = mySeat != null && fromSeat != null ? directionOnMyScreen(live.event.table_shape, chips.length, mySeat, fromSeat) : { x: 0, y: -1 };

  const done = (id: string, exit: Pt) => {
    setLeaving(exit);
    setTimeout(() => setSeen((s) => new Set(s).add(id)), 420);
    send("POST", `/api/events/${live.event.id}/napkin-read`, { napkin_id: id }).then(refreshAll, () => {});
  };

  return (
    <AnimatePresence>
      {incoming && (
        <motion.div key={incoming.id} className="fixed inset-0 z-[55] flex items-center justify-center bg-black/40 px-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            initial={{ x: from.x * 520, y: from.y * 720, rotate: from.x * 25 - 8 }}
            animate={leaving ? { x: leaving.x * 620, y: leaving.y * 780, rotate: leaving.x * 30, opacity: 0 } : { x: 0, y: 0, rotate: -3 }}
            transition={leaving ? { duration: 0.42, ease: "easeIn" } : { type: "spring", damping: 18, stiffness: 140 }}
            className="paper relative w-full max-w-[320px] rounded-sm p-5 shadow-[0_18px_40px_rgba(0,0,0,0.6)]"
            style={{ backgroundImage: "repeating-linear-gradient(45deg, rgb(43 29 18 / 0.035) 0 6px, transparent 6px 12px)" }}
          >
            <div className="pointer-events-none absolute inset-2 border border-dashed border-ink/25" />
            <div className="flex items-center gap-2 font-deco text-xs font-bold tracking-widest opacity-70">
              <Avatar member={memberById(incoming.from_id)} size={22} /> PASSED FROM {memberById(incoming.from_id)?.name.toUpperCase()}
            </div>
            <p className="chalk mt-3 min-h-[90px] text-[28px] leading-tight text-ink" style={{ textShadow: "none" }}>
              {incoming.text}
            </p>
            <input
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              maxLength={200}
              placeholder="Scribble a reply…"
              className="chalk mt-2 w-full border-b border-dashed border-ink/40 bg-transparent py-1 text-[22px] text-ink outline-none placeholder:text-ink/35"
              style={{ textShadow: "none" }}
            />
            <div className="mt-4 flex gap-2">
              <button onClick={() => done(incoming.id, { x: 0, y: 1 })} className="flex-1 rounded-full border border-ink/40 py-2 font-deco font-bold">
                Pocket it
              </button>
              <button
                disabled={busy || !reply.trim()}
                onClick={() =>
                  run(async () => {
                    await send("POST", `/api/events/${live.event.id}/pass`, { to_id: incoming.from_id, text: reply.trim() });
                    paperSlide();
                    toast(`📨 Passed back to ${memberById(incoming.from_id)?.name}`);
                    done(incoming.id, from);
                  })
                }
                className="btn-gold flex-1 rounded-full py-2 disabled:opacity-40"
              >
                Pass it back
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
