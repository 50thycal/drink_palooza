import { db } from "@/lib/db";
import { fail, ok, parseCategory, parseId, parseScore, readJson } from "@/lib/http";
import { requireMemberId } from "@/lib/identity";
import { pour } from "@/lib/server";

export const dynamic = "force-dynamic";

/** One glass poured: { category, score }. Re-pouring replaces it until the reveal. */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = parseId((await params).id);
    const body = await readJson(req);
    await pour(await db(), id, requireMemberId(req), parseCategory(body.category), parseScore(body.score));
    return ok({ ok: true });
  } catch (err) {
    return fail(err);
  }
}
