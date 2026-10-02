import { NextResponse } from "next/server";
import { CATEGORY_KEYS, SCORE_MAX, SCORE_MIN, type CategoryKey } from "./constants";

export class BadRequest extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}
/** Something is true about the world that makes the request impossible (409). */
export class Conflict extends BadRequest {
  constructor(message: string) {
    super(message, 409);
  }
}
export class Forbidden extends BadRequest {
  constructor(message: string) {
    super(message, 403);
  }
}
export class NotFound extends BadRequest {
  constructor(message = "Not found") {
    super(message, 404);
  }
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status, headers: { "cache-control": "no-store" } });
}

export function fail(err: unknown) {
  if (err instanceof BadRequest) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  // Unique-constraint violations are the data-integrity net doing its job
  // (double tap, two phones) — surface them as conflicts, not 500s.
  const code = (err as { code?: string })?.code;
  if (code === "23505") {
    return NextResponse.json({ error: "That was already recorded." }, { status: 409 });
  }
  if (code === "23514") {
    return NextResponse.json({ error: "That value isn't allowed." }, { status: 400 });
  }
  const message = err instanceof Error ? err.message : "Something went wrong";
  console.error("[api]", err);
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object") throw new Error();
    return body as Record<string, unknown>;
  } catch {
    throw new BadRequest("Expected a JSON body");
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseId(value: unknown, field = "id"): string {
  if (typeof value !== "string" || !UUID.test(value)) throw new BadRequest(`${field} is required`);
  return value;
}

/** Whole numbers 1–10. */
export function parseScore(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(n) || n < SCORE_MIN || n > SCORE_MAX) throw new BadRequest(`score must be a whole number ${SCORE_MIN}–${SCORE_MAX}`);
  return n;
}

export function parseCategory(value: unknown): CategoryKey {
  if (typeof value !== "string" || !CATEGORY_KEYS.includes(value as CategoryKey)) throw new BadRequest("Unknown category");
  return value as CategoryKey;
}

export function parseText(value: unknown, field: string, max: number, required = true): string | null {
  if (value == null || value === "") {
    if (required) throw new BadRequest(`${field} is required`);
    return null;
  }
  if (typeof value !== "string") throw new BadRequest(`${field} must be text`);
  const trimmed = value.trim();
  if (!trimmed && required) throw new BadRequest(`${field} can't be empty`);
  if (trimmed.length > max) throw new BadRequest(`${field} is too long (${max} characters max)`);
  return trimmed || null;
}
