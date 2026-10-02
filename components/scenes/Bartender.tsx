"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { MEMBER_EMOJIS } from "@/lib/constants";
import { eventAction, refreshAll, send } from "@/lib/api";
import { playSound } from "@/lib/sounds";
import { enableTilt, tiltEnabled, tiltNeedsPermission, useShake } from "@/lib/tilt";
import type { LiveEvent, Member } from "@/lib/types";
import { showScene, useApp } from "../AppContext";
import { BackBar, Jasper, Mabel } from "../art/Bartenders";
import { PrepSheet } from "../Drink";
import { Avatar, BackPlaque, DecoDivider, toast, useBusy } from "../ui";

type Speaker = "mabel" | "jasper";

/**
 * Eye level with the bartenders. Whatever you need to do before or around
 * the show, you ask them: who you are, joining, the running order, your
 * recipe, starting the show.
 */
export function BartenderScene() {
  const app = useApp();
  const { me, live, back } = app;
  const [speaker] = useState<Speaker>(() => (Math.random() < 0.5 ? "mabel" : "jasper"));
  const line = useLine(speaker);

  return (
    <div className="relative min-h-full bg-onyx pb-16">
      {me && <BackPlaque onClick={back} />}

      {/* The back bar, the bartenders, the counter */}
      <div className="relative h-[50dvh] min-h-[330px] overflow-hidden">
        <div className="absolute inset-0">
          <BackBar />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_70%,rgba(255,181,71,0.2),transparent_70%)]" />
        <div className="absolute inset-x-0 bottom-[34px] flex h-[min(62%,300px)] items-end justify-center">
          <motion.div
            className="relative h-full"
            style={{ zIndex: speaker === "mabel" ? 2 : 1, filter: speaker === "mabel" ? "none" : "brightness(0.55)" }}
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 18, opacity: 1, scale: speaker === "mabel" ? 1 : 0.88 }}
            transition={{ delay: 0.2 }}
          >
            <Mabel shaking={speaker === "mabel"} />
          </motion.div>
          <motion.div
            className="relative h-full"
            style={{ zIndex: speaker === "jasper" ? 2 : 1, filter: speaker === "jasper" ? "none" : "brightness(0.55)" }}
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: -18, opacity: 1, scale: speaker === "jasper" ? 1 : 0.88 }}
            transition={{ delay: 0.3 }}
          >
            <Jasper polishing={speaker === "jasper"} />
          </motion.div>
        </div>
        {/* bar counter */}
        <div className="absolute inset-x-0 bottom-0 h-[46px]">
          <div className="brass h-[5px]" />
          <div className="wood h-full shadow-[0_-6px_20px_rgba(0,0,0,0.6)]" />
        </div>
        {/* speech bubble */}
        <motion.div
          key={line(app)}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 14, delay: 0.5 }}
          className={`paper absolute top-[max(3.25rem,calc(env(safe-area-inset-top)+2.5rem))] z-10 max-w-[70%] rounded-2xl px-4 py-2 font-display text-[16px] leading-snug shadow-xl ${
            speaker === "mabel" ? "left-4 origin-bottom-right" : "right-4 origin-bottom-left"
          }`}
        >
          {line(app)}
          <span className={`absolute -bottom-2 h-4 w-4 rotate-45 bg-cream ${speaker === "mabel" ? "right-8" : "left-8"}`} />
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

/** What the bartender says, by state. */
function useLine(speaker: Speaker) {
  return ({ me, live, joined, memberById }: ReturnType<typeof useApp>) => {
    const m = speaker === "mabel";
    if (!me) return m ? "Evening, darling! Who's drinking tonight?" : "Evening. Whose tab am I starting?";
    if (!live) return m ? `Quiet night, ${me.name}. Shall we throw a palooza?` : `Slow one tonight, ${me.name}. Fancy opening a palooza?`;
    const presenter = memberById(live.current?.member_id);
    switch (live.event.status) {
      case "lobby":
        if (!joined) return m ? `Pull up a stool, ${me.name}! ${live.event.name} is filling up.` : `There's a seat for you at ${live.event.name}, ${me.name}.`;
        return m ? "Get your recipe written up, sugar. The show starts soon!" : "Write up your recipe while we set the order.";
      case "live":
        if (live.current?.member_id === me.id) return m ? "You're on, darling! Knock 'em dead." : "Your turn, friend. The stage is yours.";
        return presenter ? `${presenter.name} is presenting${live.current?.name ? ` the ${live.current.name}` : ""}. Take your seat!` : "The show's on!";
      case "lastcall":
        return m ? "Last call! Get those pours in, sweetheart." : "Last call. Finish your pours.";
      case "wrapped":
        return m ? "The verdict is in! Eyes on the wall!" : "The envelopes are open. To the wall!";
      default:
        return "Cheers!";
    }
  };
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

