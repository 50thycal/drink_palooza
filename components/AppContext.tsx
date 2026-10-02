"use client";

import { createContext, useContext } from "react";
import type { SceneKey } from "@/lib/scene";
import type { HomeState, LiveEvent, Member } from "@/lib/types";

export interface AppCtx {
  me: Member | null;
  meId: string | null;
  setMe: (id: string | null) => void;
  home: HomeState;
  live: LiveEvent | null;
  members: Member[];
  memberById: (id: string | null | undefined) => Member | null;
  go: (key: SceneKey, param?: string | null, opts?: { replace?: boolean }) => void;
  back: () => void;
  /** Am I in tonight's palooza? */
  joined: boolean;
  isHost: boolean;
}

export const Ctx = createContext<AppCtx | null>(null);

export function useApp(): AppCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useApp outside App");
  return c;
}

/** Where the show wants this phone right now, or null if nothing is happening. */
export function showScene(live: LiveEvent | null, meId: string | null): SceneKey | null {
  if (!live) return null;
  const joined = live.participants.some((p) => p.member_id === meId);
  switch (live.event.status) {
    case "live":
      if (live.current?.member_id === meId) return "stage";
      return joined ? "pour" : "stage";
    case "lastcall":
      return "lastcall";
    case "wrapped":
      return "wrapped";
    default:
      return null;
  }
}

export const SHOW_SCENES: SceneKey[] = ["stage", "pour", "lastcall", "wrapped"];
