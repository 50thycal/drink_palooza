"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { CATEGORIES, REACTIONS, type CategoryKey } from "@/lib/constants";
import { refreshAll, send, useDrink } from "@/lib/api";
import type { Comment, Drink, ScoreMap } from "@/lib/types";
import { useApp } from "../AppContext";
import { GlassIcon } from "../art/Glass";
import { announcePour } from "../BarBanter";
import { BarTray } from "../BarTray";
import { PhotoStrip, RecipeCard } from "../Drink";
import { PourRig } from "../PourRig";
import { PassNapkin } from "../Seating";
import { Avatar, BackPlaque, FloatingReactions, Neon, Sheet, toast } from "../ui";

/**
 * Your spot at the bar while someone presents. Four glasses, one per
 * category; pour each one. Reactions and napkin comments go to the room,
 * notes stay private.
 */
export function PourScene() {
  const { live, meId, memberById, back } = useApp();
  const [local, setLocal] = useState<{ id: string; emoji: string }[]>([]);
  const drink = live?.current ?? null;
  const presenter = memberById(drink?.member_id);

  if (!live || !drink) {
    return (
      <div className="wood flex min-h-full items-center justify-center">
        <Neon color="amber" className="text-2xl">
          Next round coming up…
        </Neon>
      </div>
    );
  }

  return (
    <div className="wood relative flex min-h-full flex-col">
      <BackPlaque onClick={back} />
      <FloatingReactions reactions={live.reactions} me={meId} local={local} />
      <NowServing drink={drink} presenterName={presenter?.name ?? ""} />
      <Glasses key={drink.id} drinkId={drink.id} mine={live.my_scores[drink.id] ?? {}} />
      <WaitingOn ids={live.waiting_on} />
      <div className="flex-1" />
      <BarTray
        drinkId={drink.id}
        comments={live.comments}
        note={live.my_notes[drink.id] ?? ""}
        top={<ReactionTray compact drinkId={drink.id} onLocal={(emoji) => setLocal((l) => [...l.slice(-20), { id: `local-${Date.now()}-${Math.random()}`, emoji }])} />}
      />
    </div>
  );
}

/** A slice of the neon wall at the top of the screen, with the recipe a tap away. */
function NowServing({ drink, presenterName }: { drink: Drink; presenterName: string }) {
  const { live, memberById } = useApp();
  const [open, setOpen] = useState(false);
  const hero = live?.drinks.find((d) => d.id === drink.id)?.hero_url;
  return (
    <>
      <button onClick={() => setOpen(true)} className="wall relative block w-full overflow-hidden border-b-2 border-gold/40 px-4 pb-3 pt-[max(3.25rem,calc(env(safe-area-inset-top)+2.75rem))] text-left">
        <div className="flex items-center gap-3">
          {hero ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hero} alt="" className="h-16 w-16 shrink-0 rounded-sm object-cover ring-2 ring-gold/70" />
          ) : (
            <Avatar member={memberById(drink.member_id)} size={56} ring />
          )}
          <div className="min-w-0">
            <Neon color="pink" script className="block text-2xl leading-none">
              Now Serving
            </Neon>
            <div className="truncate font-display text-xl text-champagne">{drink.name || "A mystery drink"}</div>
            <div className="font-deco text-sm font-bold text-champagne/70">by {presenterName} · tap for the recipe</div>
          </div>
        </div>
      </button>
      <RecipeSheet drinkId={drink.id} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function RecipeSheet({ drinkId, open, onClose }: { drinkId: string; open: boolean; onClose: () => void }) {
  const { data } = useDrink(open ? drinkId : null);
  return (
    <Sheet open={open} onClose={onClose} title={data?.drink.name || "The Recipe"}>
      {data && (
        <div className="space-y-4 pb-4">
          <PhotoStrip photos={data.photos} drink={data.drink} />
          <RecipeCard drink={data.drink} />
        </div>
      )}
    </Sheet>
  );
}

/** The four glasses: mini-glass tabs on top, the big pour rig below. */
export function Glasses({ drinkId, mine, disabled = false }: { drinkId: string; mine: ScoreMap; disabled?: boolean }) {
  const firstUnpoured = CATEGORIES.findIndex((c) => mine[c.key] == null);
  const [index, setIndex] = useState(firstUnpoured === -1 ? 0 : firstUnpoured);
  const [pending, setPending] = useState<ScoreMap>({});
  const [dir, setDir] = useState(1);
  const scores: ScoreMap = { ...mine, ...pending };
  const cat = CATEGORIES[index];

  // Once the server has a pour, drop the optimistic copy.
  useEffect(() => {
    setPending((p) => {
      const next = { ...p };
      for (const k of Object.keys(p) as CategoryKey[]) if (mine[k] === p[k]) delete next[k];
      return next;
    });
  }, [mine]);
  const goTo = (i: number) => {
    setDir(i > index ? 1 : -1);
    setIndex((i + CATEGORIES.length) % CATEGORIES.length);
  };

  // Pouring never moves you on by itself: you settle the score (pour, then
  // swipe to adjust) and tap Next when you're happy with it.
  async function commit(key: CategoryKey, score: number) {
    setPending((p) => ({ ...p, [key]: score }));
    try {
      await send("PUT", `/api/drinks/${drinkId}/scores`, { category: key, score });
      announcePour(key, score);
      void refreshAll();
    } catch (err) {
      setPending((p) => {
        const next = { ...p };
        delete next[key];
        return next;
      });
      toast((err as Error).message);
    }
  }

  return (
    <div className="px-3 pt-3">
      {/* mini glasses as tabs */}
      <div className="flex items-end justify-around rounded-lg bg-black/30 px-2 pb-1 pt-2">
        {CATEGORIES.map((c, i) => (
          <button key={c.key} onClick={() => goTo(i)} className={`flex flex-col items-center rounded-md px-1.5 pb-1 ${i === index ? "bg-gold/15 ring-1 ring-gold/60" : ""}`}>
            <GlassIcon category={c.key} score={scores[c.key]} size={34} />
            <span className={`font-deco text-[11px] font-bold tracking-wide ${i === index ? "text-gold-2" : "text-champagne/70"}`}>{c.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-3 text-center">
        <div className="flex items-center justify-between">
          <button onClick={() => goTo(index - 1)} className="px-3 py-2 text-2xl text-gold" aria-label="Previous glass">
            ‹
          </button>
          <div>
            <h2 className="gold-text font-display text-[30px] leading-none tracking-wide">{cat.label}</h2>
            <p className="mt-1 text-sm text-champagne/75">{cat.blurb}</p>
          </div>
          <button onClick={() => goTo(index + 1)} className="px-3 py-2 text-2xl text-gold" aria-label="Next glass">
            ›
          </button>
        </div>
      </div>

      <div className="relative mt-2 overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.div
            key={cat.key}
            custom={dir}
            initial={{ x: dir * 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: dir * -300, opacity: 0 }}
            transition={{ type: "spring", damping: 26, stiffness: 260 }}
          >
            <PourRig
              category={cat.key}
              value={scores[cat.key]}
              onCommit={(s) => commit(cat.key, s)}
              disabled={disabled}
              footer={scores[cat.key] != null ? <NextGlass index={index} scores={scores} onGo={goTo} /> : undefined}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Shown once the current glass has a score: the only way on to the next one. */
function NextGlass({ index, scores, onGo }: { index: number; scores: ScoreMap; onGo: (i: number) => void }) {
  const remaining = CATEGORIES.map((c, i) => ({ c, i })).filter(({ c, i }) => i !== index && scores[c.key] == null);
  // Prefer the next empty glass to the right, wrapping round.
  const target = remaining.find(({ i }) => i > index) ?? remaining[0];
  if (!target) return <p className="mt-3 text-center font-deco text-sm font-bold tracking-wider text-neon-teal/80">All four poured · swipe to adjust any time</p>;
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onGo(target.i)}
      className="btn-ghost mx-auto mt-3 flex items-center gap-2 rounded-full bg-black/45 px-5 py-2.5 text-base"
    >
      Next glass: <span className="text-gold-2">{target.c.label}</span> ›
    </motion.button>
  );
}

function WaitingOn({ ids }: { ids: string[] }) {
  const { memberById } = useApp();
  if (!ids.length) return <div className="mt-2 text-center font-deco text-xs font-bold tracking-widest text-neon-teal/80">EVERYONE HAS POURED</div>;
  return (
    <div className="mt-2 flex items-center justify-center gap-1.5 px-4">
      <span className="font-deco text-xs font-bold tracking-widest text-champagne/60">STILL POURING</span>
      {ids.map((id) => (
        <Avatar key={id} member={memberById(id)} size={24} />
      ))}
    </div>
  );
}

export function ReactionTray({ drinkId, onLocal, compact = false }: { drinkId: string; onLocal: (emoji: string) => void; compact?: boolean }) {
  return (
    <div className={compact ? "flex justify-between px-1" : "mx-3 mt-4 flex justify-between rounded-full border border-gold/40 bg-black/45 px-2 py-1.5"}>
      {REACTIONS.map((e) => (
        <motion.button
          key={e}
          whileTap={{ scale: 1.5 }}
          onClick={() => {
            onLocal(e);
            send("POST", `/api/drinks/${drinkId}/reactions`, { emoji: e }).catch((err) => toast((err as Error).message));
          }}
          className="h-10 w-10 text-2xl"
          aria-label={`React ${e}`}
        >
          {e}
        </motion.button>
      ))}
    </div>
  );
}

/** Public comments, written on cocktail napkins. */
export function Napkins({ drinkId, comments }: { drinkId: string; comments: Comment[] }) {
  const { memberById, meId, live, joined } = useApp();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [passing, setPassing] = useState(false);
  const recent = comments.slice(-6).reverse();
  const canPass = joined && live && live.event.status !== "complete" && live.participants.length > 1;
  return (
    <div className="mx-3 mt-4">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!text.trim() || busy) return;
          setBusy(true);
          try {
            await send("POST", `/api/drinks/${drinkId}/comments`, { text: text.trim() });
            setText("");
            await refreshAll();
          } catch (err) {
            toast((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
        className="paper flex items-center gap-2 rounded-sm px-3 py-2 shadow-md"
      >
        <span aria-hidden>✒️</span>
        <input
          value={text}
          maxLength={200}
          onChange={(e) => setText(e.target.value)}
          placeholder="A napkin for the whole table…"
          className="min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none placeholder:text-ink/40"
        />
        <button disabled={busy || !text.trim()} className="font-display text-sm text-oxblood disabled:opacity-40">
          Post it
        </button>
      </form>
      {canPass && (
        <>
          <button onClick={() => setPassing(true)} className="btn-ghost mt-2 w-full rounded-full bg-black/40 py-2 text-sm">
            ✉ Pass a private napkin across the table
          </button>
          <PassNapkin open={passing} onClose={() => setPassing(false)} />
        </>
      )}
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <AnimatePresence initial={false}>
          {recent.map((c, i) => (
            <motion.div
              key={c.id}
              layout
              initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: ((c.id.charCodeAt(0) + i) % 7) - 3 }}
              className="paper rounded-sm p-2.5 text-[14px] leading-snug shadow-md"
              style={{ backgroundImage: "repeating-linear-gradient(45deg, rgb(43 29 18 / 0.035) 0 6px, transparent 6px 12px)" }}
            >
              <div className="mb-1 flex items-center gap-1 font-deco text-[11px] font-bold">
                <Avatar member={memberById(c.member_id)} size={16} /> {memberById(c.member_id)?.name}
                {c.member_id === meId && (
                  <button
                    onClick={() => send("DELETE", `/api/comments/${c.id}`).then(refreshAll, (err) => toast(err.message))}
                    className="ml-auto opacity-50"
                    aria-label="Delete comment"
                  >
                    ✕
                  </button>
                )}
              </div>
              {c.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Private tasting notes: only this person ever sees them. */
export function NotesSheet({ drinkId, initial, open, onClose }: { drinkId: string; initial: string; open: boolean; onClose: () => void }) {
  const [text, setText] = useState(initial);
  useEffect(() => {
    if (!open) setText(initial);
  }, [initial, open]);
  const save = async () => {
    try {
      await send("PUT", `/api/drinks/${drinkId}/notes`, { text });
      await refreshAll();
      onClose();
    } catch (err) {
      toast((err as Error).message);
    }
  };
  return (
    <Sheet open={open} onClose={onClose} title="Tasting Notes">
      <p className="mb-2 font-deco text-xs font-bold tracking-widest opacity-70">ONLY YOU CAN SEE THESE</p>
      <textarea
        value={text}
        maxLength={1000}
        rows={6}
        onChange={(e) => setText(e.target.value)}
        placeholder="Smoky, a touch too sweet, killer garnish…"
        className="w-full rounded-sm border border-ink/30 bg-white/60 px-3 py-2 text-[16px] text-ink outline-none focus:border-ink"
      />
      <button onClick={save} className="btn-gold mt-3 mb-2 w-full rounded-full py-3">
        Save notes
      </button>
    </Sheet>
  );
}

export function NotesButton({ drinkId, initial }: { drinkId: string; initial: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-ghost rounded-full bg-black/40 px-3 py-2 text-sm">
        🔒 {initial ? "My notes ✓" : "My notes"}
      </button>
      <NotesSheet drinkId={drinkId} initial={initial} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
