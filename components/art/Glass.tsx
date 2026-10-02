"use client";

import { useId } from "react";
import type { CategoryKey } from "@/lib/constants";

/**
 * The four glasses, one per category, drawn in a shared coordinate space
 * (viewBox 0 -40 200 300; the bar surface is y≈248). Liquid is a big rect
 * clipped to the glass interior; its top edge is the score. Rotating that rect
 * against the phone's tilt keeps the surface level.
 */

interface GlassDef {
  outline: string;
  clip: string;
  bottom: number;
  top: number;
  liquid: [string, string];
  /** Where the stream from the bottle lands. */
  streamX: number;
}

export const GLASSES: Record<CategoryKey, GlassDef> = {
  // The Stoic: a heavy rocks glass, one big cube, amber.
  taste: {
    outline: "M34,104 L166,104 L157,248 L43,248 Z",
    clip: "M41,108 L159,108 L151,226 L49,226 Z",
    bottom: 226,
    top: 112,
    liquid: ["#e39a3b", "#7a3e0c"],
    streamX: 112,
  },
  // The Showpiece: a gold-rimmed coupe, rose pink, cherry on a pick.
  appearance: {
    outline: "M22,76 C22,128 60,148 100,148 C140,148 178,128 178,76 Z",
    clip: "M27,80 C27,126 62,143 100,143 C138,143 173,126 173,80 Z",
    bottom: 143,
    top: 82,
    liquid: ["#ff8ec0", "#c2185b"],
    streamX: 112,
  },
  // The Wild Card: a curvy hurricane, emerald, paper umbrella.
  creativity: {
    outline: "M62,26 C50,80 96,104 72,152 C54,190 68,224 100,226 C132,224 146,190 128,152 C104,104 150,80 138,26 Z",
    clip: "M66,30 C55,80 100,104 76,152 C59,189 71,220 100,222 C129,220 141,189 124,152 C100,104 145,80 134,30 Z",
    bottom: 222,
    top: 32,
    liquid: ["#5df2b0", "#0a6e4c"],
    streamX: 112,
  },
  // The Showstopper: a champagne flute, rising bubbles, a sparkler at ten.
  presentation: {
    outline: "M72,20 L128,20 C128,108 121,160 100,170 C79,160 72,108 72,20 Z",
    clip: "M76,23 L124,23 C124,106 118,156 100,165 C82,156 76,106 76,23 Z",
    bottom: 165,
    top: 24,
    liquid: ["#ffe9a3", "#d19b12"],
    streamX: 108,
  },
};

const GLASS_FILL = "rgba(220, 235, 255, 0.07)";
const GLASS_STROKE = "rgba(240, 248, 255, 0.75)";

export function levelY(key: CategoryKey, level: number) {
  const g = GLASSES[key];
  return g.bottom - (g.bottom - g.top) * Math.max(0, Math.min(1, level));
}

/** Score 1–10 ↔ fill 0–1. Empty glass = 1, full to the rim = 10. */
export const scoreToLevel = (score: number) => (score - 1) / 9;
export const levelToScore = (level: number) => Math.max(1, Math.min(10, Math.round(level * 9) + 1));

interface Props {
  category: CategoryKey;
  /** 0–1, continuous while pouring. */
  level: number;
  tilt?: number;
  /** Draw a stream falling from above (the bottle is tipped). */
  pouring?: boolean;
  /** Light the sparkler / extra flourishes at a perfect pour. */
  perfect?: boolean;
  /** Ghost the liquid (nothing poured yet). */
  empty?: boolean;
}

/** The glass as an SVG group, for composing into larger scenes. */
export function GlassArt({ category, level, tilt = 0, pouring = false, perfect = false, empty = false }: Props) {
  const uid = useId().replace(/:/g, "");
  const g = GLASSES[category];
  const y = levelY(category, level);
  const show = !empty && level > 0.004;
  const [c1, c2] = g.liquid;
  return (
    <g>
      <defs>
        <clipPath id={`clip-${uid}`}>
          <path d={g.clip} />
        </clipPath>
        <linearGradient id={`liq-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c1} />
          <stop offset="1" stopColor={c2} />
        </linearGradient>
        <linearGradient id={`shine-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="0.25" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.8" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.12" />
        </linearGradient>
      </defs>

      <Stem category={category} />

      {/* Glass body */}
      <path d={g.outline} fill={GLASS_FILL} />

      {/* Liquid */}
      <g clipPath={`url(#clip-${uid})`}>
        {show && (
          <g transform={`rotate(${-tilt} 100 ${y})`} style={{ transition: "transform 80ms linear" }}>
            <rect x={-120} y={y} width={440} height={420} fill={`url(#liq-${uid})`} opacity={0.92} />
            <g style={{ animation: "wave 2.2s linear infinite" }}>
              <path d={wavePath(y)} fill={c1} opacity={0.9} />
            </g>
            {category === "presentation" && <Bubbles y={y} bottom={g.bottom} />}
            {category === "taste" && <Bubbles y={y} bottom={g.bottom} sparse />}
          </g>
        )}
        {pouring && <rect x={g.streamX - 2.5} y={y - 6} width={5} height={12} fill={c1} opacity={0.7} />}
      </g>

      <Inside category={category} level={show ? level : 0} />

      {/* Glass outline and shine on top */}
      <path d={g.outline} fill={`url(#shine-${uid})`} stroke={GLASS_STROKE} strokeWidth={3} strokeLinejoin="round" />
      <Outside category={category} perfect={perfect} />

      {pouring && (
        <rect x={g.streamX - 2.5} y={-58} width={5} height={y + 58} rx={2.5} fill={c1} opacity={0.85}>
          <animate attributeName="width" values="5;3.5;5" dur="0.25s" repeatCount="indefinite" />
        </rect>
      )}
    </g>
  );
}

function wavePath(y: number) {
  let d = `M -120 ${y + 2}`;
  for (let x = -120; x < 340; x += 40) d += ` q 10 -5 20 0 t 20 0`;
  return `${d} L 340 ${y + 7} L -120 ${y + 7} Z`;
}

function Bubbles({ y, bottom, sparse = false }: { y: number; bottom: number; sparse?: boolean }) {
  const spots = sparse ? [62, 128] : [86, 96, 104, 112, 92, 108];
  return (
    <g>
      {spots.map((x, i) => (
        <circle
          key={i}
          cx={x}
          cy={bottom - 4}
          r={sparse ? 1.6 : 1.4 + (i % 3) * 0.5}
          fill="#fff"
          opacity={0.75}
          style={{
            animation: `rise ${1.6 + (i % 4) * 0.45}s ${i * 0.37}s linear infinite`,
            // Bubbles only travel as far as the surface.
            ["--h" as string]: `${bottom - y}px`,
          }}
        />
      ))}
    </g>
  );
}

function Stem({ category }: { category: CategoryKey }) {
  const glass = { fill: "rgba(220,235,255,0.14)", stroke: GLASS_STROKE, strokeWidth: 2.5 };
  switch (category) {
    case "taste":
      return null;
    case "appearance":
      return (
        <g>
          <path d="M95,147 L105,147 L103,234 L97,234 Z" {...glass} />
          <ellipse cx={100} cy={241} rx={48} ry={8} {...glass} />
        </g>
      );
    case "creativity":
      return (
        <g>
          <path d="M92,225 L108,225 L106,236 L94,236 Z" {...glass} />
          <ellipse cx={100} cy={242} rx={42} ry={7} {...glass} />
        </g>
      );
    case "presentation":
      return (
        <g>
          <path d="M97.5,169 L102.5,169 L102,234 L98,234 Z" {...glass} />
          <ellipse cx={100} cy={241} rx={36} ry={7} {...glass} />
        </g>
      );
  }
}

/** Things that sit inside the glass and should be drawn over the liquid. */
function Inside({ category, level }: { category: CategoryKey; level: number }) {
  if (category === "taste") {
    // One big clear cube. It floats a little once there's enough whisky.
    const lift = Math.max(0, level - 0.55) * 60;
    return (
      <g transform={`translate(0 ${-lift}) rotate(-7 101 184)`} style={{ transition: "transform 300ms ease" }}>
        <rect x={68} y={150} width={66} height={66} rx={9} fill="rgba(225,242,255,0.22)" stroke="rgba(255,255,255,0.65)" strokeWidth={2} />
        <path d="M74,158 L94,154" stroke="#fff" strokeOpacity={0.7} strokeWidth={3} strokeLinecap="round" />
      </g>
    );
  }
  return null;
}

/** Garnishes and flourishes outside the glass. */
function Outside({ category, perfect }: { category: CategoryKey; perfect: boolean }) {
  switch (category) {
    case "taste":
      return (
        <g stroke="rgba(255,255,255,0.12)" strokeWidth={2}>
          {[58, 79, 100, 121, 142].map((x) => (
            <line key={x} x1={x} y1={110} x2={x + (x - 100) * -0.06} y2={226} />
          ))}
          <path d="M43,232 L157,232" stroke="rgba(255,255,255,0.25)" />
        </g>
      );
    case "appearance":
      return (
        <g>
          <line x1={22} y1={76} x2={178} y2={76} stroke="#d4af37" strokeWidth={4.5} strokeLinecap="round" />
          <line x1={148} y1={48} x2={118} y2={128} stroke="#d4af37" strokeWidth={2.5} strokeLinecap="round" />
          <circle cx={130} cy={96} r={10} fill="#b3123f" stroke="#ff6b8f" strokeWidth={1.5} />
          <path d="M133,87 C140,70 150,64 158,58" fill="none" stroke="#3a7d2c" strokeWidth={2} />
          <circle cx={126} cy={92} r={2.5} fill="#fff" opacity={0.7} />
        </g>
      );
    case "creativity":
      return (
        <g>
          <line x1={150} y1={-12} x2={112} y2={120} stroke="#e9d7a5" strokeWidth={2.5} />
          <path d="M120,-8 Q150,-34 182,-10 Z" fill="#ff4fa3" stroke="#fff" strokeWidth={1.5} />
          <path d="M120,-8 Q137,-22 150,-22 L150,-12 Z M150,-22 Q166,-22 182,-10 L150,-12 Z" fill="#3ff2e0" opacity={0.85} />
          <circle cx={64} cy={28} r={15} fill="#ffb547" stroke="#fff3c4" strokeWidth={2} />
          {[0, 45, 90, 135].map((a) => (
            <line key={a} x1={64} y1={28} x2={64 + 13 * Math.cos((a * Math.PI) / 180)} y2={28 + 13 * Math.sin((a * Math.PI) / 180)} stroke="#fff3c4" strokeWidth={1} />
          ))}
        </g>
      );
    case "presentation":
      return perfect ? <Sparkler /> : null;
  }
}

function Sparkler() {
  const sparks = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2;
    return { x: 128 + Math.cos(a) * (10 + (i % 3) * 7), y: -26 + Math.sin(a) * (10 + (i % 3) * 7), d: (i % 5) * 0.12 };
  });
  return (
    <g>
      <line x1={108} y1={40} x2={128} y2={-26} stroke="#9b9b9b" strokeWidth={2.5} />
      <circle cx={128} cy={-26} r={6} fill="#fff6c9" />
      {sparks.map((s, i) => (
        <circle
          key={i}
          cx={s.x}
          cy={s.y}
          r={2.2}
          fill={i % 2 ? "#ffd36b" : "#fff"}
          style={{ animation: `sparkle 0.5s ${s.d}s ease-in-out infinite`, transformOrigin: `${s.x}px ${s.y}px`, transformBox: "view-box" }}
        />
      ))}
    </g>
  );
}

/** A small standalone glass (lists, results). */
export function GlassIcon({ category, score, size = 44 }: { category: CategoryKey; score: number | null | undefined; size?: number }) {
  return (
    <svg viewBox="0 -40 200 300" width={size} height={size * 1.5} aria-hidden>
      <GlassArt category={category} level={score != null ? scoreToLevel(score) : 0} empty={score == null} perfect={score === 10} />
    </svg>
  );
}

/**
 * The mixer bottle: an Art Deco cobbler shaker with engraved chevrons.
 * Upright it waits at the side; tipped, its spout lands over the glass.
 */
export function Shaker({ tipped }: { tipped: boolean }) {
  return (
    <g
      style={{
        transform: tipped ? "rotate(-122deg)" : "rotate(-8deg)",
        transformOrigin: "160px -96px",
        transformBox: "view-box",
        transition: "transform 380ms cubic-bezier(0.3, 1.4, 0.5, 1)",
      }}
    >
      <defs>
        <linearGradient id="shaker-metal" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#6d6a63" />
          <stop offset="0.3" stopColor="#f2efe6" />
          <stop offset="0.55" stopColor="#a8a49a" />
          <stop offset="1" stopColor="#4a4740" />
        </linearGradient>
        <linearGradient id="shaker-gold" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7a5a17" />
          <stop offset="0.35" stopColor="#f3d77a" />
          <stop offset="0.6" stopColor="#c89b2c" />
          <stop offset="1" stopColor="#6e4f12" />
        </linearGradient>
      </defs>
      {/* body */}
      <path d="M140,-52 L180,-52 L175,-120 L145,-120 Z" fill="url(#shaker-metal)" stroke="#2a2824" strokeWidth={1.5} />
      {/* engraved chevrons */}
      {[-66, -80, -94].map((y) => (
        <path key={y} d={`M147,${y} L160,${y - 8} L173,${y}`} fill="none" stroke="#3a372f" strokeOpacity={0.55} strokeWidth={1.5} />
      ))}
      {/* gold band + shoulder */}
      <rect x={143} y={-128} width={34} height={9} rx={2} fill="url(#shaker-gold)" />
      <path d="M146,-128 L174,-128 L166,-146 L154,-146 Z" fill="url(#shaker-metal)" stroke="#2a2824" strokeWidth={1.5} />
      {/* cap */}
      <rect x={152} y={-156} width={16} height={11} rx={3} fill="url(#shaker-gold)" stroke="#2a2824" strokeWidth={1} />
      <rect x={140} y={-56} width={40} height={6} rx={2} fill="url(#shaker-gold)" />
    </g>
  );
}
