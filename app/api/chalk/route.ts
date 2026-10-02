import { db } from "@/lib/db";
import { fail, ok, parseText, readJson } from "@/lib/http";
import { requireMemberId } from "@/lib/identity";
import { addChalk, listChalk } from "@/lib/server";
import type { ChalkColor } from "@/lib/types";

export const dynamic = "force-dynamic";

const COLORS: ChalkColor[] = ["white", "pink", "yellow", "teal"];

export async function GET() {
  try {
    return ok(await listChalk(await db()));
  } catch (err) {
    return fail(err);
  }
}

export async function POST(req: Request) {
  try {
    const me = requireMemberId(req);
    const body = await readJson(req);
    const color = COLORS.includes(body.color as ChalkColor) ? (body.color as ChalkColor) : "white";
    return ok(await addChalk(await db(), me, parseText(body.text, "Chalk", 140)!, color), 201);
  } catch (err) {
    return fail(err);
  }
}
