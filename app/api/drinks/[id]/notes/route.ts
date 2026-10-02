import { db } from "@/lib/db";
import { fail, ok, parseId, parseText, readJson } from "@/lib/http";
import { requireMemberId } from "@/lib/identity";
import { saveNote } from "@/lib/server";

export const dynamic = "force-dynamic";

/** Private tasting notes. Only ever shown back to their author. */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = parseId((await params).id);
    const body = await readJson(req);
    await saveNote(await db(), id, requireMemberId(req), parseText(body.text, "Note", 1000, false) ?? "");
    return ok({ ok: true });
  } catch (err) {
    return fail(err);
  }
}
