"use client";

import { motion } from "motion/react";
import { useApp } from "../AppContext";
import { Avatar, Coaster, DecoDivider, Neon } from "../ui";

/**
 * Home. Looking straight down at a long mahogany bar; scroll along it.
 * The coasters are the menu.
 */
export function BarTop() {
  const { me, live, home, memberById, go } = useApp();
  const presenter = memberById(live?.current?.member_id);
  const champ = home.last_complete?.champion;

  const tonight = (() => {
    if (!live) return { subtitle: "Open tonight's", pulse: false };
    switch (live.event.status) {
      case "lobby":
        return { subtitle: `${live.participants.length} at the bar`, pulse: false };
      case "live":
        return { subtitle: presenter ? `● ${presenter.name} is up` : "● Live", pulse: live.current?.member_id === me?.id };
      case "lastcall":
        return { subtitle: "Last call!", pulse: true };
      case "wrapped":
        return { subtitle: "The reveal!", pulse: true };
      default:
        return { subtitle: "", pulse: false };
    }
  })();

  return (
    <div className="wood relative min-h-[185dvh] overflow-hidden pb-24">
      {/* brass foot rail along the edge of the bar */}
      <div className="brass absolute inset-y-0 left-0 w-3.5 shadow-[4px_0_10px_rgba(0,0,0,0.6)]" />
      <div className="absolute inset-y-0 left-3.5 w-1.5 bg-black/40" />

      {/* rubber bar mat with the house name */}
      <div className="relative mx-auto mt-[max(1.5rem,env(safe-area-inset-top))] w-[86%] max-w-md rounded-md bg-[#0b0a09] px-4 pb-5 pt-6 shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
        <div className="deco-frame pointer-events-none absolute inset-1.5 rounded" />
        <div
          className="pointer-events-none absolute inset-3 rounded opacity-30"
          style={{ backgroundImage: "radial-gradient(circle, #d4af37 1px, transparent 1.5px)", backgroundSize: "10px 10px" }}
        />
        <div className="relative text-center">
          <div className="font-deco text-xs font-bold tracking-[0.5em] text-champagne/80">THE GILDED POUR</div>
          <div className="gold-text mt-1 font-display text-[44px] leading-[0.95] tracking-wider">
            DRINK
            <br />
            PALOOZA
          </div>
          <Neon color="pink" script className="-mt-1 block text-3xl">
            est. 2026
          </Neon>
        </div>
      </div>

      {me && (
        <div className="mt-5 flex items-center justify-center gap-2 font-deco text-sm font-bold tracking-wider text-champagne/90">
          <Avatar member={me} size={26} /> Evening, {me.name}
        </div>
      )}

      {/* ring stains and clutter */}
      <RingStain className="left-[58%] top-[22dvh]" />
      <RingStain className="left-[8%] top-[78dvh]" size={110} />
      <BottleCap className="left-[78%] top-[52dvh]" rotate={30} />
      <LimeWedge className="left-[10%] top-[108dvh]" />
      <BottleCap className="left-[70%] top-[150dvh]" rotate={-40} />

      <div className="relative mt-8 flex flex-col gap-10 px-6">
        <motion.div className="self-center" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
          <Coaster
            title="Tonight's Palooza"
            subtitle={tonight.subtitle}
            icon="🍸"
            style="emerald"
            size={212}
            pulse={tonight.pulse}
            rotate={-4}
            onClick={() => go("bartender")}
          />
        </motion.div>

        <div className="flex items-end justify-between">
          <Coaster title="Hall of Fame" subtitle="Neon & legends" icon="🏆" style="onyx" size={164} rotate={6} onClick={() => go("wall")} />
          {champ && (
            <div className="paper mb-6 w-36 rotate-[4deg] rounded-sm p-3 text-center shadow-lg">
              <div className="font-deco text-[10px] font-bold tracking-widest">REIGNING CHAMP</div>
              <div className="mt-1 flex items-center justify-center gap-1 font-display text-lg leading-tight">
                <Avatar member={memberById(champ.member_id)} size={22} />
                {memberById(champ.member_id)?.name}
              </div>
              <div className="text-xs italic opacity-80">{champ.drink_name || "Mystery drink"}</div>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Coaster title="Recipe Book" subtitle="Every drink, ever" icon="📖" style="oxblood" size={164} rotate={-7} onClick={() => go("book")} />
        </div>

        <div className="flex justify-start pl-4">
          <Coaster title="Settings" subtitle={me ? `You're ${me.name}` : ""} icon="⚙️" style="cream" size={140} rotate={9} onClick={() => go("settings")} />
        </div>

        <DecoDivider className="mx-8 mt-6 opacity-60" />
        <p className="text-center font-deco text-xs font-bold tracking-[0.3em] text-champagne/50">PLEASE DRINK RESPONSIBLY · TIP YOUR BARTENDERS</p>
      </div>
    </div>
  );
}

function RingStain({ className = "", size = 90 }: { className?: string; size?: number }) {
  return (
    <div
      className={`pointer-events-none absolute rounded-full ${className}`}
      style={{ width: size, height: size, boxShadow: "inset 0 0 0 3px rgb(30 10 2 / 0.35), inset 0 0 0 6px rgb(30 10 2 / 0.12)" }}
    />
  );
}

function BottleCap({ className = "", rotate = 0 }: { className?: string; rotate?: number }) {
  return (
    <svg viewBox="0 0 40 40" className={`pointer-events-none absolute w-10 drop-shadow-[0_3px_3px_rgba(0,0,0,0.6)] ${className}`} style={{ rotate: `${rotate}deg` }} aria-hidden>
      <path
        d={Array.from({ length: 21 }, (_, i) => {
          const a = (i / 21) * Math.PI * 2;
          const r = i % 2 ? 17 : 19.5;
          return `${i ? "L" : "M"}${20 + Math.cos(a) * r},${20 + Math.sin(a) * r}`;
        }).join(" ") + "Z"}
        fill="#c8a24a"
      />
      <circle cx="20" cy="20" r="13" fill="#6d1f2a" stroke="#f3d77a" strokeWidth="1" />
      <text x="20" y="24" textAnchor="middle" fontSize="10" fill="#f3d77a" fontFamily="Limelight, serif">
        DP
      </text>
    </svg>
  );
}

function LimeWedge({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 36" className={`pointer-events-none absolute w-16 rotate-[-18deg] drop-shadow-[0_3px_3px_rgba(0,0,0,0.5)] ${className}`} aria-hidden>
      <path d="M2,6 A28,28 0 0 0 58,6 Z" fill="#4c9a2a" />
      <path d="M6,6 A24,24 0 0 0 54,6 Z" fill="#d7f08a" />
      {[0.2, 0.4, 0.6, 0.8].map((t) => (
        <line key={t} x1="30" y1="7" x2={30 + Math.cos(Math.PI * t) * 22} y2={7 + Math.sin(Math.PI * t) * 22} stroke="#eaf8c0" strokeWidth="1.5" />
      ))}
    </svg>
  );
}
