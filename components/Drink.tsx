"use client";

import { useEffect, useRef, useState } from "react";
import { refreshAll, send, useDrink } from "@/lib/api";
import { resizePhoto } from "@/lib/image";
import type { Drink, Ingredient, Photo } from "@/lib/types";
import { useApp } from "./AppContext";
import { DecoDivider, Sheet, Spinner, toast, useBusy } from "./ui";

/** Take or pick a photo, shrink it on the phone, upload it. */
export function PhotoButton({ drinkId, label = "Snap a photo", className = "", dark = false }: { drinkId: string; label?: string; className?: string; dark?: boolean }) {
  const camera = useRef<HTMLInputElement>(null);
  const library = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function upload(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const { blob, width, height } = await resizePhoto(file);
      const form = new FormData();
      form.append("photo", blob, "drink.jpg");
      form.append("width", String(width));
      form.append("height", String(height));
      await send("POST", `/api/drinks/${drinkId}/photos`, form);
      await refreshAll();
      toast("📸 Photo added");
    } catch (err) {
      toast((err as Error).message);
    } finally {
      setBusy(false);
      if (camera.current) camera.current.value = "";
      if (library.current) library.current.value = "";
    }
  }

  const base = dark ? "btn-ghost bg-black/40" : "border border-ink/40 font-deco font-bold";
  return (
    <div className={`flex gap-2 ${className}`}>
      <button onClick={() => camera.current?.click()} disabled={busy} className={`${base} flex-1 rounded-full px-3 py-2 text-sm`}>
        {busy ? "Developing…" : `📷 ${label}`}
      </button>
      <button onClick={() => library.current?.click()} disabled={busy} className={`${base} rounded-full px-3 py-2 text-sm`} aria-label="Choose from library">
        🖼️
      </button>
      <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={(e) => upload(e.target.files?.[0])} />
      <input ref={library} type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} />
    </div>
  );
}

export function PhotoStrip({ photos, drink, onOpen }: { photos: Photo[]; drink: Drink; onOpen?: (p: Photo) => void }) {
  const { meId } = useApp();
  const { run } = useBusy();
  if (!photos.length) return null;
  return (
    <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-1">
      {photos.map((p) => {
        const hero = drink.hero_photo_id === p.id;
        const mine = drink.member_id === meId;
        return (
          <div key={p.id} className="relative shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.url}
              alt=""
              onClick={() => onOpen?.(p)}
              className={`h-28 w-24 rounded-sm object-cover shadow-md ${hero ? "ring-2 ring-gold" : ""}`}
            />
            {mine && !hero && (
              <button
                onClick={() => run(async () => (await send("PUT", `/api/drinks/${drink.id}/hero`, { photo_id: p.id }), refreshAll()))}
                className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 font-deco text-[10px] font-bold text-champagne"
              >
                ★ Hero
              </button>
            )}
            {(mine || p.uploader_id === meId) && (
              <button
                onClick={() => confirm("Remove this photo?") && run(async () => (await send("DELETE", `/api/photos/${p.id}`), refreshAll()))}
                className="absolute right-1 top-1 rounded-full bg-black/70 px-1.5 text-xs text-champagne"
                aria-label="Remove photo"
              >
                ✕
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** The recipe, printed like a menu card. */
export function RecipeCard({ drink, compact = false }: { drink: Drink; compact?: boolean }) {
  const empty = !drink.ingredients.length && !drink.method && !drink.glass && !drink.garnish && !drink.story;
  if (empty) return <p className="py-2 text-center font-deco text-sm font-bold italic opacity-70">The recipe is still a secret.</p>;
  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {drink.story && <p className="text-[15px] italic leading-snug">&ldquo;{drink.story}&rdquo;</p>}
      {drink.ingredients.length > 0 && (
        <ul className="space-y-1">
          {drink.ingredients.map((i, n) => (
            <li key={n} className="menu-item text-[15px]">
              <span className="font-semibold">{i.item}</span>
              <span className="leader" />
              <span className="font-deco font-bold">{i.amount}</span>
            </li>
          ))}
        </ul>
      )}
      {(drink.glass || drink.garnish) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 font-deco text-sm font-bold">
          {drink.glass && <span>Glass · {drink.glass}</span>}
          {drink.garnish && <span>Garnish · {drink.garnish}</span>}
        </div>
      )}
      {drink.method && <p className="whitespace-pre-line text-[15px] leading-snug">{drink.method}</p>}
    </div>
  );
}

const field = "w-full rounded-sm border border-ink/30 bg-white/60 px-3 py-2 text-[16px] text-ink outline-none focus:border-ink";
const label = "mb-1 block font-deco text-xs font-bold tracking-widest";

/** The order pad: the bartender writes up their own drink. */
export function PrepSheet({ drinkId, open, onClose }: { drinkId: string | null; open: boolean; onClose: () => void }) {
  const { data } = useDrink(open ? drinkId : null);
  const [form, setForm] = useState<{ name: string; story: string; glass: string; garnish: string; method: string; ingredients: Ingredient[] } | null>(null);
  const { busy, run } = useBusy();

  // Seed the form once per opening; later polls must not clobber typing.
  useEffect(() => {
    if (!open) setForm(null);
    else if (data && !form) {
      const d = data.drink;
      setForm({
        name: d.name,
        story: d.story,
        glass: d.glass,
        garnish: d.garnish,
        method: d.method,
        ingredients: d.ingredients.length ? d.ingredients : [{ amount: "", item: "" }, { amount: "", item: "" }],
      });
    }
  }, [open, data, form]);

  const set = (k: keyof NonNullable<typeof form>, v: unknown) => setForm((f) => (f ? { ...f, [k]: v } : f));
  const setIng = (i: number, k: keyof Ingredient, v: string) => set("ingredients", form!.ingredients.map((x, n) => (n === i ? { ...x, [k]: v } : x)));

  return (
    <Sheet open={open} onClose={onClose} title="The Order Pad">
      {!form || !data ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : (
        <form
          className="space-y-4 pb-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              await send("PATCH", `/api/drinks/${drinkId}`, form);
              await refreshAll();
              toast("Recipe saved");
              onClose();
            });
          }}
        >
          <div>
            <label className={label}>WHAT&apos;S IT CALLED?</label>
            <input className={`${field} font-display text-xl`} value={form.name} maxLength={60} onChange={(e) => set("name", e.target.value)} placeholder="The Gilded Paloma" />
          </div>
          <div>
            <label className={label}>THE PITCH</label>
            <textarea className={field} rows={2} value={form.story} maxLength={600} onChange={(e) => set("story", e.target.value)} placeholder="Inspired by a summer in Oaxaca…" />
          </div>
          <div>
            <label className={label}>INGREDIENTS</label>
            <div className="space-y-2">
              {form.ingredients.map((ing, i) => (
                <div key={i} className="flex gap-2">
                  <input className={`${field} w-20 shrink-0`} value={ing.amount} maxLength={30} onChange={(e) => setIng(i, "amount", e.target.value)} placeholder="2 oz" />
                  <input className={`${field} min-w-0`} value={ing.item} maxLength={60} onChange={(e) => setIng(i, "item", e.target.value)} placeholder="Mezcal" />
                </div>
              ))}
            </div>
            <button type="button" onClick={() => set("ingredients", [...form.ingredients, { amount: "", item: "" }])} className="mt-2 font-deco text-sm font-bold underline">
              + another ingredient
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={label}>GLASS</label>
              <input className={field} value={form.glass} maxLength={40} onChange={(e) => set("glass", e.target.value)} placeholder="Coupe" />
            </div>
            <div>
              <label className={label}>GARNISH</label>
              <input className={field} value={form.garnish} maxLength={80} onChange={(e) => set("garnish", e.target.value)} placeholder="Grapefruit twist" />
            </div>
          </div>
          <div>
            <label className={label}>METHOD</label>
            <textarea className={field} rows={4} value={form.method} maxLength={1500} onChange={(e) => set("method", e.target.value)} placeholder="Shake hard with ice. Double strain…" />
          </div>
          <DecoDivider ink />
          <div>
            <label className={label}>PHOTOS</label>
            <PhotoStrip photos={data.photos} drink={data.drink} />
            <PhotoButton drinkId={data.drink.id} className="mt-2" />
          </div>
          <button type="submit" disabled={busy} className="btn-gold w-full rounded-full py-3 text-lg">
            {busy ? "Saving…" : "Save the recipe"}
          </button>
        </form>
      )}
    </Sheet>
  );
}
