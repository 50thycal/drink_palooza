"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo } from "react";
import { CATEGORIES, type CategoryKey } from "@/lib/constants";
import { eventAction } from "@/lib/api";
import { rankOverall } from "@/lib/scoring";
import { clink, playSound } from "@/lib/sounds";
import type { EventResults, Podium } from "@/lib/types";
import { useApp } from "../AppContext";
import { GlassIcon } from "../art/Glass";
import { Avatar, BackPlaque, Confetti, DecoDivider, Neon, Sunburst, useBusy } from "../ui";

type Slide = { kind: "intro" } | { kind: "podium"; podium: Podium } | { kind: "superlatives" } | { kind: "fair" } | { kind: "champion" };

function slidesFor(r: EventResults): Slide[] {
  return [
    { kind: "intro" },
    ...r.podiums.filter((p) => p.places.length).map((podium) => ({ kind: "podium" as const, podium })),
    ...(r.superlatives.length ? [{ kind: "superlatives" as const }] : []),
    ...(r.fair_winner ? [{ kind: "fair" as const }] : []),
    { kind: "champion" },
  ];
}

/**
 * The reveal, on the neon wall. The host advances it and every phone in the
 * room follows (the slide number lives on the event), so the group watches
 * each sign light up together.
 */
export function WrappedScene() {
  const { live, isHost, memberById, back, go } = useApp();
  const { busy, run } = useBusy();
  const results = live?.results ?? null;
  const slides = useMemo(() => (results ? slidesFor(results) : []), [results]);
  if (!live || !results) {
    return (
      <div className="wall flex min-h-full items-center justify-center">
        <Neon color="amber">Opening the envelopes…</Neon>
      </div>
    );
  }
  const index = Math.min(live.event.wrap_slide, slides.length - 1);
  const slide = slides[index];
  const last = index === slides.length - 1;
  const host = memberById(live.event.host_id);
  const setSlide = (n: number) => run(() => eventAction(live.event.id, "slide", { slide: n }));

  return (
    <div className="wall relative min-h-full overflow-hidden pb-36">
      <BackPlaque onClick={back} />
      <div className="absolute inset-x-0 top-[max(1rem,env(safe-area-inset-top))] flex justify-center gap-1.5 pt-1">
        {slides.map((_, i) => (
          <span key={i} className={`h-1 w-5 rounded-full ${i <= index ? "bg-gold" : "bg-gold/20"}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.45 }}
          className="px-5 pt-[max(4.5rem,calc(env(safe-area-inset-top)+4rem))]"
        >
          {slide.kind === "intro" && <Intro results={results} name={live.event.name} />}
          {slide.kind === "podium" && <PodiumSlide podium={slide.podium} results={results} />}
          {slide.kind === "superlatives" && <Superlatives results={results} />}
          {slide.kind === "fair" && <Fair results={results} />}
          {slide.kind === "champion" && <Champion results={results} />}
        </motion.div>
      </AnimatePresence>

      <div className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black via-black/90 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-8">
        {isHost ? (
          <div className="flex gap-2">
            <button disabled={busy || index === 0} onClick={() => setSlide(index - 1)} className="btn-ghost rounded-full bg-black/50 px-5 py-3 disabled:opacity-30">
              ‹
            </button>
            {last ? (
              <button
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    if (!confirm("Close the palooza and hang the results in the Hall of Fame?")) return;
                    await eventAction(live.event.id, "finish");
                    go("wall", null, { replace: true });
                  })
                }
                className="btn-gold flex-1 rounded-full py-3 text-lg"
              >
                Hang it in the Hall of Fame
              </button>
            ) : (
              <button disabled={busy} onClick={() => setSlide(index + 1)} className="btn-gold flex-1 rounded-full py-3 text-lg">
                {index === 0 ? "Let's see it" : "Next envelope"} ›
              </button>
            )}
          </div>
        ) : (
          <p className="text-center font-deco text-sm font-bold tracking-wider text-champagne/70">{host?.name ?? "The host"} is opening the envelopes…</p>
        )}
      </div>
    </div>
  );
}

function Intro({ results, name }: { results: EventResults; name: string }) {
  const t = results.totals;
  return (
    <div className="text-center">
      <div className="font-deco text-xs font-bold tracking-[0.4em] text-champagne/60">{name.toUpperCase()}</div>
      <Neon color="pink" script className="mt-2 block text-7xl leading-none">
        The Verdict
      </Neon>
      <Sunburst className="mx-auto mt-2 w-64" opacity={0.4} />
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Plaque value={t.drinks} label="cocktails" delay={0.6} />
        <Plaque value={t.scores} label="glasses poured" delay={0.9} />
        <Plaque value={t.comments + (t.passes ?? 0)} label="napkins scribbled" delay={1.2} />
        <Plaque value={t.reactions} label="reactions" delay={1.5} />
      </div>
      {t.top_emoji && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 2, type: "spring" }} className="mt-6">
          <div className="text-7xl">{t.top_emoji}</div>
          <div className="mt-1 font-deco text-sm font-bold tracking-widest text-champagne/70">THE ROOM&apos;S FAVOURITE REACTION</div>
        </motion.div>
      )}
    </div>
  );
}

function Plaque({ value, label, delay }: { value: number; label: string; delay: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="deco-frame rounded-sm bg-black/40 px-3 py-4">
      <div className="gold-text font-display text-4xl">{value}</div>
      <div className="font-deco text-xs font-bold tracking-widest text-champagne/70">{label.toUpperCase()}</div>
    </motion.div>
  );
}

const PLACE_COLORS = ["pink", "teal", "amber"] as const;

function PodiumSlide({ podium, results }: { podium: Podium; results: EventResults }) {
  const { memberById } = useApp();
  const cat = CATEGORIES.find((c) => c.key === podium.category)!;
  const winnerHero = results.drinks.find((d) => d.drink_id === podium.places[0]?.drink_id)?.hero_url;
  // Third, then second, then first, the way envelopes should be opened.
  const order = podium.places.map((p, i) => ({ p, i })).reverse();
  const delayFor = (i: number) => 0.8 + (podium.places.length - 1 - i) * 1.4;
  useEffect(() => {
    const t = setTimeout(clink, delayFor(0) * 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [podium.category]);
  return (
    <div className="text-center">
      <div className="flex justify-center">
        <GlassIcon category={podium.category as CategoryKey} score={10} size={64} />
      </div>
      <div className="font-deco text-xs font-bold tracking-[0.4em] text-champagne/60">BEST {cat.label.toUpperCase()}</div>
      <Neon color="gold" className="block text-[42px] leading-tight">
        {cat.glass}
      </Neon>
      <div className="mt-6 space-y-4">
        {order.map(({ p, i }) => (
          <motion.div key={p.drink_id} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: delayFor(i) }}>
            <div className={`mx-auto flex items-center justify-center gap-3 rounded-lg border px-4 py-3 ${i === 0 ? "neon-tube border-white/80 bg-black/40" : "border-gold/30 bg-black/30"}`} style={{ ["--glow" as string]: "var(--neon-pink)" }}>
              <span className="font-display text-2xl text-champagne/60">{i + 1}</span>
              <Avatar member={memberById(p.member_id)} size={i === 0 ? 44 : 34} />
              <div className="min-w-0 text-left">
                <Neon color={PLACE_COLORS[i]} className={i === 0 ? "text-3xl" : "text-xl"} delay={delayFor(i)}>
                  {memberById(p.member_id)?.name}
                </Neon>
                <div className="truncate font-deco text-sm font-bold text-champagne/70">{p.name || "Mystery drink"}</div>
              </div>
              <span className="ml-auto gold-text font-display text-2xl">{p.value.toFixed(1)}</span>
            </div>
          </motion.div>
        ))}
      </div>
      {winnerHero && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delayFor(0) + 0.6 }} className="mx-auto mt-6 w-40 overflow-hidden rounded-t-full border-2 border-gold p-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={winnerHero} alt="" className="aspect-[4/5] w-full rounded-t-full object-cover" />
        </motion.div>
      )}
    </div>
  );
}

const SUPERLATIVE_ICONS: Record<string, string> = {
  harshest: "🧐",
  generous: "🥰",
  divisive: "⚖️",
  crowd: "🔥",
  chatterbox: "🗣️",
  hype: "📣",
  postman: "📨",
  penpals: "💌",
};

function Superlatives({ results }: { results: EventResults }) {
  const { memberById } = useApp();
  return (
    <div className="text-center">
      <Neon color="teal" script className="block text-6xl leading-none">
        Honourable Mentions
      </Neon>
      <div className="mt-6 space-y-3">
        {results.superlatives.map((s, i) => (
          <motion.div key={s.key} initial={{ opacity: 0, x: i % 2 ? 40 : -40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.7 }} className="brass rounded-md p-[2px] shadow-lg">
            <div className="flex items-center gap-3 rounded-[5px] bg-[#16110a] px-3 py-3 text-left">
              <span className="text-3xl">{SUPERLATIVE_ICONS[s.key] ?? "🏅"}</span>
              <div className="min-w-0 flex-1">
                <div className="gold-text font-display text-lg leading-tight">{s.title}</div>
                <div className="truncate text-sm text-champagne/75">{s.detail}</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex -space-x-2">
                  <Avatar member={memberById(s.member_id)} size={34} />
                  {s.partner_id && <Avatar member={memberById(s.partner_id)} size={34} />}
                </div>
                <span className="font-deco text-xs font-bold text-champagne">
                  {memberById(s.member_id)?.name}
                  {s.partner_id && ` & ${memberById(s.partner_id)?.name}`}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function Fair({ results }: { results: EventResults }) {
  const { memberById } = useApp();
  const raw = results.overall.places[0];
  const fair = results.fair_winner!;
  const same = raw?.drink_id === fair.drink_id;
  return (
    <div className="text-center">
      <div className="font-deco text-xs font-bold tracking-[0.4em] text-champagne/60">FAIR MODE</div>
      <Neon color="amber" className="mt-1 block text-4xl">
        Grading on a curve
      </Neon>
      <p className="mx-auto mt-4 max-w-sm text-[15px] leading-snug text-champagne/80">
        Every pour re-scored against how that person poured all night, so a harsh critic&apos;s 6 counts like a generous critic&apos;s 9.
      </p>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.2 }} className="deco-frame mt-8 rounded-md bg-black/40 px-4 py-6">
        <Avatar member={memberById(fair.member_id)} size={56} ring />
        <div className="mt-2">
          <Neon color="amber" className="text-3xl">
            {memberById(fair.member_id)?.name}
          </Neon>
        </div>
        <p className="mt-3 font-deco text-sm font-bold tracking-wider text-champagne/80">
          {same ? "Wins on a curve too. No arguments." : `Would win on a curve. The raw scores say ${memberById(raw?.member_id)?.name ?? "otherwise"}…`}
        </p>
      </motion.div>
    </div>
  );
}

function Champion({ results }: { results: EventResults }) {
  const { memberById } = useApp();
  const champ = results.overall.places[0];
  const drink = results.drinks.find((d) => d.drink_id === champ?.drink_id);
  const ranked = rankOverall(results.drinks);
  useEffect(() => {
    playSound("drumroll");
    const t = setTimeout(() => playSound("applause"), 2400);
    return () => clearTimeout(t);
  }, []);
  if (!champ) return <Neon color="pink">No pours, no champion!</Neon>;
  return (
    <div className="text-center">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.3 }}>
        <Confetti />
      </motion.div>
      <div className="font-deco text-xs font-bold tracking-[0.4em] text-champagne/60">THE PALOOZA CHAMPION</div>
      <Sunburst className="mx-auto -mb-10 mt-2 w-72" opacity={0.5} rays={25} />
      <div className="relative">
        <div className="text-6xl">🏆</div>
        <Neon color="gold" className="mt-2 block text-[56px] leading-none tracking-wider" delay={2.3}>
          {memberById(champ.member_id)?.name}
        </Neon>
        <div className="mt-3">
          <Neon color="pink" script className="text-4xl" delay={2.9}>
            {champ.name || "Mystery drink"}
          </Neon>
        </div>
        <div className="gold-text mt-2 font-display text-5xl">{champ.value.toFixed(2)}</div>
        <div className="mt-1 flex justify-center gap-2">
          {CATEGORIES.map((c) => (
            <div key={c.key} className="flex flex-col items-center">
              <GlassIcon category={c.key} score={drink?.categories[c.key] != null ? Math.round(drink.categories[c.key]!) : null} size={30} />
              <span className="font-deco text-[11px] font-bold text-champagne/70">{drink?.categories[c.key]?.toFixed(1) ?? "–"}</span>
            </div>
          ))}
        </div>
        {drink?.hero_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={drink.hero_url} alt="" className="mx-auto mt-5 aspect-[4/5] w-48 rounded-t-full border-2 border-gold object-cover p-1" />
        )}
      </div>
      <DecoDivider className="mx-6 my-6" />
      <div className="font-deco text-xs font-bold tracking-[0.35em] text-champagne/60">FINAL STANDINGS</div>
      <ol className="mt-3 space-y-2 text-left">
        {ranked.map((d, i) => (
          <li key={d.drink_id} className="flex items-center gap-3 rounded-md bg-black/35 px-3 py-2">
            <span className="w-6 font-display text-xl text-gold">{i + 1}</span>
            <Avatar member={memberById(d.member_id)} size={28} />
            <div className="min-w-0 flex-1">
              <div className="font-display text-champagne">{memberById(d.member_id)?.name}</div>
              <div className="truncate text-xs text-champagne/60">{d.name || "Mystery drink"}</div>
            </div>
            <span className="gold-text font-display text-xl">{d.overall!.toFixed(2)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
