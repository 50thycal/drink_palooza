"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Member, Reaction } from "@/lib/types";
import { useViewportInsets } from "@/lib/useViewport";

// ---- Type & ornament -------------------------------------------------------

type NeonColor = "pink" | "teal" | "amber" | "gold";
const NEON: Record<NeonColor, string> = { pink: "var(--neon-pink)", teal: "var(--neon-teal)", amber: "var(--neon-amber)", gold: "#ffd76b" };

/** Glowing tube lettering. `script` uses the neon handwriting face. */
export function Neon({
  children,
  color = "pink",
  script = false,
  className = "",
  on = true,
  delay = 0,
}: {
  children: React.ReactNode;
  color?: NeonColor;
  script?: boolean;
  className?: string;
  on?: boolean;
  delay?: number;
}) {
  return (
    <span
      className={`${on ? "neon flicker-on" : "neon-off"} ${script ? "font-neon" : "font-display"} ${className}`}
      style={{ ["--glow" as string]: NEON[color], animationDelay: on ? `${delay}s, ${delay + 1.4}s` : undefined }}
    >
      {children}
    </span>
  );
}

export function DecoDivider({ className = "", ink = false }: { className?: string; ink?: boolean }) {
  const c = ink ? "var(--ink)" : "var(--gold)";
  return (
    <div className={`flex items-center gap-2 ${className}`} aria-hidden>
      <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${c})` }} />
      <svg width="34" height="12" viewBox="0 0 34 12">
        <path d="M0,6 L10,6 M24,6 L34,6" stroke={c} strokeWidth="1" />
        <path d="M17,0 L23,6 L17,12 L11,6 Z" fill="none" stroke={c} strokeWidth="1.2" />
        <path d="M17,3 L20,6 L17,9 L14,6 Z" fill={c} />
      </svg>
      <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${c}, transparent)` }} />
    </div>
  );
}

/** Art Deco sunburst fan, used behind headings and the champion. */
export function Sunburst({ className = "", rays = 15, opacity = 0.35 }: { className?: string; rays?: number; opacity?: number }) {
  return (
    <svg viewBox="0 0 200 100" className={className} aria-hidden preserveAspectRatio="xMidYMax meet">
      {Array.from({ length: rays }, (_, i) => {
        const a = Math.PI - (i / (rays - 1)) * Math.PI;
        return <line key={i} x1={100} y1={100} x2={100 + Math.cos(a) * 100} y2={100 - Math.sin(a) * 100} stroke="var(--gold)" strokeOpacity={opacity} strokeWidth={i % 2 ? 0.6 : 1.4} />;
      })}
      {[30, 55, 80].map((r) => (
        <path key={r} d={`M${100 - r},100 A${r},${r} 0 0 1 ${100 + r},100`} fill="none" stroke="var(--gold)" strokeOpacity={opacity} strokeWidth={0.8} />
      ))}
    </svg>
  );
}

// ---- People ----------------------------------------------------------------

export function Avatar({ member, size = 36, ring = false }: { member: Member | null | undefined; size?: number; ring?: boolean }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.52,
        background: `radial-gradient(circle at 35% 30%, ${member?.color ?? "#555"}55, #0d0b09 75%)`,
        boxShadow: `inset 0 0 0 1.5px ${member?.color ?? "#555"}${ring ? ", 0 0 0 2px #0d0b09, 0 0 0 3.5px var(--gold)" : ""}`,
      }}
      title={member?.name}
    >
      {member?.emoji ?? "?"}
    </span>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <div className={`h-9 w-9 animate-spin rounded-full border-2 border-gold/25 border-t-gold ${className}`} role="status" aria-label="Loading" />
  );
}

// ---- Coaster -----------------------------------------------------------------

export type CoasterStyle = "emerald" | "oxblood" | "onyx" | "cream";
const COASTERS: Record<CoasterStyle, { bg: string; ink: string; ring: string }> = {
  emerald: { bg: "#0f3d33", ink: "#f3d77a", ring: "#d4af37" },
  oxblood: { bg: "#6d1f2a", ink: "#f4ead5", ring: "#e9d7a5" },
  onyx: { bg: "#141210", ink: "#f3d77a", ring: "#d4af37" },
  cream: { bg: "#efe2c4", ink: "#2b1d12", ring: "#2b1d12" },
};

/**
 * A round printed bar coaster. These are the menu on the bar top. Tapping one
 * lifts it before the camera moves.
 */
export function Coaster({
  title,
  subtitle,
  icon,
  style = "emerald",
  size = 176,
  onClick,
  pulse = false,
  rotate = 0,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  style?: CoasterStyle;
  size?: number;
  onClick?: () => void;
  pulse?: boolean;
  rotate?: number;
}) {
  const c = COASTERS[style];
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 1.08, y: -6, rotate: rotate - 4 }}
      className="relative shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        rotate,
        background: `
          radial-gradient(circle, transparent 54%, ${c.ring}33 55%, transparent 56%),
          repeating-conic-gradient(from 0deg, ${c.ring}22 0deg 4deg, transparent 4deg 12deg),
          radial-gradient(circle at 35% 30%, ${c.bg}, ${c.bg} 60%, #000 140%)`,
        boxShadow: `0 10px 18px rgb(0 0 0 / 0.55), 0 2px 0 rgb(0 0 0 / 0.4), inset 0 0 0 3px ${c.bg}, inset 0 0 0 4.5px ${c.ring}, inset 0 0 0 9px ${c.bg}, inset 0 0 0 10px ${c.ring}88`,
        color: c.ink,
      }}
    >
      {pulse && <span className="pointer-events-none absolute -inset-2 animate-ping rounded-full border-2 border-neon-pink/70" />}
      <span className="absolute inset-[18%] flex flex-col items-center justify-center rounded-full" style={{ background: c.bg, boxShadow: `0 0 0 1px ${c.ring}66` }}>
        <span className="text-3xl leading-none">{icon}</span>
        <span className="mt-1.5 font-display text-[15px] leading-tight tracking-wide">{title}</span>
        {subtitle && <span className="mt-0.5 max-w-[88%] font-deco text-[10px] font-bold leading-tight tracking-wider opacity-80">{subtitle}</span>}
      </span>
    </motion.button>
  );
}

// ---- Sheet -----------------------------------------------------------------

/**
 * A menu-card sheet that slides up over a scene. Sized against the visible
 * viewport so its contents stay above the iOS keyboard.
 */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: React.ReactNode }) {
  const { height, keyboard } = useViewportInsets();
  const maxH = height ? height - 24 : undefined;
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-label={title}
            className="paper absolute inset-x-0 mx-auto flex max-w-lg flex-col rounded-t-2xl shadow-2xl"
            style={{ bottom: keyboard, maxHeight: maxH ?? "88dvh" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
          >
            <div className="deco-frame-ink pointer-events-none absolute inset-2 rounded-t-xl" />
            <div className="flex items-center justify-between px-5 pt-5 pb-2">
              <h2 className="font-display text-xl tracking-wide">{title}</h2>
              <button onClick={onClose} className="relative z-10 rounded-full px-3 py-1 font-deco text-sm font-bold" aria-label="Close">
                ✕
              </button>
            </div>
            <div className="relative overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---- Effects ---------------------------------------------------------------

export function Confetti({ pieces = 90 }: { pieces?: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: pieces }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 2.5,
        dur: 3 + Math.random() * 3,
        drift: (Math.random() - 0.5) * 160,
        spin: 360 + Math.random() * 900,
        color: ["#d4af37", "#f3d77a", "#ff4fa3", "#3ff2e0", "#f4ead5"][i % 5],
        w: 6 + Math.random() * 6,
      })),
    [pieces],
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden>
      {bits.map((b, i) => (
        <span
          key={i}
          className="absolute top-0 block"
          style={{
            left: `${b.left}%`,
            width: b.w,
            height: b.w * 0.45,
            background: b.color,
            animation: `confetti-fall ${b.dur}s ${b.delay}s linear infinite`,
            ["--drift" as string]: `${b.drift}px`,
            ["--spin" as string]: `${b.spin}deg`,
          }}
        />
      ))}
    </div>
  );
}

interface Floater {
  id: string;
  emoji: string;
  left: number;
  drift: number;
}

/**
 * Emoji drifting up the screen. Reactions from other phones arrive in the
 * shared state; this phone's own taps float immediately via `local`.
 */
export function FloatingReactions({ reactions, me, local }: { reactions: Reaction[]; me: string | null; local: { id: string; emoji: string }[] }) {
  const seen = useRef<Set<string>>(new Set());
  const primed = useRef(false);
  const [floaters, setFloaters] = useState<Floater[]>([]);

  useEffect(() => {
    // Don't replay the backlog that was already on screen when we arrived.
    if (!primed.current) {
      reactions.forEach((r) => seen.current.add(r.id));
      primed.current = true;
      return;
    }
    const fresh = reactions.filter((r) => !seen.current.has(r.id));
    fresh.forEach((r) => seen.current.add(r.id));
    const others = fresh.filter((r) => r.member_id !== me);
    if (others.length) spawn(others.map((r) => ({ id: r.id, emoji: r.emoji })));
  }, [reactions, me]);

  useEffect(() => {
    const fresh = local.filter((l) => !seen.current.has(l.id));
    fresh.forEach((l) => seen.current.add(l.id));
    if (fresh.length) spawn(fresh);
  }, [local]);

  function spawn(items: { id: string; emoji: string }[]) {
    const add = items.slice(-12).map((x) => ({ id: x.id, emoji: x.emoji, left: 12 + Math.random() * 76, drift: (Math.random() - 0.5) * 80 }));
    setFloaters((f) => [...f, ...add]);
    setTimeout(() => setFloaters((f) => f.filter((x) => !add.includes(x))), 3400);
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden" aria-hidden>
      {floaters.map((f) => (
        <span key={f.id} className="float-up absolute bottom-24 text-4xl" style={{ left: `${f.left}%`, ["--drift" as string]: `${f.drift}px` }}>
          {f.emoji}
        </span>
      ))}
    </div>
  );
}

// ---- Toast -----------------------------------------------------------------

let pushToast: ((msg: string) => void) | null = null;

/** Fire-and-forget message ("Couldn't save that pour"). */
export function toast(msg: string) {
  pushToast?.(msg);
}

export function Toaster() {
  const [msgs, setMsgs] = useState<{ id: number; msg: string }[]>([]);
  useEffect(() => {
    pushToast = (msg) => {
      const id = Date.now() + Math.random();
      setMsgs((m) => [...m, { id, msg }]);
      setTimeout(() => setMsgs((m) => m.filter((x) => x.id !== id)), 3200);
    };
    return () => {
      pushToast = null;
    };
  }, []);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[max(1rem,env(safe-area-inset-top))] z-[60] flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {msgs.map((m) => (
          <motion.div
            key={m.id}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="paper deco-frame-ink max-w-sm rounded-lg px-4 py-2 text-center font-deco text-sm font-bold shadow-xl"
          >
            {m.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/** Run an async action with a busy flag and a toast on failure. */
export function useBusy() {
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      toast((err as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return { busy, run };
}

/** Brass "back" plaque, top-left of every scene except the bar. */
export function BackPlaque({ onClick, label = "Bar" }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      className="btn-ghost fixed left-3 top-[max(0.75rem,env(safe-area-inset-top))] z-20 rounded-full bg-black/55 px-3.5 py-1.5 text-xs backdrop-blur"
    >
      ← {label}
    </button>
  );
}
