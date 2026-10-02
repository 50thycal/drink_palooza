import { db } from "@/lib/db";
import { fail, ok, parseId, readJson } from "@/lib/http";
import { requireMemberId } from "@/lib/identity";
import { setHero } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = parseId((await params).id);
    const body = await readJson(req);
    await setHero(await db(), id, requireMemberId(req), parseId(body.photo_id, "photo_id"));
    return ok({ ok: true });
  } catch (err) {
    return fail(err);
  }
}
