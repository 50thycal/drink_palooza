"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { gameLine, pick, type GameEvent, type Line } from "@/lib/banter";
import type { CategoryKey } from "@/lib/constants";
import { useApp } from "./AppContext";
import { Jasper, Mabel } from "./art/Bartenders";
import { Portal } from "./ui";

const POUR_EVENT = "palooza:pour";
/** Quiet time between remarks, so they season the game rather than narrate it. */
const GAP_MS = 9000;
const SHOW_MS = 5200;
const IDLE_MS = 55000;

/** Tell the bartenders this phone just poured a glass. */
export function announcePour(category: CategoryKey, score: number) {
  window.dispatchEvent(new CustomEvent(POUR_EVENT, { detail: { category, score } }));
}

/**
 * Mabel or Jasper leaning into frame mid-game: a new presenter, the last
 * straggler, a flurry of reactions, your own pour. Lives in the bar tray, so
 * it's on the pour screen and the stage and nowhere else.
 */
export function BarBanter() {
  const { live, meId, me, memberById } = useApp();
  const [line, setLine] = useState<Line | null>(null);
  const lastAt = useRef(0);
  const hideTimer = useRef<number | undefined>(undefined);

  const say = useCallback((l: Line, force = false) => {
    const now = Date.now();
    if (!force && now - lastAt.current < GAP_MS) return;
    lastAt.current = now;
    setLine(l);
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setLine(null), SHOW_MS);
  }, []);
  useEffect(() => () => window.clearTimeout(hideTimer.current), []);

  const current = live?.current ?? null;
  const presenter = memberById(current?.member_id)?.name ?? "the presenter";
  const presenterIsMe = !!current && current.member_id === meId;
  const name = (id: string) => memberById(id)?.name ?? "Someone";

  // A fresh drink on stage. Names are read when the line is spoken (the
  // member list can land a beat after the drink), so this only keys on the id.
  const latest = useRef({ current, presenter, presenterIsMe });
  latest.current = { current, presenter, presenterIsMe };
  useEffect(() => {
    if (!current?.id) return;
    const t = window.setTimeout(() => {
      const { current: d, presenter: who, presenterIsMe: mine } = latest.current;
      if (!d) return;
      const ingredient = d.ingredients?.find((i) => i.item.trim())?.item.trim();
      say(gameLine({ kind: "stage", presenter: who, drink: d.name || "mystery drink", ingredient, isMe: mine }), true);
    }, 1400);
    return () => window.clearTimeout(t);
  }, [current?.id, say]);

  // Pours coming in from around the table.
  const prevWaiting = useRef<{ drink: string; ids: string[] } | null>(null);
  const waitingKey = `${current?.id ?? ""}|${live?.waiting_on.join(",") ?? ""}`;
  useEffect(() => {
    if (!live || !current) return;
    const now = live.waiting_on;
    const prev = prevWaiting.current;
    prevWaiting.current = { drink: current.id, ids: now };
    // A new drink starts a fresh count; nothing to remark on yet.
    if (!prev || prev.drink !== current.id) return;
    const before = prev.ids;
    const finished = before.filter((id) => !now.includes(id) && id !== meId);
    let e: GameEvent | null = null;
    let force = false;
    if (before.length > 0 && now.length === 0) {
      e = { kind: "allIn", presenter, isMe: presenterIsMe };
      force = true;
    } else if (before.length > 1 && now.length === 1) {
      e = { kind: "lastOne", name: name(now[0]), isMe: now[0] === meId };
      force = true;
    } else if (finished.length && Math.random() < 0.55) {
      e = { kind: "finished", name: name(pick(finished)), left: now.length, presenterIsMe };
    }
    if (e) say(gameLine(e), force);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waitingKey]);
  // Reaction flurries and napkins from other people.
  const seen = useRef<Set<string> | null>(null);
  const lastHype = useRef(0);
  const feedKey = `${live?.reactions.length ?? 0}:${live?.comments.length ?? 0}:${live?.reactions.at(-1)?.id ?? ""}:${live?.comments.at(-1)?.id ?? ""}`;
  useEffect(() => {
    if (!live) return;
    const ids = [...live.reactions.map((r) => r.id), ...live.comments.map((c) => c.id)];
    if (!seen.current) {
      seen.current = new Set(ids);
      return;
    }
    const fresh = live.reactions.filter((r) => !seen.current!.has(r.id) && r.member_id !== meId);
    const notes = live.comments.filter((c) => !seen.current!.has(c.id) && c.member_id !== meId);
    ids.forEach((id) => seen.current!.add(id));
    const recent = live.reactions.filter((r) => Date.now() - new Date(r.created_at).getTime() < 8000);
    if (fresh.length && recent.length >= 4 && Date.now() - lastHype.current > 25000) {
      const counts = new Map<string, number>();
      recent.forEach((r) => counts.set(r.emoji, (counts.get(r.emoji) ?? 0) + 1));
      const emoji = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
      lastHype.current = Date.now();
      say(gameLine({ kind: "hype", emoji, presenter, isMe: presenterIsMe }));
    } else if (notes.length && Math.random() < 0.7) {
      const n = notes[notes.length - 1];
      say(gameLine({ kind: "napkin", name: name(n.member_id), text: n.text }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedKey]);

  // Your own pours: wait until you stop fiddling with the glass, then react to
  // where it settled. A 1 or a 10 always gets a remark, the middle only sometimes.
  useEffect(() => {
    let settle: number | undefined;
    const onPour = (ev: Event) => {
      const { category, score } = (ev as CustomEvent<{ category: CategoryKey; score: number }>).detail;
      window.clearTimeout(settle);
      settle = window.setTimeout(() => {
        const chance = score === 1 || score === 10 ? 1 : score <= 3 || score >= 8 ? 0.85 : 0.35;
        if (Math.random() > chance) return;
        say(gameLine({ kind: "pour", category, score, presenter, me: me?.name ?? "darling" }));
      }, 1300);
    };
    window.addEventListener(POUR_EVENT, onPour);
    return () => {
      window.clearTimeout(settle);
      window.removeEventListener(POUR_EVENT, onPour);
    };
  }, [presenter, me?.name, say]);

  // And if nothing's happened for a while, they fill the silence.
  useEffect(() => {
    if (!live || !current) return;
    const t = window.setInterval(() => {
      if (Date.now() - lastAt.current < IDLE_MS) return;
      const people = live.participants.map((p) => memberById(p.member_id)?.name).filter((n): n is string => !!n && n !== me?.name);
      say(gameLine({ kind: "idle", presenter, someone: people.length ? pick(people) : presenter, me: me?.name ?? "darling" }));
    }, 15000);
    return () => window.clearInterval(t);
  }, [live, current, presenter, me?.name, memberById, say]);

  return (
    <Portal>
      <AnimatePresence>
        {line && (
          <motion.button
            key={line.text}
            initial={{ y: -24, opacity: 0, scale: 0.92 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -16, opacity: 0 }}
            transition={{ type: "spring", damping: 18, stiffness: 260 }}
            onClick={() => setLine(null)}
            className="paper fixed inset-x-3 top-[calc(max(0.75rem,env(safe-area-inset-top))+2.6rem)] z-40 mx-auto flex max-w-md items-center gap-3 rounded-2xl px-3 py-2 text-left shadow-[0_14px_36px_rgba(0,0,0,0.6)]"
            aria-live="polite"
          >
            <span className="h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-gold bg-[#1a130d]">{line.who === "mabel" ? <Mabel portrait /> : <Jasper portrait />}</span>
            <span className="min-w-0">
              <span className="block font-display text-[15px] leading-snug text-ink">{line.text}</span>
              <span className="block font-deco text-[10px] font-bold tracking-widest text-ink/55">— {line.who === "mabel" ? "MABEL" : "JASPER"}</span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </Portal>
  );
}
