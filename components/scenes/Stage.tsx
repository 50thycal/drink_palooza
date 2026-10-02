"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { SOUNDS } from "@/lib/constants";
import { eventAction, send } from "@/lib/api";
import { playSound, preloadSounds } from "@/lib/sounds";
import { useApp } from "../AppContext";
import { PhotoButton, PrepSheet } from "../Drink";
import { Avatar, BackPlaque, DecoDivider, FloatingReactions, Neon, Sunburst, toast, useBusy } from "../ui";
import { Napkins, ReactionTray, RecipeSheet } from "./Pour";

/**
 * The neon wall, as the presenter sees it. Your name in lights, your drink
 * framed in gold, a soundboard for the theatre, and "Done presenting" when
 * you've said your piece. Spectators see the same wall without the controls.
 */
export function StageScene() {
  const { live, me, meId, memberById, isHost, back } = useApp();
  const [local, setLocal] = useState<{ id: string; emoji: string }[]>([]);
  const [prep, setPrep] = useState(false);
  const [recipe, setRecipe] = useState(false);
  const { busy, run } = useBusy();
  // Fetch any recorded soundboard samples before the first tap.
  useEffect(preloadSounds, []);
  const drink = live?.current;
  if (!live || !drink) {
    return (
      <div className="wall flex min-h-full items-center justify-center">
        <Neon color="amber">Intermission</Neon>
      </div>
    );
  }
  const presenter = memberById(drink.member_id);
  const mine = drink.member_id === meId;
  const hero = live.drinks.find((d) => d.id === drink.id)?.hero_url;
  const raters = live.participants.length - 1;
  const poured = live.scored_counts[drink.id] ?? 0;
  const position = live.drinks.findIndex((d) => d.id === drink.id) + 1;

  const sound = (key: (typeof SOUNDS)[number]["key"], emoji: string) => {
    playSound(key);
    setLocal((l) => [...l.slice(-20), { id: `snd-${Date.now()}`, emoji }]);
    send("POST", `/api/drinks/${drink.id}/reactions`, { emoji }).catch(() => {});
  };

  return (
    <div className="wall relative min-h-full overflow-hidden pb-[max(2rem,env(safe-area-inset-bottom))]">
      <BackPlaque onClick={back} />
      <FloatingReactions reactions={live.reactions} me={meId} local={local} />
      <Sunburst className="pointer-events-none absolute inset-x-0 top-10 mx-auto w-[130%] max-w-none -translate-x-[11%] opacity-60" opacity={0.2} rays={21} />

      <div className="relative px-5 pt-[max(4rem,calc(env(safe-area-inset-top)+3.5rem))] text-center">
        <div className="font-deco text-xs font-bold tracking-[0.4em] text-champagne/60">
          PRESENTER {position} OF {live.drinks.length}
        </div>
        <Neon color="pink" script className="mt-1 block text-[54px] leading-none" key={`ns-${drink.id}`}>
          Now Serving
        </Neon>
        <div className="mt-3 flex items-center justify-center gap-3">
          <Avatar member={presenter} size={44} ring />
          <Neon color="teal" className="text-[40px] leading-none tracking-wider" delay={0.6} key={`nm-${drink.id}`}>
            {presenter?.name}
          </Neon>
        </div>
        <div className="mt-3">
          <Neon color="amber" className="text-2xl" delay={1.1} key={`dn-${drink.id}`}>
            {drink.name || "A Mystery Drink"}
          </Neon>
        </div>

        {/* the drink, framed in a gold Deco arch */}
        <motion.button
          onClick={() => setRecipe(true)}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="relative mx-auto mt-6 block aspect-[4/5] w-[min(72vw,300px)] overflow-hidden rounded-t-full border-[3px] border-gold bg-black/50 p-2 shadow-[0_0_40px_rgba(212,175,55,0.25)]"
        >
          <div className="h-full w-full overflow-hidden rounded-t-full border border-gold/60">
            {hero ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={hero} alt={drink.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-champagne/60">
                <span className="text-6xl">🍸</span>
                <span className="font-deco text-sm font-bold tracking-widest">NO PHOTO YET</span>
              </div>
            )}
          </div>
          <span className="absolute inset-x-0 bottom-3 mx-auto w-fit rounded-full bg-black/70 px-3 py-1 font-deco text-xs font-bold tracking-widest text-champagne">
            THE RECIPE ›
          </span>
        </motion.button>

        <div className="mt-4 flex items-center justify-center gap-1.5 font-deco text-sm font-bold tracking-wider text-champagne/75">
          {poured} of {raters} have poured
          <span className="flex -space-x-1.5">
            {live.waiting_on.map((id) => (
              <Avatar key={id} member={memberById(id)} size={22} />
            ))}
          </span>
        </div>
      </div>

      {mine ? (
        <div className="relative mt-6 px-4">
          <DecoDivider className="mx-6 mb-4" />
          <div className="mb-2 text-center font-deco text-xs font-bold tracking-[0.4em] text-champagne/70">THE SOUNDBOARD</div>
          <div className="mx-auto grid max-w-xs grid-cols-3 gap-x-5 gap-y-3">
            {SOUNDS.map((s) => (
              <div key={s.key} className="flex flex-col items-center gap-1">
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => sound(s.key, s.emoji)}
                  className="flex aspect-square w-full items-center justify-center rounded-full border-2 border-gold bg-[radial-gradient(circle_at_35%_30%,#3a2a10,#0d0b09_70%)] shadow-[0_4px_0_#5c4510,0_0_18px_rgba(212,175,55,0.2)]"
                  aria-label={s.label}
                >
                  <span className="text-3xl leading-none">{s.emoji}</span>
                </motion.button>
                <span className="text-center font-deco text-[11px] font-bold leading-tight tracking-wide text-champagne/75">{s.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button onClick={() => setPrep(true)} className="btn-ghost rounded-full bg-black/40 py-2.5 text-sm">
              ✎ Edit my recipe
            </button>
            <PhotoButton drinkId={drink.id} label="Photo" dark />
          </div>
          <button
            disabled={busy}
            onClick={() =>
              run(async () => {
                if (poured < raters && !confirm(`${raters - poured} still pouring. Pass the stage anyway? They can keep pouring.`)) return;
                await eventAction(live.event.id, "advance", { drink_id: drink.id });
                toast("Take a bow 🎩");
              })
            }
            className="btn-gold mt-4 w-full rounded-full py-4 text-xl"
          >
            Done presenting
          </button>
          <PrepSheet drinkId={drink.id} open={prep} onClose={() => setPrep(false)} />
        </div>
      ) : (
        <div className="relative mt-4">
          {me && <ReactionTray drinkId={drink.id} onLocal={(emoji) => setLocal((l) => [...l.slice(-20), { id: `local-${Date.now()}`, emoji }])} />}
          {isHost && (
            <button
              disabled={busy}
              onClick={() =>
                confirm(`Move on from ${presenter?.name}?`) && run(() => eventAction(live.event.id, "advance", { drink_id: drink.id }))
              }
              className="mx-auto mt-4 block font-deco text-xs font-bold tracking-widest text-champagne/60 underline"
            >
              HOST: SKIP TO THE NEXT PRESENTER
            </button>
          )}
        </div>
      )}

      {me && <Napkins drinkId={drink.id} comments={live.comments} />}
      <RecipeSheet drinkId={drink.id} open={recipe} onClose={() => setRecipe(false)} />
    </div>
  );
}
