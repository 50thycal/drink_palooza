"use client";

import { useEffect, useState } from "react";
import { MEMBER_EMOJIS } from "@/lib/constants";
import { eventAction, refreshAll, send } from "@/lib/api";
import { isMuted, playSound, setMuted } from "@/lib/sounds";
import { enableTilt, tiltEnabled } from "@/lib/tilt";
import { useApp } from "../AppContext";
import { Avatar, BackPlaque, DecoDivider, toast, useBusy } from "../ui";

/** The back of the coaster. */
export function SettingsScene() {
  const { me, members, setMe, live, isHost, joined, memberById, back, go } = useApp();
  const [name, setName] = useState(me?.name ?? "");
  const [emoji, setEmoji] = useState(me?.emoji ?? "🍸");
  const [muted, setMutedState] = useState(false);
  const [tilt, setTilt] = useState(false);
  const { busy, run } = useBusy();
  useEffect(() => {
    setMutedState(isMuted());
    setTilt(tiltEnabled());
  }, []);
  if (!me) return null;
  const dirty = name.trim() !== me.name || emoji !== me.emoji;

  return (
    <div className="wood relative min-h-full px-4 pb-[max(3rem,env(safe-area-inset-bottom))] pt-[max(4rem,calc(env(safe-area-inset-top)+3.5rem))]">
      <BackPlaque onClick={back} />
      <div
        className="relative mx-auto max-w-md rounded-[2rem] px-5 py-6 text-ink shadow-2xl"
        style={{
          background: "radial-gradient(circle at 30% 20%, #f3e6c8, #e2cfa6 70%, #cdb588)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5), inset 0 0 0 3px #e2cfa6, inset 0 0 0 4.5px #2b1d12, inset 0 0 0 9px #e2cfa6, inset 0 0 0 10px rgba(43,29,18,0.5)",
        }}
      >
        <div className="text-center font-display text-3xl tracking-wide">The Back of the Coaster</div>
        <DecoDivider ink className="mx-4 my-3" />

        <Label>YOU</Label>
        <div className="flex items-center gap-3">
          <Avatar member={{ ...me, emoji }} size={48} />
          <input
            value={name}
            maxLength={30}
            onChange={(e) => setName(e.target.value)}
            className="min-w-0 flex-1 border-b-2 border-ink/40 bg-transparent py-1 font-display text-2xl outline-none focus:border-ink"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-1">
          {MEMBER_EMOJIS.map((e) => (
            <button key={e} onClick={() => setEmoji(e)} className={`h-9 w-9 rounded-full text-lg ${emoji === e ? "bg-ink/15 ring-2 ring-ink" : ""}`}>
              {e}
            </button>
          ))}
        </div>
        {dirty && (
          <button
            disabled={busy || !name.trim()}
            onClick={() =>
              run(async () => {
                await send("PATCH", `/api/members/${me.id}`, { name: name.trim(), emoji });
                await refreshAll();
                toast("Updated your tab");
              })
            }
            className="btn-gold mt-3 w-full rounded-full py-2.5"
          >
            Save
          </button>
        )}

        <Label>SWITCH PERSON ON THIS PHONE</Label>
        <div className="flex flex-wrap gap-2">
          {members
            .filter((m) => m.id !== me.id)
            .map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setMe(m.id);
                  go("bar", null, { replace: true });
                  toast(`Evening, ${m.name}`);
                }}
                className="flex items-center gap-1.5 rounded-full border border-ink/30 py-1 pl-1 pr-3 font-deco font-bold"
              >
                <Avatar member={m} size={26} /> {m.name}
              </button>
            ))}
          <button onClick={() => setMe(null)} className="rounded-full border border-dashed border-ink/40 px-3 py-1 font-deco font-bold">
            + Someone new
          </button>
        </div>

        <Label>THE ROOM</Label>
        <Toggle
          on={!muted}
          label="Sounds"
          detail="Soundboard, pours, clinks, the drumroll"
          onChange={(on) => {
            setMuted(!on);
            setMutedState(!on);
            if (on) playSound("rimshot");
          }}
        />
        <Toggle
          on={tilt}
          label="Tilt & shake"
          detail="Liquid sloshes as you tilt; shake to shuffle the order"
          onChange={async (on) => {
            if (on) setTilt(await enableTilt());
            else {
              try {
                window.localStorage.setItem("drinkpalooza:tilt", "off");
              } catch {}
              setTilt(false);
            }
          }}
        />

        {live && joined && (
          <>
            <Label>{live.event.name.toUpperCase()}</Label>
            <p className="mb-2 text-sm">
              Host: <b>{memberById(live.event.host_id)?.name}</b>
              {isHost && " (you)"}
            </p>
            {!isHost && (
              <button
                disabled={busy}
                onClick={() => confirm("Take over hosting? You'll start the show and run the reveal.") && run(() => eventAction(live.event.id, "host"))}
                className="w-full rounded-full border border-ink/40 py-2 font-deco font-bold"
              >
                Take over as host
              </button>
            )}
            {isHost && live.event.status === "lobby" && (
              <button
                disabled={busy}
                onClick={() => confirm("Cancel this palooza for everyone?") && run(async () => (await eventAction(live.event.id, "cancel"), go("bar", null, { replace: true })))}
                className="w-full rounded-full border border-oxblood py-2 font-deco font-bold text-oxblood"
              >
                Cancel this palooza
              </button>
            )}
          </>
        )}

        <DecoDivider ink className="mx-4 mb-2 mt-6" />
        <p className="text-center font-deco text-xs font-bold tracking-widest opacity-60">DRINK PALOOZA · BUILD {process.env.APP_BUILD_ID ?? "dev"}</p>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 mt-5 font-deco text-xs font-bold tracking-[0.3em] opacity-75">{children}</div>;
}

function Toggle({ on, label, detail, onChange }: { on: boolean; label: string; detail: string; onChange: (on: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} className="flex w-full items-center gap-3 py-2 text-left">
      <div className="flex-1">
        <div className="font-display text-lg">{label}</div>
        <div className="text-xs opacity-70">{detail}</div>
      </div>
      <span className={`relative h-7 w-12 rounded-full transition ${on ? "bg-emerald-2" : "bg-ink/25"}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-cream shadow transition-all ${on ? "left-6" : "left-1"}`} />
      </span>
    </button>
  );
}
