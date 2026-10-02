"use client";

import { AnimatePresence, motion, useReducedMotion, type Variants } from "motion/react";
import { useRef } from "react";
import { WORLD, type Scene, type SceneKey } from "@/lib/scene";

type Move = "tilt-up" | "tilt-down" | "pan-up" | "pan-down" | "slide-left" | "slide-right" | "flip" | "fade";

/** Work out what the camera does between two places in the world. */
function moveBetween(from: SceneKey, to: SceneKey): Move {
  if (from === to) return "fade";
  if (from === "settings" || to === "settings") return "flip";
  const a = WORLD[from];
  const b = WORLD[to];
  if (b.x !== a.x) return b.x > a.x ? "slide-left" : "slide-right";
  if (b.y === a.y) return "fade";
  const up = b.y < a.y;
  if (a.upright !== b.upright) return up ? "tilt-up" : "tilt-down";
  return up ? "pan-up" : "pan-down";
}

const EASE = [0.65, 0, 0.35, 1] as const;
const T = { duration: 0.75, ease: EASE };

const variants: Variants = {
  enter: (m: Move) => {
    switch (m) {
      case "tilt-up":
        return { y: "-55%", rotateX: -32, opacity: 0, transformOrigin: "50% 0%" };
      case "tilt-down":
        return { y: "75%", rotateX: 48, opacity: 0, transformOrigin: "50% 100%" };
      case "pan-up":
        return { y: "-100%", opacity: 1 };
      case "pan-down":
        return { y: "100%", opacity: 1 };
      case "slide-left":
        return { x: "100%", opacity: 1 };
      case "slide-right":
        return { x: "-100%", opacity: 1 };
      case "flip":
        return { rotateY: -90, opacity: 1 };
      default:
        return { opacity: 0, scale: 0.97 };
    }
  },
  center: (m: Move) => ({
    x: 0,
    y: 0,
    rotateX: 0,
    rotateY: 0,
    scale: 1,
    opacity: 1,
    transition: m === "flip" ? { duration: 0.32, delay: 0.3, ease: "easeOut" } : T,
  }),
  exit: (m: Move) => {
    switch (m) {
      case "tilt-up":
        return { y: "80%", rotateX: 50, opacity: 0.15, transformOrigin: "50% 100%", transition: T };
      case "tilt-down":
        return { y: "-60%", rotateX: -34, opacity: 0.15, transformOrigin: "50% 0%", transition: T };
      case "pan-up":
        return { y: "100%", transition: T };
      case "pan-down":
        return { y: "-100%", transition: T };
      case "slide-left":
        return { x: "-35%", opacity: 0.2, transition: T };
      case "slide-right":
        return { x: "35%", opacity: 0.2, transition: T };
      case "flip":
        return { rotateY: 90, transition: { duration: 0.3, ease: "easeIn" } };
      default:
        return { opacity: 0, transition: { duration: 0.35 } };
    }
  },
};

const fadeOnly: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};

/**
 * The camera. Each scene is a full-screen layer that scrolls on its own;
 * changing scene animates the old layer out and the new one in according to
 * where they sit in the world (see lib/scene.ts).
 */
export default function SceneStage({ scene, children }: { scene: Scene; children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const prev = useRef<SceneKey>(scene.key);
  const move = useRef<Move>("fade");
  const key = `${scene.key}:${scene.param ?? ""}`;
  const lastKey = useRef(key);
  if (lastKey.current !== key) {
    move.current = moveBetween(prev.current, scene.key);
    prev.current = scene.key;
    lastKey.current = key;
  }
  return (
    <div className="fixed inset-x-0 bottom-0 overflow-hidden bg-onyx transition-[top] duration-300" style={{ perspective: 1100, top: "var(--ribbon, 0px)" }}>
      <AnimatePresence initial={false} custom={move.current}>
        <motion.div
          key={key}
          custom={move.current}
          variants={reduce ? fadeOnly : variants}
          initial="enter"
          animate="center"
          exit="exit"
          className="no-scrollbar absolute inset-0 overflow-x-hidden overflow-y-auto overscroll-contain"
          style={{ backfaceVisibility: "hidden", WebkitOverflowScrolling: "touch" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
