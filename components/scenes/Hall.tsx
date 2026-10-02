"use client";

import { motion } from "motion/react";
import { CATEGORIES } from "@/lib/constants";
import { useHall } from "@/lib/api";
import { useApp } from "../AppContext";
import { GlassIcon } from "../art/Glass";
import { Avatar, BackPlaque, DecoDivider, Neon, Spinner, Sunburst } from "../ui";

/** The back wall of the speakeasy: everyone who's ever been the best, in neon. */
export function HallScene() {
  const { memberById, go, back } = useApp();
  const { data } = useHall();
  const reigning = data?.champions[0];

  return (
    <div className="wall relative min-h-full overflow-hidden px-4 pb-[max(3rem,env(safe-area-inset-bottom))] pt-[max(4rem,calc(env(safe-area-inset-top)+3.5rem))]">
      <BackPlaque onClick={back} />
      <div className="text-center">
        <Neon color="pink" script className="block text-[64px] leading-none">
          Hall of Fame
        </Neon>
        <Sunburst className="mx-auto -mt-2 w-64" opacity={0.35} />
      </div>

      {!data ? (
        <div className="mt-16 flex justify-center">
          <Spinner />
        </div>
      ) : !reigning ? (
        <div className="mt-10 space-y-6 text-center">
          <Neon on={false} className="block text-4xl">
            Champion
          </Neon>
          <Neon on={false} className="block text-3xl">
            Best Taste
          </Neon>
          <p className="mx-auto max-w-xs font-deco text-base font-bold text-champagne/70">The wall is bare. Win a palooza to get your name in lights.</p>
        </div>
      ) : (
        <>
          {/* the reigning champion holds the belt */}
          <motion.button
            onClick={() => go("drink", reigning.drink_id)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="neon-tube mx-auto mt-2 block w-full max-w-sm rounded-2xl bg-black/50 px-4 py-5 text-center"
            style={{ ["--glow" as string]: "#ffd76b" }}
          >
            <div className="font-deco text-xs font-bold tracking-[0.4em] text-champagne/70">🏆 REIGNING CHAMPION 🏆</div>
            <div className="mt-2 flex items-center justify-center gap-3">
              <Avatar member={memberById(reigning.member_id)} size={46} ring />
              <Neon color="gold" className="text-[44px] leading-none" delay={0.3}>
                {memberById(reigning.member_id)?.name}
              </Neon>
            </div>
            <div className="mt-2">
              <Neon color="pink" script className="text-3xl" delay={0.8}>
                {reigning.drink_name || "Mystery drink"}
              </Neon>
            </div>
            <div className="mt-1 font-deco text-sm font-bold text-champagne/70">
              {reigning.event_name} · {reigning.overall.toFixed(2)}
            </div>
          </motion.button>

          <Section title="Titles">
            <div className="space-y-2">
              {data.titles.map((t, i) => (
                <div key={t.member_id} className="brass rounded-md p-[2px]">
                  <div className="flex items-center gap-3 rounded-[5px] bg-[#16110a] px-3 py-2">
                    <span className="w-5 font-display text-lg text-gold">{i + 1}</span>
                    <Avatar member={memberById(t.member_id)} size={30} />
                    <span className="flex-1 font-display text-lg text-champagne">{memberById(t.member_id)?.name}</span>
                    <span className="font-deco text-sm font-bold text-champagne/80">
                      {"🏆".repeat(Math.min(t.wins, 5))}
                      {t.wins > 5 ? `×${t.wins}` : ""} {t.podiums} podium{t.podiums === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Best Ever">
            <div className="space-y-3">
              {data.best_ever.map((b, i) => {
                const cat = CATEGORIES.find((c) => c.key === b.category);
                return (
                  <button key={b.category} onClick={() => go("drink", b.drink_id)} className="flex w-full items-center gap-3 rounded-lg border border-gold/25 bg-black/35 px-3 py-2.5 text-left">
                    {cat ? <GlassIcon category={cat.key} score={10} size={30} /> : <span className="w-[30px] text-center text-2xl">🏆</span>}
                    <div className="min-w-0 flex-1">
                      <div className="font-deco text-[11px] font-bold tracking-[0.3em] text-champagne/60">{(cat ? cat.label : "Overall").toUpperCase()}</div>
                      <Neon color={(["teal", "amber", "pink"] as const)[i % 3]} className="text-xl" delay={0.2 * i}>
                        {memberById(b.member_id)?.name}
                      </Neon>
                      <div className="truncate text-sm text-champagne/70">
                        {b.drink_name || "Mystery drink"} · {b.event_name}
                      </div>
                    </div>
                    <span className="gold-text font-display text-2xl">{b.value.toFixed(1)}</span>
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title="Personal Bests">
            <div className="grid grid-cols-2 gap-2">
              {data.personal_bests.map((p) => (
                <button key={p.member_id} onClick={() => go("drink", p.drink_id)} className="rounded-md bg-black/35 p-2.5 text-left">
                  <div className="flex items-center gap-1.5 font-display text-champagne">
                    <Avatar member={memberById(p.member_id)} size={22} /> {memberById(p.member_id)?.name}
                  </div>
                  <div className="mt-1 truncate text-xs text-champagne/70">{p.drink_name || "Mystery drink"}</div>
                  <div className="gold-text font-display text-xl">{p.overall.toFixed(2)}</div>
                </button>
              ))}
            </div>
          </Section>

          <Section title="Past Champions">
            <ol className="space-y-1.5">
              {data.champions.map((c) => (
                <li key={c.event_id}>
                  <button onClick={() => go("drink", c.drink_id)} className="menu-item text-champagne">
                    <span className="font-display">{c.event_name}</span>
                    <span className="leader border-gold/30!" />
                    <span className="font-deco font-bold">{memberById(c.member_id)?.name}</span>
                  </button>
                </li>
              ))}
            </ol>
          </Section>
        </>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto mt-9 max-w-md">
      <DecoDivider className="mb-2" />
      <h3 className="mb-3 text-center font-deco text-sm font-bold tracking-[0.4em] text-gold-2">{title.toUpperCase()}</h3>
      {children}
    </section>
  );
}
