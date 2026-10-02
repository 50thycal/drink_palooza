/**
 * Mabel and Jasper, the house bartenders. Flat Art Deco poster style: simple
 * shapes, gold linework, stylised features. viewBox 0 0 200 250; the bar
 * counter is drawn by the scene in front of them, so below ~y=215 is hidden.
 */

export function Mabel({ shaking = false }: { shaking?: boolean }) {
  const skin = "#f2c9a8";
  const skinShade = "#d9a583";
  const hair = "#15110f";
  return (
    <svg viewBox="0 0 200 250" className="h-full w-auto" aria-label="Mabel, the flapper bartender">
      {/* back of the bob */}
      <path d="M62,80 C58,40 80,20 102,20 C126,20 144,40 140,80 C140,100 132,112 122,114 L80,114 C70,112 62,100 62,80 Z" fill={hair} />
      {/* neck + shoulders */}
      <path d="M91,98 L109,98 L111,126 L89,126 Z" fill={skinShade} />
      <path d="M48,250 C48,172 56,136 76,128 C84,124 92,123 100,123 C108,123 116,124 124,128 C144,136 152,172 152,250 Z" fill={skin} />
      {/* resting arm */}
      <path d="M62,142 C54,172 56,204 68,232" fill="none" stroke={skin} strokeWidth={15} strokeLinecap="round" />
      <path d="M64,214 L74,212" stroke="#d4af37" strokeWidth={4} strokeLinecap="round" />
      {/* drop-waist dress */}
      <path d="M74,250 C72,206 72,166 76,148 Q100,166 124,148 C128,166 128,206 126,250 Z" fill="#0f3d33" />
      <path d="M76,148 Q100,166 124,148" fill="none" stroke="#d4af37" strokeWidth={2} />
      <line x1={80} y1={130} x2={78} y2={150} stroke="#d4af37" strokeWidth={2} />
      <line x1={120} y1={130} x2={122} y2={150} stroke="#d4af37" strokeWidth={2} />
      {/* beaded sunburst */}
      <g stroke="#d4af37" strokeWidth={1.2} opacity={0.85}>
        {[-60, -40, -20, 0, 20, 40, 60].map((a) => (
          <line key={a} x1={100} y1={250} x2={100 + Math.sin((a * Math.PI) / 180) * 70} y2={250 - Math.cos((a * Math.PI) / 180) * 70} />
        ))}
        <path d="M76,198 L88,190 L100,198 L112,190 L124,198" fill="none" strokeWidth={2} />
        <path d="M75,210 L88,202 L100,210 L112,202 L125,210" fill="none" strokeWidth={2} />
      </g>
      {/* long pearls */}
      {Array.from({ length: 19 }, (_, i) => {
        const t = i / 18;
        const x = 89 + 22 * t;
        const y = 126 + Math.sin(t * Math.PI) * 72;
        return <circle key={i} cx={x} cy={y} r={2.6} fill="#fbf6ea" stroke="#cbbf9f" strokeWidth={0.6} />;
      })}
      {/* face */}
      <ellipse cx={100} cy={70} rx={25} ry={31} fill={skin} />
      {/* finger-wave fringe and side curtains */}
      <path d="M74,64 C74,40 92,32 106,34 C122,36 132,48 128,66 C120,52 108,48 97,52 C88,55 81,59 74,64 Z" fill={hair} />
      <path d="M64,72 C64,92 70,104 81,108 C78,94 77,82 79,68 Z" fill={hair} />
      <path d="M136,72 C136,92 130,104 119,108 C122,94 123,82 121,68 Z" fill={hair} />
      <g fill="none" stroke="#4a3d38" strokeWidth={1.5} strokeLinecap="round">
        <path d="M82,52 Q90,44 100,46" />
        <path d="M96,42 Q108,38 120,46" />
        <path d="M70,84 Q74,90 72,96" />
        <path d="M130,84 Q126,90 128,96" />
      </g>
      {/* spit curls */}
      <path d="M80,86 C76,86 75,92 79,93 C82,94 83,90 81,89" fill="none" stroke={hair} strokeWidth={2} strokeLinecap="round" />
      <path d="M120,86 C124,86 125,92 121,93 C118,94 117,90 119,89" fill="none" stroke={hair} strokeWidth={2} strokeLinecap="round" />
      {/* headband, jewel, feather */}
      <path d="M72,60 Q100,46 130,56" fill="none" stroke="#d4af37" strokeWidth={4} strokeLinecap="round" />
      <path d="M118,51 C124,30 134,12 150,2 C144,20 136,36 122,51 Z" fill="#f4ead5" stroke="#3ff2e0" strokeWidth={1.2} />
      <path d="M121,50 C130,36 142,26 158,20 C148,30 138,40 125,51 Z" fill="#e9d7a5" opacity={0.85} />
      <circle cx={119} cy={52} r={5} fill="#3ff2e0" stroke="#d4af37" strokeWidth={2} />
      {/* features: closed eyes, high brows, red cupid's bow */}
      <g fill="none" stroke="#2b1d12" strokeLinecap="round">
        <path d="M82,64 Q90,58 97,62" strokeWidth={1.4} />
        <path d="M103,62 Q110,58 118,64" strokeWidth={1.4} />
        <path d="M83,73 Q90,78 97,73" strokeWidth={2} />
        <path d="M103,73 Q110,78 117,73" strokeWidth={2} />
        <path d="M85,76 L84,79 M89,77.5 L88.5,80.5 M93,77 L93,80" strokeWidth={1} />
        <path d="M107,77 L107,80 M111,77.5 L111.5,80.5 M115,76 L116,79" strokeWidth={1} />
        <path d="M100,75 Q103,82 99,85" strokeWidth={1.2} stroke={skinShade} />
      </g>
      <circle cx={86} cy={85} r={5} fill="#ff7d95" opacity={0.35} />
      <circle cx={114} cy={85} r={5} fill="#ff7d95" opacity={0.35} />
      <path d="M92,92 Q96,88 100,91 Q104,88 108,92 Q100,98 92,92 Z" fill="#b8143c" />
      <circle cx={113} cy={89} r={1} fill="#2b1d12" />
      {/* raised arm with a shaker */}
      <g style={shaking ? { animation: "shake-it 0.5s ease-in-out infinite", transformOrigin: "160px 124px", transformBox: "view-box" } : undefined}>
        <path d="M140,142 L162,122 L154,88" fill="none" stroke={skin} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
        <rect x={146} y={92} width={16} height={6} rx={2} fill="#d4af37" transform="rotate(-10 154 95)" />
        <g transform="rotate(-14 156 64)">
          <path d="M146,90 L166,90 L163,52 L149,52 Z" fill="#dcd8ce" stroke="#4a4740" strokeWidth={1.2} />
          <path d="M149,52 L163,52 L159,42 L153,42 Z" fill="#c8c3b6" stroke="#4a4740" strokeWidth={1.2} />
          <rect x={153} y={36} width={6} height={7} rx={2} fill="#d4af37" />
          <rect x={147} y={70} width={18} height={4} fill="#d4af37" />
        </g>
      </g>
    </svg>
  );
}

export function Jasper({ polishing = false }: { polishing?: boolean }) {
  const skin = "#dca784";
  const skinShade = "#c48d6b";
  const hair = "#2b1a10";
  return (
    <svg viewBox="0 0 200 250" className="h-full w-auto" aria-label="Jasper, the dapper bartender">
      {/* neck */}
      <path d="M90,94 L110,94 L112,120 L88,120 Z" fill={skinShade} />
      {/* shirt with rolled sleeves */}
      <path d="M38,250 C38,162 50,128 78,120 L100,118 L122,120 C150,128 162,162 162,250 Z" fill="#f4efe6" />
      <path d="M50,250 C48,200 50,170 56,150" fill="none" stroke="#d9d2c4" strokeWidth={2} />
      <path d="M150,250 C152,200 150,170 144,150" fill="none" stroke="#d9d2c4" strokeWidth={2} />
      {/* sleeve garters */}
      <path d="M43,170 Q52,166 61,170" fill="none" stroke="#d4af37" strokeWidth={4} strokeLinecap="round" />
      <path d="M139,170 Q148,166 157,170" fill="none" stroke="#d4af37" strokeWidth={4} strokeLinecap="round" />
      {/* vest */}
      <path d="M66,250 L66,152 C70,140 78,130 88,124 L100,164 L112,124 C122,130 130,140 134,152 L134,250 Z" fill="#5a1822" />
      <path d="M88,124 L100,164 L112,124" fill="none" stroke="#d4af37" strokeWidth={1.5} />
      <path d="M72,196 L88,196 M112,196 L128,196" stroke="#d4af37" strokeWidth={1.5} />
      {[176, 192, 208].map((y) => (
        <circle key={y} cx={100} cy={y} r={2.6} fill="#d4af37" />
      ))}
      {/* collar + bow tie */}
      <path d="M88,118 L100,130 L93,140 L83,124 Z" fill="#fff" stroke="#d9d2c4" strokeWidth={1} />
      <path d="M112,118 L100,130 L107,140 L117,124 Z" fill="#fff" stroke="#d9d2c4" strokeWidth={1} />
      <path d="M100,128 L85,120 L85,136 Z" fill="#111" />
      <path d="M100,128 L115,120 L115,136 Z" fill="#111" />
      <rect x={96} y={124} width={8} height={8} rx={2} fill="#222" />
      {/* forearms, towel, and a coupe being polished */}
      <g style={polishing ? { animation: "polish 1.6s ease-in-out infinite", transformOrigin: "100px 200px", transformBox: "view-box" } : undefined}>
        <path d="M56,196 C70,204 82,206 92,206" fill="none" stroke={skin} strokeWidth={13} strokeLinecap="round" />
        <path d="M144,196 C130,204 118,206 108,206" fill="none" stroke={skin} strokeWidth={13} strokeLinecap="round" />
        <path d="M82,176 C82,190 92,196 100,196 C108,196 118,190 118,176 Z" fill="rgba(220,235,255,0.18)" stroke="#f0f6ff" strokeWidth={1.5} />
        <line x1={82} y1={176} x2={118} y2={176} stroke="#d4af37" strokeWidth={2} />
        <path d="M86,198 C92,214 108,214 116,198 C110,206 92,206 86,198 Z" fill="#f4ead5" stroke="#cbbf9f" strokeWidth={1} />
        <line x1={100} y1={196} x2={100} y2={204} stroke="#f0f6ff" strokeWidth={2} />
      </g>
      {/* head */}
      <ellipse cx={75} cy={66} rx={4.5} ry={8} fill={skinShade} />
      <ellipse cx={125} cy={66} rx={4.5} ry={8} fill={skinShade} />
      <path d="M76,58 C76,36 88,28 100,28 C112,28 124,36 124,58 C124,82 116,96 100,98 C84,96 76,82 76,58 Z" fill={skin} />
      <path d="M80,80 C84,92 92,97 100,98 C108,97 116,92 120,80 C114,90 106,93 100,93 C94,93 86,90 80,80 Z" fill={skinShade} opacity={0.35} />
      {/* slicked hair, side part */}
      <path d="M74,58 C72,30 88,16 104,16 C122,16 131,30 127,56 C124,44 118,37 108,35 C98,33 87,37 81,45 C78,49 76,53 74,58 Z" fill={hair} />
      <path d="M86,26 C92,22 100,21 108,22" fill="none" stroke="#7a5638" strokeWidth={2} strokeLinecap="round" />
      <path d="M90,38 C98,34 110,34 120,40" fill="none" stroke="#5a3a22" strokeWidth={1.4} strokeLinecap="round" />
      {/* features */}
      <g strokeLinecap="round">
        <path d="M84,56 Q90,52.5 96,55" fill="none" stroke={hair} strokeWidth={3} />
        <path d="M104,55 Q110,52.5 116,56" fill="none" stroke={hair} strokeWidth={3} />
        <ellipse cx={90} cy={64} rx={3.2} ry={2.6} fill="#1d140d" />
        <ellipse cx={110} cy={64} rx={3.2} ry={2.6} fill="#1d140d" />
        <circle cx={91} cy={63} r={0.9} fill="#fff" />
        <circle cx={111} cy={63} r={0.9} fill="#fff" />
        <path d="M100,66 L97.5,77 Q100,79.5 103,77.5" fill="none" stroke={skinShade} strokeWidth={1.5} />
        <path d="M91,83.5 Q100,80.5 109,83.5" fill="none" stroke={hair} strokeWidth={2.2} />
        <path d="M92,88 Q100,94 108,88" fill="none" stroke="#7a3b2a" strokeWidth={2} />
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
