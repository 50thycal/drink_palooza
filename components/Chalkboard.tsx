"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { refreshAll, send, useChalk, useMemory } from "@/lib/api";
import type { ChalkColor, ChalkNote } from "@/lib/types";
import { useApp } from "./AppContext";
import { Sheet, toast, useBusy } from "./ui";

export const CHALK: Record<ChalkColor, string> = { white: "#f2efe6", pink: "#ff9cc8", yellow: "#ffe27a", teal: "#8ff5e8" };

/** Every note gets the same little tilt on every phone. */
const tilt = (id: string) => ((id.charCodeAt(0) + id.charCodeAt(id.length - 1)) % 9) - 4;

/** The running tab, chalked across the top of the board. */
export function TabLine({ className = "" }: { className?: string }) {
  const { data } = useMemory();
  const t = data?.tally;
  if (!t || !t.paloozas) return <div className={`chalk text-center text-lg opacity-80 ${className}`}>Tonight&apos;s specials: whatever you write here</div>;
  return (
    <div className={`chalk flex flex-wrap justify-center gap-x-4 text-lg leading-tight opacity-90 ${className}`}>
      <span>{t.paloozas} palooza{t.paloozas === 1 ? "" : "s"}</span>
      <span>{t.drinks} drinks</span>
      <span>{t.pours} pours</span>
      <span>{t.napkins} napkins</span>
    </div>
  );
}

function Note({ note, big = false }: { note: ChalkNote; big?: boolean }) {
  const { memberById, meId } = useApp();
  const { run } = useBusy();
  const who = memberById(note.member_id);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, filter: "blur(4px)" }}
      className={`chalk relative leading-tight ${big ? "text-[26px]" : "text-[20px]"}`}
      style={{ color: CHALK[note.color], rotate: `${tilt(note.id)}deg` }}
    >
      {note.text}
      <span className="ml-1.5 whitespace-nowrap text-[0.65em] opacity-70">— {who?.name ?? "?"}</span>
      {big && note.member_id === meId && (
        <button
          onClick={() => run(async () => (await send("DELETE", `/api/chalk/${note.id}`), refreshAll()))}
          className="ml-2 align-middle text-[14px] opacity-60"
          aria-label="Wipe it off"
        >
          ⌫
        </button>
      )}
    </motion.div>
  );
}

/** The full board: read everything, write your own, wipe your own. */
export function ChalkboardSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { me } = useApp();
  const { data } = useChalk();
  const [text, setText] = useState("");
  const [color, setColor] = useState<ChalkColor>("white");
  const { busy, run } = useBusy();
  return (
    <Sheet open={open} onClose={onClose} title="The Chalkboard" tone="slate">
      <TabLine className="border-b border-dashed border-white/20 pb-2" />
      <div className="flex min-h-[200px] flex-col gap-3 py-4">
        <AnimatePresence initial={false}>
          {(data ?? []).map((n) => (
            <Note key={n.id} note={n} big />
          ))}
        </AnimatePresence>
        {data && !data.length && <p className="chalk py-10 text-center text-2xl opacity-60">A blank board. Be the first.</p>}
      </div>
      {me && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            run(async () => {
              await send("POST", "/api/chalk", { text: text.trim(), color });
              setText("");
              await refreshAll();
              toast("Chalked it");
            });
          }}
          className="sticky bottom-0 -mx-5 border-t border-white/15 bg-[#1d2420] px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3"
        >
          <div className="flex items-center gap-2">
            {(Object.keys(CHALK) as ChalkColor[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-7 w-7 rounded-full ${color === c ? "ring-2 ring-white ring-offset-2 ring-offset-[#1d2420]" : ""}`}
                style={{ background: CHALK[c] }}
                aria-label={`${c} chalk`}
              />
            ))}
            <span className="chalk ml-auto text-lg opacity-60">{140 - text.length}</span>
          </div>
          <div className="mt-2 flex gap-2">
            <input
              value={text}
              maxLength={140}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write on the board…"
              className="chalk min-w-0 flex-1 border-b border-dashed border-white/40 bg-transparent py-1 text-[24px] outline-none placeholder:text-white/35"
              style={{ color: CHALK[color] }}
            />
            <button disabled={busy || !text.trim()} className="chalk rounded-full border border-white/50 px-4 text-xl disabled:opacity-40">
              Chalk it
            </button>
          </div>
        </form>
      )}
    </Sheet>
  );
}

/** The board as it hangs over the bar: the tab plus the freshest few notes. */
export function ChalkboardPreview({ onOpen }: { onOpen: () => void }) {
  const { data } = useChalk();
  const latest = (data ?? []).slice(0, 3);
  return (
    <motion.button
      onClick={onOpen}
      whileTap={{ scale: 0.98 }}
      className="slate relative block w-full rounded-md p-4 text-left shadow-[0_12px_28px_rgba(0,0,0,0.55)]"
      style={{ border: "8px solid #6b4a2b", boxShadow: "inset 0 0 0 2px #3e2a17, 0 12px 28px rgba(0,0,0,0.55)" }}
    >
      <div className="chalk text-center text-[28px] font-bold leading-none">The Chalkboard</div>
      <TabLine className="mt-1" />
      <div className="mt-3 space-y-2">
        {latest.length ? latest.map((n) => <Note key={n.id} note={n} />) : <p className="chalk text-center text-xl opacity-60">Tap to write the first thing</p>}
      </div>
      <div className="chalk mt-3 text-right text-base opacity-60">tap to write →</div>
      {/* chalk tray */}
      <div className="absolute -bottom-[14px] left-6 right-6 h-[6px] rounded-sm bg-[#4a3220]">
        <span className="absolute -top-[3px] left-4 h-[5px] w-6 rounded-full bg-[#f2efe6]" />
        <span className="absolute -top-[3px] left-12 h-[5px] w-4 rounded-full bg-[#ff9cc8]" />
      </div>
    </motion.button>
  );
}
