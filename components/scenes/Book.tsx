"use client";

import { useMemo, useState } from "react";
import { CATEGORIES } from "@/lib/constants";
import { useCatalog, useDrink } from "@/lib/api";
import { useApp } from "../AppContext";
import { GlassIcon } from "../art/Glass";
import { PhotoButton, PhotoStrip, PrepSheet, RecipeCard } from "../Drink";
import { Avatar, BackPlaque, DecoDivider, Spinner } from "../ui";
import { Napkins, NotesButton } from "./Pour";

/**
 * The leather-bound book at the far end of the bar: every drink anyone has
 * ever made, with its photos and recipe. Search by name or ingredient.
 */
export function BookScene() {
  const { memberById, members, go, back } = useApp();
  const { data } = useCatalog();
  const [q, setQ] = useState("");
  const [who, setWho] = useState<string | null>(null);
  const [sort, setSort] = useState<"new" | "top">("new");

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const rows = (data ?? []).filter(
      (d) =>
        (!who || d.member_id === who) &&
        (!needle || d.name.toLowerCase().includes(needle) || d.ingredients.some((i) => i.item.toLowerCase().includes(needle)) || d.event_name.toLowerCase().includes(needle)),
    );
    return sort === "top" ? [...rows].sort((a, b) => (b.overall ?? -1) - (a.overall ?? -1)) : rows;
  }, [data, q, who, sort]);

  return (
    <div className="wood relative min-h-full px-3 pb-[max(3rem,env(safe-area-inset-bottom))] pt-[max(3.75rem,calc(env(safe-area-inset-top)+3.25rem))]">
      <BackPlaque onClick={back} />
      {/* the cover */}
      <div className="relative mx-auto max-w-md rounded-t-md bg-[linear-gradient(160deg,#7a2433,#4a121c)] px-5 py-6 text-center shadow-2xl">
        <div className="deco-frame pointer-events-none absolute inset-2 rounded-sm" />
        <div className="font-deco text-xs font-bold tracking-[0.5em] text-champagne/80">THE</div>
        <div className="gold-text font-display text-4xl tracking-wider">Recipe Book</div>
        <div className="mt-1 font-deco text-xs font-bold tracking-[0.3em] text-champagne/70">{data ? `${data.length} DRINKS` : "…"}</div>
      </div>
      {/* the pages */}
      <div className="paper relative mx-auto max-w-md rounded-b-md px-3 pb-5 pt-4 shadow-2xl">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search a drink, an ingredient…"
          className="w-full rounded-sm border border-ink/30 bg-white/60 px-3 py-2 text-[16px] text-ink outline-none focus:border-ink"
        />
        <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto pb-1">
          <Chip on={!who} onClick={() => setWho(null)}>
            Everyone
          </Chip>
          {members.map((m) => (
            <Chip key={m.id} on={who === m.id} onClick={() => setWho(who === m.id ? null : m.id)}>
              {m.emoji} {m.name}
            </Chip>
          ))}
        </div>
        <div className="mt-2 flex justify-end gap-3 font-deco text-xs font-bold">
          <button onClick={() => setSort("new")} className={sort === "new" ? "underline" : "opacity-50"}>
            NEWEST
          </button>
          <button onClick={() => setSort("top")} className={sort === "top" ? "underline" : "opacity-50"}>
            TOP SCORED
          </button>
        </div>
        <DecoDivider ink className="my-3" />
        {!data ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : !shown.length ? (
          <p className="py-10 text-center font-deco font-bold italic opacity-60">{data.length ? "Nothing matches." : "No recipes yet. Prep your drink with the bartenders!"}</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {shown.map((d) => (
              <button key={d.id} onClick={() => go("drink", d.id)} className="text-left">
                <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-onyx shadow-md">
                  {d.hero_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={d.hero_url} alt="" loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <GlassIcon category="appearance" score={7} size={60} />
                    </div>
                  )}
                  {d.overall != null && <span className="absolute right-1.5 top-1.5 rounded-full bg-black/75 px-2 py-0.5 font-display text-sm text-gold-2">{d.overall.toFixed(1)}</span>}
                </div>
                <div className="mt-1.5 truncate font-display text-[17px] leading-tight">{d.name || "Mystery drink"}</div>
                <div className="flex items-center gap-1 truncate font-deco text-xs font-bold opacity-75">
                  <Avatar member={memberById(d.member_id)} size={16} /> {memberById(d.member_id)?.name} · {d.event_name}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`shrink-0 rounded-full border px-3 py-1 font-deco text-sm font-bold ${on ? "border-ink bg-ink text-cream" : "border-ink/30"}`}>
      {children}
    </button>
  );
}

/** One drink's page in the book. */
export function DrinkScene({ id }: { id: string | null }) {
  const { memberById, meId, back } = useApp();
  const { data, error } = useDrink(id);
  const [edit, setEdit] = useState(false);
  const [zoom, setZoom] = useState<string | null>(null);

  if (!data) {
    return (
      <div className="wood flex min-h-full items-center justify-center">
        <BackPlaque onClick={back} label="Book" />
        {error ? <p className="font-deco font-bold text-champagne">That page is missing.</p> : <Spinner />}
      </div>
    );
  }
  const { drink, event, photos, result, my_scores } = data;
  const maker = memberById(drink.member_id);
  const hero = photos.find((p) => p.id === drink.hero_photo_id) ?? photos[0];
  const mine = drink.member_id === meId;

  return (
    <div className="wood relative min-h-full px-3 pb-[max(3rem,env(safe-area-inset-bottom))] pt-[max(3.75rem,calc(env(safe-area-inset-top)+3.25rem))]">
      <BackPlaque onClick={back} label="Book" />
      <div className="paper relative mx-auto max-w-md rounded-md px-4 pb-6 pt-4 shadow-2xl">
        <div className="deco-frame-ink pointer-events-none absolute inset-1.5 rounded-sm" />
        <div className="relative">
          {hero && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hero.url} alt={drink.name} onClick={() => setZoom(hero.url)} className="aspect-[4/5] w-full rounded-t-[999px] object-cover shadow-md" />
          )}
          <div className="mt-3 text-center">
            <div className="font-deco text-xs font-bold tracking-[0.3em] opacity-70">{event.name.toUpperCase()}</div>
            <h1 className="font-display text-[32px] leading-tight">{drink.name || "Mystery drink"}</h1>
            <div className="mt-1 flex items-center justify-center gap-1.5 font-deco font-bold">
              <Avatar member={maker} size={24} /> by {maker?.name}
            </div>
          </div>

          {result && result.overall != null && (
            <div className="mt-4 rounded-md bg-onyx px-3 py-3 text-champagne">
              <div className="flex items-end justify-around">
                {CATEGORIES.map((c) => (
                  <div key={c.key} className="flex flex-col items-center">
                    <GlassIcon category={c.key} score={result.categories[c.key] != null ? Math.round(result.categories[c.key]!) : null} size={34} />
                    <span className="font-deco text-[11px] font-bold">{c.label}</span>
                    <span className="gold-text font-display">{result.categories[c.key]?.toFixed(1) ?? "–"}</span>
                  </div>
                ))}
                <div className="flex flex-col items-center">
                  <span className="font-deco text-[11px] font-bold">OVERALL</span>
                  <span className="gold-text font-display text-3xl">{result.overall.toFixed(2)}</span>
                  <span className="text-[11px] opacity-60">{result.raters} judges</span>
                </div>
              </div>
            </div>
          )}
          {!result && Object.keys(my_scores).length > 0 && (
            <div className="mt-4 flex items-center justify-center gap-2 font-deco text-sm font-bold">
              Your pours:
              {CATEGORIES.map((c) => (
                <span key={c.key} className="rounded-md bg-onyx px-1">
                  <GlassIcon category={c.key} score={my_scores[c.key]} size={20} />
                </span>
              ))}
              <span className="opacity-60">· hidden from others until the reveal</span>
            </div>
          )}

          <DecoDivider ink className="my-4" />
          <RecipeCard drink={drink} />
          {mine && (
            <button onClick={() => setEdit(true)} className="mt-3 w-full rounded-full border border-ink/40 py-2 font-deco font-bold">
              ✎ Edit my recipe
            </button>
          )}

          <DecoDivider ink className="my-4" />
          <div className="mb-2 font-deco text-xs font-bold tracking-[0.3em]">PHOTOS</div>
          <PhotoStrip photos={photos} drink={drink} onOpen={(p) => setZoom(p.url)} />
          <PhotoButton drinkId={drink.id} className="mt-2" label="Add a photo" />
        </div>
      </div>

      <div className="mx-auto max-w-md">
        <div className="mt-6 text-center font-deco text-xs font-bold tracking-[0.35em] text-champagne/70">NAPKINS</div>
        <Napkins drinkId={drink.id} comments={data.comments} />
        <div className="mx-3 mt-4">
          <NotesButton drinkId={drink.id} initial={data.my_note} />
        </div>
      </div>

      {mine && <PrepSheet drinkId={drink.id} open={edit} onClose={() => setEdit(false)} />}
      {zoom && (
        <button onClick={() => setZoom(null)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoom} alt="" className="max-h-full max-w-full rounded-sm" />
        </button>
      )}
    </div>
  );
}
