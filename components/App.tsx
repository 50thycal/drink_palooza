"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef } from "react";
import { useHome } from "@/lib/api";
import { useMe } from "@/lib/me";
import { useScene } from "@/lib/scene";
import { Ctx, SHOW_SCENES, showScene, useApp, type AppCtx } from "./AppContext";
import SceneStage from "./SceneStage";
import { NapkinArrivals } from "./Seating";
import { BarTop } from "./scenes/BarTop";
import { BartenderScene } from "./scenes/Bartender";
import { BookScene, DrinkScene } from "./scenes/Book";
import { HallScene } from "./scenes/Hall";
import { LastCallScene } from "./scenes/LastCall";
import { PourScene } from "./scenes/Pour";
import { SettingsScene } from "./scenes/Settings";
import { StageScene } from "./scenes/Stage";
import { WrappedScene } from "./scenes/Wrapped";
import { Neon, Spinner, Toaster } from "./ui";

export default function App() {
  const { me: meId, setMe, ready } = useMe();
  const { data: home, error } = useHome();
  const { scene, go, back } = useScene();

  const members = useMemo(() => home?.members ?? [], [home?.members]);
  const me = members.find((m) => m.id === meId) ?? null;
  const live = home?.event ?? null;
  const target = showScene(live, meId);

  // A remembered person who no longer exists (database reset) → ask again.
  useEffect(() => {
    if (ready && meId && home && !me) setMe(null);
  }, [ready, meId, home, me, setMe]);

  // When the show changes phase (the host starts it, last call, the reveal),
  // everyone in the palooza who's waiting with the bartenders is carried along.
  const lastStatus = useRef(live?.event.status);
  const joinedNow = !!live?.participants.some((p) => p.member_id === meId);
  useEffect(() => {
    const status = live?.event.status;
    if (status !== lastStatus.current) {
      lastStatus.current = status;
      if (target && joinedNow && (scene.key === "bartender" || scene.key === "bar")) go(target);
    }
  }, [live?.event.status, target, joinedNow, scene.key, go]);

  // The show drives the camera for anyone already in it: when it's your turn
  // the camera pans up to the stage; when you're done it tilts back down to
  // your spot at the bar; when the reveal starts everyone looks at the wall.
  useEffect(() => {
    if (!home || !me) return;
    const inShow = SHOW_SCENES.includes(scene.key);
    if (inShow && target && target !== scene.key) go(target, null, { replace: true });
    // The show ended: whoever was watching the reveal follows the results to the Hall of Fame.
    if (inShow && !target) go(scene.key === "wrapped" ? "wall" : "bar", null, { replace: true });
  }, [home, me, target, scene.key, go]);

  if (!ready || (!home && !error)) return <Splash />;
  if (!home) {
    return (
      <div className="wall flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <Neon color="pink" className="text-3xl">
          Closed
        </Neon>
        <p className="font-deco font-bold text-champagne">The bar can&apos;t reach its cellar.</p>
        <p className="max-w-sm text-sm text-champagne/70">{(error as Error)?.message}</p>
      </div>
    );
  }

  const ctx: AppCtx = {
    me,
    meId: me?.id ?? null,
    setMe,
    home,
    live,
    members,
    memberById: (id) => members.find((m) => m.id === id) ?? null,
    go,
    back,
    joined: !!live?.participants.some((p) => p.member_id === me?.id),
    isHost: !!me && live?.event.host_id === me.id,
  };

  // No identity yet: the bartenders ask who's drinking.
  const current = !me ? { key: "bartender" as const, param: null } : scene;

  let body: React.ReactNode;
  switch (current.key) {
    case "bartender":
      body = <BartenderScene />;
      break;
    case "wall":
      body = <HallScene />;
      break;
    case "stage":
      body = <StageScene />;
      break;
    case "pour":
      body = <PourScene />;
      break;
    case "lastcall":
      body = <LastCallScene />;
      break;
    case "wrapped":
      body = <WrappedScene />;
      break;
    case "book":
      body = <BookScene />;
      break;
    case "drink":
      body = <DrinkScene id={current.param} />;
      break;
    case "settings":
      body = <SettingsScene />;
      break;
    default:
      body = <BarTop />;
  }

  // Elsewhere in the bar when the show needs you? A neon call-out, not a hijack.
  const callout =
    me && target && !SHOW_SCENES.includes(current.key)
      ? target === "stage" && live?.current?.member_id === me.id
        ? { text: "You're up! Take the stage", color: "pink" as const }
        : target === "wrapped"
          ? { text: "The reveal is starting", color: "amber" as const }
          : null
      : null;

  return (
    <Ctx.Provider value={ctx}>
      <ShowRibbon hidden={!!callout || !me || SHOW_SCENES.includes(current.key)} onGo={() => target && go(target)} />
      <SceneStage scene={current}>{body}</SceneStage>
      <AnimatePresence>
        {callout && (
          <motion.button
            initial={{ y: -80 }}
            animate={{ y: 0 }}
            exit={{ y: -80 }}
            onClick={() => go(target!)}
            className="fixed inset-x-4 top-[max(0.75rem,env(safe-area-inset-top))] z-40 mx-auto max-w-sm rounded-xl border border-white/30 bg-black/85 px-4 py-3 text-center backdrop-blur"
          >
            <Neon color={callout.color} className="text-lg">
              {callout.text} →
            </Neon>
          </motion.button>
        )}
      </AnimatePresence>
      {me && <NapkinArrivals />}
      <Toaster />
    </Ctx.Provider>
  );
}

const RIBBON_PX = 34;

/**
 * While the show is on and you've wandered off (the recipe book, the
 * chalkboard, the bar), a thin neon strip keeps you in the loop and takes you
 * back with a tap. Scenes shift down beneath it rather than being covered.
 */
function ShowRibbon({ hidden, onGo }: { hidden: boolean; onGo: () => void }) {
  const { live, memberById, meId, joined } = useApp();
  const status = live?.event.status;
  let text: string | null = null;
  if (!hidden && live && status === "live" && live.current) {
    const raters = live.participants.length - 1;
    const poured = live.scored_counts[live.current.id] ?? 0;
    const mine = live.my_scores[live.current.id] ?? {};
    const left = joined && live.current.member_id !== meId ? 4 - Object.keys(mine).length : 0;
    text = `${memberById(live.current.member_id)?.name} is presenting · ${poured}/${raters} poured${left > 0 ? ` · ${left} glass${left === 1 ? "" : "es"} to go` : ""}`;
  } else if (!hidden && status === "lastcall") {
    text = "Last call · finish your pours before the reveal";
  }
  const visible = !!text;
  useEffect(() => {
    document.documentElement.style.setProperty("--ribbon", visible ? `${RIBBON_PX}px` : "0px");
  }, [visible]);
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          key="ribbon"
          onClick={onGo}
          initial={{ y: -60 }}
          animate={{ y: 0 }}
          exit={{ y: -60 }}
          className="fixed inset-x-0 top-0 z-40 flex items-end justify-center gap-2 border-b border-neon-pink/50 bg-black/90 px-3 pb-1.5 backdrop-blur"
          style={{ height: `calc(${RIBBON_PX}px + env(safe-area-inset-top))` }}
        >
          <span className="pulse-dot mb-[5px] h-2 w-2 shrink-0 rounded-full bg-neon-pink shadow-[0_0_8px_var(--neon-pink)]" />
          <span className="truncate font-deco text-[13px] font-bold tracking-wide text-champagne">{text}</span>
          <span className="shrink-0 font-deco text-[13px] font-bold text-neon-pink">Back →</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

function Splash() {
  return (
    <div className="wall flex h-full flex-col items-center justify-center gap-6">
      <Neon color="pink" script className="text-6xl">
        Drink Palooza
      </Neon>
      <Spinner />
    </div>
  );
}
