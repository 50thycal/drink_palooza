"use client";

import { motion } from "motion/react";
import { useRef, useState } from "react";
import type { Comment } from "@/lib/types";
import { ChalkboardSheet } from "./Chalkboard";
import { uploadDrinkPhoto } from "./Drink";
import { Napkins, NotesSheet } from "./scenes/Pour";
import { Sheet, toast } from "./ui";

/**
 * The bar mat docked to the bottom of the pour screen and the stage. The
 * glass (or the presenter's drink) gets the screen; everything else is one
 * thumb-tap away down here, so nobody scrolls mid-presentation.
 *
 * `top` is the row that matters most right now: the reaction emoji for
 * someone watching, the soundboard and "Done presenting" for the presenter.
 */
export function BarTray({
  top,
  drinkId,
  comments,
  note,
  extra,
}: {
  top: React.ReactNode;
  drinkId: string;
  comments: Comment[];
  /** This person's private note, or null to leave the notes button off. */
  note: string | null;
  /** An extra icon (the presenter's recipe editor). */
  extra?: React.ReactNode;
}) {
  const [sheet, setSheet] = useState<"napkins" | "notes" | "chalk" | null>(null);
  const photo = useRef<HTMLInputElement>(null);
  const [developing, setDeveloping] = useState(false);

  return (
    <>
      <div className="sticky bottom-0 z-20 mt-3">
        <div className="pointer-events-none absolute inset-x-0 -top-6 h-6 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="relative rounded-t-2xl border-t border-gold/50 bg-[#0b0a09]/95 px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_30px_rgba(0,0,0,0.6)] backdrop-blur">
          {/* the rubber mat's dotted texture */}
          <div
            className="pointer-events-none absolute inset-0 rounded-t-2xl opacity-[0.12]"
            style={{ backgroundImage: "radial-gradient(circle, #d4af37 1px, transparent 1.4px)", backgroundSize: "9px 9px" }}
          />
          <div className="relative">{top}</div>
          <div className="relative mt-2 grid grid-cols-4 gap-1.5 border-t border-white/10 pt-2">
            <TrayButton icon="✒️" label="Napkins" badge={comments.length || null} onClick={() => setSheet("napkins")} />
            {note != null ? (
              <TrayButton icon="🔒" label={note ? "Notes ✓" : "Notes"} onClick={() => setSheet("notes")} />
            ) : (
              extra
            )}
            <TrayButton icon={developing ? "⏳" : "📷"} label={developing ? "Developing" : "Photo"} onClick={() => photo.current?.click()} />
            <TrayButton icon="🖍" label="Chalkboard" onClick={() => setSheet("chalk")} />
          </div>
        </div>
      </div>

      {/* No `capture`: iPhone then offers "Take Photo" or "Photo Library" itself. */}
      <input
        ref={photo}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setDeveloping(true);
          try {
            await uploadDrinkPhoto(drinkId, file);
          } catch (err) {
            toast((err as Error).message);
          } finally {
            setDeveloping(false);
          }
        }}
      />
      <Sheet open={sheet === "napkins"} onClose={() => setSheet(null)} title="Napkins" tone="wood">
        <div className="-mx-3 pb-4">
          <Napkins drinkId={drinkId} comments={comments} />
        </div>
      </Sheet>
      {note != null && <NotesSheet drinkId={drinkId} initial={note} open={sheet === "notes"} onClose={() => setSheet(null)} />}
      <ChalkboardSheet open={sheet === "chalk"} onClose={() => setSheet(null)} />
    </>
  );
}

export function TrayButton({ icon, label, onClick, badge = null }: { icon: string; label: string; onClick: () => void; badge?: number | null }) {
  return (
    <motion.button whileTap={{ scale: 0.9 }} onClick={onClick} className="relative flex flex-col items-center gap-0.5 rounded-lg py-1">
      <span className="text-[22px] leading-none">{icon}</span>
      <span className="font-deco text-[11px] font-bold tracking-wide text-champagne/80">{label}</span>
      {badge != null && (
        <span className="absolute right-[18%] top-0 min-w-[18px] rounded-full bg-neon-pink px-1 text-center font-body text-[11px] font-bold leading-[18px] text-white">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </motion.button>
  );
}
