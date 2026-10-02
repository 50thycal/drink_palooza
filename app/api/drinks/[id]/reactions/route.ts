import { db } from "@/lib/db";
import { fail, ok, parseId, parseText, readJson } from "@/lib/http";
import { requireMemberId } from "@/lib/identity";
import { react } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = parseId((await params).id);
    const body = await readJson(req);
    await react(await db(), id, requireMemberId(req), parseText(body.emoji, "Emoji", 16)!);
    return ok({ ok: true }, 201);
  } catch (err) {
    return fail(err);
  }
}
