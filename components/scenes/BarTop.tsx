"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { useMemory } from "@/lib/api";
import type { BarMemory, Member } from "@/lib/types";
import { useApp } from "../AppContext";
import { ChalkboardPreview, ChalkboardSheet } from "../Chalkboard";
import { Avatar, Coaster, DecoDivider, Neon } from "../ui";

/** A stable 0–1 number from an id, so the bar looks the same on every phone. */
function hash(id: string, salt = 0) {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}

/**
 * Home. Looking straight down at a long mahogany bar; scroll along it.
 * The coasters are the menu.
 */
export function BarTop() {
  const { me, live, home, memberById, go } = useApp();
  const { data: memory } = useMemory();
  const [chalk, setChalk] = useState(false);
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

      {/* the bar remembers: every drink left a ring, every champion a cap */}
      <Memories memory={memory} memberById={memberById} />
      <RingStain className="left-[58%] top-[22dvh]" />
      <LimeWedge className="left-[10%] top-[108dvh]" />
      {!memory?.caps.length && <BottleCap className="left-[78%] top-[52dvh]" rotate={30} />}

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

        <div className="mx-1 rotate-[-1.5deg]">
          <ChalkboardPreview onOpen={() => setChalk(true)} />
        </div>

        <div className="flex items-start justify-between pl-4">
          <Coaster title="Settings" subtitle={me ? `You're ${me.name}` : ""} icon="⚙️" style="cream" size={140} rotate={9} onClick={() => go("settings")} />
          {memory?.overheard && <Overheard o={memory.overheard} who={memberById(memory.overheard.member_id)} />}
        </div>

        <DecoDivider className="mx-8 mt-6 opacity-60" />
        <p className="text-center font-deco text-xs font-bold tracking-[0.3em] text-champagne/50">PLEASE DRINK RESPONSIBLY · TIP YOUR BARTENDERS</p>
      </div>
      <ChalkboardSheet open={chalk} onClose={() => setChalk(false)} />
    </div>
  );
}

/**
 * Ring stains (one per drink ever presented, tinted with its maker's colour)
 * and champions' bottle caps, scattered the same way on every phone. They
 * sit under everything and pile up palooza after palooza.
 */
function Memories({ memory, memberById }: { memory: BarMemory | undefined; memberById: (id: string) => Member | null }) {
  if (!memory) return null;
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {memory.rings.map((r) => {
        const color = memberById(r.member_id)?.color ?? "#1e0a02";
        const size = 64 + hash(r.id, 3) * 52;
        return (
          <div
            key={r.id}
            className="absolute rounded-full"
            style={{
              left: `${4 + hash(r.id, 1) * 78}%`,
              top: `${12 + hash(r.id, 2) * 84}%`,
              width: size,
              height: size * (0.92 + hash(r.id, 4) * 0.12),
              boxShadow: `inset 0 0 0 ${2 + hash(r.id, 5) * 2}px rgb(30 10 2 / 0.32), inset 0 0 0 7px ${color}14`,
              rotate: `${hash(r.id, 6) * 180}deg`,
            }}
          />
        );
      })}
      {memory.caps.map((c) => {
        const who = memberById(c.member_id);
        const initials = (who?.name ?? "?").slice(0, 2).toUpperCase();
        const d = new Date(c.date);
        return (
          <ChampionCap
            key={c.event_id}
            initials={initials}
            date={`${d.getMonth() + 1}/${String(d.getFullYear()).slice(2)}`}
            color={who?.color ?? "#6d1f2a"}
            style={{ left: `${8 + hash(c.event_id, 7) * 76}%`, top: `${20 + hash(c.event_id, 8) * 72}%`, rotate: `${hash(c.event_id, 9) * 70 - 35}deg` }}
          />
        );
      })}
    </div>
  );
}

function ChampionCap({ initials, date, color, style }: { initials: string; date: string; color: string; style: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 48 48" className="absolute w-12 drop-shadow-[0_3px_3px_rgba(0,0,0,0.6)]" style={style}>
      <path
        d={
          Array.from({ length: 23 }, (_, i) => {
            const a = (i / 23) * Math.PI * 2;
            const r = i % 2 ? 20.5 : 23.5;
            return `${i ? "L" : "M"}${24 + Math.cos(a) * r},${24 + Math.sin(a) * r}`;
          }).join(" ") + "Z"
        }
        fill="#d4af37"
      />
      <circle cx="24" cy="24" r="16" fill={color} stroke="#fff3c4" strokeWidth="1.2" />
      <text x="24" y="25" textAnchor="middle" fontSize="12" fill="#fff8e0" style={{ fontFamily: "var(--font-display)" }}>
        {initials}
      </text>
      <text x="24" y="34" textAnchor="middle" fontSize="6" fill="#fff8e0" style={{ fontFamily: "var(--font-body)" }} fontWeight="700">
        🏆 {date}
      </text>
    </svg>
  );
}

/** One napkin from last time, left on the bar. */
function Overheard({ o, who }: { o: NonNullable<BarMemory["overheard"]>; who: Member | null }) {
  return (
    <div
      className="paper mt-6 w-40 rotate-[5deg] rounded-sm p-3 shadow-lg"
      style={{ backgroundImage: "repeating-linear-gradient(45deg, rgb(43 29 18 / 0.035) 0 6px, transparent 6px 12px)" }}
    >
      <div className="font-deco text-[9px] font-bold tracking-widest opacity-70">OVERHEARD AT {o.event_name.toUpperCase()}</div>
      <p className="chalk mt-1 text-xl leading-tight" style={{ textShadow: "none" }}>
        &ldquo;{o.text}&rdquo;
      </p>
      <div className="mt-1 text-right font-deco text-[11px] font-bold opacity-70">— {who?.name ?? "someone"}</div>
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
      <text x="20" y="24" textAnchor="middle" fontSize="10" fill="#f3d77a" style={{ fontFamily: "var(--font-display)" }}>
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
