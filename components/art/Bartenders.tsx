"use client";

import { useId } from "react";

/**
 * Mabel and Jasper, the house bartenders. Painted-poster style: soft
 * gradients for skin and fabric, gold linework for the Deco trim.
 *
 * Built on figure-drawing proportions (Loomis): shoulders about two heads
 * wide (a little more for him), upper arm about 1.5 heads, forearm about
 * one, hands three-quarters of a head, and elbows hanging at the waist,
 * which is where a bar top meets a standing bartender.
 *
 * `portrait` crops the same drawing to head and shoulders for the little
 * cameo that pops up during the game.
 */

/** Both drawings share one frame so they line up behind one bar. */
export const VIEW_W = 240;
export const VIEW_H = 290;
/** Where the bar top meets them: waist height, about where elbows hang. */
export const BAR_Y = 262;
const VIEWBOX = `-20 0 ${VIEW_W} ${VIEW_H}`;

/**
 * "body" is everything behind the counter; "front" is whatever rests on the
 * bar top (drawn again over the counter so hands sit on it, not behind it).
 */
export type Layer = "all" | "body" | "front";

/** Gradient ids must be unique per drawing: there can be several on screen. */
function useIds() {
  const raw = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (name: string) => `${name}-${raw}`;
}

/** Points along a quadratic curve, for strings of pearls and beads. */
function along(n: number, [x0, y0]: number[], [cx, cy]: number[], [x1, y1]: number[]) {
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    const u = 1 - t;
    return [u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1];
  });
}

export function Mabel({ shaking = false, portrait = false, layer = "all" }: { shaking?: boolean; portrait?: boolean; layer?: Layer }) {
  const id = useIds();
  const url = (n: string) => `url(#${id(n)})`;
  const ink = "#3a2416";
  return (
    <svg viewBox={portrait ? "60 14 82 82" : VIEWBOX} className="h-full w-auto" aria-label="Mabel, the flapper bartender">
      <defs>
        <radialGradient id={id("face")} cx="0.46" cy="0.42" r="0.62">
          <stop offset="0" stopColor="#fff1e6" />
          <stop offset="0.55" stopColor="#f8dcc8" />
          <stop offset="1" stopColor="#e6b89c" />
        </radialGradient>
        <linearGradient id={id("body")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#e3b598" />
          <stop offset="0.35" stopColor="#f8dcc8" />
          <stop offset="0.65" stopColor="#f6d6c0" />
          <stop offset="1" stopColor="#dcab8e" />
        </linearGradient>
        <linearGradient id={id("hair")} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#fbeab0" />
          <stop offset="0.45" stopColor="#e9c46a" />
          <stop offset="1" stopColor="#b28a3b" />
        </linearGradient>
        <linearGradient id={id("hairBack")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c99e48" />
          <stop offset="1" stopColor="#8a6628" />
        </linearGradient>
        <linearGradient id={id("dress")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#082b25" />
          <stop offset="0.5" stopColor="#156352" />
          <stop offset="1" stopColor="#082b25" />
        </linearGradient>
        <linearGradient id={id("arm")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#d9a689" />
          <stop offset="0.45" stopColor="#f8dcc8" />
          <stop offset="1" stopColor="#d29f82" />
        </linearGradient>
        <linearGradient id={id("glove")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#050505" />
          <stop offset="0.45" stopColor="#3a3a3e" />
          <stop offset="0.6" stopColor="#141416" />
          <stop offset="1" stopColor="#050505" />
        </linearGradient>
        <linearGradient id={id("steel")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8d8a84" />
          <stop offset="0.3" stopColor="#f7f5ef" />
          <stop offset="0.55" stopColor="#bdb9b0" />
          <stop offset="1" stopColor="#6f6c66" />
        </linearGradient>
        <linearGradient id={id("lip")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c8173f" />
          <stop offset="1" stopColor="#8a0c2c" />
        </linearGradient>
        <radialGradient id={id("iris")} cx="0.45" cy="0.4" r="0.6">
          <stop offset="0" stopColor="#9ad8d2" />
          <stop offset="0.7" stopColor="#3f8a8c" />
          <stop offset="1" stopColor="#21494d" />
        </radialGradient>
        <radialGradient id={id("blush")}>
          <stop offset="0" stopColor="#ff8f9e" stopOpacity="0.45" />
          <stop offset="1" stopColor="#ff8f9e" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id("feather")} x1="0" y1="1" x2="0.6" y2="0">
          <stop offset="0" stopColor="#fff8ea" />
          <stop offset="1" stopColor="#e8dcc2" />
        </linearGradient>
      </defs>

      {layer !== "front" && (
        <>
      {/* the back of the bob */}
      <path d="M62,76 C58,40 80,19 102,19 C127,19 145,40 141,78 C140,96 134,108 124,113 L78,113 C68,108 62,96 62,76 Z" fill={url("hairBack")} />

      {/* neck: real width, shadow under the jaw */}
      <path d="M87,90 L113,90 L116,130 L84,130 Z" fill={url("body")} />
      <path d="M87,94 C94,104 106,104 113,94 L113,107 C106,113 94,113 87,107 Z" fill="#c99478" opacity={0.45} />

      {/* shoulders and chest: a woman's shoulders are about two heads wide */}
      <path d="M100,120 C92,120 86,123 80,127 C68,133 54,137 45,143 C36,150 32,160 32,174 L60,186 L140,186 L168,174 C168,160 164,150 155,143 C146,137 132,133 120,127 C114,123 108,120 100,120 Z" fill={url("body")} />
      <g fill="none" stroke="#c9937a" strokeLinecap="round" opacity={0.55}>
        <path d="M64,137 C74,139 86,141 96,140" strokeWidth={1.2} />
        <path d="M136,137 C126,139 114,141 104,140" strokeWidth={1.2} />
        <path d="M100,146 L100,154" strokeWidth={0.8} />
      </g>

      {/* sleeveless beaded dress, straight 1920s cut */}
      <path d="M50,300 L50,184 C50,170 54,158 60,150 L70,138 L80,138 C86,156 92,170 100,178 C108,170 114,156 120,138 L130,138 L140,150 C146,158 150,170 150,184 L150,300 Z" fill={url("dress")} />
      <path d="M80,138 C86,156 92,170 100,178 C108,170 114,156 120,138" fill="none" stroke="#e8c45c" strokeWidth={1.6} />
      <path d="M70,138 L80,138 M120,138 L130,138" stroke="#e8c45c" strokeWidth={1.2} />
      <g fill="#7fe0c8" opacity={0.35}>
        {Array.from({ length: 84 }, (_, i) => {
          const col = i % 12;
          const row = Math.floor(i / 12);
          return <circle key={i} cx={56 + col * 8 + (row % 2) * 4} cy={190 + row * 10} r={0.9} />;
        })}
      </g>
      <g fill="none" stroke="#e8c45c" strokeLinecap="round" strokeLinejoin="round">
        <path d="M54,200 L70,190 L85,200 L100,190 L115,200 L130,190 L146,200" strokeWidth={1.4} />
        <path d="M53,210 L70,200 L85,210 L100,200 L115,210 L130,200 L147,210" strokeWidth={1} opacity={0.7} />
        {[-60, -40, -20, 0, 20, 40, 60].map((a) => (
          <line key={a} x1={100} y1={262} x2={100 + Math.sin((a * Math.PI) / 180) * 34} y2={262 - Math.cos((a * Math.PI) / 180) * 34} strokeWidth={1} opacity={0.85} />
        ))}
        <path d="M70,262 A30,30 0 0 1 130,262" strokeWidth={1.3} />
      </g>
      {/* a slight shadow where the arms meet the body */}
      <path d="M56,182 C54,210 54,236 54,262" stroke="#04140f" strokeWidth={4} opacity={0.5} fill="none" />
      <path d="M144,182 C146,210 146,236 146,262" stroke="#04140f" strokeWidth={4} opacity={0.5} fill="none" />

      {/* pearls: a choker strand and a long knotted rope */}
      {along(17, [87, 128], [100, 156], [113, 128]).map(([x, y], i) => (
        <circle key={`s${i}`} cx={x} cy={y} r={2} fill="#fffaf0" stroke="#c9bd9e" strokeWidth={0.4} />
      ))}
      {along(36, [84, 128], [100, 326], [116, 128]).map(([x, y], i) => (
        <circle key={`l${i}`} cx={x} cy={y} r={2.3} fill="#fffaf0" stroke="#c9bd9e" strokeWidth={0.4} />
      ))}
      {along(7, [100, 226], [95, 238], [92, 252]).map(([x, y], i) => (
        <circle key={`t${i}`} cx={x} cy={y} r={2.1} fill="#fffaf0" stroke="#c9bd9e" strokeWidth={0.4} />
      ))}

      {/* her right arm hangs to the bar: upper arm ~1.4 heads, opera glove from mid-arm */}
      <path d="M45,142 C34,146 28,158 28,174 C28,186 29,198 30,208 L56,208 C56,196 57,186 57,178 C57,162 53,150 45,142 Z" fill={url("arm")} />
      <path d="M36,150 C32,160 31,172 32,184" fill="none" stroke="#fff3ea" strokeWidth={1.4} opacity={0.6} />
      <path d="M30,204 C30,222 31,240 33,258 L57,260 C56,242 56,222 56,204 Z" fill={url("glove")} />
      <path d="M30,205 Q43,199 56,205" fill="none" stroke="#3a3a40" strokeWidth={1.3} />
      <path d="M35,212 C35,228 36,244 38,256" fill="none" stroke="#77777e" strokeWidth={1.1} opacity={0.6} />

      {/* face */}
      <path d="M77,64 C77,42 88,33 100,33 C112,33 123,42 123,64 C123,82 115,97 100,100 C85,97 77,82 77,64 Z" fill={url("face")} />
      <path d="M78,72 C80,86 88,96 100,100 C93,95 85,86 82,72 Z" fill="#d9a88c" opacity={0.35} />
      <path d="M122,72 C120,86 112,96 100,100 C107,95 115,86 118,72 Z" fill="#d9a88c" opacity={0.35} />
      <ellipse cx={86} cy={79} rx={8} ry={5.5} fill={url("blush")} />
      <ellipse cx={114} cy={79} rx={8} ry={5.5} fill={url("blush")} />

      {/* eyes: smoky lids, sea-green irises, long lashes */}
      {[0, 1].map((side) => {
        return (
          <g key={side} transform={side ? "translate(200 0) scale(-1 1)" : undefined}>
            <path d="M80,63 C84,57 94,57 98,63 C94,61 85,61 80,63 Z" fill="#7d5a6e" opacity={0.4} />
            <path d="M82,66 Q89,60.6 96.5,65.6 Q89.5,70 82,66 Z" fill="#fdf9f3" />
            <circle cx={89.6} cy={65.6} r={2.9} fill={url("iris")} />
            <circle cx={89.6} cy={65.6} r={1.3} fill="#0f0c0b" />
            <circle cx={90.6} cy={64.6} r={0.75} fill="#fff" />
            <path d="M81.5,65.8 Q89,59.6 97,65.4" fill="none" stroke={ink} strokeWidth={1.7} strokeLinecap="round" />
            <path d="M83.5,67.6 Q89.5,70.2 95.5,67.4" fill="none" stroke="#b98670" strokeWidth={0.6} />
            <g stroke={ink} strokeWidth={0.8} strokeLinecap="round">
              <line x1={82.2} y1={65} x2={79.6} y2={63} />
              <line x1={83.6} y1={63.6} x2={81.6} y2={61} />
              <line x1={85.4} y1={62.4} x2={84.2} y2={59.6} />
            </g>
            {/* pencilled, downturned brows */}
            <path d="M79.5,56.5 C84,52.6 92,52.4 97.5,55.6" fill="none" stroke="#8a6526" strokeWidth={1.2} strokeLinecap="round" />
          </g>
        );
      })}

      {/* nose */}
      <path d="M100.6,63 C100,70 98.2,75 98.6,77.2 Q100.4,79.2 103,77.8" fill="none" stroke="#c8937a" strokeWidth={1} strokeLinecap="round" />
      <ellipse cx={101.6} cy={70} rx={0.8} ry={4} fill="#fff" opacity={0.35} />

      {/* cupid's-bow lips */}
      <path d="M92.6,86.6 Q95.6,83.6 98.4,85 Q100,84.2 101.6,85 Q104.4,83.6 107.4,86.6 Q100,87.8 92.6,86.6 Z" fill={url("lip")} />
      <path d="M93,86.8 Q100,93.4 107,86.8 Q100,88.4 93,86.8 Z" fill={url("lip")} />
      <path d="M93,86.8 Q100,88.2 107,86.8" fill="none" stroke="#5a0718" strokeWidth={0.7} />
      <ellipse cx={101.5} cy={89.8} rx={2.2} ry={0.8} fill="#fff" opacity={0.35} />
      <circle cx={109.5} cy={81} r={0.85} fill="#3a2416" />

      {/* platinum-gold finger waves, side parted */}
      <path d="M75,62 C72,35 90,23 105,24 C123,25 133,40 127,64 C124,52 118,45 110,43 C102,41 93,45 87,49 C82,53 78,57 75,62 Z" fill={url("hair")} />
      <path d="M75,58 C68,72 68,94 75,106 C79,112 86,112 87,107 C81,101 79,92 80,82 C81,72 80,64 78,58 Z" fill={url("hair")} />
      <path d="M125,58 C132,72 132,94 125,106 C121,112 114,112 113,107 C119,101 121,92 120,82 C119,72 120,64 122,58 Z" fill={url("hair")} />
      <g fill="none" strokeLinecap="round">
        <path d="M80,48 C86,40 94,40 98,44 C102,48 110,46 114,40" stroke="#9c7531" strokeWidth={1.4} />
        <path d="M78,56 C84,48 92,48 96,52 C100,56 108,54 114,48 C118,46 122,48 125,52" stroke="#9c7531" strokeWidth={1.4} />
        <path d="M84,34 C92,30 100,32 104,36 C108,40 116,38 120,33" stroke="#9c7531" strokeWidth={1.2} />
        <path d="M82,45 C88,38 94,38 97,41" stroke="#fff4c8" strokeWidth={1.4} opacity={0.85} />
        <path d="M88,30 C94,27 100,29 103,32" stroke="#fff4c8" strokeWidth={1.2} opacity={0.85} />
        <path d="M100,52 C104,50 109,48 112,45" stroke="#fff4c8" strokeWidth={1.2} opacity={0.8} />
        <path d="M73,72 C77,76 76,82 72,86 C76,90 77,96 73,100" stroke="#9c7531" strokeWidth={1.2} />
        <path d="M127,72 C123,76 124,82 128,86 C124,90 123,96 127,100" stroke="#9c7531" strokeWidth={1.2} />
        <path d="M75,66 C79,70 78,76 75,80" stroke="#fff4c8" strokeWidth={1} opacity={0.7} />
        <path d="M125,66 C121,70 122,76 125,80" stroke="#fff4c8" strokeWidth={1} opacity={0.7} />
      </g>
      {/* kiss curls on the cheeks */}
      <path d="M81,84 C77,84 76,90 80,91.5 C83,92.5 84.5,88.6 82,87.6" fill="none" stroke="#c99e48" strokeWidth={1.8} strokeLinecap="round" />
      <path d="M119,84 C123,84 124,90 120,91.5 C117,92.5 115.5,88.6 118,87.6" fill="none" stroke="#c99e48" strokeWidth={1.8} strokeLinecap="round" />

      {/* rhinestone headband, brooch and ostrich plume */}
      <path d="M73,60 Q100,44 129,55" fill="none" stroke="#1b1b1f" strokeWidth={4.4} strokeLinecap="round" />
      <g fill="#f8f4ea">
        {along(13, [75, 58.6], [100, 43.6], [127, 54.6]).map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={1.05} />
        ))}
      </g>
      {/* ostrich plume: a soft curved frond with wispy barbs */}
      <path d="M119,49 C110,36 112,16 126,6 C134,0 144,-2 152,0 C152,12 147,24 140,33 C134,41 127,47 123,51 Z" fill={url("feather")} opacity={0.95} />
      <g fill="none" stroke="#fffaf0" strokeLinecap="round" opacity={0.9}>
        {Array.from({ length: 14 }, (_, i) => {
          const t = i / 13;
          const x = 121 + 26 * t;
          const y = 49 - 47 * t;
          return (
            <g key={i}>
              <path d={`M${x - 6 + 10 * t * t},${y + 2} q${-7 + t * 3},${-1} ${-10 + t * 4},${-6}`} strokeWidth={1.2} />
              <path d={`M${x + 4 - t * 2},${y + 2} q${7 - t * 3},${0} ${9 - t * 3},${-5}`} strokeWidth={1.2} />
            </g>
          );
        })}
      </g>
      <g fill="none" stroke="#d9cba8" strokeWidth={0.7} opacity={0.8}>
        <path d="M118,40 C120,28 126,18 134,12" />
        <path d="M126,44 C132,34 138,26 146,14" />
      </g>
      <path d="M121,49 C127,34 136,18 151,1" fill="none" stroke="#c6b48c" strokeWidth={1} />
      <circle cx={120} cy={50} r={5.2} fill="#1d8f86" stroke="#e8c45c" strokeWidth={1.8} />
      <circle cx={118.6} cy={48.6} r={1.4} fill="#c9fff6" />
      <g stroke="#e8c45c" strokeWidth={1.2}>
        <line x1={120} y1={56} x2={118} y2={62} />
        <line x1={122.5} y1={55.6} x2={123.6} y2={61} />
      </g>


      {/* her left arm: elbow down at her side, forearm up, shaking at shoulder height */}
      <g style={shaking ? { animation: "shake-it 0.5s ease-in-out infinite", transformOrigin: "182px 246px", transformBox: "view-box" } : undefined}>
        <path d="M146,152 C147,142 165,139 171,147 C176,163 179,179 181,195 L159,201 C155,186 150,170 146,152 Z" fill={url("arm")} />
        <path d="M167,150 C172,164 175,178 177,190" fill="none" stroke="#fff3ea" strokeWidth={1.4} opacity={0.6} />
        <path d="M159,200 L181,194 C185,211 189,228 192,243 C192,252 184,257 176,254 L172,249 C168,232 163,216 159,200 Z" fill={url("glove")} />
        <path d="M159,201 Q170,194 181,195" fill="none" stroke="#3a3a40" strokeWidth={1.3} />
        {/* forearm, in front of the upper arm */}
        <path d="M171,249 C168,224 165,196 164,170 L180,167 C183,192 189,218 195,240 C195,252 179,257 171,249 Z" fill={url("glove")} />
        <path d="M188,232 C185,214 182,196 180,176" fill="none" stroke="#77777e" strokeWidth={1.2} opacity={0.7} />
        <ellipse cx={172} cy={172} rx={9.5} ry={3.6} transform="rotate(-8 172 172)" fill="none" stroke="#e8c45c" strokeWidth={2.4} />
        {/* cobbler shaker: ~30 cm of steel, gripped round the tin */}
        <g transform="rotate(-8 172 150)">
          <path d="M157,170 L187,170 L184,118 L160,118 Z" fill={url("steel")} stroke="#56534d" strokeWidth={0.9} />
          <path d="M160,118 L184,118 L178,106 L166,106 Z" fill={url("steel")} stroke="#56534d" strokeWidth={0.9} />
          <path d="M166,106 L178,106 L176,93 L168,93 Z" fill={url("steel")} stroke="#56534d" strokeWidth={0.9} />
          <rect x={166.5} y={84} width={11} height={10} rx={3} fill="#e8c45c" stroke="#9c7531" strokeWidth={0.6} />
          <rect x={158.6} y={128} width={27} height={3.6} fill="#e8c45c" />
          <path d="M163,122 L161,168" stroke="#fff" strokeWidth={1.8} opacity={0.7} />
          {/* gloved hand: four fingers wrapped round, thumb over the front */}
          <path d="M155,146 C153,138 158,134 166,134 L180,134 C188,134 191,140 190,148 C189,158 186,166 178,167 L164,167 C157,166 155,156 155,146 Z" fill="#0b0b0c" />
          <path d="M156,143 L190,143 M156,151 L190,151 M157,159 L188,159" stroke="#2c2c31" strokeWidth={1} />
          <path d="M158,136 C166,132 176,132 186,137 C182,142 172,144 160,141 Z" fill="#1b1b1f" />
          <path d="M160,137 C168,134.6 176,134.6 184,137.4" fill="none" stroke="#5a5a62" strokeWidth={0.9} />
        </g>
      </g>
        </>
      )}
      {layer !== "body" && !portrait && (
        <>
      {/* on the bar top, in front of the counter's edge: forearm laid along the bar, hand flat */}
      <path d="M30,256 C34,250 50,250 58,254 C68,258 80,260 90,260 L92,272 C76,272 58,272 44,270 C32,268 26,262 30,256 Z" fill={url("glove")} />
      <path d="M40,258 C54,260 70,264 88,264" fill="none" stroke="#77777e" strokeWidth={1.1} opacity={0.6} />
      <path d="M86,258 C94,254 108,254 116,258 C121,261 121,268 116,271 L90,272 C84,270 82,262 86,258 Z" fill="#0b0b0c" />
      <path d="M100,257 L101,271 M107,257 L109,271 M113,259 L116,270" stroke="#2c2c31" strokeWidth={1} />
      <path d="M88,259 C93,256 99,256 103,258" fill="none" stroke="#5a5a62" strokeWidth={0.9} />
      <ellipse cx={84} cy={265} rx={4} ry={8.4} fill="none" stroke="#e8c45c" strokeWidth={2.4} />
      <ellipse cx={79} cy={265} rx={3.6} ry={8} fill="none" stroke="#b8902f" strokeWidth={1.6} />
        </>
      )}
    </svg>
  );
}

export function Jasper({ polishing = false, portrait = false, layer = "all" }: { polishing?: boolean; portrait?: boolean; layer?: Layer }) {
  const id = useIds();
  const url = (n: string) => `url(#${id(n)})`;
  return (
    <svg viewBox={portrait ? "58 8 84 84" : VIEWBOX} className="h-full w-auto" aria-label="Jasper, the dapper bartender">
      <defs>
        <radialGradient id={id("face")} cx="0.46" cy="0.4" r="0.66">
          <stop offset="0" stopColor="#ecbf97" />
          <stop offset="0.55" stopColor="#d9a277" />
          <stop offset="1" stopColor="#b67d55" />
        </radialGradient>
        <linearGradient id={id("skin")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9a277" />
          <stop offset="1" stopColor="#ad7450" />
        </linearGradient>
        <linearGradient id={id("arm")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e2ae84" />
          <stop offset="0.5" stopColor="#c98f64" />
          <stop offset="1" stopColor="#9c6643" />
        </linearGradient>
        <radialGradient id={id("hand")} cx="0.45" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#e6b38a" />
          <stop offset="1" stopColor="#b47a52" />
        </radialGradient>
        <linearGradient id={id("hair")} x1="0" y1="0" x2="1" y2="0.4">
          <stop offset="0" stopColor="#0b0806" />
          <stop offset="0.45" stopColor="#2b211b" />
          <stop offset="0.6" stopColor="#120d0a" />
          <stop offset="1" stopColor="#050403" />
        </linearGradient>
        <linearGradient id={id("shirt")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#cfc6b4" />
          <stop offset="0.3" stopColor="#f8f4ec" />
          <stop offset="0.7" stopColor="#f3eee4" />
          <stop offset="1" stopColor="#c9bfac" />
        </linearGradient>
        <linearGradient id={id("vest")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2a0a10" />
          <stop offset="0.5" stopColor="#6a1d29" />
          <stop offset="1" stopColor="#2a0a10" />
        </linearGradient>
        <radialGradient id={id("iris")} cx="0.45" cy="0.4" r="0.6">
          <stop offset="0" stopColor="#8a5a2c" />
          <stop offset="1" stopColor="#3a220f" />
        </radialGradient>
        <linearGradient id={id("sleeve")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#b3a78f" />
          <stop offset="0.35" stopColor="#f8f4ec" />
          <stop offset="0.7" stopColor="#e9e2d5" />
          <stop offset="1" stopColor="#a99d86" />
        </linearGradient>
        <pattern id={id("pin")} width="5" height="10" patternUnits="userSpaceOnUse">
          <line x1="2.5" y1="0" x2="2.5" y2="10" stroke="#e8c45c" strokeWidth="0.35" opacity="0.35" />
        </pattern>
      </defs>

      {layer !== "front" && (
        <>
      {/* thick neck: a muscular man's neck is nearly as wide as his jaw */}
      <path d="M81,84 L119,84 L123,128 L77,128 Z" fill={url("skin")} />
      <path d="M82,88 C92,100 108,100 118,88 L119,104 C108,111 92,111 81,104 Z" fill="#8f5a3a" opacity={0.42} />
      <g fill="none" stroke="#8f5a3a" strokeLinecap="round" opacity={0.45}>
        <path d="M88,100 C92,110 96,118 98,126" strokeWidth={1.4} />
        <path d="M112,100 C108,110 104,118 102,126" strokeWidth={1.4} />
      </g>

      {/* shirt: trapezius slope, shoulders ~2.1 heads across, chest tapering to the waist */}
      <path d="M100,112 C90,112 84,115 77,118 C62,123 44,128 33,137 C21,147 15,161 15,178 L40,190 L160,190 L185,178 C185,161 179,147 167,137 C156,128 138,123 123,118 C116,115 110,112 100,112 Z" fill={url("shirt")} />
      <path d="M38,176 C40,210 46,240 50,264 L50,300 L150,300 L150,264 C154,240 160,210 162,176 Z" fill={url("shirt")} />
      <g fill="none" stroke="#cfc5b2" strokeLinecap="round">
        <path d="M46,138 C54,132 64,126 76,121" strokeWidth={1.2} />
        <path d="M154,138 C146,132 136,126 124,121" strokeWidth={1.2} />
      </g>

      {/* vest, pinstriped, with a watch chain */}
      <path d="M58,140 C68,130 78,124 86,120 L100,198 L100,300 L52,300 C52,262 50,232 49,206 C48,178 50,154 58,140 Z" fill={url("vest")} />
      <path d="M142,140 C132,130 122,124 114,120 L100,198 L100,300 L148,300 C148,262 150,232 151,206 C152,178 150,154 142,140 Z" fill={url("vest")} />
      <path d="M52,300 L52,206 C50,178 50,154 58,140 L86,120 L100,198 L114,120 L142,140 C150,154 150,178 148,206 L148,300 Z" fill={url("pin")} />
      <path d="M86,120 L100,198 L114,120" fill="none" stroke="#e8c45c" strokeWidth={1.3} />
      <path d="M58,140 C64,170 72,190 100,198 C128,190 136,170 142,140" fill="none" stroke="#1a0508" strokeWidth={1} opacity={0.5} />
      <path d="M62,232 L80,230 M120,230 L138,232" stroke="#e8c45c" strokeWidth={1.4} strokeLinecap="round" />
      {[208, 224, 240, 256].map((y) => (
        <g key={y}>
          <circle cx={100} cy={y} r={2.8} fill="#e8c45c" />
          <circle cx={99.2} cy={y - 0.8} r={1} fill="#fff6cf" />
        </g>
      ))}
      <path d="M100,240 C108,250 120,250 128,236" fill="none" stroke="#e8c45c" strokeWidth={1.2} strokeDasharray="1.8 1.3" />

      {/* collar and bow tie */}
      <path d="M85,114 L100,130 L91,142 L78,122 Z" fill="#fff" stroke="#cfc6b4" strokeWidth={0.9} />
      <path d="M115,114 L100,130 L109,142 L122,122 Z" fill="#fff" stroke="#cfc6b4" strokeWidth={0.9} />
      <path d="M100,129 L83,119 C81,126 81,134 83,140 Z" fill="#111" />
      <path d="M100,129 L117,119 C119,126 119,134 117,140 Z" fill="#111" />
      <path d="M85,122 L96,128 M85,137 L96,130 M115,122 L104,128 M115,137 L104,130" stroke="#333" strokeWidth={0.8} />
      <rect x={95.5} y={124.5} width={9} height={9} rx={2.6} fill="#1d1d1d" />

      {/* upper arms (~1.3 heads, elbows at the waist), shirtsleeves with gold garters */}
      {[0, 1].map((side) => (
        <g key={side} transform={side ? "translate(200 0) scale(-1 1)" : undefined}>
          <path d="M40,131 C24,133 12,147 12,169 C12,195 16,226 20,252 L49,255 C51,236 55,214 55,196 C55,174 53,150 40,131 Z" fill={url("sleeve")} />
          <path d="M54,188 C54,212 51,234 49,255" fill="none" stroke="#8e8371" strokeWidth={1.5} />
          <path d="M20,150 C26,140 34,135 44,133" fill="none" stroke="#fffdf8" strokeWidth={2.2} opacity={0.75} />
          <path d="M17,198 C22,190 30,186 38,186" fill="none" stroke="#b5a990" strokeWidth={1.1} />
          <path d="M12,182 Q33,172 55,179" fill="none" stroke="#e8c45c" strokeWidth={4} strokeLinecap="round" />
          <path d="M12,182 Q33,172 55,179" fill="none" stroke="#9c7531" strokeWidth={0.8} strokeLinecap="round" />
          {/* rolled cuff just above the elbow */}
          <path d="M17,228 C27,222 43,224 52,230 L50,246 C40,240 28,240 19,244 Z" fill="#ece5d8" stroke="#b9ad96" strokeWidth={0.9} />
          <path d="M18,236 C28,232 42,233 51,238" fill="none" stroke="#b9ad96" strokeWidth={0.8} />
        </g>
      ))}

      {/* forearms come forward from the elbows (foreshortened): left hand on the stem, right hand polishing */}
      <g style={polishing ? { animation: "polish 1.6s ease-in-out infinite", transformOrigin: "100px 220px", transformBox: "view-box" } : undefined}>
        <path d="M20,246 C30,232 58,226 82,226 L88,248 C70,252 52,260 38,266 C26,264 18,256 20,246 Z" fill={url("arm")} />
        <path d="M26,242 C40,234 58,231 78,231" fill="none" stroke="#f0c39b" strokeWidth={1.6} opacity={0.55} />
        <path d="M34,254 C48,248 62,244 78,242" fill="none" stroke="#8f5a3a" strokeWidth={1.1} opacity={0.5} />
        <path d="M50,240 C56,238 62,239 68,236" fill="none" stroke="#9e6845" strokeWidth={0.8} opacity={0.6} />
        <path d="M180,246 C176,230 150,212 132,196 L118,210 C130,226 144,246 156,262 C168,264 180,258 180,246 Z" fill={url("arm")} />
        <path d="M174,240 C164,226 150,212 136,201" fill="none" stroke="#f0c39b" strokeWidth={1.6} opacity={0.55} />
        <path d="M162,252 C152,238 140,224 128,212" fill="none" stroke="#8f5a3a" strokeWidth={1.1} opacity={0.5} />
        {/* coupe: an 11 cm bowl, held by the stem */}
        <path d="M80,186 C80,202 90,210 100,210 C110,210 120,202 120,186 Z" fill="rgba(220,235,255,0.22)" stroke="#f0f6ff" strokeWidth={1.4} />
        <ellipse cx={100} cy={186} rx={20} ry={3.4} fill="rgba(255,255,255,0.12)" stroke="#f0f6ff" strokeWidth={1.2} />
        <path d="M85,190 C87,200 92,205 98,206" fill="none" stroke="#fff" strokeWidth={1.4} opacity={0.6} />
        <line x1={100} y1={210} x2={100} y2={240} stroke="#f0f6ff" strokeWidth={2.2} />
        {/* left hand round the stem: fingers wrapped, thumb on top */}
        <path d="M80,228 C84,222 98,221 106,226 C110,232 110,244 104,249 C97,254 85,253 80,247 C76,241 76,233 80,228 Z" fill={url("hand")} />
        <path d="M82,234 L106,233 M81,240 L107,240 M83,246 L104,246" stroke="#9e6845" strokeWidth={0.9} opacity={0.75} />
        <path d="M84,227 C90,222 99,222 104,227" fill="none" stroke="#8f5a3a" strokeWidth={1.1} />
        {/* right hand under a bar towel, wiping the bowl */}
        <path d="M106,180 C112,170 130,170 138,180 C143,188 141,202 132,210 L118,214 C110,210 104,192 106,180 Z" fill={url("hand")} />
        <path d="M104,184 C110,174 126,172 136,180 C140,190 136,202 126,208 C118,208 110,200 108,194 Z" fill="#f7f1e3" stroke="#cfc4ab" strokeWidth={1} />
        <path d="M110,186 C116,182 126,182 132,186 M112,195 C118,192 126,192 131,195" fill="none" stroke="#d8ccb2" strokeWidth={0.9} />
        <path d="M128,206 C131,222 128,238 122,248 L134,250 C140,236 140,220 136,204 Z" fill="#f7f1e3" stroke="#cfc4ab" strokeWidth={1} />
        <path d="M125,240 L136,241" stroke="#9e2b36" strokeWidth={1.6} opacity={0.75} />
      </g>

      {/* ears */}
      {[0, 1].map((side) => (
        <g key={side} transform={side ? "translate(200 0) scale(-1 1)" : undefined}>
          <path d="M77,56 C71,52 69,62 71,68 C72,73 75,76 78,75 Z" fill={url("skin")} />
          <path d="M76,59 C73,58 72,64 74,68" fill="none" stroke="#8f5a3a" strokeWidth={1} />
        </g>
      ))}

      {/* square jaw, strong chin */}
      <path d="M77,54 C77,32 88,22 100,22 C112,22 123,32 123,54 C123,68 121,80 116,88 C111,95 106,98 100,98 C94,98 89,95 84,88 C79,80 77,68 77,54 Z" fill={url("face")} />
      {/* five o'clock shadow on the jaw */}
      <path d="M79,70 C80,82 86,92 94,96 C97,97.5 103,97.5 106,96 C114,92 120,82 121,70 C118,82 112,90 106,92 C102,93.4 98,93.4 94,92 C88,90 82,82 79,70 Z" fill="#3c3a40" opacity={0.18} />
      <path d="M92,90 C95,94 105,94 108,90 C106,96 94,96 92,90 Z" fill="#3c3a40" opacity={0.12} />
      {/* cheekbones */}
      <path d="M80,66 C84,74 88,78 92,79" fill="none" stroke="#a96f4a" strokeWidth={1.4} opacity={0.35} />
      <path d="M120,66 C116,74 112,78 108,79" fill="none" stroke="#a96f4a" strokeWidth={1.4} opacity={0.35} />
      <path d="M99.4,94 L100,97" stroke="#9e6845" strokeWidth={0.8} opacity={0.7} />

      {/* eyes: dark, hooded, steady */}
      {[0, 1].map((side) => (
        <g key={side} transform={side ? "translate(200 0) scale(-1 1)" : undefined}>
          <path d="M83,58 C86,55.6 93,55.4 96.6,58.4 C92,57.6 87,57.8 83,58 Z" fill="#7e4e33" opacity={0.5} />
          <path d="M83.6,61.2 Q89.6,57.2 96,60.8 Q89.8,64.6 83.6,61.2 Z" fill="#fbf4ea" />
          <circle cx={90} cy={61} r={2.5} fill={url("iris")} />
          <circle cx={90} cy={61} r={1.15} fill="#0b0705" />
          <circle cx={90.9} cy={60.1} r={0.65} fill="#fff" />
          <path d="M83.2,61 Q89.6,56.6 96.4,60.4" fill="none" stroke="#1d120b" strokeWidth={1.6} strokeLinecap="round" />
          <path d="M84.6,62.8 Q90,65.4 95.2,62.6" fill="none" stroke="#9e6845" strokeWidth={0.6} />
          {/* thick, straight brows */}
          <path d="M81,53.4 C85,50 92,49.6 97.6,51.6 L97,54.2 C92,52.8 86,53.4 81.6,55.6 Z" fill="#120c08" />
        </g>
      ))}

      {/* strong straight nose */}
      <path d="M97.6,58 C97.4,64 96.4,70 95.4,74.2 C95,76.6 96.8,78.2 99,78 C100.6,78.8 103,78.4 104.4,76.8" fill="none" stroke="#9e6845" strokeWidth={1.1} strokeLinecap="round" />
      <path d="M102,60 C102.4,66 103.2,70 104,73" fill="none" stroke="#a96f4a" strokeWidth={1.2} opacity={0.4} />
      <ellipse cx={99.8} cy={67} rx={0.9} ry={4.8} fill="#fff" opacity={0.25} />
      <path d="M95.6,76.4 Q97.2,77.8 98.4,77 M104.4,76.6 Q103,77.8 101.8,77" stroke="#6e4128" strokeWidth={1} fill="none" />

      {/* tight, clean-cut pencil moustache */}
      <path d="M89.6,82.4 C92.6,80.2 96.4,79.8 99.2,80.8 L99.2,82 C96.6,81.4 93,81.8 89.6,82.4 Z" fill="#120c08" />
      <path d="M110.4,82.4 C107.4,80.2 103.6,79.8 100.8,80.8 L100.8,82 C103.4,81.4 107,81.8 110.4,82.4 Z" fill="#120c08" />
      {/* lips, a hint of a smirk */}
      <path d="M91.6,85 Q96,83.8 100,84.6 Q104.6,83.6 109.4,84 Q104,86.4 100,86.2 Q95.6,86.4 91.6,85 Z" fill="#9c5a44" />
      <path d="M92.6,85.6 Q100,90.4 107.6,85.4 Q100,87.6 92.6,85.6 Z" fill="#b06a52" />
      <path d="M109.4,84 Q110.6,83.2 111.2,82.4" stroke="#7a4430" strokeWidth={0.8} fill="none" strokeLinecap="round" />

      {/* slicked-back black hair, sharp side part, short sides */}
      <path d="M77,50 C75,40 76,34 79,30 L78,46 Z" fill="#2b211b" opacity={0.7} />
      <path d="M123,50 C125,40 124,34 121,30 L122,46 Z" fill="#2b211b" opacity={0.7} />
      <path d="M76,46 C74,22 88,9 104,9 C121,9 131,22 125,46 C123,37 119,31 112,28 C104,25 92,26 86,30 C81,34 78,40 76,46 Z" fill={url("hair")} />
      <path d="M88,12 C86,17 85,23 85,29" fill="none" stroke="#b67d55" strokeWidth={0.9} opacity={0.7} />
      <g fill="none" strokeLinecap="round">
        <path d="M89,15 C98,11 112,12 120,20" stroke="#4d3e33" strokeWidth={1} />
        <path d="M90,20 C99,16 112,17 122,26" stroke="#4d3e33" strokeWidth={1} />
        <path d="M89,25 C98,21 110,22 123,32" stroke="#4d3e33" strokeWidth={1} />
        <path d="M94,13 C102,10.6 110,11.4 116,15" stroke="#8a7a6d" strokeWidth={1.4} opacity={0.8} />
        <path d="M80,30 C81,24 84,18 87,14" stroke="#4d3e33" strokeWidth={1} />
      </g>
        </>
      )}
    </svg>
  );
}

// ---- The back bar ------------------------------------------------------------

/** The wall reaches this far above the bartenders' frame, in the same units. */
export const WALL_TOP = -420;

type Rng = () => number;
function mulberry(seed: number): Rng {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const choose = <T,>(r: Rng, xs: readonly T[]) => xs[Math.floor(r() * xs.length)];

/**
 * Real bottles at real size. The frame is about 3.3 units per cm (Mabel's
 * head is ~23 cm), and the back wall sits a step behind them, so everything
 * on it is drawn at 85%. [height cm, width cm, neck cm, shoulder style]
 */
const BOTTLES = {
  fifth: [30, 8, 9, "round"], // the everyday 750 ml
  litre: [33, 8.5, 10, "round"],
  square: [27, 9, 6, "square"], // Tennessee-style whiskey
  wine: [31, 7.5, 11, "slope"], // vermouth, aperitifs
  slim: [34, 6.5, 12, "slope"], // cordials, absinthe
  flask: [20, 9.5, 5, "square"], // squat liqueur flask
  half: [22, 6.5, 7, "round"], // 375 ml
  bitters: [13, 5, 4, "round"], // bitters with a paper label
  decanter: [24, 11, 4, "decanter"], // cut-glass with a ball stopper
} as const;
type Kind = keyof typeof BOTTLES;
const KINDS = Object.keys(BOTTLES) as Kind[];
const WEIGHTS: Record<Kind, number> = { fifth: 6, litre: 2, square: 3, wine: 3, slim: 2, flask: 2, half: 2, bitters: 2, decanter: 1 };

/** Glass colour, and what's inside it. */
const GLASS: { glass: string; alpha: number; liquid: string | null }[] = [
  { glass: "#8a4a12", alpha: 0.9, liquid: "#b8661a" }, // bourbon in amber
  { glass: "#c9d6d9", alpha: 0.32, liquid: "#c27a26" }, // whiskey, clear glass
  { glass: "#c9d6d9", alpha: 0.32, liquid: null }, // gin, vodka
  { glass: "#c9d6d9", alpha: 0.32, liquid: "#c41e3a" }, // bitter red aperitivo
  { glass: "#c9d6d9", alpha: 0.32, liquid: "#b7c43a" }, // chartreuse
  { glass: "#1f5b37", alpha: 0.88, liquid: "#3a5a1c" }, // green glass
  { glass: "#0f3a26", alpha: 0.92, liquid: null },
  { glass: "#1d3f8f", alpha: 0.85, liquid: null }, // cobalt gin
  { glass: "#7d1328", alpha: 0.85, liquid: null }, // ruby
  { glass: "#4a3b30", alpha: 0.9, liquid: "#6b3510" }, // dark rum
  { glass: "#c9d6d9", alpha: 0.3, liquid: "#7a5ab3" }, // crème de violette
  { glass: "#c9d6d9", alpha: 0.3, liquid: "#2f7fd8" }, // blue curaçao
  { glass: "#c9d6d9", alpha: 0.3, liquid: "#5fae4c" }, // absinthe
  { glass: "#e9e2d0", alpha: 0.95, liquid: null }, // milk glass
  { glass: "#5b2e0e", alpha: 0.92, liquid: null }, // amaro
];
const LABELS = ["#efe3c6", "#f5f1e8", "#121212", "#a3202c", "#d4af37", "#1c4d4d", "#e8d9b0", "#2a1a3e"];
const CAPS = ["#d4af37", "#b8902f", "#7a0f1c", "#1a1a1a", "#c9b38a", "#8c8c8c"];

function pickKind(r: Rng): Kind {
  const total = KINDS.reduce((a, k) => a + WEIGHTS[k], 0);
  let n = r() * total;
  for (const k of KINDS) if ((n -= WEIGHTS[k]) < 0) return k;
  return "fifth";
}

function Bottle({ x, y, kind, seed }: { x: number; y: number; kind: Kind; seed: number }) {
  // Each bottle rolls its own dice so a re-render can never reshuffle the bar.
  const r = mulberry(seed);
  const U = 3.3 * 0.85;
  const [hc, wc, nc, shoulder] = BOTTLES[kind];
  const h = hc * U * (0.94 + r() * 0.12);
  const w = wc * U * (0.94 + r() * 0.12);
  const neck = nc * U;
  const nw = kind === "decanter" ? w * 0.28 : Math.max(2.4 * U, w * (kind === "flask" ? 0.3 : 0.32));
  const g = choose(r, kind === "decanter" ? GLASS.filter((c) => c.alpha < 0.5) : GLASS);
  const x0 = x;
  const x1 = x + w;
  const cx = x + w / 2;
  const top = y - h;
  const sh = shoulder === "square" ? 3 : shoulder === "slope" ? h * 0.22 : shoulder === "decanter" ? w * 0.42 : h * 0.12;
  const yn = top + neck; // neck base
  const ys = yn + sh; // shoulder start
  const n0 = cx - nw / 2;
  const n1 = cx + nw / 2;
  const body =
    shoulder === "decanter"
      ? `M${x0 + 2},${y} C${x0 - 2},${y - h * 0.3} ${x0},${ys} ${n0},${yn} L${n0},${top + 4} L${n1},${top + 4} L${n1},${yn} C${x1},${ys} ${x1 + 2},${y - h * 0.3} ${x1 - 2},${y} Z`
      : `M${x0},${y - 1.5} L${x0},${ys} C${x0},${ys - sh * 0.7} ${n0},${yn + sh * 0.35} ${n0},${yn} L${n0},${top} L${n1},${top} L${n1},${yn} C${n1},${yn + sh * 0.35} ${x1},${ys - sh * 0.7} ${x1},${ys} L${x1},${y - 1.5} Q${x1},${y} ${x1 - 1.5},${y} L${x0 + 1.5},${y} Q${x0},${y} ${x0},${y - 1.5} Z`;
  const level = ys + (y - ys) * (0.05 + r() * 0.75);
  const labelKind = r();
  const lc = choose(r, LABELS);
  const capC = choose(r, CAPS);
  const lh = (y - ys) * (0.35 + r() * 0.25);
  const ly = ys + (y - ys) * (0.3 + r() * 0.15);
  return (
    <g>
      <path d={body} fill={g.glass} fillOpacity={g.alpha} stroke="#000" strokeOpacity={0.35} strokeWidth={0.6} />
      {g.liquid && <rect x={x0 + 1.2} y={level} width={w - 2.4} height={y - level - 1.2} fill={g.liquid} opacity={0.85} />}
      {/* label: a plain band, an oval, or a tall paper label */}
      {kind === "decanter" ? (
        <path d={`M${cx - 6},${y - h * 0.35} l6,-5 l6,5 l-6,5 Z`} fill="#d4af37" opacity={0.8} />
      ) : labelKind < 0.45 ? (
        <rect x={x0 + 1.5} y={ly} width={w - 3} height={lh} rx={1} fill={lc} opacity={0.92} />
      ) : labelKind < 0.75 ? (
        <ellipse cx={cx} cy={ly + lh / 2} rx={w / 2 - 2} ry={lh / 2} fill={lc} opacity={0.92} />
      ) : (
        <>
          <rect x={x0 + 2} y={ly} width={w - 4} height={lh * 0.6} fill={lc} opacity={0.9} />
          <rect x={n0 - 0.5} y={yn + 1} width={nw + 1} height={3} fill={choose(r, LABELS)} opacity={0.9} />
        </>
      )}
      {labelKind < 0.75 && kind !== "decanter" && <line x1={x0 + 3} x2={x1 - 3} y1={ly + lh * 0.45} y2={ly + lh * 0.45} stroke={lc === "#121212" ? "#d4af37" : "#6b5a40"} strokeWidth={0.8} opacity={0.7} />}
      {/* cap, cork, wax or stopper */}
      {kind === "decanter" ? (
        <circle cx={cx} cy={top + 1} r={nw * 0.75} fill="#c9d6d9" fillOpacity={0.45} stroke="#000" strokeOpacity={0.3} strokeWidth={0.5} />
      ) : capC === "#7a0f1c" ? (
        <path d={`M${n0 - 0.6},${top + 5} L${n0 - 0.6},${top - 1} L${n1 + 0.6},${top - 1} L${n1 + 0.6},${top + 5} q-1,4 -2,0 q-1.5,3 -3,0 Z`} fill={capC} />
      ) : (
        <rect x={n0 - 0.5} y={top - 2} width={nw + 1} height={Math.min(neck * 0.45, 9)} rx={1} fill={capC} />
      )}
      {/* the shine down one side */}
      <rect x={x0 + w * 0.16} y={ys + 2} width={Math.max(1.2, w * 0.08)} height={(y - ys) * 0.75} fill="#fff" opacity={0.22} rx={0.6} />
    </g>
  );
}

/** A little champagne tower of coupes, waiting their turn. */
function Coupes({ x, y }: { x: number; y: number }) {
  const U = 3.3 * 0.85;
  const bw = 11 * U; // bowl across
  const gh = 13 * U; // foot to rim
  const glass = (gx: number, gy: number, k: string) => {
    const rim = gy - gh;
    return (
      <g key={k} stroke="#e8f0f5" strokeOpacity={0.6} strokeWidth={0.9}>
        <path d={`M${gx - bw / 2},${rim} C${gx - bw / 2},${rim + gh * 0.42} ${gx + bw / 2},${rim + gh * 0.42} ${gx + bw / 2},${rim} Z`} fill="#e8f0f5" fillOpacity={0.12} />
        <line x1={gx} y1={rim + gh * 0.31} x2={gx} y2={gy} />
        <path d={`M${gx - bw * 0.28},${gy} Q${gx},${gy - 2} ${gx + bw * 0.28},${gy}`} fill="none" />
      </g>
    );
  };
  return (
    <g>
      {[0, 1, 2].map((i) => glass(x + i * bw * 1.02, y, `a${i}`))}
      {[0, 1].map((i) => glass(x + bw * 0.51 + i * bw * 1.02, y - gh, `b${i}`))}
      {glass(x + bw * 1.02, y - gh * 2, "c")}
    </g>
  );
}

/**
 * The back bar, in the bartenders' own units so the bottles are bottle-sized
 * next to them: mirrored Deco panels, three lit glass shelves, and a jumble
 * of real shapes, colours and fill levels. Seeded, so it's the same bar on
 * every phone.
 */
export function BackBar() {
  const r = mulberry(1920);
  const shelves = [150, 10, -130];
  const panels = Array.from({ length: 10 }, (_, i) => -500 + i * 120);
  return (
    <svg viewBox={`-500 ${WALL_TOP} 1200 ${VIEW_H - WALL_TOP}`} preserveAspectRatio="xMidYMax slice" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="bb-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0d0907" />
          <stop offset="1" stopColor="#1c130c" />
        </linearGradient>
        <linearGradient id="bb-mirror" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2a2119" />
          <stop offset="0.5" stopColor="#1a140f" />
          <stop offset="1" stopColor="#261d15" />
        </linearGradient>
        <linearGradient id="bb-brass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3d77a" />
          <stop offset="1" stopColor="#7a5a17" />
        </linearGradient>
        <linearGradient id="bb-light" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#ffb547" stopOpacity="0.32" />
          <stop offset="1" stopColor="#ffb547" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x={-500} y={WALL_TOP} width={1200} height={VIEW_H - WALL_TOP} fill="url(#bb-wall)" />
      {/* arched mirror panels with a sunburst crown */}
      {panels.map((x) => (
        <g key={x}>
          <path d={`M${x + 8},${VIEW_H} L${x + 8},${WALL_TOP + 110} Q${x + 60},${WALL_TOP + 40} ${x + 112},${WALL_TOP + 110} L${x + 112},${VIEW_H} Z`} fill="url(#bb-mirror)" stroke="#d4af37" strokeOpacity={0.35} strokeWidth={1.2} />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <line key={i} x1={x + 60} y1={WALL_TOP + 112} x2={x + 14 + i * 15.3} y2={WALL_TOP + 76 + Math.abs(i - 3) * 9} stroke="#d4af37" strokeOpacity={0.18} strokeWidth={0.8} />
          ))}
        </g>
      ))}
      {shelves.map((sy, s) => {
        const items: React.ReactNode[] = [];
        let x = -500 + r() * 10;
        let k = 0;
        while (x < 700) {
          if (s === 0 && r() < 0.06) {
            items.push(<Coupes key={k++} x={x + 16} y={sy} />);
            x += 110;
            continue;
          }
          const kind = pickKind(r);
          const w = BOTTLES[kind][1] * 3.3 * 0.85;
          items.push(<Bottle key={k} x={x} y={sy} kind={kind} seed={s * 1000 + k} />);
          k++;
          x += w + 2 + r() * (r() < 0.15 ? 30 : 9);
        }
        return (
          <g key={sy}>
            <rect x={-500} y={sy - 110} width={1200} height={110} fill="url(#bb-light)" />
            {items}
            <rect x={-500} y={sy} width={1200} height={3.5} fill="url(#bb-brass)" />
            <rect x={-500} y={sy + 3.5} width={1200} height={6} fill="#000" opacity={0.35} />
          </g>
        );
      })}
    </svg>
  );
}
