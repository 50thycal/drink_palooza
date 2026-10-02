"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * The app is one place, and every screen is a camera position in it. Scenes
 * are routed by hash (#/book/<id>) so the phone's back gesture walks the
 * camera back, and a drink can be linked to directly.
 */
export type SceneKey = "bar" | "bartender" | "wall" | "stage" | "pour" | "lastcall" | "wrapped" | "book" | "drink" | "settings";

export interface Scene {
  key: SceneKey;
  param: string | null;
}

/**
 * World positions. `upright` scenes are seen at eye level (bartenders, the
 * neon wall); the rest are looked down at (the bar top, your spot, the book).
 * Moving between the two kinds is a tilt; within a kind it's a pan.
 */
export const WORLD: Record<SceneKey, { x: number; y: number; upright: boolean }> = {
  bar: { x: 0, y: 0, upright: false },
  bartender: { x: 0, y: -1, upright: true },
  wall: { x: 0, y: -2, upright: true },
  stage: { x: 0, y: -2, upright: true },
  wrapped: { x: 0, y: -2, upright: true },
  pour: { x: 0, y: 1, upright: false },
  lastcall: { x: 0, y: 1, upright: false },
  book: { x: 1, y: 0, upright: false },
  drink: { x: 2, y: 0, upright: false },
  settings: { x: 0, y: 0, upright: false },
};

const KEYS = Object.keys(WORLD) as SceneKey[];

function parse(hash: string): Scene {
  const [, key, param] = hash.replace(/^#/, "").split("/");
  return KEYS.includes(key as SceneKey) ? { key: key as SceneKey, param: param || null } : { key: "bar", param: null };
}

const href = (s: Scene) => (s.key === "bar" ? "#/" : `#/${s.key}${s.param ? `/${s.param}` : ""}`);

export function useScene() {
  const [scene, setScene] = useState<Scene>({ key: "bar", param: null });
  useEffect(() => {
    const read = () => setScene(parse(window.location.hash));
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  /** Move the camera. `replace` is for automatic moves (it's your turn) so Back still goes to the bar. */
  const go = useCallback((key: SceneKey, param: string | null = null, opts: { replace?: boolean } = {}) => {
    const next = { key, param };
    const url = href(next);
    if (opts.replace) window.history.replaceState(null, "", url);
    else window.history.pushState(null, "", url);
    setScene(next);
  }, []);

  const back = useCallback(() => {
    if (window.history.length > 1 && window.location.hash && window.location.hash !== "#/") window.history.back();
    else go("bar", null, { replace: true });
  }, [go]);

  return { scene, go, back };
}
