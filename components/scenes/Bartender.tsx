"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MEMBER_EMOJIS } from "@/lib/constants";
import { eventAction, refreshAll, send, useMemory } from "@/lib/api";
import { sceneExchanges, type Line } from "@/lib/banter";
import { playSound } from "@/lib/sounds";
import { enableTilt, tiltEnabled, tiltNeedsPermission, useShake } from "@/lib/tilt";
import type { LiveEvent, Member } from "@/lib/types";
import { showScene, useApp } from "../AppContext";
import { BackBar, BAR_Y, Jasper, Mabel, VIEW_H, WALL_TOP, type Layer } from "../art/Bartenders";
import { ChalkboardSheet } from "../Chalkboard";
import { PrepSheet } from "../Drink";
import { PassNapkin, SeatingSheet } from "../Seating";
import { Avatar, BackPlaque, DecoDivider, toast, useBusy } from "../ui";

const MET_KEY = "drinkpalooza:met-bartenders";

/**
 * Eye level with the bartenders. Whatever you need to do before or around
 * the show, you ask them: who you are, joining, the running order, your
 * recipe, starting the show.
 */
export function BartenderScene() {
  const app = useApp();
  const { me, live, back } = app;
  const { data: memory } = useMemory();
  const { line, next } = useDialogue(app, memory?.wins ?? {});
  const speaker = line.who;
  // You meet the bartenders properly once per phone; after that they step
  // back so the menu sits higher. Tap them to bring the full view back.
  const [compact, setCompact] = useState(() => {
    try {
      return window.localStorage.getItem(MET_KEY) === "1";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    if (!me) return;
    try {
      window.localStorage.setItem(MET_KEY, "1");
    } catch {}
  }, [me]);

  return (
    <div className="relative min-h-full bg-onyx pb-16">
      {me && <BackPlaque onClick={back} />}

      {/* The back bar, the bartenders, the counter */}
      <div
        onClick={() => me && setCompact((c) => !c)}
        className={`relative overflow-hidden transition-[height] duration-500 ${compact && me ? "h-[310px]" : "h-[50dvh] min-h-[340px]"}`}
      >
        {/* The top 170px is kept for the speech bubble, so it never covers a face. */}
        <BehindTheBar speaker={speaker} className="h-[calc(100%-170px)]" />
        {/* speech bubble */}
        <motion.div
          key={`${line.who}:${line.text}`}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 14, delay: 0.15 }}
          onClick={(e) => {
            e.stopPropagation();
            next();
          }}
          className={`paper absolute top-[max(3.25rem,calc(env(safe-area-inset-top)+2.5rem))] z-10 max-w-[70%] rounded-2xl px-4 py-2 font-display text-[16px] leading-snug shadow-xl ${
            speaker === "mabel" ? "left-4 origin-bottom-left" : "right-4 origin-bottom-right"
          }`}
        >
          {line.text}
          <span className={`absolute -bottom-2 h-4 w-4 rotate-45 bg-cream ${speaker === "mabel" ? "left-28" : "right-32"}`} />
          <span className="mt-0.5 block font-deco text-[11px] font-bold tracking-widest opacity-60">— {speaker === "mabel" ? "MABEL" : "JASPER"}</span>
        </motion.div>
      </div>

      {/* The menu card */}
      <div className="relative z-10 mx-auto -mt-2 w-[92%] max-w-md">
        <div className="paper relative rounded-sm px-5 pb-6 pt-5 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
          <div className="deco-frame-ink pointer-events-none absolute inset-2" />
          <div className="relative">{!me ? <WhoIsDrinking /> : !live ? <OpenPalooza /> : <EventMenu live={live} />}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * The two of them standing behind the counter. Drawn in three slices so the
 * bar really is between you and them: their bodies, then the counter (its top
 * edge at their waists), then anything resting on the bar top, like Mabel's
 * hand, drawn again on top of the counter.
 */
function BehindTheBar({ speaker, className }: { speaker: "mabel" | "jasper"; className: string }) {
  const row = (layer: Layer) => (
    <div className="absolute inset-0 flex items-end justify-center">
      {(["mabel", "jasper"] as const).map((who, i) => {
        const on = speaker === who;
        return (
          <motion.div
            key={who}
            className="relative h-full"
            style={{ zIndex: on ? 2 : 1, filter: on ? "drop-shadow(0 10px 18px rgba(0,0,0,0.55))" : "brightness(0.55)", transformOrigin: "50% 100%" }}
            initial={{ x: i ? 40 : -40, opacity: 0 }}
            animate={{ x: i ? -26 : 26, opacity: 1, scale: on ? 1 : 0.9 }}
            transition={{ delay: 0.2 + i * 0.1 }}
          >
            {who === "mabel" ? <Mabel shaking={on} layer={layer} /> : <Jasper polishing={on} layer={layer} />}
          </motion.div>
        );
      })}
    </div>
  );
  return (
    <div className={`absolute inset-x-0 bottom-[30px] transition-[height] duration-500 ${className}`}>
      {/* the back wall, in the same units as the two of them, so a bottle is bottle-sized */}
      <div className="absolute inset-x-0 bottom-0 blur-[0.4px]" style={{ height: `${((VIEW_H - WALL_TOP) / VIEW_H) * 100}%` }}>
        <BackBar />
        <div className="absolute inset-0 bg-[radial-gradient(55%_40%_at_50%_75%,rgba(255,181,71,0.16),transparent_70%),linear-gradient(rgba(0,0,0,0.35),transparent_45%)]" />
      </div>
      {row("body")}
      {/* the counter: polished top, brass edge, panelled front */}
      <div className="absolute inset-x-0 bottom-[-400px] z-[3]" style={{ top: `${(BAR_Y / VIEW_H) * 100}%` }}>
        <div className="h-[9px] bg-[linear-gradient(#a0552c,#6b3219_60%,#4e2411)] shadow-[0_-1px_0_rgba(255,214,150,0.35)]" />
        <div className="brass h-[4px]" />
        <div className="wood h-full shadow-[inset_0_10px_14px_rgba(0,0,0,0.55)]" style={{ backgroundImage: "repeating-linear-gradient(90deg, transparent 0 46px, rgba(0,0,0,0.28) 46px 48px, rgba(255,214,150,0.08) 48px 49px)" }} />
      </div>
      <div className="absolute inset-0 z-[4]">{row("front")}</div>
    </div>
  );
}

/**
 * Mabel and Jasper talk among themselves: the line you need first, then
 * running jokes, back-and-forths and call-outs by name, looping. Tap the
 * bubble to hurry them along.
 */
function useDialogue(app: ReturnType<typeof useApp>, wins: Record<string, number>) {
  const { me, live, joined, memberById } = app;
  // Re-script only when something worth talking about changes, not on every poll.
  const key = JSON.stringify([
    me?.id,
    me?.name,
    joined,
    live?.event.status,
    live?.event.name,
    live?.current?.id,
    live?.participants.map((p) => p.member_id),
    live?.drinks.map((d) => [d.member_id, d.has_recipe, !!d.hero_url]),
    live?.waiting_on.length === 1 ? live.waiting_on : live?.waiting_on.length,
    wins,
  ]);
  const script = useMemo(
    () => sceneExchanges({ me: me ? { id: me.id, name: me.name } : null, live, joined, nameOf: (id) => memberById(id)?.name ?? null, wins }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );
  const [pos, setPos] = useState({ beat: 0, line: 0 });
  useEffect(() => setPos({ beat: 0, line: 0 }), [script]);
  const beat = script[pos.beat % script.length] ?? script[0];
  const line: Line = beat[Math.min(pos.line, beat.length - 1)];
  const next = useCallback(() => {
    setPos((p) => {
      const b = script[p.beat % script.length];
      return p.line + 1 < b.length ? { beat: p.beat, line: p.line + 1 } : { beat: (p.beat + 1) % script.length, line: 0 };
    });
  }, [script]);
  useEffect(() => {
    if (script.length === 1 && beat.length === 1) return;
    const lastOfBeat = pos.line >= beat.length - 1;
    const ms = Math.min(6500, Math.max(2800, line.text.length * 55)) + (lastOfBeat ? 1600 : 0);
    const t = window.setTimeout(next, ms);
    return () => window.clearTimeout(t);
  }, [pos, line, beat, script, next]);
  return { line, next };
}

// ---- Sign-in ---------------------------------------------------------------

function WhoIsDrinking() {
  const { members, setMe, go } = useApp();
  const [creating, setCreating] = useState(members.length === 0);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(MEMBER_EMOJIS[members.length % MEMBER_EMOJIS.length]);
  const { busy, run } = useBusy();

  const pick = (m: Member) => {
    setMe(m.id);
    go("bar", null, { replace: true });
  };

  return (
    <div>
      <MenuHeading>Who&apos;s Drinking</MenuHeading>
      {!creating && (
        <div className="space-y-1.5">
          {members.map((m) => (
            <button key={m.id} onClick={() => pick(m)} className="menu-item py-1.5 text-lg">
              <Avatar member={m} size={30} />
              <span className="font-display">{m.name}</span>
              <span className="leader" />
              <span className="font-deco text-sm font-bold">that&apos;s me</span>
            </button>
          ))}
          <button onClick={() => setCreating(true)} className="menu-item pt-3 text-lg">
            <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-ink/40">+</span>
            <span className="font-display">I&apos;m new here</span>
            <span className="leader" />
          </button>
        </div>
      )}
      {creating && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            run(async () => {
              const m = await send<Member>("POST", "/api/members", { name: name.trim(), emoji });
              await refreshAll();
              pick(m);
            });
          }}
          className="space-y-4"
        >
          <input
            autoFocus
            value={name}
            maxLength={30}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full border-b-2 border-ink/40 bg-transparent py-2 text-center font-display text-2xl text-ink outline-none placeholder:text-ink/30 focus:border-ink"
          />
          <div className="flex flex-wrap justify-center gap-1.5">
            {MEMBER_EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className={`h-10 w-10 rounded-full text-xl ${emoji === e ? "bg-ink/15 ring-2 ring-ink" : ""}`}
              >
                {e}
              </button>
            ))}
          </div>
          <button disabled={busy || !name.trim()} className="btn-gold w-full rounded-full py-3 text-lg disabled:opacity-50">
            Open my tab
          </button>
          {members.length > 0 && (
            <button type="button" onClick={() => setCreating(false)} className="w-full font-deco text-sm font-bold underline">
              I&apos;ve been here before
            </button>
          )}
        </form>
      )}
      <p className="mt-4 text-center text-xs opacity-60">No password. This phone remembers you; switch any time in Settings.</p>
    </div>
  );
}

// ---- No palooza open -------------------------------------------------------

function OpenPalooza() {
  const { back } = useApp();
  const [name, setName] = useState(() => `Drink Palooza · ${new Date().toLocaleDateString(undefined, { month: "short", year: "numeric" })}`);
  const { busy, run } = useBusy();
  return (
    <div>
      <MenuHeading>Tonight</MenuHeading>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(async () => {
            await send("POST", "/api/events", { name });
            await refreshAll();
            playSound("applause");
          });
        }}
        className="space-y-3"
      >
        <input
          value={name}
          maxLength={60}
          onChange={(e) => setName(e.target.value)}
          className="w-full border-b-2 border-ink/40 bg-transparent py-2 text-center font-display text-xl text-ink outline-none focus:border-ink"
        />
        <button disabled={busy || !name.trim()} className="btn-gold w-full rounded-full py-3 text-lg">
          Open a new Palooza
        </button>
      </form>
      <p className="mt-3 text-center text-xs opacity-70">You&apos;ll be the host: you start the show and run the reveal.</p>
      <button onClick={back} className="mt-4 w-full font-deco text-sm font-bold underline">
        Back to the bar
      </button>
    </div>
  );
}

// ---- The palooza -------------------------------------------------------------

function EventMenu({ live }: { live: LiveEvent }) {
  const app = useApp();
  const { me, joined, isHost, memberById, go, meId } = app;
  const { event } = live;
  const { busy, run } = useBusy();
  const [prep, setPrep] = useState(false);
  const [seating, setSeating] = useState(false);
  const [passing, setPassing] = useState(false);
  const [chalk, setChalk] = useState(false);
  const myDrink = live.drinks.find((d) => d.member_id === meId);
  const host = memberById(event.host_id);
  const target = showScene(live, meId);

  const shuffle = useCallback(() => {
    if (event.status !== "lobby" || !joined) return;
    playSound("drumroll");
    run(() => eventAction(event.id, "shuffle"));
  }, [event.status, event.id, joined, run]);
  const [shakeOn, setShakeOn] = useState(false);
  useEffect(() => setShakeOn(tiltEnabled()), []);
  useShake(shuffle, shakeOn && event.status === "lobby" && joined);

  return (
    <div>
      <MenuHeading sub={event.status === "lobby" ? "Now seating" : event.status === "live" ? "Now serving" : undefined}>{event.name}</MenuHeading>
      {event.status === "lobby" && <Stools live={live} />}

      <div className="space-y-2.5">
        {!joined && (event.status === "lobby" || event.status === "live") && (
          <MenuButton onClick={() => run(() => eventAction(event.id, "join"))} disabled={busy} price="✦" primary>
            Join the palooza
          </MenuButton>
        )}

        {target && joined && (
          <MenuButton onClick={() => go(target)} price="→" primary>
            {event.status === "live" ? (live.current?.member_id === me?.id ? "Take the stage" : "Take your seat") : event.status === "lastcall" ? "Finish my pours" : "Watch the reveal"}
          </MenuButton>
        )}
        {target && !joined && event.status !== "live" && (
          <MenuButton onClick={() => go(target)} price="→">
            Watch from the bar
          </MenuButton>
        )}
        {!joined && event.status === "live" && (
          <MenuButton onClick={() => go("stage")} price="→">
            Just watch
          </MenuButton>
        )}

        {joined && myDrink && (
          <MenuButton onClick={() => setPrep(true)} price={myDrink.has_recipe ? "✓" : "✎"}>
            {myDrink.name ? `Prep my drink · ${myDrink.name}` : "Prep my drink"}
          </MenuButton>
        )}

        {event.status === "lobby" && joined && (
          <MenuButton onClick={shuffle} disabled={busy} price="🎲">
            {event.order_set ? "Shake up the order again" : "Shake up the order"}
          </MenuButton>
        )}
        {event.status === "lobby" && joined && tiltNeedsPermission() && !shakeOn && (
          <button
            onClick={async () => setShakeOn(await enableTilt())}
            className="w-full text-center font-deco text-xs font-bold underline opacity-70"
          >
            Let me shake my phone to shuffle
          </button>
        )}

        {isHost && event.status === "lobby" && (
          <MenuButton
            onClick={() =>
              run(async () => {
                if (live.participants.length < 2) throw new Error("You need at least two bartenders");
                if (!event.seating_set && confirm("Seat the table first, so napkins can be passed across it?")) return setSeating(true);
                if (!confirm("Start the show? The order locks in.")) return;
                await eventAction(event.id, "start");
                playSound("airhorn");
              })
            }
            disabled={busy}
            price="★"
            primary
          >
            Start the show
          </MenuButton>
        )}
        {isHost && event.status === "lastcall" && (
          <MenuButton
            onClick={() =>
              run(async () => {
                const unfinished = live.drinks.some((d) => (live.scored_counts[d.id] ?? 0) < live.participants.length - 1);
                if (unfinished && !confirm("Not everyone has finished pouring. Start the reveal anyway?")) return;
                await eventAction(event.id, "reveal");
                go("wrapped");
              })
            }
            disabled={busy}
            price="★"
            primary
          >
            Start the reveal
          </MenuButton>
        )}
        {!isHost && event.status === "lobby" && (
          <p className="pt-1 text-center font-deco text-sm font-bold italic opacity-70">{host?.name ?? "The host"} starts the show</p>
        )}

        {joined && event.status !== "complete" && (
          <>
            <MenuButton onClick={() => setSeating(true)} price={event.seating_set ? "✓" : "🪑"}>
              {event.seating_set ? "Change the seating" : "Seat the table"}
            </MenuButton>
            {live.participants.length > 1 && (
              <MenuButton onClick={() => setPassing(true)} price="✉">
                Pass a napkin
              </MenuButton>
            )}
          </>
        )}
        <MenuButton onClick={() => setChalk(true)} price="🖍">
          Write on the chalkboard
        </MenuButton>
      </div>

      <DecoDivider ink className="my-5" />
      <LineUp live={live} />

      {joined && event.status === "lobby" && (
        <button
          onClick={() => confirm("Leave this palooza?") && run(() => eventAction(event.id, "leave"))}
          className="mt-5 w-full font-deco text-xs font-bold underline opacity-60"
        >
          Leave the palooza
        </button>
      )}
      {myDrink && <PrepSheet drinkId={myDrink.id} open={prep} onClose={() => setPrep(false)} />}
      <SeatingSheet open={seating} onClose={() => setSeating(false)} />
      <PassNapkin open={passing} onClose={() => setPassing(false)} />
      <ChalkboardSheet open={chalk} onClose={() => setChalk(false)} />
    </div>
  );
}

/**
 * The running order. When anyone shakes it up, every phone plays the same
 * slot-machine shuffle and lands on the order the server picked.
 */
function LineUp({ live }: { live: LiveEvent }) {
  const { memberById, meId } = useApp();
  const version = live.event.order_version;
  const seen = useRef(version);
  const [rolling, setRolling] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (version === seen.current) return;
    seen.current = version;
    setRolling(true);
    const iv = setInterval(() => setTick((t) => t + 1), 90);
    const done = setTimeout(() => {
      clearInterval(iv);
      setRolling(false);
      toast("🎲 The order is set!");
    }, 1700);
    return () => {
      clearInterval(iv);
      clearTimeout(done);
    };
  }, [version]);

  const people = live.participants;
  const ordered = live.event.order_set || live.event.status !== "lobby";
  return (
    <div>
      <div className="mb-2 text-center font-deco text-xs font-bold tracking-[0.3em]">{ordered ? "THE RUNNING ORDER" : "AT THE BAR · ORDER NOT SET"}</div>
      <ol className="space-y-1.5">
        <AnimatePresence initial={false}>
          {people.map((p, i) => {
            const shown = rolling ? people[(i + tick) % people.length] : p;
            const m = memberById(shown.member_id);
            const drink = live.drinks.find((d) => d.member_id === shown.member_id);
            const status = drink?.status;
            return (
              <motion.li
                key={rolling ? `r${i}` : p.member_id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: rolling ? 0 : i * 0.08 }}
                className={`flex items-center gap-2.5 rounded-sm px-2 py-1 ${status === "presenting" ? "bg-ink/10" : ""}`}
              >
                <span className="w-6 text-right font-display text-lg">{ordered ? `${i + 1}.` : "·"}</span>
                <Avatar member={m} size={28} />
                <span className={`font-display text-lg ${status === "done" ? "opacity-50" : ""}`}>
                  {m?.name}
                  {shown.member_id === meId && <span className="ml-1 font-deco text-xs font-bold">(you)</span>}
                </span>
                <span className="leader flex-1 border-b-2 border-dotted border-ink/20" />
                <span className="font-deco text-sm font-bold">
                  {status === "presenting" ? "● on stage" : status === "done" ? "✓" : drink?.name ? drink.name : drink?.has_recipe ? "ready" : ""}
                </span>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ol>
    </div>
  );
}

// ---- Who's ready ----------------------------------------------------------------

/**
 * A row of bar stools, one per person, in seat order. Each shows whether
 * they've written up their recipe and added a photo of the drink, so the
 * host can see at a glance who's still prepping before starting the show.
 */
function Stools({ live }: { live: LiveEvent }) {
  const { memberById, meId } = useApp();
  const people = [...live.participants].sort((a, b) => (a.seat ?? 99) - (b.seat ?? 99));
  const status = (id: string) => {
    const d = live.drinks.find((x) => x.member_id === id);
    return { recipe: !!d?.has_recipe, photo: !!d?.hero_url, name: d?.name ?? "" };
  };
  const ready = people.filter((p) => {
    const s = status(p.member_id);
    return s.recipe && s.photo;
  }).length;
  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center justify-between font-deco text-[11px] font-bold tracking-widest">
        <span>
          {ready} OF {people.length} READY
        </span>
        <span className={live.event.seating_set ? "" : "opacity-60"}>🪑 {live.event.seating_set ? "TABLE SEATED ✓" : "SEATS NOT SET"}</span>
      </div>
      <div className="flex flex-wrap justify-center gap-x-1 gap-y-3">
        {people.map((p) => {
          const m = memberById(p.member_id);
          const s = status(p.member_id);
          const done = s.recipe && s.photo;
          return (
            <div key={p.member_id} className="flex w-[62px] flex-col items-center">
              <div className={`rounded-full ${done ? "ring-2 ring-emerald-2 ring-offset-2 ring-offset-cream" : ""}`}>
                <Avatar member={m} size={38} />
              </div>
              {/* the stool */}
              <svg viewBox="0 0 40 30" className="-mt-1 w-10" aria-hidden>
                <ellipse cx="20" cy="5" rx="15" ry="4" fill="#6d1f2a" stroke="#2b1d12" strokeWidth="1.2" />
                <path d="M9,7 L6,29 M31,7 L34,29 M14,8 L13,29 M26,8 L27,29" stroke="#2b1d12" strokeWidth="1.6" />
                <path d="M7.5,19 L32.5,19" stroke="#8c6d1f" strokeWidth="1.6" />
              </svg>
              <span className="mt-0.5 max-w-full truncate font-display text-[13px] leading-tight">{p.member_id === meId ? "You" : m?.name}</span>
              <span className="text-[13px] leading-none" title={`${s.recipe ? "Recipe written" : "No recipe yet"} · ${s.photo ? "Photo added" : "No photo yet"}`}>
                <span className={s.recipe ? "" : "opacity-25 grayscale"}>📝</span>
                <span className={s.photo ? "" : "opacity-25 grayscale"}>📷</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- Menu typography -----------------------------------------------------------

function MenuHeading({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-4 text-center">
      {sub && <div className="font-deco text-[11px] font-bold tracking-[0.4em] opacity-70">{sub.toUpperCase()}</div>}
      <h2 className="font-display text-[26px] leading-tight tracking-wide">{children}</h2>
      <DecoDivider ink className="mx-6 mt-2" />
    </div>
  );
}

function MenuButton({ children, onClick, price, disabled, primary }: { children: React.ReactNode; onClick: () => void; price: string; disabled?: boolean; primary?: boolean }) {
  return (
    <motion.button whileTap={{ scale: 0.97 }} onClick={onClick} disabled={disabled} className={`menu-item py-1 ${primary ? "text-[22px]" : "text-lg"} disabled:opacity-50`}>
      <span className={`font-display ${primary ? "text-oxblood" : ""}`}>{children}</span>
      <span className="leader" />
      <span className="font-deco font-bold">{price}</span>
    </motion.button>
  );
}

