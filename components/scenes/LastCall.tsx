"use client";

import { useState } from "react";
import { CATEGORIES } from "@/lib/constants";
import { eventAction } from "@/lib/api";
import { weightedOverall } from "@/lib/scoring";
import { useApp } from "../AppContext";
import { GlassIcon } from "../art/Glass";
import { Avatar, BackPlaque, DecoDivider, Neon, Sheet, useBusy } from "../ui";
import { Glasses } from "./Pour";

/**
 * Everyone has presented. Before the reveal, every pour is laid out side by
 * side so people can recalibrate (the first drink of the night often gets a
 * 9 before anyone knows what's coming). Pours stay editable until the host
 * starts the reveal.
 */
export function LastCallScene() {
  const { live, meId, memberById, isHost, joined, go, back } = useApp();
  const [editing, setEditing] = useState<string | null>(null);
  const { busy, run } = useBusy();
  if (!live) return null;
  const others = live.drinks.filter((d) => d.member_id !== meId);
  const needed = live.participants.length - 1;
  const myMissing = joined ? others.filter((d) => CATEGORIES.some((c) => live.my_scores[d.id]?.[c.key] == null)).length : 0;
  const allDone = live.drinks.every((d) => (live.scored_counts[d.id] ?? 0) >= needed);
  const host = memberById(live.event.host_id);
  const editingDrink = live.drinks.find((d) => d.id === editing);

  return (
    <div className="wood relative min-h-full px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(4rem,calc(env(safe-area-inset-top)+3.5rem))]">
      <BackPlaque onClick={back} />
      <div className="text-center">
        <Neon color="amber" script className="block text-6xl leading-none">
          Last Call
        </Neon>
        <p className="mt-2 font-deco text-sm font-bold tracking-wider text-champagne/80">
          {joined
            ? myMissing
              ? `You've got ${myMissing} drink${myMissing === 1 ? "" : "s"} still to pour.`
              : "All poured. Change anything before the reveal."
            : "Everyone's finishing their pours."}
        </p>
      </div>

      <div className="paper relative mt-6 rounded-sm px-4 py-4 shadow-2xl">
        <div className="deco-frame-ink pointer-events-none absolute inset-1.5" />
        <div className="relative">
          <div className="mb-3 text-center font-deco text-xs font-bold tracking-[0.35em]">{joined ? "YOUR POURS, SIDE BY SIDE" : "THE ROUND"}</div>
          <div className="space-y-3">
            {others.map((d) => {
              const mine = live.my_scores[d.id] ?? {};
              const overall = weightedOverall(mine);
              return (
                <button key={d.id} onClick={() => joined && setEditing(d.id)} className="flex w-full items-center gap-2 border-b border-ink/15 pb-3 text-left last:border-0">
                  <Avatar member={memberById(d.member_id)} size={30} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display text-lg leading-tight">{d.name || "Mystery drink"}</div>
                    <div className="font-deco text-xs font-bold opacity-70">
                      {memberById(d.member_id)?.name} · {live.scored_counts[d.id] ?? 0}/{needed} poured
                    </div>
                  </div>
                  {joined && (
                    <div className="flex items-end gap-0.5 rounded-md bg-onyx px-1.5 pt-1">
                      {CATEGORIES.map((c) => (
                        <GlassIcon key={c.key} category={c.key} score={mine[c.key]} size={20} />
                      ))}
                    </div>
                  )}
                  {joined && <div className="w-9 text-right font-display text-lg">{overall != null ? overall.toFixed(1) : "–"}</div>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <DecoDivider className="mx-8 my-6" />
      {isHost ? (
        <button
          disabled={busy}
          onClick={() =>
            run(async () => {
              if (!allDone && !confirm("Not everyone has finished pouring. Start the reveal anyway?")) return;
              await eventAction(live.event.id, "reveal");
              go("wrapped", null, { replace: true });
            })
          }
          className="btn-gold w-full rounded-full py-4 text-xl"
        >
          Start the reveal
        </button>
      ) : (
        <p className="text-center font-deco text-sm font-bold italic text-champagne/70">{host?.name ?? "The host"} will start the reveal.</p>
      )}

      <Sheet open={!!editingDrink} onClose={() => setEditing(null)} title={editingDrink?.name || "Re-pour"}>
        {editingDrink && (
          <div className="-mx-5 bg-onyx pb-4">
            <Glasses key={editingDrink.id} drinkId={editingDrink.id} mine={live.my_scores[editingDrink.id] ?? {}} />
          </div>
        )}
      </Sheet>
    </div>
  );
}
