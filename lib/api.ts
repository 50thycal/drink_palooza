"use client";

import useSWR, { mutate } from "swr";
import { getMemberId } from "./me";
import type { CatalogEntry, DrinkDetail, HallOfFame, HomeState } from "./types";

function headers(): Record<string, string> {
  const me = getMemberId();
  return me ? { "x-member-id": me } : {};
}

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store", headers: headers() });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
  return res.json();
}

/**
 * A room full of phones. While a palooza is open everyone polls every 2s, so
 * the presenter changing, a reaction, or the reveal advancing lands almost
 * immediately; otherwise every 8s. Polling pauses when the tab is hidden.
 */
export function useHome() {
  return useSWR<HomeState>("/api/state", fetcher, {
    refreshInterval: (data) => (data?.event ? 2_000 : 8_000),
    revalidateOnFocus: true,
    keepPreviousData: true,
  });
}

export function useDrink(id: string | null) {
  return useSWR<DrinkDetail>(id ? `/api/drinks/${id}` : null, fetcher, { refreshInterval: 6_000, keepPreviousData: true });
}

export function useCatalog() {
  return useSWR<CatalogEntry[]>("/api/catalog", fetcher, { refreshInterval: 20_000 });
}

export function useHall() {
  return useSWR<HallOfFame>("/api/hall", fetcher, { refreshInterval: 30_000 });
}

/**
 * After any write, pull every shared view back in sync. Key filter only: with
 * a data argument (even `undefined`) SWR writes it into the cache, which would
 * blank every screen until the refetch lands.
 */
export function refreshAll() {
  return mutate((key) => typeof key === "string" && key.startsWith("/api/"));
}

type Method = "POST" | "PUT" | "PATCH" | "DELETE";

export async function send<T = unknown>(method: Method, url: string, body?: unknown): Promise<T> {
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const res = await fetch(url, {
    method,
    headers: { ...headers(), ...(body && !isForm ? { "content-type": "application/json" } : {}) },
    body: body ? (isForm ? (body as FormData) : JSON.stringify(body)) : undefined,
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok) throw new Error(payload?.error ?? `Request failed (${res.status})`);
  return payload as T;
}

/** Lifecycle shorthand: POST /api/events/:id/:action, then resync. */
export async function eventAction(eventId: string, action: string, body?: unknown) {
  await send("POST", `/api/events/${eventId}/${action}`, body ?? {});
  await refreshAll();
}
