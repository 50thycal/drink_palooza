"use client";

import { useEffect, useRef, useState } from "react";
import { CATEGORIES, type CategoryKey } from "@/lib/constants";
import { clink, startPourSound } from "@/lib/sounds";
import { useTilt } from "@/lib/tilt";
import { GlassArt, levelToScore, levelY, scoreToLevel, Shaker } from "./art/Glass";

const POUR_SECONDS = 2.6; // empty → full while holding the bottle
const SWIPE_PX_PER_POINT = 28; // vertical finger travel per score point
const SWIPE_DEADZONE_PX = 6; // a tap isn't a swipe

/**
 * One glass on the bar and the bottle beside it. Two ways to score:
 *  - hold the bottle: it tips and pours, the level rises; let go to stop.
 *  - swipe up or down anywhere on the glass: nudge the score from where it
 *    is (about one point per finger-width), to top up or pour some back out.
 * Either way the level snaps to a whole score on release: empty glass = 1,
 * full to the rim = 10.
 */
export function PourRig({
  category,
  value,
  onCommit,
  disabled = false,
  footer,
}: {
  category: CategoryKey;
  value: number | null | undefined;
  onCommit: (score: number) => void;
  disabled?: boolean;
  /** Replaces the how-to hint once there's something better to show (the Next button). */
  footer?: React.ReactNode;
}) {
  const def = CATEGORIES.find((c) => c.key === category)!;
  const tilt = useTilt();
  const [level, setLevel] = useState<number | null>(value != null ? scoreToLevel(value) : null);
  const [pouring, setPouring] = useState(false);
  const [dragging, setDragging] = useState(false);
  const busy = pouring || dragging;
  const levelRef = useRef(level);
  levelRef.current = level;
  const stopSound = useRef<() => void>(() => {});
  const lastScore = useRef<number | null>(null);

  // Follow the server unless a hand is on the bottle.
  useEffect(() => {
    if (!busy) setLevel(value != null ? scoreToLevel(value) : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, category]);

  function stepFeedback(l: number) {
    const s = levelToScore(l);
    if (s !== lastScore.current) {
      lastScore.current = s;
      navigator.vibrate?.(6);
    }
  }

  function commit() {
    const l = levelRef.current ?? 0;
    const score = levelToScore(l);
    setLevel(scoreToLevel(score));
    if (score !== value) {
      onCommit(score);
      clink();
    }
  }

  // ---- hold the bottle to pour ----
  const raf = useRef(0);
  function startPour(e: React.PointerEvent) {
    if (disabled) return;
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setPouring(true);
    stopSound.current = startPourSound();
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setLevel((l) => {
        const next = Math.min(1, (l ?? 0) + dt / POUR_SECONDS);
        stepFeedback(next);
        return next;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }
  function endPour() {
    if (!pouring) return;
    cancelAnimationFrame(raf.current);
    stopSound.current();
    setPouring(false);
    commit();
  }
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  // ---- swipe up/down to adjust ----
  const swipe = useRef<{ y: number; from: number | null; moved: boolean } | null>(null);
  function startSwipe(e: React.PointerEvent) {
    if (disabled || pouring) return;
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    swipe.current = { y: e.clientY, from: levelRef.current, moved: false };
    setDragging(true);
  }
  function moveSwipe(e: React.PointerEvent) {
    const s = swipe.current;
    if (!s) return;
    const dy = s.y - e.clientY;
    if (!s.moved && Math.abs(dy) < SWIPE_DEADZONE_PX) return;
    s.moved = true;
    const l = Math.max(0, Math.min(1, (s.from ?? 0) + dy / (SWIPE_PX_PER_POINT * 9)));
    stepFeedback(l);
    setLevel(l);
  }
  function endSwipe() {
    const s = swipe.current;
    if (!s) return;
    swipe.current = null;
    setDragging(false);
    if (s.moved) commit();
    else setLevel(s.from);
  }

  const shown = level != null ? levelToScore(level) : null;

  return (
    <div className="relative select-none" style={{ touchAction: "none" }}>
      {/* the readout */}
      <div className="pointer-events-none absolute left-1 top-0 z-10">
        <div className="font-deco text-[11px] font-bold tracking-[0.3em] text-champagne/70">{def.glass.toUpperCase()}</div>
        <div className="flex items-baseline gap-1">
          <span className="gold-text font-display text-[64px] leading-none">{shown ?? "–"}</span>
          <span className="font-display text-xl text-champagne/60">/10</span>
        </div>
        {def.weight > 1 && <div className="mt-1 inline-block rounded-full border border-gold px-2 py-0.5 font-deco text-[11px] font-bold text-gold">COUNTS ×{def.weight}</div>}
      </div>

      <svg
        viewBox="0 -170 200 430"
        className="mx-auto block w-full"
        // Sized to what's left between the Now Serving header and the bar
        // tray, so the glass, the pour button and Next all fit without a scroll.
        style={{ cursor: "ns-resize", height: "clamp(190px, 100dvh - 590px, 400px)" }}
        aria-label={`${def.label} glass, ${shown ?? "not poured"}. Swipe up or down to adjust.`}
        onPointerDown={startSwipe}
        onPointerMove={moveSwipe}
        onPointerUp={endSwipe}
        onPointerCancel={endSwipe}
      >
        <defs>
          <linearGradient id="rig-bar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#6a3420" />
            <stop offset="1" stopColor="#2a130b" />
          </linearGradient>
        </defs>
        {/* bar top the glass stands on */}
        <rect x={-60} y={246} width={320} height={20} fill="url(#rig-bar)" />
        <ellipse cx={100} cy={249} rx={70} ry={5} fill="#000" opacity={0.35} />

        {/* gauge: gold ticks for 1–10 beside the glass */}
        <g>
          {Array.from({ length: 10 }, (_, i) => {
            const y = levelY(category, i / 9);
            const on = shown != null && i + 1 <= shown;
            return (
              <g key={i}>
                <line x1={182} x2={i % 9 === 0 || i === 4 ? 196 : 191} y1={y} y2={y} stroke={on ? "#f3d77a" : "rgba(212,175,55,0.35)"} strokeWidth={1.5} />
                {(i === 0 || i === 4 || i === 9) && (
                  <text x={199} y={y + 3.5} fontSize={9} fill="rgba(233,215,165,0.7)" textAnchor="end" style={{ fontFamily: "var(--font-body)" }} transform={`translate(0 ${i === 9 ? 10 : i === 0 ? -6 : 0})`}>
                    {i + 1}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        <GlassArt category={category} level={level ?? 0} empty={level == null} tilt={tilt} pouring={pouring && (level ?? 0) < 1} perfect={shown === 10} />
        <Shaker tipped={pouring} />

        {/* hit areas */}
        <rect
          x={120}
          y={-170}
          width={80}
          height={140}
          fill="transparent"
          onPointerDown={(e) => {
            e.stopPropagation();
            startPour(e);
          }}
          onPointerUp={(e) => {
            e.stopPropagation();
            endPour();
          }}
          onPointerCancel={endPour}
          onContextMenu={(e) => e.preventDefault()}
          style={{ cursor: "pointer" }}
        />
      </svg>

      <div className="mt-1 flex items-center justify-center gap-3">
        <button
          onClick={() => {
            if (disabled) return;
            const s = Math.max(1, (shown ?? 2) - 1);
            setLevel(scoreToLevel(s));
            if (s !== value) onCommit(s);
          }}
          className="btn-ghost h-11 w-11 rounded-full bg-black/40 text-xl"
          aria-label="Pour a little out"
        >
          −
        </button>
        <button
          onPointerDown={startPour}
          onPointerUp={endPour}
          onPointerCancel={endPour}
          onPointerLeave={endPour}
          onContextMenu={(e) => e.preventDefault()}
          disabled={disabled}
          className="btn-gold h-12 flex-1 max-w-[220px] rounded-full text-base select-none"
          style={{ touchAction: "none", WebkitUserSelect: "none" }}
        >
          {pouring ? "Pouring…" : level == null ? "Hold to pour" : "Hold to top up"}
        </button>
        <button
          onClick={() => {
            if (disabled) return;
            const s = Math.min(10, (shown ?? 0) + 1);
            setLevel(scoreToLevel(s));
            if (s !== value) onCommit(s);
          }}
          className="btn-ghost h-11 w-11 rounded-full bg-black/40 text-xl"
          aria-label="Add a splash"
        >
          +
        </button>
      </div>
      {footer ?? <p className="mt-2 text-center text-xs text-champagne/55">Hold the bottle to pour · swipe up or down to adjust · empty = 1, full = 10</p>}
    </div>
  );
}
