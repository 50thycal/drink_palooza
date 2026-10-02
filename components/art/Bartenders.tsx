"use client";

import { useId } from "react";

/**
 * Mabel and Jasper, the house bartenders. Painted-poster style: soft
 * gradients for skin and fabric, gold linework for the Deco trim. viewBox
 * 0 0 200 250; the bar counter is drawn by the scene in front of them, so
 * below ~y=215 is mostly hidden.
 *
 * `portrait` crops the same drawing to head and shoulders for the little
 * cameo that pops up during the game.
 */

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

export function Mabel({ shaking = false, portrait = false }: { shaking?: boolean; portrait?: boolean }) {
  const id = useIds();
  const url = (n: string) => `url(#${id(n)})`;
  const ink = "#3a2416";
  return (
    <svg viewBox={portrait ? "60 14 82 82" : "0 0 200 250"} className="h-full w-auto" aria-label="Mabel, the flapper bartender">
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

      {/* the back of the bob */}
      <path d="M62,76 C58,40 80,19 102,19 C127,19 145,40 141,78 C140,96 134,108 124,113 L78,113 C68,108 62,96 62,76 Z" fill={url("hairBack")} />

      {/* neck and shoulders */}
      <path d="M90,92 L110,92 L112,126 L88,126 Z" fill={url("body")} />
      <path d="M90,96 C95,103 105,103 110,96 L110,104 C105,108 95,108 90,104 Z" fill="#c99478" opacity={0.45} />
      <path d="M64,168 C62,148 68,136 80,130 C88,126 94,125 100,125 C106,125 112,126 120,130 C132,136 138,148 136,168 Z" fill={url("body")} />
      <g fill="none" stroke="#c9937a" strokeLinecap="round" opacity={0.55}>
        <path d="M80,134 Q89,138 96,135" strokeWidth={1.1} />
        <path d="M120,134 Q111,138 104,135" strokeWidth={1.1} />
      </g>

      {/* drop-waist beaded dress */}
      <path d="M68,250 C66,212 66,174 69,150 L78,132 L87,133 C91,148 95,157 100,160 C105,157 109,148 113,133 L122,132 L131,150 C134,174 134,212 132,250 Z" fill={url("dress")} />
      <path d="M78,132 C86,140 93,154 100,160 C107,154 114,140 122,132" fill="none" stroke="#e8c45c" strokeWidth={1.6} />
      {/* sequin shimmer */}
      <g fill="#7fe0c8" opacity={0.35}>
        {Array.from({ length: 54 }, (_, i) => {
          const col = i % 9;
          const row = Math.floor(i / 9);
          const x = 72 + col * 7 + (row % 2) * 3.5;
          const y = 166 + row * 7;
          return <circle key={i} cx={x} cy={y} r={0.9} />;
        })}
      </g>
      {/* Deco beadwork: chevrons and a fan at the hip */}
      <g fill="none" stroke="#e8c45c" strokeLinecap="round" strokeLinejoin="round">
        <path d="M72,176 L86,168 L100,176 L114,168 L128,176" strokeWidth={1.4} />
        <path d="M71,184 L86,176 L100,184 L114,176 L129,184" strokeWidth={1} opacity={0.7} />
        <path d="M68,204 L132,204" strokeWidth={2.4} />
        <path d="M68,209 L132,209" strokeWidth={1} />
        {[-56, -38, -19, 0, 19, 38, 56].map((a) => (
          <line key={a} x1={100} y1={240} x2={100 + Math.sin((a * Math.PI) / 180) * 30} y2={240 - Math.cos((a * Math.PI) / 180) * 30} strokeWidth={1} opacity={0.85} />
        ))}
        <path d="M76,240 A24,24 0 0 1 124,240" strokeWidth={1.2} />
      </g>
      {/* fringe */}
      <g stroke="#0d4a3e" strokeWidth={1.2}>
        {Array.from({ length: 32 }, (_, i) => (
          <line key={i} x1={69 + i * 2} y1={210} x2={68.5 + i * 2 + Math.sin(i) * 0.8} y2={226} />
        ))}
      </g>

      {/* resting arm: bare shoulder into a black satin opera glove, hand on the bar */}
      <path d="M68,134 C58,140 54,156 54,172 C54,182 55,190 58,196 L70,192 C68,182 68,170 70,158 C71,150 72,142 72,137 Z" fill={url("body")} />
      <path d="M66,140 C60,148 58,160 58,170" fill="none" stroke="#c9937a" strokeWidth={1} opacity={0.5} />
      <path d="M54,170 C53,184 55,194 60,202 C66,212 76,222 88,228 L95,218 C84,212 76,204 72,195 C69,187 69,178 70,170 Z" fill={url("glove")} />
      <path d="M54,170 Q62,166 70,170" fill="none" stroke="#3a3a40" strokeWidth={1.3} />
      <path d="M58,184 C61,198 70,210 84,220" fill="none" stroke="#77777e" strokeWidth={1} opacity={0.6} />
      <path d="M86,216 C92,214 98,218 98,224 C98,229 92,231 88,229 Z" fill="#0b0b0c" />
      <g>
        <ellipse cx={84} cy={222} rx={7.4} ry={3.8} transform="rotate(34 84 222)" fill="none" stroke="#e8c45c" strokeWidth={2.6} />
        <ellipse cx={80} cy={218} rx={7.4} ry={3.8} transform="rotate(34 80 218)" fill="none" stroke="#b8902f" strokeWidth={1.6} />
      </g>

      {/* pearls: a short strand and a long knotted rope */}
      {along(15, [88, 127], [100, 146], [112, 127]).map(([x, y], i) => (
        <circle key={`s${i}`} cx={x} cy={y} r={1.9} fill="#fffaf0" stroke="#c9bd9e" strokeWidth={0.4} />
      ))}
      {along(26, [86, 126], [100, 214], [114, 126]).map(([x, y], i) => (
        <circle key={`l${i}`} cx={x} cy={y} r={2.2} fill="#fffaf0" stroke="#c9bd9e" strokeWidth={0.4} />
      ))}
      {along(6, [100, 170], [96, 180], [94, 192]).map(([x, y], i) => (
        <circle key={`t${i}`} cx={x} cy={y} r={2} fill="#fffaf0" stroke="#c9bd9e" strokeWidth={0.4} />
      ))}

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

      {/* the shaking arm: bare shoulder, gloved from above the elbow, cobbler shaker in hand */}
      <g style={shaking ? { animation: "shake-it 0.5s ease-in-out infinite", transformOrigin: "160px 124px", transformBox: "view-box" } : undefined}>
        <path d="M128,132 C138,128 150,128 160,132 L164,146 C152,146 140,146 132,146 Z" fill={url("body")} />
        <path d="M134,134 C142,132 150,132 156,134" fill="none" stroke="#c9937a" strokeWidth={1} opacity={0.5} />
        {/* glove: upper arm to elbow, forearm rising to the hand */}
        <path d="M150,130 C158,128 166,130 170,136 C173,142 170,148 164,148 C158,148 152,146 150,144 Z" fill={url("glove")} />
        <path d="M160,132 C166,124 166,112 162,100 C160,94 158,90 156,88 L148,92 C150,98 152,106 153,114 C153,122 152,128 150,132 Z" fill={url("glove")} />
        <path d="M150,131 L151,145" stroke="#3a3a40" strokeWidth={1.3} />
        <path d="M162,128 C164,118 162,108 158,98" fill="none" stroke="#77777e" strokeWidth={1.1} opacity={0.7} />
        <ellipse cx={155} cy={100} rx={6.4} ry={2.8} transform="rotate(-16 155 100)" fill="none" stroke="#e8c45c" strokeWidth={2.2} />
        <g transform="rotate(-14 156 62)">
          <path d="M145,92 L167,92 L163.5,52 L148.5,52 Z" fill={url("steel")} stroke="#56534d" strokeWidth={0.9} />
          <path d="M148.5,52 L163.5,52 L160,41 L152,41 Z" fill={url("steel")} stroke="#56534d" strokeWidth={0.9} />
          <rect x={152.5} y={34} width={7} height={8} rx={2.4} fill="#e8c45c" stroke="#9c7531" strokeWidth={0.6} />
          <rect x={146.4} y={64} width={19.2} height={3.4} fill="#e8c45c" />
          <rect x={148} y={52} width={16} height={2} fill="#8d8a84" />
          <path d="M150.5,56 L149,90" stroke="#fff" strokeWidth={1.4} opacity={0.7} />
          {/* fingers wrapped round the tin */}
          <path d="M143,78 C139,78 139,90 144,90 L167,90 C171,90 171,78 167,78 Z" fill="#0b0b0c" />
          <path d="M144,82 L167,82 M144,86 L167,86" stroke="#34343a" strokeWidth={0.8} />
          <path d="M146,79 C150,78.4 160,78.4 165,79" stroke="#5a5a62" strokeWidth={0.8} fill="none" />
        </g>
      </g>
    </svg>
  );
}

export function Jasper({ polishing = false, portrait = false }: { polishing?: boolean; portrait?: boolean }) {
  const id = useIds();
  const url = (n: string) => `url(#${id(n)})`;
  return (
    <svg viewBox={portrait ? "58 8 84 84" : "0 0 200 250"} className="h-full w-auto" aria-label="Jasper, the dapper bartender">
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

      {/* thick neck, trapezius sloping into broad shoulders */}
      <path d="M84,86 L116,86 L120,118 L80,118 Z" fill={url("skin")} />
      <path d="M85,90 C92,100 108,100 115,90 L116,102 C108,108 92,108 84,102 Z" fill="#8f5a3a" opacity={0.4} />
      <path d="M97,104 Q100,108 103,104" fill="none" stroke="#8f5a3a" strokeWidth={0.9} opacity={0.6} />

      {/* shirt: broad chest and shoulders */}
      <path d="M46,250 C44,200 46,160 54,140 C60,130 68,124 80,120 L100,116 L120,120 C132,124 140,130 146,140 C154,160 156,200 154,250 Z" fill={url("shirt")} />
      {/* chest under the shirt */}
      <g fill="none" stroke="#cfc5b2" strokeLinecap="round">
        <path d="M60,150 C66,158 74,162 84,162" strokeWidth={1.4} />
        <path d="M140,150 C134,158 126,162 116,162" strokeWidth={1.4} />
      </g>

      {/* vest, pinstriped, with a watch chain */}
      <path d="M58,250 L58,150 C62,136 72,126 84,120 L100,168 L116,120 C128,126 138,136 142,150 L142,250 Z" fill={url("vest")} />
      <path d="M58,250 L58,150 C62,136 72,126 84,120 L100,168 L116,120 C128,126 138,136 142,150 L142,250 Z" fill={url("pin")} />
      <path d="M84,120 L100,168 L116,120" fill="none" stroke="#e8c45c" strokeWidth={1.2} />
      <path d="M70,150 C82,158 92,164 100,168 C108,164 118,158 130,150" fill="none" stroke="#1a0508" strokeWidth={1} opacity={0.6} />
      <path d="M68,198 L84,196 M116,196 L132,198" stroke="#e8c45c" strokeWidth={1.4} strokeLinecap="round" />
      {[178, 192, 206, 220].map((y) => (
        <g key={y}>
          <circle cx={100} cy={y} r={2.6} fill="#e8c45c" />
          <circle cx={99.3} cy={y - 0.7} r={0.9} fill="#fff6cf" />
        </g>
      ))}
      <path d="M100,206 C108,214 118,214 126,204" fill="none" stroke="#e8c45c" strokeWidth={1.1} strokeDasharray="1.6 1.2" />

      {/* collar and bow tie */}
      <path d="M86,114 L100,128 L92,140 L80,122 Z" fill="#fff" stroke="#cfc6b4" strokeWidth={0.9} />
      <path d="M114,114 L100,128 L108,140 L120,122 Z" fill="#fff" stroke="#cfc6b4" strokeWidth={0.9} />
      <path d="M100,127 L84,118 C82,124 82,132 84,137 Z" fill="#111" />
      <path d="M100,127 L116,118 C118,124 118,132 116,137 Z" fill="#111" />
      <path d="M86,121 L96,126 M86,134 L96,128 M114,121 L104,126 M114,134 L104,128" stroke="#333" strokeWidth={0.8} />
      <rect x={96} y={123} width={8} height={8} rx={2.4} fill="#1d1d1d" />

      {/* big shoulders and upper arms in rolled shirtsleeves, gold garters */}
      {[0, 1].map((side) => (
        <g key={side} transform={side ? "translate(200 0) scale(-1 1)" : undefined}>
          <path d="M70,121 C48,121 30,134 26,158 C24,172 24,182 26,192 L54,196 C56,182 58,166 60,152 C62,138 66,128 70,121 Z" fill={url("sleeve")} />
          <path d="M60,150 C58,166 56,182 54,196" fill="none" stroke="#8e8371" strokeWidth={1.4} />
          <path d="M34,140 C40,132 50,127 62,125" fill="none" stroke="#fffdf8" strokeWidth={2} opacity={0.7} />
          <path d="M30,168 C34,160 40,156 46,156" fill="none" stroke="#b5a990" strokeWidth={1} />
          <path d="M26,158 Q42,150 60,156" fill="none" stroke="#e8c45c" strokeWidth={3.6} strokeLinecap="round" />
          <path d="M26,158 Q42,150 60,156" fill="none" stroke="#9c7531" strokeWidth={0.8} strokeLinecap="round" />
          {/* rolled cuff */}
          <path d="M24,182 C32,177 46,179 56,185 L54,199 C44,192 32,192 25,196 Z" fill="#ece5d8" stroke="#b9ad96" strokeWidth={0.9} />
          <path d="M25,189 C34,185 45,187 55,192" fill="none" stroke="#b9ad96" strokeWidth={0.8} />
        </g>
      ))}

      {/* forearms (sinewy, a few veins), towel, and the coupe he's polishing */}
      <g style={polishing ? { animation: "polish 1.6s ease-in-out infinite", transformOrigin: "100px 200px", transformBox: "view-box" } : undefined}>
        {[0, 1].map((side) => (
          <g key={side} transform={side ? "translate(200 0) scale(-1 1)" : undefined}>
            <path d="M25,192 C27,210 52,222 88,216 L90,198 C68,198 58,194 54,188 Z" fill={url("arm")} />
            <path d="M28,196 C34,192 44,192 52,194" fill="none" stroke="#7a4a30" strokeWidth={1.2} opacity={0.5} />
            <path d="M34,198 C46,206 62,210 82,208" fill="none" stroke="#8f5a3a" strokeWidth={1.2} opacity={0.45} />
            <path d="M44,196 C52,200 60,201 68,200 M58,200 C64,204 72,205 80,203" fill="none" stroke="#9e6845" strokeWidth={0.8} opacity={0.6} />
            <path d="M36,192 C44,198 56,200 66,199" fill="none" stroke="#f0c39b" strokeWidth={1.4} opacity={0.6} />
          </g>
        ))}
        {/* coupe */}
        <path d="M80,174 C80,190 90,197 100,197 C110,197 120,190 120,174 Z" fill="rgba(220,235,255,0.22)" stroke="#f0f6ff" strokeWidth={1.4} />
        <path d="M84,178 C86,188 92,192 98,193" fill="none" stroke="#fff" strokeWidth={1.4} opacity={0.6} />
        <line x1={80} y1={174} x2={120} y2={174} stroke="#e8c45c" strokeWidth={1.8} />
        <line x1={100} y1={197} x2={100} y2={206} stroke="#f0f6ff" strokeWidth={2} />
        {/* bar towel wrapped over both hands */}
        <path d="M80,200 C84,194 116,194 120,200 C124,208 118,218 100,218 C82,218 76,208 80,200 Z" fill="#f7f1e3" stroke="#cfc4ab" strokeWidth={1} />
        <path d="M84,203 C92,207 108,207 116,203 M86,210 C94,213 106,213 114,210" fill="none" stroke="#d8ccb2" strokeWidth={0.9} />
        <path d="M82,200 L118,200" stroke="#9e2b36" strokeWidth={1.4} opacity={0.7} />
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
    </svg>
  );
}

/** The back bar behind the bartenders: brass shelves of backlit bottles. */
export function BackBar() {
  const bottles = [
    // x, width, height, colour
    [8, 16, 46, "#7a3e0c"], [28, 12, 56, "#1d5a3a"], [44, 18, 40, "#6d1f2a"], [66, 14, 52, "#c8a24a"],
    [84, 20, 44, "#2a3f6a"], [108, 12, 58, "#7a3e0c"], [124, 16, 48, "#3c6e2f"], [144, 14, 54, "#8b2e5a"],
    [162, 18, 42, "#c8771f"], [184, 12, 50, "#1d5a3a"],
  ] as const;
  return (
    <svg viewBox="0 0 200 150" preserveAspectRatio="xMidYMax slice" className="h-full w-full" aria-hidden>
      <defs>
        <radialGradient id="bb-glow" cx="0.5" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#ffb547" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ffb547" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bb-brass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3d77a" />
          <stop offset="1" stopColor="#7a5a17" />
        </linearGradient>
      </defs>
      <rect width="200" height="150" fill="#120d09" />
      {/* deco mirror panels */}
      {[0, 50, 100, 150].map((x) => (
        <g key={x}>
          <rect x={x + 3} y={4} width={44} height={140} fill="#1a130d" stroke="#d4af37" strokeOpacity={0.35} strokeWidth={0.8} />
          <path d={`M${x + 25},4 L${x + 25},30 M${x + 3},30 L${x + 47},30`} stroke="#d4af37" strokeOpacity={0.25} strokeWidth={0.6} />
          {[0, 1, 2, 3, 4].map((i) => (
            <line key={i} x1={x + 25} y1={30} x2={x + 5 + i * 10} y2={6} stroke="#d4af37" strokeOpacity={0.18} strokeWidth={0.5} />
          ))}
        </g>
      ))}
      <rect width="200" height="150" fill="url(#bb-glow)" />
      {[70, 130].map((shelfY, s) => (
        <g key={shelfY}>
          {bottles.map(([x, w, h, color], i) => {
            const hh = h * (s ? 0.85 : 0.7);
            return (
              <g key={i} opacity={0.92}>
                <rect x={x + ((i * 7 + s * 11) % 5)} y={shelfY - hh} width={w} height={hh} rx={3} fill={color} />
                <rect x={x + ((i * 7 + s * 11) % 5) + w / 2 - 2.5} y={shelfY - hh - 10} width={5} height={12} rx={1.5} fill={color} />
                <rect x={x + ((i * 7 + s * 11) % 5) + 2} y={shelfY - hh * 0.6} width={w - 4} height={hh * 0.28} fill="#f4ead5" opacity={0.75} />
                <rect x={x + ((i * 7 + s * 11) % 5) + 2} y={shelfY - hh + 3} width={2.5} height={hh - 6} fill="#fff" opacity={0.18} />
              </g>
            );
          })}
          <rect x={0} y={shelfY} width={200} height={3} fill="url(#bb-brass)" />
        </g>
      ))}
    </svg>
  );
}
